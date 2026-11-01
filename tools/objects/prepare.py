"""Prepare a separate object dataset from a real capture and explicit foreground masks.

This entry point never starts Brush or modifies the room reconstruction job.
Masks are provided by a person or an external segmenter; no segmentation is implied.
"""
import argparse
import copy
import json
from pathlib import Path
import shutil
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/dataset'))
from convert import convert, local_file, to_opengl


def capture(path):
    path = Path(path).resolve()
    data = json.loads(path.read_text())
    if (data.get('version') != 1 or data.get('units') != 'meter'
            or data.get('source') != 'arkit' or data.get('simulated') is not False
            or data.get('camera_axes') != 'opengl'):
        raise ValueError('需要真实的 MemoryRoom ARKit 采集 session.json')
    return path, data


def inventory(path):
    path, data = capture(path)
    result = []
    for obj in data.get('objects', []):
        segments = {phase: f'{phase}:{obj["id"]}' for phase in ('object', 'empty', 'placement')}
        grouped = {phase: [f for f in data['frames'] if f['segment'] == segment and f.get('tracking_state') == 'normal']
                   for phase, segment in segments.items()}
        result.append({'id': obj['id'], 'name': obj['name'], 'segments': segments,
                       'frame_counts': {key: len(frames) for key, frames in grouped.items()},
                       'images_requiring_masks': [f['image'] for f in grouped['object']],
                       'empty_images': [f['image'] for f in grouped['empty']],
                       'placement_images': [f['image'] for f in grouped['placement']],
                       'status': 'needs-foreground-masks-and-stationary-confirmation'})
    return {'capture_id': data['id'], 'space_id': data.get('space_id'), 'objects': result,
            'notes': ['没有物品片段时不会从房间帧猜测物品', '重扫前的 discarded 片段不参与',
                      '空位片段存在不等于空位已拍干净；背景修复尚未执行']}


