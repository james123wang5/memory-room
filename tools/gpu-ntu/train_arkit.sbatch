#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=28G
#SBATCH --time=05:50:00
#SBATCH --job-name=memoryroom_ar
#SBATCH --output=logs/train_%j.out
#SBATCH --error=logs/train_%j.err
# No nounset across the site's optional Conda/Qt activation variables.
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?}"
module load anaconda/25.5.1
if module is-loaded cuda/12.8.0 >/dev/null 2>&1; then
  module unload cuda/12.8.0
fi
eval "$(conda shell.bash hook)"
conda activate memoryroom-ns115
export CUDA_HOME="$CONDA_PREFIX"
export PATH="$CONDA_PREFIX/bin:$PATH"
export MAX_JOBS=2 OMP_NUM_THREADS="$SLURM_CPUS_PER_TASK"
export OPENBLAS_NUM_THREADS=2 MKL_NUM_THREADS=2
export QT_QPA_PLATFORM=offscreen
export TORCH_EXTENSIONS_DIR="$HOME/memoryroom/cache/torch_extensions"
export XDG_CACHE_HOME="$HOME/memoryroom/cache/xdg"
mkdir -p "$TORCH_EXTENSIONS_DIR" "$XDG_CACHE_HOME"
bash run_arkit_remote.sh
