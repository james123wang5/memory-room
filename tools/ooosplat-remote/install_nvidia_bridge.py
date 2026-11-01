#!/usr/bin/env python3
"""Extract the public NVIDIA rootless runtime helper in this user's prefix.

No root package-manager invocation, driver installation or host configuration.
"""
from pathlib import Path
import hashlib
import io
import subprocess
import tarfile
import urllib.request

root=Path.home()/'memoryroom/runtime/nvidia'
root.mkdir(parents=True,exist_ok=True)
packages=[('libnvidia-container-tools_1.20.1-1_amd64.deb','8bd131b8977a3db667982024850ae7b50cfa02d6b2be06a718064ec814778f05'),
          ('libnvidia-container1_1.20.1-1_amd64.deb','9d803cd9c898cb2fa927529d5ac4fc09f3d65c8cfbde8985de1b9398e53a4656')]
for name,expected in packages:
    path=root/name
    if not path.exists():
        with urllib.request.urlopen('https://nvidia.github.io/libnvidia-container/stable/deb/amd64/'+name,timeout=45) as src:
            path.write_bytes(src.read())
    if hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise SystemExit('NVIDIA package checksum mismatch')
    members=subprocess.check_output(['ar','t',str(path)],text=True).splitlines()
    member=next(x for x in members if x.startswith('data.tar'))
    contents=subprocess.check_output(['ar','p',str(path),member])
    with tarfile.open(fileobj=io.BytesIO(contents),mode='r:*') as tar:
        for entry in tar.getmembers():
            if not (root/entry.name).resolve().is_relative_to(root.resolve()):raise SystemExit('Unsafe package path')
        tar.extractall(root)
wrapper=root/'bin/nvidia-container-cli';wrapper.parent.mkdir(exist_ok=True)
wrapper.write_text('''#!/bin/bash
set -e
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export LD_LIBRARY_PATH="$ROOT/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "$ROOT/usr/bin/nvidia-container-cli" "$@"
''')
wrapper.chmod(0o755)
print('Private NVIDIA container helper installed; host GPU driver unchanged.')
