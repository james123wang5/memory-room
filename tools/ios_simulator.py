"""Build/install our capture app in Apple's existing iPhone 17 Pro simulator.

Apple manages its runtime and device container. Build/package caches and copied
capture archives are kept in this project on Lexar. No real iPhone is modified.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'apps/capture-ios/MemoryRoomCapture.xcodeproj'
BUNDLE = 'local.memoryroom.capture'


def run(args, **kwargs):
    return subprocess.run([str(a) for a in args], cwd=ROOT, check=True, **kwargs)


def device_id():
    result = run(['xcrun','simctl','list','devices','available','-j'], capture_output=True, text=True)
    devices = json.loads(result.stdout)['devices']
    candidates = [(runtime, d) for runtime, group in devices.items() for d in group if d['name'] == 'iPhone 17 Pro']
    if not candidates:
        raise RuntimeError('没有可用的 iPhone 17 Pro 模拟器。请在 Device Hub 中添加。')
    candidates.sort(key=lambda pair: pair[1]['state'] == 'Booted', reverse=True)
    return candidates[0][1]['udid']


def build_command(destination='generic/platform=iOS Simulator'):
    return ['xcodebuild','-project',PROJECT,'-scheme','MemoryRoomCapture','-configuration','Debug',
            '-destination',destination,'-derivedDataPath',ROOT/'.cache/xcode',
            '-clonedSourcePackagesDirPath',ROOT/'.cache/swiftpm',
            '-packageCachePath',ROOT/'.cache/swiftpm-cache']


def build():
    run(['xcodebuild','-checkFirstLaunchStatus'],capture_output=True)
    log = ROOT/'artifacts/ios/build-simulator.log'; log.parent.mkdir(parents=True,exist_ok=True)
    print('正在构建采集应用，构建缓存保存在移动硬盘…',flush=True)
    with log.open('w') as output:
        try: run(build_command()+['build','CODE_SIGNING_ALLOWED=NO','ARCHS=arm64','ONLY_ACTIVE_ARCH=YES'],stdout=output,stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError:
            print(log.read_text()[-8000:]); raise


def launch(device):
    run(['xcrun','simctl','bootstatus',device,'-b'])
    app = ROOT/'.cache/xcode/Build/Products/Debug-iphonesimulator/MemoryRoomCapture.app'
    run(['xcrun','simctl','install',device,app])
    # Only terminate our own app, so relaunch consistently starts at its home screen.
    subprocess.run(['xcrun','simctl','terminate',device,BUNDLE],capture_output=True)
    run(['xcrun','simctl','launch',device,BUNDLE,'--demo'])
    developer = run(['xcode-select','-p'],capture_output=True,text=True).stdout.strip()
    hub = Path(developer).parent/'Applications/DeviceHub.app'
    if hub.exists(): run(['open',hub])
    else: run(['open','-a','Simulator'])
    print('已安装并打开 MemoryRoom 采集。模拟器只使用演练数据。')


def collect(device):
    result = run(['xcrun','simctl','get_app_container',device,BUNDLE,'data'],capture_output=True,text=True)
    exports = Path(result.stdout.strip())/'Documents/Exports'
    archives = sorted(exports.glob('*.capture.zip'))
    if not archives: raise RuntimeError('还没有导出的采集包，请先在应用里完成流程并生成采集包。')
    output = ROOT/'data/raw/simulator-exports'; output.mkdir(parents=True,exist_ok=True)
    for archive in archives:
        destination = output/archive.name
        if not destination.exists(): shutil.copy2(archive,destination)
    print(f'已保留 {len(archives)} 个演练采集包：{output}')
    return output


def screenshot(device, destination):
    # CoreSimulator's helper cannot write to removable volumes on this Mac.
    # Use a short-lived system temp file, immediately move the result to Lexar.
    with tempfile.TemporaryDirectory(prefix='memoryroom-simulator-') as temp:
        path = Path(temp)/'screen.png'
        run(['xcrun','simctl','io',device,'screenshot',path],capture_output=True)
        destination = Path(destination); destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,destination)
    print(destination)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('action',choices=['launch','collect','screenshot','test'])
    p.add_argument('--output',type=Path,default=ROOT/'artifacts/ios/simulator.png')
    p.add_argument('--skip-build',action='store_true')
    a=p.parse_args(); device=device_id()
    if a.action == 'launch':
        if not a.skip_build: build()
        launch(device)
    elif a.action == 'collect': collect(device)
    elif a.action == 'screenshot': screenshot(device,a.output)
    else:
        result=ROOT/'artifacts/ios/CaptureFlow-latest.xcresult'
        if result.exists(): raise RuntimeError(f'测试结果已存在，请先归档它再重试：{result}')
        run(build_command(f'platform=iOS Simulator,id={device}')+['-resultBundlePath',result,'-parallel-testing-enabled','NO','test','CODE_SIGNING_ALLOWED=NO','ARCHS=arm64','ONLY_ACTIVE_ARCH=YES'])


if __name__ == '__main__':
    try: main()
    except (RuntimeError,subprocess.CalledProcessError,OSError) as error:
        print(f'未完成：{error}',file=sys.stderr); sys.exit(1)
