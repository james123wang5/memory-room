#!/bin/bash
#SBATCH --partition=MGPU-TC2
#SBATCH --qos=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=8
#SBATCH --mem=28G
#SBATCH --time=05:50:00
#SBATCH --job-name=mr_setup
#SBATCH --output=logs/setup_%j.out
#SBATCH --error=logs/setup_%j.err
# Site Conda/Qt activation hooks read unset optional variables; do not enable nounset.
set -eo pipefail
cd "${SLURM_SUBMIT_DIR:?Submit from the unpacked capture directory}"
module load anaconda/25.5.1
eval "$(conda shell.bash hook)"
srun --cpu-bind=cores bash install_env.sh
