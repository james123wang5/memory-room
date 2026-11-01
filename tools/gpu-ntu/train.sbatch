#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=28G
#SBATCH --time=05:50:00
#SBATCH --job-name=memoryroom
#SBATCH --output=logs/train_%j.out
#SBATCH --error=logs/train_%j.err
# Site Conda/Qt activation hooks read unset optional variables; do not enable nounset.
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?Submit from the unpacked capture directory}"
module load anaconda/25.5.1
# Do not inherit the interactive shell's CUDA 12 library path into torch.
if module is-loaded cuda/12.8.0 >/dev/null 2>&1; then
  module unload cuda/12.8.0
fi
eval "$(conda shell.bash hook)"
conda activate memoryroom-ns115
MEMORYROOM_BASE_LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}"
module load cuda/12.8.0
export MEMORYROOM_COLMAP_LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}"
if [[ -n "$MEMORYROOM_BASE_LD_LIBRARY_PATH" ]]; then
  export LD_LIBRARY_PATH="$MEMORYROOM_BASE_LD_LIBRARY_PATH"
else
  unset LD_LIBRARY_PATH
fi
export CUDA_HOME="$CONDA_PREFIX"
export PATH="$CONDA_PREFIX/bin:$PATH"
export MAX_JOBS=2
export OMP_NUM_THREADS="$SLURM_CPUS_PER_TASK"
export OPENBLAS_NUM_THREADS=2 MKL_NUM_THREADS=2
export QT_QPA_PLATFORM=offscreen
export TORCH_EXTENSIONS_DIR="$HOME/memoryroom/cache/torch_extensions"
export XDG_CACHE_HOME="$HOME/memoryroom/cache/xdg"
mkdir -p "$TORCH_EXTENSIONS_DIR" "$XDG_CACHE_HOME"
# User confirmed this COLMAP 3.8 build supports CUDA with the site module.
export COLMAP_GPU="${COLMAP_GPU:-True}"
# To resume the training stage: export RESUME_CKPT_DIR=/absolute/path/nerfstudio_models
printf 'Started UTC: %s\nHost: %s\nJob: %s\nCOLMAP GPU: %s\nTorch CUDA_HOME: %s\n' \
  "$(date -u +%FT%TZ)" "$(hostname)" "$SLURM_JOB_ID" "$COLMAP_GPU" "$CUDA_HOME"
# This is already a scheduled batch allocation; computation remains on its node.
bash run_remote.sh
