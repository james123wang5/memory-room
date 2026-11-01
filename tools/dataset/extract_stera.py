"""Experimental Stera MCAP -> explicit normalized capture adapter.

Requires stera-sdk (not installed by default), numpy and Pillow. Tested API shape
against upstream source, not against a real phone recording yet. Input poses are
camera_link-to-world. Compose TF optical-to-link before emitting OpenCV C2W.
"""
import argparse
import json
from pathlib import Path
import shutil


def extract(source, destination, every=6, events_path=None):
    from stera.data import MCAPReader
    from PIL import Image
    import numpy as np
    source, destination = Path(source).resolve(), Path(destination).resolve()
    if destination.exists():
        raise ValueError('输出目录已存在，请使用新目录')
    if every < 1:
        raise ValueError('抽帧间隔必须为正整数')
    events = json.loads(Path(events_path).read_text()) if events_path else []
    for event in events:
        if not event.get('id') or not isinstance(event.get('start'), (float, int)) or event.get('end', -1) <= event['start']:
            raise ValueError('片段需要 id、start、end（与 MCAP 时间戳一致的秒数）')
    reader = MCAPReader(source)
    intr = reader.rgb_intrinsics
    if intr is None:
        raise ValueError('录制缺少 RGB 相机内参')
    if np.any(np.abs(intr.D) > 1e-7):
        raise ValueError('此版本不自动去畸变，请先处理相机畸变')
    r_opt_to_link = reader.R_optical_to_link
    if r_opt_to_link.shape != (3, 3):
        raise ValueError('录制的光学坐标变换无效')
    destination.mkdir(parents=True)
    (destination / 'images').mkdir()
    frames, dropped = [], 0
    try:
        for frame in reader.frames(max_pose_dt=0.025):
            if frame.index % every:
                continue
            if frame.camera_pose is None:
                dropped += 1
                continue
            h, w = frame.rgb.shape[:2]
            if (w, h) != (intr.width, intr.height):
                raise ValueError('RGB 图像与内参尺寸不一致，不能猜测旋转或缩放')
            k = frame.rgb_K if frame.rgb_K is not None else intr.K
            pose = np.eye(4)
            pose[:3, :3] = frame.camera_pose.rotation @ r_opt_to_link
            pose[:3, 3] = frame.camera_pose.translation
            image = f'images/{frame.index:06d}.png'
            Image.fromarray(frame.rgb).save(destination / image)
            matching = [e for e in events if e['start'] <= frame.timestamp < e['end']]
            if len(matching) > 1:
                raise ValueError('扫描片段时间重叠')
            frames.append({'image': image, 'timestamp': frame.timestamp,
                           'segment': matching[0]['id'] if matching else 'unassigned',
                           'intrinsics': {'w': w, 'h': h, 'fl_x': float(k[0, 0]), 'fl_y': float(k[1, 1]),
                                          'cx': float(k[0, 2]), 'cy': float(k[1, 2])},
                           'camera_to_world': pose.tolist()})
        if not frames:
            raise ValueError('没有带有效相机位姿的图像帧')
        session = {'version': 1, 'units': 'meter', 'camera_axes': 'opencv',
                   'source_mcap': str(source), 'frames': frames,
                   'warnings': ['实验性适配器，尚无实机录像验证', '未验证跟踪重置和重定位，需在采集端避免会话中断'],
                   'dropped_missing_pose': dropped}
        (destination / 'session.json').write_text(json.dumps(session, ensure_ascii=False, indent=2))
    except Exception:
        shutil.rmtree(destination)
        raise
    return session


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source', type=Path); p.add_argument('output', type=Path)
    p.add_argument('--every', type=int, default=6); p.add_argument('--events', type=Path)
    a = p.parse_args()
    try:
        result = extract(a.source, a.output, a.every, a.events)
    except ImportError:
        p.exit(1, '未安装可选 Stera SDK；请参考 docs/CAPTURE.md。没有自动下载模型。\n')
    except (ValueError, OSError, KeyError) as e:
        p.exit(1, f'提取失败：{e}\n')
    print(f'已提取 {len(result["frames"])} 帧。下一步：标注片段、生成蒙版、运行 convert.py。')

if __name__ == '__main__':
    main()
