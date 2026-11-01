"""Capture and held-out appearance gates. Heuristics, not a geometry guarantee."""
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image

from convert import local_file, to_opengl


def capture_check(session_path):
    session_path = Path(session_path)
    data = json.loads(session_path.read_text())
    issues = []
    if data.get('source') != 'arkit' or data.get('simulated') is not False:
        issues.append('请使用真实手机采集；演练数据不会进入成片流程。')
    if data.get('quality_version') != 1:
        issues.append('这是旧版采集，没有扫描时的质量和覆盖记录。请用新版引导重新扫描。')
    room = data.get('quality', {}).get('room', {})
    if not room.get('gate_passed') or data.get('status') != 'capture-checks-passed-not-reconstructed':
        issues += room.get('issues', [])[:6] or ['手机端的房间采集预检未通过，请继续补扫后再导出。']
    frames = [f for f in data.get('frames', []) if f.get('segment') == 'room']
    if len(frames) < 100:
        issues.append('房间有效关键帧不足 100 个。请移动身体，换角度观察同一表面。')
    if issues:
        return {'passed': False, 'issues': list(dict.fromkeys(issues)), 'frames': len(frames)}
    camera = []
    bad = 0
    for frame in frames:
        pose = to_opengl(frame['camera_to_world'], data['camera_axes'])
        camera.append([pose[i][3] for i in range(3)])
        quality = frame.get('quality') or {}
        fields = ['speed_mps', 'angular_speed_rps', 'predicted_blur_pixels', 'brightness',
                  'clipped_fraction', 'edge_energy', 'overlap', 'depth_valid_fraction']
        if not all(isinstance(quality.get(k), (int, float)) and math.isfinite(quality[k]) for k in fields):
            bad += 1; continue
        if (quality['speed_mps'] > .55 or quality['angular_speed_rps'] > .8
                or quality['predicted_blur_pixels'] > 5 or quality['brightness'] < .12
                or quality['clipped_fraction'] > .28 or quality['edge_energy'] < 12
                or quality['overlap'] < .5 or quality['depth_valid_fraction'] < .45):
            bad += 1
    if bad:
        issues.append(f'{bad} 张关键帧缺少有效质量记录或未达到采集要求，请重扫该阶段。')
    camera = np.asarray(camera)
    path = float(np.linalg.norm(np.diff(camera, axis=0), axis=1).sum())
    loop = float(np.linalg.norm(camera[-1]-camera[0]))
    if path < 4 or loop > .8:
        issues.append('房间路线没有连成一圈，请从起点出发缓慢绕行并回到起点。')
    layout_path = session_path.parent/'room-layout.json'
    if not layout_path.is_file():
        issues.append('缺少房间结构记录，请用新版采集端重新扫描。')
        return {'passed': False, 'issues': issues, 'frames': len(frames)}
    surfaces = json.loads(layout_path.read_text())
    if len(surfaces) > 200:
        raise ValueError('房间结构超出单房间范围')
    if sum(s.get('kind') == 'wall' for s in surfaces) < 3 or not any(s.get('kind') == 'floor' for s in surfaces):
        issues.append('墙面或地面结构识别不足。请先拍清房间各个墙角和地面。')
    patches = []
    for surface in surfaces:
        pose = np.array(to_opengl(surface['transform'], 'opengl'))
        w, h = float(surface['width']), float(surface['height'])
        if not (math.isfinite(w) and math.isfinite(h) and 0 < w < 30 and 0 < h < 30):
            raise ValueError('房间结构尺寸无效')
        nx, ny = min(20, max(1, math.ceil(w/.5))), min(12, max(1, math.ceil(h/.5)))
        xx, yy = np.meshgrid((np.arange(nx)+.5)/nx*w-w/2, (np.arange(ny)+.5)/ny*h-h/2)
        local = np.stack([xx.ravel(), yy.ravel(), np.zeros(nx*ny), np.ones(nx*ny)], axis=1)
        patches.extend((local@pose.T)[:, :3].tolist())
    points = np.asarray(patches)
    counts = np.zeros(len(points), dtype=int)
    first_camera = np.full((len(points), 3), np.nan)
    first_direction = np.full((len(points), 3), np.nan)
    baseline = np.zeros(len(points), dtype=bool)
    hidden_counts = np.zeros(len(points), dtype=int)
    hidden_camera = np.full((len(points), 3), np.nan)
    hidden_baseline = np.zeros(len(points), dtype=bool)
    for frame in frames:
        meta = frame.get('depth')
        if not meta or meta.get('encoding') != 'float32-little-endian' or meta.get('units') != 'meter':
            issues.append('关键帧缺少可用 LiDAR 深度。'); break
        dw, dh = meta['width'], meta['height']
        if not (0 < dw <= 1024 and 0 < dh <= 1024):
            raise ValueError('深度尺寸超限')
        depth = np.fromfile(local_file(session_path.parent, meta['path']), dtype='<f4').reshape(dh, dw)
        pose = np.asarray(frame['camera_to_world']); cam = pose[:3, 3]
        local = (points-cam)@pose[:3, :3]
        z = -local[:, 2]; k = meta['intrinsics']
        with np.errstate(divide='ignore', invalid='ignore'):
            u = k['fl_x']*local[:, 0]/z+k['cx']; v = -k['fl_y']*local[:, 1]/z+k['cy']
        visible = np.isfinite(u) & np.isfinite(v) & (z >= .4) & (z <= 4) & (u > dw*.06) & (u < dw*.94) & (v > dh*.06) & (v < dh*.94)
        index = np.where(visible)[0]
        observed = depth[v[index].astype(int), u[index].astype(int)]
        hidden_index = index[np.isfinite(observed) & (observed > .25) & (observed < z[index]-np.maximum(.2, z[index]*.07))]
        new_hidden = hidden_counts[hidden_index] == 0
        hidden_camera[hidden_index[new_hidden]] = cam
        hidden_baseline[hidden_index] |= np.linalg.norm(cam-hidden_camera[hidden_index], axis=1) >= .2
        hidden_counts[hidden_index] += 1
        index = index[np.isfinite(observed) & (observed > .25) & (abs(observed-z[index]) <= np.maximum(.12, z[index]*.05))]
        direction = cam-points[index]; direction /= np.linalg.norm(direction, axis=1)[:, None]
        new = counts[index] == 0
        first_camera[index[new]], first_direction[index[new]] = cam, direction[new]
        angle = np.arccos(np.clip(np.sum(direction*first_direction[index], axis=1), -1, 1))
        baseline[index] |= (np.linalg.norm(cam-first_camera[index], axis=1) >= .2) & (angle >= .14)
        counts[index] += 1
    hidden = (counts == 0) & (hidden_counts >= 3) & hidden_baseline
    eligible = ~hidden
    coverage = float(np.mean(((counts >= 3) & baseline)[eligible])) if eligible.any() else 0
    if coverage < .75:
        issues.append(f'电脑复核发现已识别表面只有 {coverage:.0%} 达到多角度覆盖。请回到红点区域换位置补扫。')
    return {'passed': not issues, 'issues': list(dict.fromkeys(issues)), 'frames': len(frames),
            'multiview_fraction': coverage, 'occluded_patches': int(hidden.sum()), 'path_meters': path, 'loop_distance_meters': loop,
            'policy': 'experimental-v1; not proof of unseen coverage or absolute geometry accuracy'}


