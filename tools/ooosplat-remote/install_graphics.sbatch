#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=2
#SBATCH --mem=2G
#SBATCH --time=00:10:00
#SBATCH --job-name=ooo_install
#SBATCH --output=logs/install_graphics_%j.out
#SBATCH --error=logs/install_graphics_%j.err
# Production runtime/GPU identity setup; no sample rendering or training.
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?}"
source ./enroot_env.sh
command -v nvidia-container-cli
GPU_UUID="$(python3 assigned_gpu.py)"
export NVIDIA_VISIBLE_DEVICES="$GPU_UUID" NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics
echo "Assigned GPU UUID: $GPU_UUID"
cat "$PWD/nvidia_icd.json"
enroot start --conf "$PWD/gpu-enroot.conf" --mount "$HOME/memoryroom:/memoryroom" \
  --env LD_LIBRARY_PATH= --env PYTHONPATH= \
  --env NVIDIA_VISIBLE_DEVICES --env NVIDIA_DRIVER_CAPABILITIES \
  --env MEMORYROOM_ASSIGNED_GPU="$GPU_UUID" \
  --env VK_DRIVER_FILES=/memoryroom/jobs/ooosplat_1ebc5b7a/nvidia_icd.json \
  memoryroom-ooosplat python3 -c \
  'import sys;sys.path.insert(0,"/memoryroom/jobs/ooosplat_1ebc5b7a");from runner import validate_gpu;print("Runtime ready for assigned GPU:",validate_gpu())'