def prepare(path, object_id, mask_manifest, stationary=False):
    if not stationary:
        raise ValueError('先确认所选物品片段中物品完全静止；手持翻转数据不能沿用相机位姿训练')
    import numpy as np
    from PIL import Image
    from depth_seed import unproject

    path, data = capture(path)
    obj = next((o for o in data.get('objects', []) if o['id'] == object_id), None)
    if obj is None:
        raise ValueError('采集中不存在此物品编号')
    manifest_path = Path(mask_manifest).resolve()
    manifest = json.loads(manifest_path.read_text())
    if manifest.get('capture_id') != data['id'] or manifest.get('object_id') != object_id:
        raise ValueError('蒙版清单与当前采集、物品身份不匹配')
    masks = manifest.get('masks')
    if not isinstance(masks, dict) or not masks:
        raise ValueError('需要 masks 字典：原始图像相对路径 → 蒙版相对路径')
    eligible = {f['image']: f for f in data['frames']
                if f['segment'] == f'object:{object_id}' and f.get('tracking_state') == 'normal'}
    if any(name not in eligible for name in masks):
        raise ValueError('蒙版清单包含其他片段、旧片段或非正常跟踪帧')
    frames = [f for f in data['frames'] if f['image'] in masks]
    if len(frames) < 12:
        raise ValueError('至少需要 12 个有明确前景蒙版的不同有效视角')
    base = ROOT / 'data/processed/object-preparation'
    base.mkdir(parents=True, exist_ok=True)
    output = base / uuid.uuid4().hex
    staging = base / ('.preparing-' + uuid.uuid4().hex)
    staging.mkdir()
    try:
        source = staging / 'input'; source.mkdir()
        (source / 'images').mkdir(); (source / 'masks').mkdir()
        normalized = copy.deepcopy(data); normalized['frames'] = []
        point_sets, color_sets = [], []
        for index, frame in enumerate(frames):
            image_path = local_file(path.parent, frame['image'])
            mask_path = local_file(manifest_path.parent, masks[frame['image']])
            with Image.open(image_path) as image, Image.open(mask_path) as mask:
                intr = frame['intrinsics']
                if image.size != (intr['w'], intr['h']) or mask.size != image.size:
                    raise ValueError(f'图像和蒙版尺寸必须匹配原始内参：{frame["image"]}')
                alpha = np.asarray(mask.convert('L'))
                fraction = float(np.count_nonzero(alpha > 127)) / alpha.size
                if not 0 < fraction < 0.95:
                    raise ValueError(f'蒙版没有明确前景或几乎覆盖整张图片：{frame["image"]}')
                relative = f'images/{index:06d}{image_path.suffix.lower()}'
                mask_relative = f'masks/{index:06d}.png'
                shutil.copy2(image_path, source / relative)
                Image.fromarray(alpha).save(source / mask_relative)
                item = copy.deepcopy(frame); item['image'] = relative; item['mask'] = mask_relative
                # Depth remains in original raw capture; the normalized derivative does not claim to contain it.
                item.pop('depth', None)
                normalized['frames'].append(item)
                meta = frame.get('depth')
                if not meta:
                    continue
                if meta.get('encoding') != 'float32-little-endian' or meta.get('units') != 'meter':
                    raise ValueError('不支持的深度格式')
                depth = np.fromfile(local_file(path.parent, meta['path']), dtype='<f4').reshape(meta['height'], meta['width'])
                pose = to_opengl(frame['camera_to_world'], data['camera_axes'])
                xyz, xx, yy = unproject(depth, meta['intrinsics'], pose, stride=2)
                rgb = np.asarray(image.convert('RGB'))
                ix = np.clip(np.rint(xx * image.width / meta['width']).astype(int), 0, image.width - 1)
                iy = np.clip(np.rint(yy * image.height / meta['height']).astype(int), 0, image.height - 1)
                foreground = alpha[iy, ix] > 127
                point_sets.append(xyz[foreground]); color_sets.append(rgb[iy[foreground], ix[foreground]])
        if not point_sets or sum(len(points) for points in point_sets) < 30:
            raise ValueError('物品前景缺少可用深度点，无法确定米制原点；请改善蒙版或补拍')
        points, colors = np.concatenate(point_sets), np.concatenate(color_sets)
        origin = np.median(points, axis=0)
        points = points - origin
        _, keep = np.unique(np.floor(points / 0.008).astype(np.int64), axis=0, return_index=True)
        points, colors = points[keep], colors[keep]
        for frame in normalized['frames']:
            for axis in range(3): frame['camera_to_world'][axis][3] -= float(origin[axis])
        normalized['status'] = 'object-mask-derivative'
        normalized_path = source / 'session.json'
        normalized_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2))
        dataset = staging / 'dataset'
        convert(normalized_path, dataset, mode='object', segment=f'object:{object_id}')
        vertices = np.empty(len(points), dtype=[('x','<f4'),('y','<f4'),('z','<f4'),('red','u1'),('green','u1'),('blue','u1')])
        for axis, key in enumerate(('x','y','z')): vertices[key] = points[:, axis]
        for axis, key in enumerate(('red','green','blue')): vertices[key] = colors[:, axis]
        header = (f'ply\nformat binary_little_endian 1.0\nelement vertex {len(points)}\n'
                  'property float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n')
        with (dataset / 'lidar-seed.ply').open('wb') as handle:
            handle.write(header.encode()); handle.write(vertices.tobytes())
        transforms = json.loads((dataset / 'transforms.json').read_text())
        transforms['ply_file_path'] = 'lidar-seed.ply'
        (dataset / 'transforms.json').write_text(json.dumps(transforms, indent=2))
        job = json.loads((dataset / 'job.json').read_text())
        job['source_session'] = str(output / 'input/session.json')
        (dataset / 'job.json').write_text(json.dumps(job, ensure_ascii=False, indent=2))
        report = {'version': 1, 'object_id': object_id, 'name': obj['name'], 'capture_id': data['id'],
                  'space_id': data.get('space_id'), 'raw_session': str(path),
                  'frames': len(frames), 'seed_points': len(points),
                  'suggested_position_meters': origin.tolist(), 'model_units': 'meter',
                  'suggested_rotation_degrees': [0, 0, 0], 'suggested_scale': 1,
                  'status': 'dataset-ready-not-trained', 'alignment': 'same-capture-origin-needs-user-confirmation',
                  'warnings': ['原点来自蒙版内深度点，仅是初始摆放建议', '如果物品在房间扫描后移动过，必须重新摆放对齐',
                               '没有执行自动分割、背景移除、训练或画质判断']}
        (staging / 'placement.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        staging.rename(output)
        return {'output': str(output), **report}
    except Exception:
        shutil.rmtree(staging)
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    listing = commands.add_parser('inventory', help='列出物品、空位和放回片段，不生成模型')
    listing.add_argument('session', type=Path)
    export = commands.add_parser('prepare', help='读取已提供的前景蒙版，生成独立训练数据；不启动训练')
    export.add_argument('session', type=Path)
    export.add_argument('--object-id', required=True)
    export.add_argument('--mask-manifest', required=True, type=Path)
    export.add_argument('--stationary-confirmed', action='store_true')
    args = parser.parse_args()
    try:
        result = inventory(args.session) if args.command == 'inventory' else prepare(args.session, args.object_id, args.mask_manifest, args.stationary_confirmed)
    except (ValueError, KeyError, OSError, ImportError) as error:
        parser.exit(1, f'无法整理物品：{error}\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