def appearance_check(dataset, eval_directory, minimum_mean=23.0, minimum_view=17.0):
    dataset, eval_directory = Path(dataset), Path(eval_directory)
    transforms = json.loads((dataset/'transforms.json').read_text())
    expected = list(range(0, len(transforms['frames']), 10))
    views = []
    for index in expected:
        path = eval_directory/f'{index:06d}.png'
        if not path.is_file():
            return {'passed': False, 'issues': ['重建器没有输出全部留出视角，无法自动验收。'], 'views': views}
        with Image.open(path) as result, Image.open(local_file(dataset, transforms['frames'][index]['file_path'])) as source:
            result = result.convert('RGB'); source = source.convert('RGB').resize(result.size, Image.Resampling.LANCZOS)
            a, b = np.asarray(source, dtype=np.float32)/255, np.asarray(result, dtype=np.float32)/255
            mse = float(np.square(a-b).mean())
            views.append({'frame': index, 'psnr_rgb': -10*math.log10(max(mse, 1e-10))})
    mean = float(np.mean([v['psnr_rgb'] for v in views]))
    worst = min(views, key=lambda v: v['psnr_rgb'])
    passed = mean >= minimum_mean and worst['psnr_rgb'] >= minimum_view
    return {'passed': passed, 'mean_psnr_rgb': mean, 'worst_view': worst, 'views': views,
            'issues': [] if passed else ['自动重建的留出视角仍有明显误差，未作为成片提交。请补拍缺少侧向视角、模糊或反光严重的区域。'],
            'thresholds': {'mean_psnr_rgb': minimum_mean, 'worst_psnr_rgb': minimum_view},
            'limits': ['RGB heuristic is experimental, not a subjective photorealism guarantee',
                       'Does not certify geometry or uncaptured surfaces']}
