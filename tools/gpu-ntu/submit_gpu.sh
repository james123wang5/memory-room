#!/bin/bash
# Submission/file management only. All reconstruction runs in the batch job.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if [[ -f last_train_job.txt ]]; then
  LAST_JOB="$(cat last_train_job.txt)"
  if [[ "$LAST_JOB" =~ ^[0-9]+$ ]]; then
    LAST_STATE="$(squeue -h -j "$LAST_JOB" -o %T 2>/dev/null || true)"
    if [[ -n "$LAST_STATE" ]]; then
      echo "Previous job $LAST_JOB is still in the queue ($LAST_STATE). Not submitting another."
      exit 1
    fi
  fi
fi
[[ -d images ]] || { echo 'Missing original images/ directory' >&2; exit 2; }
chmod +x colmap-limited.sh
mkdir -p logs
if [[ -d processed && ! -f processed/transforms.json ]]; then
  PREVIOUS="processed_before_gpu_fix_$(date -u +%Y%m%dT%H%M%SZ)_$$"
  mv processed "$PREVIOUS"
  echo "Preserved incomplete preprocessing in $PREVIOUS"
fi
NEW_JOB="$(sbatch --parsable train.sbatch)"
NEW_JOB="${NEW_JOB%%;*}"
[[ "$NEW_JOB" =~ ^[0-9]+$ ]] || { echo "Unexpected sbatch output: $NEW_JOB" >&2; exit 2; }
printf '%s\n' "$NEW_JOB" > last_train_job.txt
echo "Submitted GPU reconstruction job: $NEW_JOB"
echo "Follow progress with: sacct -j $NEW_JOB --format=JobID,State,ExitCode,Elapsed"
echo "Log: $ROOT/logs/train_${NEW_JOB}.out"
