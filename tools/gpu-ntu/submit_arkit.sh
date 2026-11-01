#!/bin/bash
# Administrative file preparation + sbatch only; no reconstruction on head node.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if [[ -f last_train_job.txt ]]; then
  LAST_JOB="$(cat last_train_job.txt)"
  if [[ "$LAST_JOB" =~ ^[0-9]+$ ]]; then
    LAST_STATE="$(squeue -h -j "$LAST_JOB" -o %T 2>/dev/null || true)"
    if [[ -n "$LAST_STATE" ]]; then
      echo "Previous job $LAST_JOB is still active ($LAST_STATE); refusing duplicate submission."
      exit 1
    fi
  fi
fi
[[ -d images ]] || { echo 'Missing original images/; do not reuse unrelated photos.' >&2; exit 2; }
[[ -f arkit_dataset/transforms.json && -f arkit_dataset/lidar-seed.ply ]] || {
  echo 'Missing measured camera/depth payload' >&2; exit 2;
}
if [[ ! -e arkit_dataset/images && ! -L arkit_dataset/images ]]; then
  ln -s ../images arkit_dataset/images
fi
# File/metadata checks only: no image decoding, training or GPU test.
python3 - <<'PY'
import json
from pathlib import Path
root = Path('arkit_dataset')
data = json.loads((root/'transforms.json').read_text())
for frame in data['frames']:
    path = Path(frame['file_path'])
    if path.is_absolute() or '..' in path.parts or not (root/path).is_file():
        raise SystemExit('Missing or unsafe original image path: '+str(path))
manifest = json.loads((root/'capture-manifest.json').read_text())
if manifest.get('provider') != 'arkit-depth-splatfacto' or manifest['provided_camera_count'] != len(data['frames']):
    raise SystemExit('Camera manifest does not match this dataset')
original = json.loads(Path('capture-summary.json').read_text())
if original.get('capture_id') != manifest.get('capture_id'):
    raise SystemExit('Calibration belongs to a different capture; refusing to reuse these photos')
print('Provided measured cameras:', len(data['frames']), '(not a COLMAP registration count)')
PY
mkdir -p logs
NEW_JOB="$(sbatch --parsable train_arkit.sbatch)"
NEW_JOB="${NEW_JOB%%;*}"
[[ "$NEW_JOB" =~ ^[0-9]+$ ]] || { echo "Unexpected sbatch output: $NEW_JOB" >&2; exit 2; }
printf '%s\n' "$NEW_JOB" > last_train_job.txt
printf '%s|arkit-depth-splatfacto\n' "$NEW_JOB" > last_train_provider.txt
echo "Submitted measured-camera GPU training job: $NEW_JOB"
