#!/bin/bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)_${SLURM_JOB_ID:-manual}"
ITERATIONS="${ITERATIONS:-30000}"
COLMAP_GPU="${COLMAP_GPU:-True}"
case "$COLMAP_GPU" in
  True|true|1) COLMAP_GPU_ARGS=(--gpu) ;;
  False|false|0) COLMAP_GPU_ARGS=(--no-gpu) ;;
  *) echo 'COLMAP_GPU must be True/False, true/false or 1/0' >&2; exit 2 ;;
esac
mkdir -p "$ROOT/results/$RUN_ID" "$ROOT/outputs"
RESULT="$ROOT/results/$RUN_ID"
CONFIG="$ROOT/outputs/memoryroom/splatfacto/$RUN_ID/config.yml"
export ROOT RESULT
{
  printf 'run_id=%s\njob_id=%s\nhost=%s\nstarted_utc=%s\n' \
    "$RUN_ID" "${SLURM_JOB_ID:-none}" "$(hostname)" "$(date -u +%FT%TZ)"
  printf 'iterations_target=%s\ncolmap_gpu=%s\n' "$ITERATIONS" "$COLMAP_GPU"
} > "$RESULT/run-info.txt"

# Reuse completed camera reconstruction after a scheduler interruption.
# Incomplete data is preserved, rather than silently overwritten on retry.
if [[ ! -f "$ROOT/processed/transforms.json" ]]; then
  if [[ -d "$ROOT/processed" ]]; then
    echo "Incomplete processed/ exists. Preserve it with: mv processed processed-incomplete-<date>, then resubmit." >&2
    exit 2
  fi
  [[ -x "$ROOT/colmap-limited.sh" ]] || { echo 'Missing executable colmap-limited.sh' >&2; exit 2; }
  ns-process-data images --data "$ROOT/images" --output-dir "$ROOT/processed" \
    --colmap-cmd "$ROOT/colmap-limited.sh" --verbose \
    --matching-method sequential "${COLMAP_GPU_ARGS[@]}" --num-downscales 2
fi

# Report registration coverage; it is not a geometric/photometric quality score.
python - <<'PY'
import json, os
from pathlib import Path
root, result = Path(os.environ['ROOT']), Path(os.environ['RESULT'])
source = sum(1 for p in (root/'images').iterdir() if p.suffix.lower() in {'.jpg','.jpeg','.png'})
registered = len(json.loads((root/'processed/transforms.json').read_text())['frames'])
ratio = registered / source if source else 0
report = {'input_images': source, 'registered_images': registered,
          'registration_fraction': ratio, 'quality_verified': False,
          'note': '70% is an initial compute-saving cutoff, not a validated quality threshold.'}
(result/'registration-report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2), flush=True)
if ratio < 0.7:
    raise SystemExit('Too few images registered for the initial 70% cutoff. Inspect COLMAP and capture overlap before training.')
PY

TRAIN_ARGS=(splatfacto --data "$ROOT/processed" --output-dir "$ROOT/outputs"
  --experiment-name memoryroom --timestamp "$RUN_ID" --vis tensorboard
  --max-num-iterations "$ITERATIONS" --steps-per-save 2000
  --steps-per-eval-batch 0 --steps-per-eval-image 0 --steps-per-eval-all-images 0
  --pipeline.model.sh-degree 1)
if [[ -n "${RESUME_CKPT_DIR:-}" ]]; then
  [[ -d "$RESUME_CKPT_DIR" ]] || { echo "Missing RESUME_CKPT_DIR" >&2; exit 2; }
  TRAIN_ARGS+=(--load-dir "$RESUME_CKPT_DIR")
fi
TRAIN_ARGS+=(nerfstudio-data --eval-mode all --downscale-factor 1)
ns-train "${TRAIN_ARGS[@]}"
ns-export gaussian-splat --load-config "$CONFIG" --output-dir "$RESULT" \
  --output-filename memoryroom.ply
cp "$CONFIG" "$RESULT/config-reference.yml"
printf 'Training and PLY export finished at %s\n' "$(date -u +%FT%TZ)" > "$RESULT/EXPORT_COMPLETED.txt"
echo "Download: $RESULT/memoryroom.ply"
echo "Keep outputs/, processed/, logs/ and environment/ for resume and provenance."
