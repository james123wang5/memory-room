#!/usr/bin/env python3
"""Submit the production CPU->GPU chain; never train on the head node."""
from pathlib import Path
import json
import re
import subprocess

root=Path(__file__).resolve().parent
path=root/'jobs.json'
if path.exists():
    prior=json.loads(path.read_text())
    for key,value in prior.items():
        if key.endswith('_job'):
            status=subprocess.run(['squeue','-h','-j',str(value),'-o','%T'],capture_output=True,text=True)
            if status.stdout.strip():raise SystemExit('Existing pipeline job still active: '+str(value))
images=root/'images'
if not images.exists():images.symlink_to('../cap_1ebc5b7a/images',target_is_directory=True)
if len(list(images.glob('*.jpg')))!=493:raise SystemExit('Expected the original 493-image capture')
(root/'logs').mkdir(exist_ok=True)
def submit(*args):
    result=subprocess.check_output(['sbatch','--parsable',*args],cwd=root,text=True).strip().split(';')[0]
    if not re.fullmatch(r'\d+',result):raise SystemExit('Unexpected sbatch output')
    return result
prep=submit('reconstruct.sbatch')
try:train=submit('--dependency=afterok:'+prep,'train.sbatch')
except BaseException:
    subprocess.run(['scancel',prep],check=False)
    raise
data={'provider':'ooosplat-colmap-ooobrush','reconstruct_job':prep,'train_job':train}
path.write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps(data,indent=2))
print('COLMAP preparation submitted; OOOBrush GPU training starts after successful reconstruction.')
