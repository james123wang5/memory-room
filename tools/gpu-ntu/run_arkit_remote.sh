#!/bin/bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)_arkit_${SLURM_JOB_ID:?}"
ITERATIONS="${ITERATIONS:-30000}"
RESULT="$ROOT/results/$RUN_ID"
CONFIG="$ROOT/outputs/memoryroom/splatfacto/$RUN_ID/config.yml"
mkdir -p "$RESULT" "$ROOT/outputs"
{
  printf 'run_id=%s\njob_id=%s\nhost=%s\nstarted_utc=%s\n' \
    "$RUN_ID" "$SLURM_JOB_ID" "$(hostname)" "$(date -u +%FT%TZ)"
  printf 'provider=arkit-depth-splatfacto\niterations_target=%s\n' "$ITERATIONS"
} > "$RESULT/run-info.txt"
cp "$ROOT/arkit_dataset/capture-manifest.json" "$RESULT/capture-manifest.json"
echo 'Using recorded ARKit cameras + measured LiDAR seed, not COLMAP registration.'
echo 'Camera count is not a reconstruction quality score. Original COLMAP output is preserved.'
ns-train splatfacto --data "$ROOT/arkit_dataset" --output-dir "$ROOT/outputs" \
  --experiment-name memoryroom --timestamp "$RUN_ID" --vis tensorboard \
  --max-num-iterations "$ITERATIONS" --steps-per-save 2000 \
  --steps-per-eval-batch 0 --steps-per-eval-image 0 --steps-per-eval-all-images 0 \
  --pipeline.model.sh-degree 1 --pipeline.model.camera-optimizer.mode SO3xR3 \
  nerfstudio-data --eval-mode all --downscale-factor 1 \
  --orientation-method none --center-method none --auto-scale-poses False
ns-export gaussian-splat --load-config "$CONFIG" --output-dir "$RESULT" \
  --output-filename memoryroom.ply
# Nerfstudio 1.1.5 always writes a Z-up comment. This provider explicitly keeps
# ARKit's Y-up world. Correct that comment in place without touching vertices,
# SH coefficients, Gaussian rotations or scales (the replacement is same-size).
python - "$RESULT/memoryroom.ply" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
with path.open('r+b') as stream:
    prefix = stream.read(16384)
    end = prefix.find(b'end_header\n')
    if end < 0:
        raise SystemExit('PLY header not found; refusing to label this export complete')
    header = prefix[:end + len(b'end_header\n')]
    marker = b'comment Vertical Axis: z\n'
    if marker not in header:
        raise SystemExit('Unexpected PLY axis comment; inspect the exporter version')
    stream.seek(0)
    stream.write(header.replace(marker, b'comment Vertical Axis: y\n'))
PY
cp "$CONFIG" "$RESULT/config-reference.yml"
cp "$ROOT/arkit_dataset/depth-seed-report.json" "$RESULT/depth-seed-report.json"
printf 'Training and PLY export finished at %s\n' "$(date -u +%FT%TZ)" > "$RESULT/EXPORT_COMPLETED.txt"
echo "Download: $RESULT/memoryroom.ply"
echo 'World up: Y. Numeric scale retains measured metres; physical accuracy still requires inspection.'
