#!/usr/bin/env python3
"""Prepare a real ARKit camera/LiDAR dataset, without training or evaluation.

The matching handoff's original image names are preserved so the school server
can reuse its existing images/. Only measured cameras and a depth seed are new.
"""
import argparse
import json
import math
from pathlib import Path
import re
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/dataset'))
from convert import local_file, to_opengl
from depth_seed import build as build_depth_seed


def prepare(prepared, output):
    prepared, output = Path(prepared).resolve(), Path(output).resolve()
    handoff = json.loads((prepared / 'handoff.json').read_text())
    capture = prepared / 'capture'
    session = json.loads((capture / 'session.json').read_text())
    if session.get('source') != 'arkit' or session.get('simulated') is not False:
        raise ValueError('Requires a real ARKit capture, not simulated data')
    if session.get('units') != 'meter' or session.get('camera_axes') not in ('opengl', 'opencv'):
        raise ValueError('Explicit metric units and camera axes are required')
    if output.exists():
        raise ValueError('Use a new output directory; existing datasets are not overwritten')
    originals = {frame['image']: frame for frame in session['frames']}
    frames, selected, names = [], [], set()
    for record in handoff['frames']:
        raw = originals[record['original']]
        if raw.get('segment') != 'room' or raw.get('tracking_state') != 'normal':
            raise ValueError('Every included camera must be a normally tracked room frame')
        name = record['name']
        if not re.fullmatch(r'\d{6}\.(?:jpg|jpeg|png)', name, re.I) or name in names:
            raise ValueError('Unexpected or duplicate handoff image name')
        names.add(name)
        local_file(prepared / 'input/images', name)
        intrinsics = record['intrinsics']
        for key in ('w', 'h', 'fl_x', 'fl_y', 'cx', 'cy'):
            value = intrinsics[key]
            if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
                raise ValueError('Non-finite camera calibration')
        if any(intrinsics[k] <= 0 for k in ('w', 'h', 'fl_x', 'fl_y')):
            raise ValueError('Invalid camera size/focal length')
        if intrinsics.get('distorted', False):
            raise ValueError('Distorted inputs require a separate calibrated conversion')
        pose = to_opengl(record['camera_to_world'], session['camera_axes'])
        frame = {key: intrinsics[key] for key in ('w', 'h', 'fl_x', 'fl_y', 'cx', 'cy')}
        frame.update(file_path='images/' + name, transform_matrix=pose)
        frames.append(frame)
        selected.append(raw)
    if not frames or not any(frame.get('depth') for frame in selected):
        raise ValueError('Measured cameras and LiDAR depth are both required')
    output.mkdir(parents=True)
    (output / 'images').symlink_to(prepared / 'input/images', target_is_directory=True)
    transforms = {'camera_model': 'OPENCV', 'units_per_meter': 1.0,
                  'orientation_override': 'none', 'frames': frames}
    (output / 'transforms.json').write_text(json.dumps(transforms, indent=2) + '\n')
    # A derived sidecar lives alongside the extracted depth/images it references.
    # The original session.json and raw archive are never modified.
    selected_session = dict(session, frames=selected)
    selection_path = capture / ('arkit-seed-selection-' + uuid.uuid4().hex + '.json')
    selection_path.write_text(json.dumps(selected_session, ensure_ascii=False, indent=2) + '\n')
    seed = build_depth_seed(selection_path, output, every=9, voxel=0.035)
    if seed['seed_points'] < 1:
        raise ValueError('No measured 3D seed points could be prepared')
    manifest = {
        'version': 1, 'provider': 'arkit-depth-splatfacto',
        'capture_id': handoff['capture_id'], 'image_count': len(frames),
        'provided_camera_count': len(frames), 'colmap_registered_images': None,
        'tracking_state': 'normal', 'camera_source': 'recorded ARKit camera-to-world',
        'camera_axes': 'opengl', 'world_up_axis': 'y', 'units': 'meter',
        'originals_reencoded': False, 'seed_points': seed['seed_points'],
        'seed_depth_frames': seed['depth_frames'],
        'capture_advice': handoff.get('issues', []),
        'trained': False, 'quality_verified': False,
        'note': 'Provided camera counts are not COLMAP registration or quality scores. '
                'AR tracking drift and incomplete capture may still affect the result.'
    }
    (output / 'capture-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('prepared', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    print(json.dumps(prepare(args.prepared, args.output), ensure_ascii=False, indent=2))
