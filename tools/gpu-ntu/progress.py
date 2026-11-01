#!/usr/bin/env python3
"""Read-only progress display; no training, submission, downloads or GPU calls.

Uses only the Python standard library. Supports the existing NTU capture layout.
Written for user execution; not run against the NTU environment in this session.
"""
import argparse
import json
import re
import sqlite3
import subprocess
import sys
import time
from pathlib import Path


ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
TERMINAL_STATES = {
    "COMPLETED", "FAILED", "CANCELLED", "TIMEOUT", "OUT_OF_MEMORY",
    "NODE_FAIL", "PREEMPTED", "BOOT_FAIL", "DEADLINE", "REVOKED",
}
STATE_NAMES = {
    "PENDING": "排队中", "RUNNING": "运行中", "COMPLETING": "正在结束",
    "COMPLETED": "正常结束", "FAILED": "失败", "CANCELLED": "被取消",
    "TIMEOUT": "超时", "OUT_OF_MEMORY": "内存不足", "NODE_FAIL": "节点故障",
}


def text_tail(path, limit=2_000_000):
    try:
        with path.open("rb") as stream:
            stream.seek(max(0, path.stat().st_size - limit))
            return ANSI.sub("", stream.read().decode("utf-8", errors="replace")).replace("\r", "\n")
    except OSError:
        return ""


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def image_count(directory):
    try:
        return sum(p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
                   for p in directory.iterdir())
    except OSError:
        return 0


def counts_from_database(path):
    # mode=ro never creates or modifies the COLMAP database. A busy database is
    # displayed as temporarily unavailable rather than blocking reconstruction.
    if not path.is_file():
        return None, None
    connection = None
    try:
        connection = sqlite3.connect(path.as_uri() + "?mode=ro", uri=True, timeout=0.2)
        connection.execute("PRAGMA query_only=ON")
        extracted = connection.execute("SELECT COUNT(*) FROM keypoints").fetchone()[0]
        pairs = connection.execute("SELECT COUNT(*) FROM two_view_geometries WHERE rows > 0").fetchone()[0]
        return extracted, pairs
    except sqlite3.Error:
        return None, None
    finally:
        if connection is not None:
            connection.close()


def accounting(job_id):
    try:
        proc = subprocess.run(
            ["sacct", "-j", job_id, "-X", "-n", "-P",
             "--format=JobID,State,ExitCode,Elapsed,Timelimit"],
            capture_output=True, text=True, timeout=8,
        )
        for line in proc.stdout.splitlines():
            fields = line.split("|")
            if len(fields) >= 5 and fields[0] == job_id:
                return fields[1:5]
    except (OSError, subprocess.TimeoutExpired):
        pass
    return ["UNKNOWN", "?", "?", "?"]


def bar(count, total):
    if total <= 0:
        return str(count)
    fraction = min(1.0, max(0.0, count / total))
    width = int(fraction * 20)
    return "[" + "#" * width + "-" * (20 - width) + "] %s/%s (%.1f%%)" % (count, total, fraction * 100)


