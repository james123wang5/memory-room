#!/bin/bash
# Run on an allowed network-enabled installation node, or via setup.sbatch if
# compute-node outbound access works. This installs dependencies, not training.
# Site Conda/Qt activation hooks read unset optional variables; do not enable nounset.
set -eo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_NAME=memoryroom-ns115
eval "$(conda shell.bash hook)"
export PIP_CACHE_DIR="$HOME/memoryroom/cache/pip"
export CONDA_PKGS_DIRS="$HOME/memoryroom/cache/conda"
export MAX_JOBS="${MAX_JOBS:-${SLURM_CPUS_PER_TASK:-2}}"
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-$MAX_JOBS}"
export CMAKE_BUILD_PARALLEL_LEVEL="${CMAKE_BUILD_PARALLEL_LEVEL:-$MAX_JOBS}"
export XDG_CACHE_HOME="$HOME/memoryroom/cache/xdg"
mkdir -p "$PIP_CACHE_DIR" "$CONDA_PKGS_DIRS"
if conda env list --json | python -c 'import json,sys; e=json.load(sys.stdin)["envs"]; sys.exit(0 if any(p.endswith("/memoryroom-ns115") for p in e) else 1)'; then
  echo "Reusing the dedicated $ENV_NAME environment; the existing torch environment is not modified."
else
  conda create -y -n "$ENV_NAME" python=3.10 pip
fi
conda activate "$ENV_NAME"
conda install -y -c conda-forge 'colmap=3.8' ffmpeg 'gxx_linux-64=11'
conda install -y -c nvidia/label/cuda-11.8.0 'cuda-toolkit=11.8.0'
python -m pip install 'setuptools<81' wheel ninja
python -m pip install -c "$ROOT/constraints.txt" 'numpy==1.26.4' \
  'torch==2.1.2' 'torchvision==0.16.2' --index-url https://download.pytorch.org/whl/cu118 \
  --extra-index-url https://pypi.org/simple
# gsplat 1.4 supports deferring CUDA compilation until first use on the allocated GPU.
# Do not force CUDA_VISIBLE_DEVICES: Slurm owns the allocated device mapping.
# Keep pip's default build isolation: fpsample needs scikit-build-core and
# pybind11, which its pyproject declares and pip installs in the build env.
BUILD_NO_CUDA=1 python -m pip install \
  -c "$ROOT/constraints.txt" 'nerfstudio==1.1.5'
# Download a public pretrained dependency to the same cache used by train.sbatch.
# No model inference, evaluation, training or CUDA compilation is performed here.
python - <<'PY'
from torchvision.models import AlexNet_Weights
AlexNet_Weights.IMAGENET1K_V1.get_state_dict(progress=True, check_hash=True)
PY
mkdir -p "$ROOT/environment"
python -m pip freeze > "$ROOT/environment/pip-freeze.txt"
conda list --explicit > "$ROOT/environment/conda-explicit.txt"
date -u +%FT%TZ > "$ROOT/environment/installation-finished.txt"
echo "Installation finished. This does not establish reconstruction quality or runtime compatibility. Submit train.sbatch next."
