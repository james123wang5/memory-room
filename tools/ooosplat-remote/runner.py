#!/usr/bin/env python3
"""Slurm/Enroot adapter for pinned OOOSplat engines and ordinary-image recipe.

Uses COLMAP4.2.1 and OOOBrush ooo-v1.0.0, not Nerfstudio or gsplat. Mirrors the
official ordinary-image exhaustive pipeline, best sparse-model selection,
balanced Brush arguments, registration warning and validated atomic PLY publish.
Desktop GUI/editor, video bridge backfill and Caspar probing are not this adapter.
"""
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent
ENGINES = Path('/memoryroom/runtime/ooosplat')
COLMAP = ENGINES / 'colmap/bin/colmap'
BRUSH = ENGINES / 'brush/brush_app'
STATE = ROOT / 'status.json'


def state(stage, **values):
    try:
        data = json.loads(STATE.read_text())
    except (OSError, ValueError):
        data = {}
    data.update(provider='ooosplat-colmap-ooobrush', stage=stage, updated_unix=time.time(), **values)
    tmp = STATE.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    tmp.replace(STATE)
    print('[OOOSplat remote]', stage, json.dumps(values, ensure_ascii=False), flush=True)


def run(argv, log_name, env=None):
    path = ROOT / 'logs' / log_name
    path.parent.mkdir(exist_ok=True)
    with path.open('a') as stream:
        stream.write('\nCOMMAND '+json.dumps(list(map(str, argv)))+'\n')
        stream.flush()
        result = subprocess.run(list(map(str, argv)), stdout=stream, stderr=subprocess.STDOUT, env=env)
    if result.returncode:
        with path.open('rb') as stream:
            stream.seek(max(0, path.stat().st_size-10000))
            print(stream.read().decode(errors='replace'), flush=True)
        raise RuntimeError('%s exited %s; log %s' % (argv[0], result.returncode, path))


