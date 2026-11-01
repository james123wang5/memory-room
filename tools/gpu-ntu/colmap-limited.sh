#!/bin/bash
# COLMAP 3.8 adapter: explicit worker limits, independent of OpenMP defaults.
# Verified against upstream option declarations, not executed on NTU here.
set -euo pipefail
REAL_COLMAP="${CONDA_PREFIX:?Activate memoryroom-ns115 first}/bin/colmap"
# The conda COLMAP GPU build needs CUDA 12. Keep that runtime search path
# local to COLMAP, separate from torch cu118 / its CUDA 11.8 build toolkit.
if [[ -n "${MEMORYROOM_COLMAP_LD_LIBRARY_PATH:-}" ]]; then
  export LD_LIBRARY_PATH="$MEMORYROOM_COLMAP_LD_LIBRARY_PATH"
fi
export OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 MKL_NUM_THREADS=2
EXTRA=()
case "${1:-}" in
  feature_extractor) EXTRA=(--SiftExtraction.num_threads 2) ;;
  sequential_matcher|exhaustive_matcher|vocab_tree_matcher)
    EXTRA=(--SiftMatching.num_threads 2 --SiftMatching.max_num_matches 8192) ;;
  mapper) EXTRA=(--Mapper.num_threads 2) ;;
esac
exec "$REAL_COLMAP" "$@" "${EXTRA[@]}"
