#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=28G
#SBATCH --time=05:50:00
#SBATCH --job-name=ooo_colmap
#SBATCH --output=logs/reconstruct_%j.out
#SBATCH --error=logs/reconstruct_%j.err
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?}"
source ./enroot_env.sh
# Official CUDA13.2 COLMAP requires driver >=580; the site has 570.148.08.
# Use its supported CPU/Ceres path in a CPU-only allocation, not an idle GPU.
unset NVIDIA_VISIBLE_DEVICES
enroot start --mount "$HOME/memoryroom:/memoryroom" \
  --env LD_LIBRARY_PATH= --env PYTHONPATH= \
  memoryroom-ooosplat python3 /memoryroom/jobs/ooosplat_1ebc5b7a/runner.py reconstruct
