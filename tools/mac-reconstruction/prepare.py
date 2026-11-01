"""Prepare immutable phone photographs for OOOSplat. Does not train or evaluate."""
import json
from pathlib import Path
import shutil
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/dataset'))
from import_capture import import_capture
from convert import local_file


def run(archive, work):
    work = Path(work).resolve()
    def update(status, message, **values):
        path = work / 'status.json'
        old = json.loads(path.read_text()) if path.exists() else {}
        old.update(status=status, message=message, updated_at=time.time(), **values)
        temp = work / 'status.tmp'; temp.write_text(json.dumps(old, ensure_ascii=False, indent=2)); temp.replace(path)
    try:
        session = import_capture(Path(archive), work / 'capture')
        if session.get('source') != 'arkit' or session.get('simulated') is not False:
            raise ValueError('请选择真实手机采集包')
        frames = [f for f in session['frames'] if f.get('segment') == 'room' and f.get('tracking_state') == 'normal']
        frames.sort(key=lambda f: f['timestamp'])
        if len(frames) < 12:
            raise ValueError('少于 12 个正常跟踪的空间视角，请补拍后重新导入；原件已保留')
        from PIL import Image
        images = work / 'input/images'; images.mkdir(parents=True)
        thumbs = work / 'thumbs'; thumbs.mkdir()
        records = []; sizes = set(); capture_runs = []; continuity_known = True
        for index, frame in enumerate(frames):
            original = local_file(work / 'capture', frame['image'])
            suffix = original.suffix.lower()
            if suffix not in ('.jpg', '.jpeg', '.png'):
                raise ValueError('只接收手机的原始 JPEG / PNG 图片')
            name = f'{index:06d}{suffix}'
            # Copy unchanged bytes; never resize or recompress the reconstruction input.
            shutil.copy2(original, images / name)
            with Image.open(original) as image:
                if image.size != (frame['intrinsics']['w'], frame['intrinsics']['h']):
                    raise ValueError(f'图像尺寸和相机记录不匹配：{frame["image"]}')
                sizes.add(image.size)
                thumb = image.convert('RGB'); thumb.thumbnail((320, 240)); thumb.save(thumbs / f'{index:06d}.jpg', quality=75)
            records.append({'index': index, 'name': name, 'original': frame['image'],
                            'timestamp': frame['timestamp'], 'intrinsics': frame['intrinsics'],
                            'camera_to_world': frame['camera_to_world'], 'depth': frame.get('depth'),
                            'quality': frame.get('quality')})
            quality = frame.get('quality') or {}
            capture_run = quality.get('capture_run')
            if type(capture_run) is not int or capture_run < 0:
                capture_run = None; continuity_known = False
            # Preserve consecutive spans, even if an imported capture reuses a run ID.
            if not capture_runs or capture_runs[-1]['capture_run'] != capture_run:
                capture_runs.append({'capture_run': capture_run, 'frames': 0,
                                     'first_image': name, 'first_timestamp': frame['timestamp'],
                                     'continuity': quality.get('continuity', 'unknown')})
            capture_runs[-1].update(last_image=name, last_timestamp=frame['timestamp'])
            capture_runs[-1]['frames'] += 1
        if len(sizes) != 1:
            raise ValueError('同一段照片存在不同尺寸。请分开镜头或分辨率不同的片段；已保存原件，不自动裁切')
        summary = (session.get('quality') or {}).get('room') or {}
        issues = list(session.get('warnings', [])) + list(summary.get('issues', []))
        if not summary:
            issues.append('旧采集包没有覆盖记录，不能据此判定是否拍全')
        requires_general_matching = not continuity_known or len(capture_runs) > 1
        if len(capture_runs) > 1:
            issues.append('存在换区片段：文件名是时间顺序，不代表连续机位。请使用跨照片匹配，并保留共同门框、墙角或家具的连接视角')
        if not continuity_known:
            issues.append('此采集缺少完整的换区记录，不能假定所有相邻照片连续；建议按普通无序照片做匹配')
        if session.get('status') == 'partial': issues.append('本次采集曾中断；仅保留中断前的空间视角')
        if len(frames) > 600: issues.append('照片较多，Mac 配准可能耗时较长。完整照片已保留，没有自动删帧')
        if session.get('capture_notes'): issues.append('现场备注：' + str(session['capture_notes'])[:1500])
        report = {'version': 1, 'capture_id': session['id'], 'space_id': session.get('space_id', session['id']),
                  'title': session.get('title', '我的空间'), 'scope': session.get('capture_scope', 'unknown'),
                  'frame_count': len(frames), 'all_frames': len(session['frames']), 'image_size': list(next(iter(sizes))),
                  'images_path': str(images), 'frames': records, 'coverage': summary,
                  'capture_runs': capture_runs, 'continuity_known': continuity_known,
                  'requires_general_matching': requires_general_matching,
                  'capture_checklist': session.get('capture_checklist'), 'issues': list(dict.fromkeys(issues)),
                  'image_order': 'timestamp-ascending; zero-padded filenames', 'route': 'ooosplat-colmap',
                  'quality': 'balanced', 'originals_reencoded': False,
                  'note': 'OOOSplat 重新估计位姿；sidecar 中 ARKit 内参、深度和位姿只作保留，不宣称 OOOSplat 自动读取它们。'}
        (work / 'handoff.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        (work / 'input/capture-runs.json').write_text(json.dumps({
            'capture_runs': capture_runs, 'continuity_known': continuity_known,
            'requires_general_matching': requires_general_matching,
            'estimated_components': summary.get('estimated_components'),
            'note': '片段关联来自 AR 位姿与深度估计，不是 COLMAP 配准结果；无共同可识别内容时可能无法合并。'
        }, ensure_ascii=False, indent=2), encoding='utf-8')
        matching_instruction = (
            '有换区或连续性未知：若询问是否按连续拍摄顺序排列，选择否/普通无序图片。\n'
            '需要支持跨区域的照片匹配；COLMAP 可使用 exhaustive，较大数据集需适当的检索/回环匹配。\n'
            '若当前 OOOSplat 版本无法控制匹配方式，请使用可配置的 COLMAP 路线；不要只匹配相邻照片。\n'
            if requires_general_matching else
            '已记录为单个连续片段；若询问照片顺序，可选择“已按拍摄顺序排列”。\n')
        (work / 'input/README.txt').write_text(
            'MemoryRoom → OOOSplat\n\n'
            f'采集：{report["title"]}\n照片：{len(frames)} 张，时间顺序已保留，输入像素未缩放或重新压缩。\n'
            '在 OOOSplat 新建普通图片任务，选择本文件旁的 images 文件夹。\n'
            '选择“均衡”，开启自动优化。\n'
            + matching_instruction +
            '项目目录请选择移动硬盘上的 MemoryRoom/data/processed/ooosplat-projects。\n'
            '生成后在 MemoryRoom 的该任务里导入 final.ply，或导出标准高斯 PLY 后导回。\n'
            '仅正常跟踪的 room 片段进入这里；物品、空位、放回和重扫前的片段保留在 capture 原件中。\n'
            '拍摄覆盖提示不是成片保证；配准失败或画面模糊时保留日志和原图。\n', encoding='utf-8')
        update('prepared', '照片已整理，可以交给 OOOSplat 重建', title=report['title'],
               frames=len(frames), issues=report['issues'], input_path=str(images), capture_id=session['id'],
               capture_runs=len(capture_runs) if continuity_known else None,
               requires_general_matching=requires_general_matching)
    except Exception as error:
        update('failed', str(error))
        raise


if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2])
