#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=28G
#SBATCH --time=05:50:00
#SBATCH --job-name=ooo_brush
#SBATCH --output=logs/train_%j.out
#SBATCH --error=logs/train_%j.err
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?}"
source ./enroot_env.sh
: "${SLURM_JOB_GPUS:?No scheduler GPU assignment; refusing automatic device selection}"
GPU_UUID="$(python3 assigned_gpu.py)"
[[ "$GPU_UUID" =~ ^GPU-[0-9a-fA-F-]+$ ]] || { echo 'Expected one assigned GPU UUID' >&2; exit 2; }
export NVIDIA_VISIBLE_DEVICES="$GPU_UUID"
export NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics
enroot start --conf "$PWD/gpu-enroot.conf" --mount "$HOME/memoryroom:/memoryroom" \
  --env LD_LIBRARY_PATH= --env PYTHONPATH= \
  --env NVIDIA_VISIBLE_DEVICES --env NVIDIA_DRIVER_CAPABILITIES \
  --env MEMORYROOM_ASSIGNED_GPU="$GPU_UUID" \
  --env VK_DRIVER_FILES=/memoryroom/jobs/ooosplat_1ebc5b7a/nvidia_icd.json \
  memoryroom-ooosplat python3 /memoryroom/jobs/ooosplat_1ebc5b7a/runner.py train
