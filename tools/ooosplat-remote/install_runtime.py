#!/usr/bin/env python3
"""Install the two verified official archives into the user's private runtime."""
from pathlib import Path
import hashlib
import tarfile
import shutil

root=Path.home()/'memoryroom/runtime/ooosplat'
items=[('colmap-4.2.1-runtime.1-linux.tar.xz','99d3e586b554069ff8fc524430924886608505ba8337751783682fae9eadf88d'),
       ('OOOBrush-x86_64-unknown-linux-gnu.tar.gz','eea89703d98b2fcc090309746ef4ef54271ef402c2b67e644ed7ac1390dcfb4e')]
for name,expected in items:
    archive=root/'downloads'/name
    with archive.open('rb') as stream:
        digest=hashlib.sha256()
        for block in iter(lambda:stream.read(1024*1024),b''):digest.update(block)
    if digest.hexdigest()!=expected:raise SystemExit('Official archive SHA256 mismatch: '+name)
    if name.startswith('colmap'):
        dest=root/'colmap';dest.mkdir(exist_ok=True)
        with tarfile.open(archive) as tar:
            for member in tar.getmembers():
                target=(dest/member.name).resolve()
                if not target.is_relative_to(dest.resolve()):raise SystemExit('Unsafe archive path')
                if member.issym():
                    if not (target.parent/member.linkname).resolve().is_relative_to(dest.resolve()):raise SystemExit('Unsafe symlink')
            tar.extractall(dest)
    else:
        dest=root/'brush';dest.mkdir(exist_ok=True)
        with tarfile.open(archive) as tar:
            for source,target in [('./brush-cli','brush_app'),('./LICENSE','LICENSE'),('./BUILDINFO.json','BUILDINFO.json')]:
                with tar.extractfile(source) as src,(dest/target).open('wb') as dst:shutil.copyfileobj(src,dst)
        if hashlib.sha256((dest/'brush_app').read_bytes()).hexdigest()!='ca819f94716c04add531e69e5f6812a2d1e9a8cefbc2803da000d905d4fccb0a':
            raise SystemExit('Headless OOOBrush binary does not match the pinned manifest')
        (dest/'brush_app').chmod(0o755)
print('Official COLMAP4.2.1 and headless OOOBrush1.0.0 installed in private runtime; no engine executed here.')
