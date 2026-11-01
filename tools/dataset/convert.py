"""Convert an explicit normalized capture session to Brush/Nerfstudio format.

This converter does not estimate poses or segment objects. Every input pose is
camera-to-world in metres; camera_axes must explicitly name OpenGL or OpenCV.
Output is OpenGL camera-to-world. Rotation matrices and paths are validated.
"""
import argparse
import json
import math
from pathlib import Path
import shutil


def matrix4(value):
    if not isinstance(value, list) or len(value) != 4 or any(not isinstance(row, list) or len(row) != 4 for row in value):
        raise ValueError('位姿必须是 4×4 相机到世界矩阵')
    if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for row in value for x in row):
        raise ValueError('位姿含有无效数字')
    if any(abs(value[3][i] - expected) > 1e-6 for i, expected in enumerate([0, 0, 0, 1])):
        raise ValueError('位姿最后一行必须是 [0,0,0,1]')
    for i in range(3):
        for j in range(3):
            dot = sum(value[k][i] * value[k][j] for k in range(3))
            if abs(dot - (1 if i == j else 0)) > 0.01:
                raise ValueError('位姿旋转部分不是正交矩阵，不能含缩放')
    r = value
    det = (r[0][0] * (r[1][1]*r[2][2] - r[1][2]*r[2][1])
           - r[0][1] * (r[1][0]*r[2][2] - r[1][2]*r[2][0])
           + r[0][2] * (r[1][0]*r[2][1] - r[1][1]*r[2][0]))
    if abs(det - 1) > 0.02:
        raise ValueError('位姿必须使用右手坐标系')
    return [list(row) for row in value]


def to_opengl(pose, axes):
    result = matrix4(pose)
    if axes == 'opencv':
        # C2W_gl = C2W_cv @ diag(1,-1,-1,1). Translation does not change.
        for row in result:
            row[1] *= -1
            row[2] *= -1
    elif axes != 'opengl':
        raise ValueError('camera_axes 必须明确是 opengl 或 opencv')
    return result


def local_file(root, relative):
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute() or '\\' in relative:
        raise ValueError('文件路径必须是采集目录内的相对路径')
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('文件路径超出了采集目录')
    if not path.is_file():
        raise ValueError(f'文件不存在：{relative}')
    return path


def convert(session_path, output, mode='room', segment=None, every=1):
    session_path, output = Path(session_path).resolve(), Path(output).resolve()
    if mode not in ('room', 'object'):
        raise ValueError('mode 只能是 room 或 object')
    if every < 1:
        raise ValueError('抽帧间隔必须大于零')
    if output.exists():
        raise ValueError('输出目录已存在；请选择新目录，避免覆盖采集或结果')
    data = json.loads(session_path.read_text())
    if data.get('version') != 1 or data.get('units') != 'meter':
        raise ValueError('需要 version=1 且 units=meter 的采集数据')
    axes = data.get('camera_axes')
    if axes not in ('opengl', 'opencv'):
        raise ValueError('必须声明 camera_axes，不能猜测坐标约定')
    selected = [f for f in data.get('frames', []) if segment is None or f.get('segment') == segment][::every]
    if not selected:
        raise ValueError('没有匹配的有效帧')
    prepared = []
    for index, frame in enumerate(selected):
        intr = frame.get('intrinsics', {})
        for key in ('w', 'h', 'fl_x', 'fl_y', 'cx', 'cy'):
            x = intr.get(key)
            if isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x):
                raise ValueError(f'第 {index} 帧缺少有效相机参数 {key}')
        if any(intr[k] <= 0 for k in ('w', 'h', 'fl_x', 'fl_y')) or any(int(intr[k]) != intr[k] for k in ('w', 'h')):
            raise ValueError('图像尺寸须为正整数，焦距须为正')
        if intr.get('distorted', False):
            raise ValueError('此版本只接收已校正的针孔图像，畸变图像需先处理')
        image = local_file(session_path.parent, frame['image'])
        mask = local_file(session_path.parent, frame['mask']) if frame.get('mask') else None
        if image.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
            raise ValueError('图像必须是 PNG 或 JPEG')
        if mask and mask.suffix.lower() != '.png':
            raise ValueError('蒙版必须是 PNG，白色保留、黑色排除')
        if mode == 'object' and not mask:
            raise ValueError('独立物品每一帧都需要前景蒙版；转换器不会自动分割')
        prepared.append((image, mask, frame, intr, to_opengl(frame['camera_to_world'], axes)))
    # Optional image handling is imported only for an actual conversion.
    try:
        from PIL import Image
    except ImportError as e:
        raise ValueError('需要 Pillow 读取图像：请在项目虚拟环境安装 tools/dataset/requirements.txt') from e
    # Validate all images before creating the output tree.
    for image, mask, _, intr, _ in prepared:
        with Image.open(image) as im:
            if im.size != (intr['w'], intr['h']):
                raise ValueError(f'图像尺寸与相机参数不符：{image.name}')
        if mask:
            with Image.open(mask) as im:
                if im.size != (intr['w'], intr['h']):
                    raise ValueError(f'蒙版尺寸与图像不符：{mask.name}')
    output.mkdir(parents=True)
    try:
        (output / 'images').mkdir()
        if mode == 'room' and any(x[1] for x in prepared):
            (output / 'masks').mkdir()
        result = {'camera_model': 'OPENCV', 'units_per_meter': 1.0, 'frames': []}
        for i, (image, mask, frame, intr, pose) in enumerate(prepared):
            filename = f'{i:06d}.png' if mode == 'object' else f'{i:06d}{image.suffix.lower()}'
            dest = output / 'images' / filename
            if mode == 'object':
                with Image.open(image) as im, Image.open(mask) as m:
                    rgba = im.convert('RGBA'); rgba.putalpha(m.convert('L')); rgba.save(dest)
            else:
                shutil.copy2(image, dest)
                if mask:
                    shutil.copy2(mask, output / 'masks' / f'{i:06d}.png')
            result['frames'].append({key: intr[key] for key in ('w', 'h', 'fl_x', 'fl_y', 'cx', 'cy')} |
                                    {'file_path': f'images/{filename}', 'transform_matrix': pose})
        (output / 'transforms.json').write_text(json.dumps(result, indent=2))
        plan = {'version': 1, 'source_session': str(session_path), 'mode': mode, 'segment': segment,
                'simulated': data.get('simulated', False), 'capture_source': data.get('source', 'normalized-input'),
                'frames': len(prepared), 'alpha_mode': 'transparent' if mode == 'object' else 'masked',
                'requires_alpha_matching': mode == 'object',
                'status': 'dataset-exported-not-trained',
                'notes': ['物品必须在所选片段内固定', '相机位姿精度尚需在真实采集中验证',
                          '未估计物体自身运动；未运行 SAM2 或 Brush']}
        (output / 'job.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2))
    except Exception:
        shutil.rmtree(output)
        raise
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('session', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--mode', choices=['room', 'object'], default='room')
    parser.add_argument('--segment')
    parser.add_argument('--every', type=int, default=1)
    args = parser.parse_args()
    try:
        result = convert(args.session, args.output, args.mode, args.segment, args.every)
    except (ValueError, KeyError, OSError) as e:
        parser.exit(1, f'转换失败：{e}\n')
    print(f'已导出 {len(result["frames"])} 帧：{args.output}（尚未训练）')

if __name__ == '__main__':
    main()
