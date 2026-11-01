#!/usr/bin/env python3
"""Resolve the scheduler-visible CUDA device to its UUID, without a kernel run.

Global Slurm GPU indices need not equal nvidia-smi indices. CUDA's visibility
environment is retained; insist on exactly one visible device before mapping
its identity into the Vulkan container.
"""
import ctypes
import os
import sys
import uuid

print('GPU allocation: SLURM_JOB_GPUS=%s CUDA_VISIBLE_DEVICES=%s' %
      (os.environ.get('SLURM_JOB_GPUS'),os.environ.get('CUDA_VISIBLE_DEVICES')),file=sys.stderr)
driver=ctypes.CDLL('libcuda.so.1')
def check(result,operation):
    if result:raise SystemExit('CUDA identity query %s failed with code %s'%(operation,result))
check(driver.cuInit(0),'initialize driver')
count=ctypes.c_int()
check(driver.cuDeviceGetCount(ctypes.byref(count)),'visible device count')
if count.value!=1:raise SystemExit('Expected exactly one scheduler-visible CUDA device, got '+str(count.value))
device=ctypes.c_int()
check(driver.cuDeviceGet(ctypes.byref(device),0),'device handle')
identifier=(ctypes.c_ubyte*16)()
get_uuid=getattr(driver,'cuDeviceGetUuid_v2',driver.cuDeviceGetUuid)
check(get_uuid(ctypes.byref(identifier),device),'device UUID')
print('GPU-'+str(uuid.UUID(bytes=bytes(identifier))))
