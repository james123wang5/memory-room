"""Generate an original synthetic Gaussian vase. No downloaded or scanned assets."""
import math
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'apps/viewer/public/demo/assets/demo-vase.ply'

def main():
    vertices = []
    for yi in range(100):
        y = yi / 99 * 0.32
        # Slightly asymmetric ceramic silhouette, with a visible opening.
        r = 0.065 + 0.035 * math.sin(y / 0.32 * math.pi) - 0.025 * (y / 0.32) ** 3
        for ti in range(128):
            a = ti / 128 * math.tau
            stripe = 0.025 * math.sin(a * 12)
            color = (0.20 + stripe, 0.39 + stripe, 0.35 + stripe)
            if yi > 93:
                color = (0.73, 0.61, 0.41)
            dc = tuple((c - 0.5) / 0.28209479177387814 for c in color)
            vertices.append((r * math.cos(a), y, r * math.sin(a), *dc, 3.5,
                             math.log(0.0035), math.log(0.0035), math.log(0.0035), 1, 0, 0, 0))
    for ri in range(20):
        r = ri / 19 * 0.06
        for ti in range(64):
            a = ti / 64 * math.tau
            dc = tuple((c - 0.5) / 0.28209479177387814 for c in (0.13, 0.25, 0.23))
            vertices.append((r * math.cos(a), 0.005, r * math.sin(a), *dc, 4,
                             math.log(0.004), math.log(0.004), math.log(0.004), 1, 0, 0, 0))
    props = 'x y z f_dc_0 f_dc_1 f_dc_2 opacity scale_0 scale_1 scale_2 rot_0 rot_1 rot_2 rot_3'.split()
    header = ('ply\nformat binary_little_endian 1.0\ncomment MemoryRoom synthetic demo; not a scan\n'
              f'element vertex {len(vertices)}\n' + ''.join(f'property float {p}\n' for p in props) + 'end_header\n')
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with DEST.open('wb') as f:
        f.write(header.encode('ascii'))
        for v in vertices:
            f.write(struct.pack('<14f', *v))
    print(f'Generated {len(vertices)} synthetic Gaussians: {DEST}')

if __name__ == '__main__':
    main()