def colmap_env():
    env = dict(os.environ)
    env['LD_LIBRARY_PATH'] = str(ENGINES/'colmap/lib')
    env.update(QT_QPA_PLATFORM='offscreen', OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2')
    return env


def helptext(command):
    result = subprocess.run([str(COLMAP), command, '-h'], capture_output=True, text=True, env=colmap_env())
    output = result.stdout + result.stderr
    if result.returncode:
        raise RuntimeError('COLMAP command metadata unavailable: '+output[-3000:])
    return output


def thread_option(help_output, candidates, value):
    for candidate in candidates:
        if candidate in help_output:
            return [candidate, str(value)]
    raise RuntimeError('Pinned COLMAP is missing its expected thread-control option')


def model_counts(path):
    try:
        counts = []
        for name in ('cameras.bin', 'images.bin', 'points3D.bin'):
            with (path/name).open('rb') as f:
                counts.append(struct.unpack('<Q', f.read(8))[0])
        return counts
    except (OSError, struct.error):
        return (0, 0, 0)


def reconstruct():
    config = json.loads((ROOT/'official-pipeline-optimization.json').read_text())
    profile = config['brushProfiles']['balanced']
    photos = sorted(p for p in (ROOT/'images').iterdir() if p.suffix.lower() in ('.jpg','.jpeg','.png'))
    if len(photos) < 2:
        raise RuntimeError('At least two original input images required')
    work = ROOT/'work/colmap'
    work.mkdir(parents=True, exist_ok=True)
    database = work/'database.db'
    state('feature_extraction', input_images=len(photos), colmap_version='4.2.1',
          colmap_backend='CPU/Ceres', backend_reason='Host driver570 below official runtime minimum580',
          brush_version='ooo-v1.0.0', target_iterations=profile['totalSteps'])
    feature_help = helptext('feature_extractor')
    camera_args = []
    camera_file = ROOT/'camera-initialization.json'
    if camera_file.exists():
        camera = json.loads(camera_file.read_text())
        if camera.get('capture_id') != '1ebc5b7a-3127-4516-840b-53b61fb4ab1a' or camera.get('camera_model') != 'SIMPLE_RADIAL':
            raise RuntimeError('Measured camera initialization belongs to another capture')
        camera_args = ['--ImageReader.camera_params', ','.join(map(str,camera['params']))]
    run([COLMAP, 'feature_extractor', '--database_path', database, '--image_path', ROOT/'images',
         '--ImageReader.camera_model', 'SIMPLE_RADIAL', '--ImageReader.single_camera', '1',
         '--FeatureExtraction.use_gpu', '0', '--FeatureExtraction.max_image_size', str(profile['sfmMaxImageSize']),
         '--SiftExtraction.max_num_features', str(config['qualities']['balanced']['automaticOptimizationOn']['sfmMaxFeatures'])]
        + camera_args + thread_option(feature_help, ['--FeatureExtraction.num_threads','--SiftExtraction.num_threads'], 2),
        'colmap-features.log', colmap_env())
    state('matching', matching='exhaustive', input_images=len(photos))
    matching_help = helptext('exhaustive_matcher')
    run([COLMAP, 'exhaustive_matcher', '--database_path', database, '--FeatureMatching.use_gpu', '0']
        + thread_option(matching_help, ['--FeatureMatching.num_threads','--SiftMatching.num_threads'], 2),
        'colmap-matching.log', colmap_env())
    sparse = work/'sparse'
    sparse.mkdir(exist_ok=True)
    state('mapping')
    run([COLMAP, 'mapper', '--database_path', database, '--image_path', ROOT/'images',
         '--output_path', sparse, '--Mapper.num_threads', '4',
         '--Mapper.ba_local_backend', 'CERES', '--Mapper.ba_global_backend', 'CERES'],
        'colmap-mapper.log', colmap_env())
    choices = [(path, model_counts(path)) for path in [sparse]+sorted(sparse.iterdir()) if path.is_dir()]
    valid = [(path, counts) for path, counts in choices if all(count > 0 for count in counts)]
    if not valid:
        raise RuntimeError('Official COLMAP did not produce a valid camera/image/point model')
    selected, counts = max(valid, key=lambda value: value[1][1])
    ratio = counts[1]/len(photos)
    report = dict(input_images=len(photos), registered_images=counts[1], points=counts[2],
                  registration_fraction=ratio, selected_model=str(selected.relative_to(ROOT)),
                  models=[dict(path=str(p.relative_to(ROOT)), cameras=c[0], images=c[1], points=c[2]) for p,c in choices],
                  quality_verified=False, complete_room_verified=False,
                  warning='Low registration; output may contain only part of the room' if ratio<0.8 else None)
    (ROOT/'registration-report.json').write_text(json.dumps(report,indent=2)+'\n')
    dataset = ROOT/'dataset'
    (dataset/'sparse/0').mkdir(parents=True, exist_ok=True)
    if not (dataset/'images').exists():
        (dataset/'images').symlink_to('../images', target_is_directory=True)
    for name in ('cameras.bin','images.bin','points3D.bin'):
        shutil.copy2(selected/name, dataset/'sparse/0'/name)
    state('ready_for_training', **report)


def validate_gpu():
    expected = os.environ.get('MEMORYROOM_ASSIGNED_GPU','')
    if not re.fullmatch(r'GPU-[0-9a-fA-F-]+', expected):
        raise RuntimeError('No explicit scheduler-assigned GPU UUID')
    # Device identity inspection is part of this production allocation; it does
    # not render a sample or benchmark. Fail closed if container isolation failed.
    info = subprocess.run(['vulkaninfo','--summary'], capture_output=True,text=True, timeout=30)
    (ROOT/'logs/vulkan-allocation.txt').write_text(info.stdout+info.stderr)
    uuids = re.findall(r'deviceUUID\s*=\s*([0-9a-fA-F-]+)',info.stdout)
    norm = lambda value: value.replace('GPU-','').replace('-','').lower()
    if info.returncode or len(uuids)!=1 or norm(uuids[0])!=norm(expected):
        raise RuntimeError('Vulkan visibility does not match the one Slurm-assigned GPU; refusing automatic selection')
    return expected


def train():
    report = json.loads((ROOT/'registration-report.json').read_text())
    config = json.loads((ROOT/'official-pipeline-optimization.json').read_text())
    profile = config['brushProfiles']['balanced']
    gpu = validate_gpu()
    out = ROOT/'output'
    out.mkdir(exist_ok=True)
    state('training', gpu_uuid=gpu, target_iterations=profile['totalSteps'],
          colmap_version='4.2.1', brush_version='ooo-v1.0.0', warning=report.get('warning'))
    den = profile['densification']
    env = dict(os.environ, CUBECL_WGPU_DEFAULT_DEVICE='DiscreteGpu(0)',
               WGPU_BACKEND='vulkan', RUST_LOG='info,brush_cli=info,brush_process=info,cubecl_wgpu=info,burn_wgpu=info',
               RUST_BACKTRACE='1', XDG_RUNTIME_DIR='/memoryroom/runtime/ooosplat/xdg',
               XDG_CACHE_HOME='/memoryroom/runtime/ooosplat/cache')
    Path(env['XDG_RUNTIME_DIR']).mkdir(mode=0o700, parents=True, exist_ok=True)
    args = [BRUSH, '--total-train-iters', str(profile['totalSteps']),
            '--max-resolution', str(profile['maxResolution']), '--refine-every', str(config['shared']['brushRefineEvery']),
            '--max-splats', str(max(profile['maxSplats'], report['points'])),
            '--growth-grad-threshold', str(den['growthGradThreshold']),
            '--growth-select-fraction', str(den['growthSelectFraction']),
            '--growth-stop-iter', str(den['growthStopIter']),
            '--export-every', str(profile['totalSteps']), '--export-path', out,
            '--export-name', 'final.ply.tmp', ROOT/'dataset']
    (ROOT/'train-command.json').write_text(json.dumps(list(map(str,args)),indent=2)+'\n')
    run(args,'ooobrush-training.log',env)
    temp = out/'final.ply.tmp'
    with temp.open('rb') as f:
        header = f.read(65536).split(b'end_header\n')[0].decode('ascii','replace')
    needed = ('x','y','z','f_dc_0','opacity','scale_0','rot_0')
    vertex = re.search(r'^element vertex (\d+)$',header,re.M)
    if 'format binary_little_endian 1.0' not in header or not vertex or int(vertex[1])<1:
        raise RuntimeError('Invalid OOOBrush output; model not published')
    for name in needed:
        if not re.search(r'^property \S+ '+re.escape(name)+r'$',header,re.M):
            raise RuntimeError('Missing Gaussian property '+name)
    final = out/'final.ply'
    temp.replace(final)
    (out/'EXPORT_COMPLETED.txt').write_text('OOOBrush ooo-v1.0.0 completed and PLY published\n')
    shutil.copy2(ROOT/'registration-report.json',out/'registration-report.json')
    shutil.copy2(ROOT/'engine-lock.json',out/'engine-lock.json')
    state('completed', output=str(final), gaussian_count=int(vertex[1]), bytes=final.stat().st_size,
          quality_verified=False, complete_room_verified=False)


if __name__=='__main__':
    try:
        if sys.argv[1]=='reconstruct': reconstruct()
        elif sys.argv[1]=='train': train()
        else: raise ValueError('Unknown production stage')
    except Exception as error:
        state('failed', failed_stage=sys.argv[1] if len(sys.argv)>1 else 'unknown', error=str(error))
        raise
