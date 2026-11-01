"""Safely unpack our phone's capture ZIP into data/raw; never overwrite a capture."""
import argparse
import json
from pathlib import Path, PurePosixPath
import shutil
import stat
import uuid
import zipfile

from convert import local_file, matrix4

ROOT = Path(__file__).resolve().parents[2]


def import_capture(archive, destination):
    archive, destination = Path(archive).resolve(), Path(destination).resolve()
    if destination.exists(): raise ValueError('输出目录已存在，不能覆盖原始采集')
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        if len(entries) > 40000 or sum(i.file_size for i in entries) > 8*1024**3:
            raise ValueError('采集包超过第一版 40,000 个文件 / 8 GB 限制')
        names=set()
        for entry in entries:
            path = PurePosixPath(entry.filename)
            parts = entry.filename.rstrip('/').split('/')
            if path.is_absolute() or any(x in ('','..','.') for x in parts) or '\\' in entry.filename or ':' in entry.filename:
                raise ValueError('采集包含有越界路径')
            if entry.filename in names: raise ValueError('采集包有重复文件路径')
            names.add(entry.filename)
            if stat.S_ISLNK(entry.external_attr >> 16): raise ValueError('不接受采集包内的符号链接')
        if 'session.json' not in names: raise ValueError('采集包根目录缺少 session.json')
        if z.getinfo('session.json').file_size > 32*1024**2: raise ValueError('会话描述文件过大')
        session=json.loads(z.read('session.json'))
        if session.get('version') != 1 or session.get('units') != 'meter' or session.get('camera_axes') != 'opengl':
            raise ValueError('不是兼容的 MemoryRoom 采集包')
        if session.get('source') not in ('arkit','simulator-demo') or not isinstance(session.get('simulated'), bool):
            raise ValueError('采集包缺少真实/演练来源声明')
        if (session['source'] == 'simulator-demo') != session['simulated']:
            raise ValueError('采集包来源与演练标记不一致')
        frames=session.get('frames',[])
        if not isinstance(frames,list) or not frames: raise ValueError('采集包没有图像帧')
        destination.parent.mkdir(parents=True,exist_ok=True)
        staging=destination.parent/('.import-'+uuid.uuid4().hex)
        staging.mkdir()
        try:
            z.extractall(staging)
            for frame in frames:
                local_file(staging,frame['image']); matrix4(frame['camera_to_world'])
                if frame.get('depth'): local_file(staging,frame['depth']['path'])
            staging.rename(destination)
        except Exception:
            shutil.rmtree(staging); raise
    return session


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('archive',type=Path); p.add_argument('output',type=Path)
    a=p.parse_args()
    try: session=import_capture(a.archive,a.output)
    except (ValueError,OSError,KeyError,zipfile.BadZipFile) as error: p.exit(1,f'导入失败：{error}\n')
    print(json.dumps({'saved':str(a.output),'simulated':session['simulated'],'frames':len(session['frames']),
                      'objects':len(session.get('objects',[])), 'status':session.get('status')},ensure_ascii=False,indent=2))
    print('这里只导入原始采集，尚未分割或训练高斯模型。')

if __name__=='__main__': main()
