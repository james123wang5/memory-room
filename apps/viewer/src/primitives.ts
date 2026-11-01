import * as T from 'three';
import type { SceneNode } from '../../../packages/scene/src/schema';

const mat = (color: number, roughness = 0.85) => new T.MeshStandardMaterial({ color, roughness });
const wood = mat(0x9f7651), darkWood = mat(0x624b38), paleWood = mat(0xc3a37d);
const cream = mat(0xe9e3d5), green = mat(0x365d4d), brass = mat(0xad8a4e, 0.4);
function box(g: T.Group, w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function cylinder(g: T.Group, top: number, bottom: number, height: number, x: number, y: number, z: number, material: T.Material) {
  const m = new T.Mesh(new T.CylinderGeometry(top, bottom, height, 32), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}

export function makePrimitive(kind: SceneNode['primitive']): T.Group {
  const g = new T.Group();
  if (kind === 'room') {
    box(g, 5.9, 0.14, 4.6, 0, -0.09, 0, paleWood);
    for (let x = 0; x < 24; x++) for (let z = 0; z < 4; z++) {
      const tone = [0xc3a98b, 0xcbb294, 0xc7ae90, 0xd1b99d][(x * 7 + z * 3) % 4];
      box(g, 0.24, 0.013, 1.13, -2.78 + x * 0.24, -0.008, -1.72 + z * 1.15, mat(tone));
    }
    box(g, 5.9, 2.65, 0.13, 0, 1.25, -2.3, mat(0xe3dfd2));
    box(g, 0.13, 2.65, 4.6, -2.95, 1.25, 0, mat(0xd6d7c9));
    box(g, 5.8, 0.1, 0.04, 0, 0.04, -2.21, cream);
    box(g, 0.04, 0.1, 4.5, -2.86, 0.04, 0, cream);
    // Window and framing, drawn on the rear wall of the cutaway room.
    box(g, 1.28, 1.2, 0.035, -1.33, 1.78, -2.21, mat(0xbfd5cc));
    const frame = mat(0xf2eee3);
    for (const dx of [-0.68, 0, 0.68]) box(g, 0.045, 1.3, 0.09, -1.33 + dx, 1.78, -2.16, frame);
    for (const dy of [-0.63, 0, 0.63]) box(g, 1.4, 0.045, 0.09, -1.33, 1.78 + dy, -2.16, frame);
    box(g, 1.6, 0.06, 0.2, -1.33, 1.1, -2.1, cream);
    // A small framed print.
    box(g, 0.75, 0.95, 0.05, 0.5, 1.82, -2.2, darkWood);
    box(g, 0.66, 0.86, 0.02, 0.5, 1.82, -2.165, cream);
    const print = new T.Mesh(new T.CircleGeometry(0.2, 48), mat(0xaf7053));
    print.position.set(0.5, 1.88, -2.15); g.add(print);
    box(g, 0.43, 0.04, 0.015, 0.5, 1.53, -2.145, green);
    const rug = box(g, 2.15, 0.015, 1.55, -0.65, 0.005, 0.75, mat(0xb9b6a1));
    rug.rotation.y = -0.07;
    for (let i = 0; i < 10; i++) box(g, 1.99, 0.003, 0.01, -0.65, 0.016, 0.1 + i * 0.14, mat(0xa5a18b));
  } else if (kind === 'desk') {
    box(g, 1.85, 0.08, 0.86, 0, 0.78, 0, wood);
    for (const x of [-0.77, 0.77]) for (const z of [-0.32, 0.32]) box(g, 0.06, 0.75, 0.06, x, 0.375, z, darkWood);
    box(g, 1.55, 0.13, 0.05, 0, 0.65, -0.32, wood);
    // Reading lamp, part of the fixed demonstration table.
    cylinder(g, 0.12, 0.14, 0.025, 0.58, 0.835, -0.2, green);
    cylinder(g, 0.013, 0.013, 0.4, 0.58, 1.04, -0.2, brass);
    cylinder(g, 0.1, 0.2, 0.16, 0.58, 1.26, -0.2, green);
  } else if (kind === 'chair') {
    box(g, 0.5, 0.065, 0.48, 0, 0.45, 0, wood);
    for (const x of [-0.2, 0.2]) for (const z of [-0.19, 0.19]) box(g, 0.04, 0.44, 0.04, x, 0.22, z, darkWood);
    for (const x of [-0.2, 0.2]) box(g, 0.04, 0.46, 0.04, x, 0.72, 0.2, darkWood);
    for (const y of [0.69, 0.83]) box(g, 0.46, 0.09, 0.05, 0, y, 0.2, wood);
  } else if (kind === 'cabinet') {
    for (const x of [-0.52, 0.52]) for (const z of [-0.26, 0.26]) cylinder(g, 0.035, 0.025, 0.14, x, 0.07, z, darkWood);
    box(g, 1.22, 0.055, 0.78, 0, 0.9, 0, wood);
    box(g, 1.22, 0.055, 0.78, 0, 0.13, 0, wood);
    for (const x of [-0.585, 0.585]) box(g, 0.05, 0.75, 0.78, x, 0.51, 0, wood);
    box(g, 1.14, 0.72, 0.035, 0, 0.51, -0.37, darkWood);
    box(g, 1.13, 0.035, 0.72, 0, 0.53, 0, paleWood);
    box(g, 0.55, 0.33, 0.045, 0.29, 0.33, 0.365, wood);
    cylinder(g, 0.025, 0.025, 0.055, 0.1, 0.33, 0.41, brass).rotation.x = Math.PI / 2;
    // Decorative stack on the cabinet top.
    box(g, 0.4, 0.035, 0.25, -0.27, 0.95, 0, green);
    box(g, 0.34, 0.025, 0.22, -0.24, 0.98, 0, cream);
  } else if (kind === 'drawer') {
    box(g, 1.1, 0.03, 0.64, 0, -0.11, 0, paleWood);
    box(g, 1.13, 0.23, 0.055, 0, 0, 0.37, wood);
    for (const x of [-0.53, 0.53]) box(g, 0.025, 0.19, 0.66, x, 0, 0.02, paleWood);
    box(g, 1.07, 0.19, 0.025, 0, 0, -0.31, paleWood);
    box(g, 0.18, 0.025, 0.035, 0, 0.015, 0.42, brass);
  } else if (kind === 'door') {
    // Origin lies on the hinge. This offset is important for correct articulation.
    box(g, 0.55, 0.33, 0.045, 0.275, 0, 0, wood);
    cylinder(g, 0.025, 0.025, 0.055, 0.45, 0, 0.05, brass).rotation.x = Math.PI / 2;
  } else if (kind === 'book') {
    box(g, 0.25, 0.043, 0.34, 0, 0, 0, cream);
    for (const y of [-0.026, 0.026]) box(g, 0.27, 0.01, 0.36, 0, y, 0, green);
    box(g, 0.015, 0.054, 0.36, -0.13, 0, 0, green);
    box(g, 0.12, 0.002, 0.006, 0.01, 0.032, -0.03, brass);
    box(g, 0.075, 0.002, 0.004, 0.01, 0.032, 0.005, brass);
  } else if (kind === 'plant') {
    cylinder(g, 0.19, 0.13, 0.32, 0, 0.16, 0, mat(0xa87555));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, h = 0.45 + i % 3 * 0.16;
      cylinder(g, 0.006, 0.008, h, Math.sin(a) * 0.05, h / 2 + 0.3, Math.cos(a) * 0.05, green);
      const leaf = new T.Mesh(new T.SphereGeometry(1, 16, 12), mat(i % 2 ? 0x627d50 : 0x405b3e));
      leaf.scale.set(0.11, 0.035, 0.24); leaf.rotation.set(0.4, a, 0.3);
      leaf.position.set(Math.sin(a) * 0.15, h + 0.28, Math.cos(a) * 0.15); leaf.castShadow = true; g.add(leaf);
    }
  }
  return g;
}
