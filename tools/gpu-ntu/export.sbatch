#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=20G
#SBATCH --time=00:25:00
#SBATCH --job-name=mr_export
#SBATCH --output=logs/export_%j.out
#SBATCH --error=logs/export_%j.err
# Site Conda/Qt activation hooks read unset optional variables; do not enable nounset.
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?}"
: "${EXPORT_CONFIG:?Set EXPORT_CONFIG to the original absolute config.yml path}"
module load anaconda/25.5.1
eval "$(conda shell.bash hook)"
conda activate memoryroom-ns115
export CUDA_HOME="$CONDA_PREFIX"
export MAX_JOBS="$SLURM_CPUS_PER_TASK"
export TORCH_EXTENSIONS_DIR="$HOME/memoryroom/cache/torch_extensions"
export XDG_CACHE_HOME="$HOME/memoryroom/cache/xdg"
RESULT="$PWD/results/checkpoint_${SLURM_JOB_ID}"
mkdir -p "$RESULT" "$TORCH_EXTENSIONS_DIR" "$XDG_CACHE_HOME"
srun --cpu-bind=cores ns-export gaussian-splat --load-config "$EXPORT_CONFIG" \
  --output-dir "$RESULT" --output-filename memoryroom.ply
printf 'Exported existing checkpoint; original training may be incomplete.\n' > "$RESULT/CHECKPOINT_EXPORT_ONLY.txt"
