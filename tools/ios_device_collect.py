"""Copy the latest MemoryRoom export from one connected physical iPhone to Lexar.

Only accesses this app's Documents/Exports. Does not remove phone files or
overwrite an existing local export. Run after '结束并生成采集包' on the phone.
"""
import json
from pathlib import Path
import subprocess
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT/'artifacts/ios'
EXPORTS = ROOT/'data/raw/iphone-exports'


def devicectl(*args, report):
    result = subprocess.run(['xcrun', 'devicectl', *args, '--json-output', str(report)],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode:
        raise RuntimeError('手机操作未完成。请保持手机解锁、连接数据线，并检查信任和开发者模式。\n'+result.stdout[-1500:])
    return json.loads(report.read_text())['result']


def verify(path, expected_size):
    if path.stat().st_size != expected_size:
        raise ValueError('采集包大小不完整，保留文件待检查')
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None or 'session.json' not in archive.namelist():
            raise ValueError('采集包完整性检查失败')
        session = json.loads(archive.read('session.json'))
        if session.get('source') != 'arkit' or session.get('simulated') is not False:
            raise ValueError('这不是明确标记的真实采集包')


def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True); EXPORTS.mkdir(parents=True, exist_ok=True)
    devices = devicectl('list', 'devices', report=ARTIFACTS/'devices-current.json')['devices']
    physical = [d for d in devices if d.get('hardwareProperties', {}).get('reality') == 'physical'
                and d.get('connectionProperties', {}).get('tunnelState') == 'connected']
    if len(physical) != 1:
        raise ValueError('请仅连接一台已信任这台电脑的真实 iPhone，保持手机解锁后重试。')
    device = physical[0]['identifier']
    files = devicectl('device', 'info', 'files', '--device', device, '--domain-type', 'appDataContainer',
                     '--domain-identifier', 'local.memoryroom.capture', '--subdirectory', 'Documents/Exports',
                     '--no-recurse', report=ARTIFACTS/'exports-current.json')['files']
    files = [f for f in files if f['name'].endswith('.capture.zip') and not f['resources'].get('isDirectory')]
    if not files:
        raise ValueError('尚无采集包；请先在手机点击“结束并生成采集包”。')
    latest = max(files, key=lambda f: f['metadata']['lastModDate'])
    name = latest['name']
    if Path(name).name != name or '\\' in name:
        raise ValueError('导出文件名不安全')
    destination = EXPORTS/name
    if destination.exists():
        verify(destination, latest['metadata']['size'])
        print(f'这份采集已完整保存在硬盘：\n{destination}')
        return
    temporary = EXPORTS/(name+'.'+uuid.uuid4().hex+'.partial')
    print('正在通过数据线取回采集包。请保持连接；较大采集可能需要几分钟。', flush=True)
    devicectl('device', 'copy', 'from', '--device', device, '--domain-type', 'appDataContainer',
              '--domain-identifier', 'local.memoryroom.capture', '--source', f'Documents/Exports/{name}',
              '--destination', str(temporary), '--timeout', '300', report=ARTIFACTS/'copy-latest.json')
    verify(temporary, latest['metadata']['size'])
    temporary.rename(destination)
    print(f'采集包已完整保存，手机原件保留：\n{destination}')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error))
