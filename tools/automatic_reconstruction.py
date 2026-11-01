"""Produce a local room preview. No evaluation render or appearance-score gate.

Only the user starts this pipeline by importing/retrying a capture in the UI.
The raw archive is immutable; all derived files live in a new job directory.
"""
import argparse
import fcntl
import json
import math
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parent/'dataset'))
from import_capture import import_capture
from convert import convert
from depth_seed import build as depth_seed

ROOT = Path(__file__).resolve().parents[1]
BRUSH = ROOT/'vendor/brush/v0.3.0/brush-app-aarch64-apple-darwin/brush_app'
child = None
cancel_requested = False


def cancel(signum, frame):
    global cancel_requested
    cancel_requested = True
    if child and child.poll() is None:
        child.terminate()
    raise KeyboardInterrupt


def run(archive, work, node, profile='standard'):
    global child
    work.mkdir(parents=True, exist_ok=True)
    state = {'status': 'importing', 'message': '正在保存原始采集', 'progress': 3,
             'profile': profile, 'pid': os.getpid(), 'started_at': time.time(),
             'issues': [], 'result_kind': 'unverified-preview', 'evaluation_performed': False}

    def update(status, message, progress, **extra):
        state.update(status=status, message=message, progress=progress, updated_at=time.time(), **extra)
        temporary = work/'status.tmp'
        temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2))
        temporary.replace(work/'status.json')

    def stop_requested():
        if cancel_requested or (work/'cancel.request').exists():
            raise KeyboardInterrupt

    lock = None
    try:
        # A file lock also prevents a second Vite/server process from running another GPU job.
        lock = (ROOT/'data/processed/reconstruction.lock').open('a')
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ValueError('另一个重建任务仍在运行。请等它结束后重试此任务。')
        update('importing', '正在解包；手机原件与导入包均保留', 5)
        capture = work/'capture'
        session = import_capture(archive, capture)
        stop_requested()
        if session.get('source') != 'arkit' or session.get('simulated') is not False:
            raise ValueError('请选择真实手机采集包；演练数据不作为真实空间生成。')
        frames = [f for f in session['frames'] if f.get('segment') == 'room' and f.get('tracking_state') == 'normal']
        if len(frames) < 12:
            update('needs_rescan', '可用空间视角太少，请换角度补拍', 10,
                   issues=['至少需要 12 个有效空间视角才能开始处理；建议按手机引导增加左右和高低视角。'])
            return
        issues = list(session.get('warnings', []))[:20]
        scope = session.get('capture_scope', 'room')
        expected = 45 if scope == 'area' else 100
        if len(frames) < expected:
            issues.append(f'本次有 {len(frames)} 个空间视角，数量偏少；可以先看预览，再决定补拍。')
        issues += (session.get('quality') or {}).get('room', {}).get('issues', [])[:8]
        if not session.get('quality_version'):
            issues.append('旧采集包缺少拍摄指导记录；仍按已有照片与位姿生成。')
        if session.get('status') == 'partial':
            issues.append('本次曾中断，只使用中断前保留的空间片段。')
        if any(f.get('segment', '').startswith('object:') for f in session['frames']):
            issues.append('本批仅生成静态空间；物品、空位和放回片段已保留，不混入房间训练。')
        if not any(f.get('depth') for f in frames):
            update('needs_rescan', '此采集缺少本地重建所需的深度', 10,
                   issues=['请使用带 LiDAR 的 iPhone，等待深度与跟踪稳定后再扫描。原始数据已保留。'])
            return
        if not BRUSH.is_file():
            raise ValueError('未找到本地 Brush v0.3.0；请恢复项目 vendor/brush 中的重建程序。')
        # The derived session preserves IDs and uses the original images by relative path.
        prepared = dict(session)
        prepared['frames'] = frames
        prepared_path = capture/'prepared-room.json'
        prepared_path.write_text(json.dumps(prepared, ensure_ascii=False, indent=2))
        issues = list(dict.fromkeys(issues))
        update('preparing', '正在整理空间照片与相机位置', 15, issues=issues, frames=len(frames),
               capture_id=session['id'], title=session.get('title', '我的空间'))
        (work/'input-summary.json').write_text(json.dumps({
            'capture_id': session['id'], 'scope': scope, 'room_frames': len(frames),
            'total_frames': len(session['frames']), 'issues': issues,
            'policy': 'Capture guidance is advisory. No visual evaluation is run.'
        }, ensure_ascii=False, indent=2))
        settings = {'quick': (2000, 768, 180000, 180), 'standard': (6000, 1024, 400000, 300)}
        steps, resolution, splats, frame_limit = settings[profile]
        every = max(1, math.ceil(len(frames)/frame_limit))
        dataset, output = work/'dataset', work/'model'
        convert(prepared_path, dataset, 'room', 'room', every)
        stop_requested()
        seed = depth_seed(prepared_path, dataset, max(1, every*3))
        if seed['seed_points'] < 1:
            raise ValueError('深度数据没有生成可用空间点，请重新拍摄有纹理的墙角和家具。')
        output.mkdir()
        args = [str(BRUSH), str(dataset), '--total-steps', str(steps),
                '--max-resolution', str(resolution), '--max-splats', str(splats), '--sh-degree', '1',
                '--refine-every', '100', '--growth-stop-iter', str(steps-500),
                '--eval-every', str(steps+1), '--export-every', str(steps), '--export-path', str(output)]
        (output/'command.json').write_text(json.dumps(args, indent=2))
        stop_requested()
        started = time.monotonic()
        log_path = output/'train.log'
        update('training', '正在生成空间；耗时取决于素材规模与本机 GPU', 25, steps=steps)
        with log_path.open('w') as log:
            child = subprocess.Popen(args, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
            while child.poll() is None:
                stop_requested()
                if time.monotonic()-started > 7200:
                    raise TimeoutError('本次生成超过两小时，已停止并保留素材。可选择快速预览重试。')
                # Report elapsed time honestly; only show a step count if Brush logged one.
                with log_path.open('rb') as reader:
                    reader.seek(max(0, log_path.stat().st_size-16384))
                    tail = reader.read().decode('utf-8', errors='replace')
                matches = re.findall(r'(?:iteration|iter|step)\s*[:= ]\s*(\d+)', tail, re.I)
                iteration = min(steps, int(matches[-1])) if matches else None
                progress = 25 + int(60*iteration/steps) if iteration is not None else 25
                update('training', '正在生成空间，完成后会提供预览', progress,
                       elapsed_seconds=int(time.monotonic()-started), iteration=iteration)
                try:
                    child.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    pass
            if child.returncode:
                raise ValueError('Brush 生成未完成，原始采集和 train.log 已保留。可重试快速预览。')
        stop_requested()
        model = output/f'export_{steps}.ply'
        if not model.is_file() or model.stat().st_size == 0:
            raise ValueError('重建器未输出预期模型，诊断记录保留在本次任务目录。')
        update('packaging', '正在整理预览与来源记录', 92)
        with (output/'package.log').open('w') as package_log:
            child = subprocess.Popen([node, '--import', 'tsx', str(ROOT/'tools/package_reconstruction.ts'),
                                      str(model), str(prepared_path), str(work/'result.room.zip')],
                                     cwd=ROOT, stdout=subprocess.DEVNULL, stderr=package_log)
            packaging_started = time.monotonic()
            while child.poll() is None:
                stop_requested()
                if time.monotonic()-packaging_started > 300:
                    raise TimeoutError('打包耗时过长，模型保留在任务目录中。')
                try:
                    child.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    pass
        if child.returncode:
            raise ValueError('模型已生成，但项目打包未完成。请保留任务目录中的模型与 package.log。')
        stop_requested()
        update('ready', '空间已生成，请打开预览并决定是否保存', 100,
               result_available=True, elapsed_seconds=int(time.monotonic()-started))
    except KeyboardInterrupt:
        update('cancelled', '已停止；原始采集保留，可重新生成', state['progress'])
    except Exception as error:
        update('failed', str(error), state['progress'])
    finally:
        if child and child.poll() is None:
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill(); child.wait()
        if lock:
            fcntl.flock(lock, fcntl.LOCK_UN); lock.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path); parser.add_argument('work', type=Path)
    parser.add_argument('--node', required=True)
    parser.add_argument('--profile', choices=['quick', 'standard'], default='standard')
    args = parser.parse_args()
    signal.signal(signal.SIGTERM, cancel); signal.signal(signal.SIGINT, cancel)
    run(args.archive.resolve(), args.work.resolve(), args.node, args.profile)
