"""Build a metric colored point seed from aligned ARKit sceneDepth (not a trained splat).

RGB and depth must use the same unrotated camera axes. Keep the original capture
unchanged; this writes only into an already converted Nerfstudio dataset.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

from convert import local_file, to_opengl


def unproject(depth, intrinsics, pose, stride=4):
    if stride < 1 or intrinsics['fl_x'] <= 0 or intrinsics['fl_y'] <= 0:
        raise ValueError('Stride and focal lengths must be positive')
    h, w = depth.shape
    yy, xx = np.mgrid[0:h:stride, 0:w:stride]
    z = depth[::stride, ::stride]
    valid = np.isfinite(z) & (z >= 0.2) & (z <= 5.0)
    xx, yy, z = xx[valid], yy[valid], z[valid]
    camera = np.stack(((xx-intrinsics['cx'])*z/intrinsics['fl_x'],
                       -(yy-intrinsics['cy'])*z/intrinsics['fl_y'], -z), axis=1)
    pose = np.asarray(pose)
    return camera @ pose[:3, :3].T + pose[:3, 3], xx, yy


def build(session_path, dataset_path, every=9, voxel=0.035):
    if every < 1 or not np.isfinite(voxel) or voxel <= 0:
        raise ValueError('Frame interval and voxel size must be positive')
    session_path, dataset_path = Path(session_path), Path(dataset_path)
    data = json.loads(session_path.read_text())
    if data.get('source') != 'arkit' or data.get('simulated') is not False:
        raise ValueError('This tool expects a real ARKit capture')
    output = dataset_path/'lidar-seed.ply'
    if output.exists():
        raise ValueError('Point seed already exists; use a new dataset')
    points, colors = [], []
    frames = [f for f in data['frames'] if f['segment'] == 'room' and f.get('depth')][::every]
    for frame in frames:
        meta = frame.get('depth')
        if not meta:
            continue
        if meta['encoding'] != 'float32-little-endian' or meta['units'] != 'meter':
            raise ValueError('Unexpected depth encoding')
        depth = np.fromfile(local_file(session_path.parent, meta['path']), dtype='<f4')
        depth = depth.reshape(meta['height'], meta['width'])
        pose = to_opengl(frame['camera_to_world'], data['camera_axes'])
        xyz, xx, yy = unproject(depth, meta['intrinsics'], pose)
        if len(xyz) == 0:
            continue
        with Image.open(local_file(session_path.parent, frame['image'])) as im:
            im = np.asarray(im.convert('RGB'))
            ix = np.clip(np.rint(xx*im.shape[1]/meta['width']).astype(int), 0, im.shape[1]-1)
            iy = np.clip(np.rint(yy*im.shape[0]/meta['height']).astype(int), 0, im.shape[0]-1)
            rgb = im[iy, ix]
        points.append(xyz); colors.append(rgb)
    if not points:
        raise ValueError('No usable depth frames')
    points, colors = np.concatenate(points), np.concatenate(colors)
    _, keep = np.unique(np.floor(points/voxel).astype(np.int32), axis=0, return_index=True)
    points, colors = points[keep], colors[keep]
    # Standard XYZ + uchar RGB is accepted by Brush's PLY importer.
    vertices = np.empty(len(points), dtype=[('xyz', '<f4', (3,)), ('rgb', 'u1', (3,))])
    vertices['xyz'], vertices['rgb'] = points, colors
    header = ('ply\nformat binary_little_endian 1.0\ncomment ARKit LiDAR seed; not trained Gaussian\n'
              f'element vertex {len(points)}\nproperty float x\nproperty float y\nproperty float z\n'
              'property uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n')
    with output.open('wb') as f:
        f.write(header.encode()); f.write(vertices.tobytes())
    transforms_path = dataset_path/'transforms.json'
    transforms = json.loads(transforms_path.read_text())
    transforms['ply_file_path'] = output.name
    transforms_path.write_text(json.dumps(transforms, indent=2))
    report = {'source': str(session_path), 'seed_points': len(points), 'depth_frames': len(frames),
              'voxel_meters': voxel, 'bounds_min': points.min(axis=0).tolist(),
              'bounds_max': points.max(axis=0).tolist(), 'trained': False}
    (dataset_path/'depth-seed-report.json').write_text(json.dumps(report, indent=2))
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('session', type=Path); p.add_argument('dataset', type=Path)
    p.add_argument('--every', type=int, default=9)
    a = p.parse_args()
    print(json.dumps(build(a.session, a.dataset, a.every), indent=2))
