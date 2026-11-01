#!/bin/bash
export ENROOT_CACHE_PATH="$HOME/memoryroom/runtime/enroot/cache"
export ENROOT_DATA_PATH="$HOME/memoryroom/runtime/enroot/data"
export ENROOT_RUNTIME_PATH="$HOME/memoryroom/runtime/enroot/run"
export ENROOT_TEMP_PATH="$HOME/memoryroom/runtime/enroot/tmp"
export ENROOT_MAX_PROCESSORS=2
export ENROOT_CONFIG_PATH="$HOME/memoryroom/runtime/enroot"
export ENROOT_RESTRICT_DEV=y
if [[ -x "$HOME/memoryroom/runtime/nvidia/bin/nvidia-container-cli" ]]; then
  export PATH="$HOME/memoryroom/runtime/nvidia/bin:$PATH"
fi
export OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 MKL_NUM_THREADS=2