def snapshot(root, job_id):
    state, exit_code, elapsed, limit = accounting(job_id)
    state_key = (state.split() or ["UNKNOWN"])[0].rstrip("+")
    run_dirs = sorted((root / "results").glob("*_%s" % job_id))
    result = run_dirs[-1] if run_dirs else None
    info = text_tail(result / "run-info.txt") if result else ""
    provider_record = text_tail(root / "last_train_provider.txt").strip()
    arkit = ("provider=arkit-depth-splatfacto" in info or
             provider_record == job_id + "|arkit-depth-splatfacto")
    dataset = root / ("arkit_dataset" if arkit else "processed")
    total = image_count(root / "images")
    copied = image_count(dataset / "images")
    extracted, pairs = (None, None) if arkit else counts_from_database(dataset / "colmap/database.db")
    transforms = read_json(dataset / "transforms.json")
    registered = len(transforms.get("frames", [])) if isinstance(transforms, dict) else None
    stdout_path = root / ("logs/train_%s.out" % job_id)
    stderr_path = root / ("logs/train_%s.err" % job_id)
    output = text_tail(stdout_path)
    attempts = re.findall(r"Registering image\s+#(\d+)\s+\((\d+)\)", output)
    mapping = bool(attempts or re.search(r"Global bundle adjustment|Retriangulation|Pose refinement report", output))
    train_dir = root / "outputs/memoryroom/splatfacto" / result.name if result else None
    target = 30000
    if result:
        target_match = re.search(r"^iterations_target=(\d+)$", info, re.M)
        if target_match:
            target = int(target_match.group(1))
    saved_steps = []
    if train_dir:
        for path in (train_dir / "nerfstudio_models").glob("step-*.ckpt"):
            match = re.fullmatch(r"step-(\d+)\.ckpt", path.name)
            if match:
                saved_steps.append(int(match.group(1)) + 1)
    log_steps = [int(m.group(1)) for m in re.finditer(
        r"^\s*(\d+)\s*\(\s*\d+(?:\.\d+)?%\s*\)", output, re.M)
        if int(m.group(1)) <= target]
    saved = max(saved_steps) if saved_steps else None
    logged = log_steps[-1] if log_steps else None
    if logged is not None and saved is not None:
        logged = max(logged, saved)
    training = bool(saved is not None or logged is not None or
                    (train_dir and (train_dir / "config.yml").is_file()))
    exported = bool(result and (result / "EXPORT_COMPLETED.txt").is_file()
                    and (result / "memoryroom.ply").is_file())
    if arkit:
        extraction_status = "此路线无需重新提取"
        matching_status = "此路线无需重新匹配"
    else:
        extraction_status = bar(extracted, total) if extracted is not None else "等待开始 / 数据库暂不可读"
        if pairs is None:
            matching_status = "等待开始 / 数据库暂不可读"
        elif mapping or registered is not None or training or exported:
            matching_status = "完成；有效匹配 %s 对" % pairs
        else:
            matching_status = "已验证 %s 对；总对数不是固定进度" % pairs

    lines = [
        "MemoryRoom · 房间重建进度",
        "=" * 58,
        "作业 %s | %s [%s] | 退出码 %s" % (job_id, STATE_NAMES.get(state_key, state), state, exit_code),
        "运行时间 %s | 作业时间上限 %s" % (elapsed, limit),
        "相机来源：" + ("手机测量位姿 + LiDAR（不是 COLMAP 匹配）" if arkit else "COLMAP 照片配准"),
        "",
        "1. 照片准备    " + (bar(copied, total) if total else "等待照片"),
        "2. 特征提取    " + extraction_status,
        "3. 照片匹配    " + matching_status,
    ]
    if arkit:
        manifest = read_json(dataset / "capture-manifest.json") or {}
        lines.append("4. 手机测量    已提供 %s 个相机位姿、%s 个 LiDAR 初始化点" %
                     (manifest.get('provided_camera_count', '?'), manifest.get('seed_points', '?')))
        lines.append("               测量数量不是画质评分；仍可能有跟踪漂移或缺失。")
    elif registered is not None:
        lines.append("4. 房间配准    已输出 %s/%s 个视角（是覆盖统计，不是画质评分）" % (registered, total))
    elif attempts:
        image_id, attempt = attempts[-1]
        lines.append("4. 房间配准    进行中：当前子模型计数 %s，正在登记图片 #%s" % (attempt, image_id))
        lines.append("               图片编号和子模型计数都不能当成整体百分比。")
    elif mapping:
        lines.append("4. 房间配准    正在优化相机和三维点；暂不显示虚构百分比")
    else:
        lines.append("4. 房间配准    等待前面步骤完成")

    if exported:
        lines.append("5. 高斯训练    已结束")
    elif logged is not None:
        lines.append("5. 高斯训练    日志步数 " + bar(logged, target))
        lines.append("               按该日志还差 %s 步；日志可能有延迟。" % max(0, target - logged))
    elif saved is not None:
        lines.append("5. 高斯训练    至少已保存 " + bar(saved, target))
        lines.append("               检查点约每 2000 步更新；不是实时迭代数。")
    elif training:
        lines.append("5. 高斯训练    已启动；正在初始化/编译/训练，尚无可读步数")
    else:
        lines.append("5. 高斯训练    " + ("等待启动，目标 %s 步" % target if arkit else
                                         "等待房间配准，目标 %s 步" % target))
    if exported:
        model = result / "memoryroom.ply"
        lines.append("6. 导出模型    已生成 memoryroom.ply（%.1f MiB）" % (model.stat().st_size / 1024**2))
        lines.append("\n学校结果位置：%s" % model)
        lines.append("模型仍在学校服务器，需下载到 Mac；成片质量需实际查看。")
    else:
        lines.append("6. 导出模型    等待高斯训练结束")

    if state_key in TERMINAL_STATES and (state_key != "COMPLETED" or not exported):
        lines.append("\n作业已结束，但尚未确认完整模型导出。以下保留日志末尾：")
        for label, content in (("输出", output), ("错误通道", text_tail(stderr_path))):
            lines.append("--- %s ---" % label)
            lines.extend(content.splitlines()[-16:])
    lines.append("\n每 30 秒刷新；Ctrl+C 只关闭此面板，不取消训练。")
    return "\n".join(lines), state_key in TERMINAL_STATES


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--job", help="Defaults to last_train_job.txt")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    try:
        job_id = args.job or (root / "last_train_job.txt").read_text().strip()
        if not re.fullmatch(r"\d+", job_id):
            raise ValueError("Invalid job ID")
    except (OSError, ValueError) as error:
        print("无法读取作业编号：%s" % error, file=sys.stderr)
        return 2
    try:
        while True:
            report, ended = snapshot(root, job_id)
            if args.watch and sys.stdout.isatty():
                print("\033[2J\033[H", end="")
            print(report, flush=True)
            if not args.watch or ended:
                break
            time.sleep(30)
    except KeyboardInterrupt:
        print("\n已关闭查看窗口；学校任务继续由 Slurm 管理。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
