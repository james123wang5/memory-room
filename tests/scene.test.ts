import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3 } from 'three';
import { createDemo } from '../packages/scene/src/demo';
import { parseScene } from '../packages/scene/src/schema';
import { applyJoint, InspectionSession } from '../packages/scene/src/interactions';
import { packScene, unpackScene } from '../packages/scene/src/bundle';

test('scene rejects circular ancestry and missing assets', () => {
  const cycle = createDemo(); cycle.nodes.find(n => n.id === 'cabinet')!.parent = 'book';
  assert.throws(() => parseScene(cycle), /循环/);
  const missing = createDemo(); delete missing.assets['gaussian-vase'];
  assert.throws(() => parseScene(missing), /资源/);
});
test('scene rejects duplicate ids, traversal paths and non-uniform/invalid scales', () => {
  const duplicate = createDemo(); duplicate.nodes[1].id = duplicate.nodes[0].id;
  assert.throws(() => parseScene(duplicate), /重复/);
  for (const path of ['../private.ply', 'https://host/model.ply', '/model.ply', 'assets\\model.ply']) {
    const scene = createDemo(); scene.assets['gaussian-vase'].path = path;
    assert.throws(() => parseScene(scene));
  }
  const scene = createDemo(); scene.nodes[0].transform.scale = 0;
  assert.throws(() => parseScene(scene));
});
test('drawer motion carries a child book, clamps values and never accumulates drift', () => {
  const scene = createDemo(), node = scene.nodes.find(n => n.id === 'drawer')!;
  const cabinet = new Group(), drawer = new Group(), book = new Group();
  cabinet.position.set(1.28, 0, -1.02); cabinet.add(drawer); drawer.add(book); book.position.set(0, -0.015, 0.06);
  applyJoint(drawer, node, 0); const home = book.getWorldPosition(new Vector3());
  for (let i = 0; i < 50; i++) applyJoint(drawer, node, 0.5);
  assert.ok(Math.abs(book.getWorldPosition(new Vector3()).z - home.z - 0.24) < 1e-10);
  applyJoint(drawer, node, 3); assert.equal(node.joint!.value, 1);
  applyJoint(drawer, node, 0); assert.ok(book.getWorldPosition(new Vector3()).distanceTo(home) < 1e-10);
});
test('inspection restores exact local transform and follows a moving parent afterward', () => {
  const scene = new Group(), drawer = new Group(), book = new Group(), anchor = new Group();
  scene.add(drawer, anchor); drawer.add(book); drawer.position.set(2, 1, -3); drawer.rotation.y = 0.4;
  book.position.set(0.1, 0.03, -0.12); book.rotation.set(0.1, 0.2, 0.3); book.scale.setScalar(0.8);
  const p = book.position.clone(), q = book.quaternion.clone(), s = book.scale.clone();
  const inspect = new InspectionSession();
  inspect.begin(book, anchor, 0.2, new Vector3(0, 0.1, 0)); inspect.rotate(1.2, -0.6);
  drawer.position.z += 0.4; inspect.restore();
  assert.equal(book.parent, drawer); assert.ok(book.position.distanceTo(p) < 1e-12);
  assert.ok(1 - Math.abs(book.quaternion.dot(q)) < 1e-12); assert.ok(book.scale.distanceTo(s) < 1e-12);
  assert.equal(inspect.active, false);
});
test('hinged door rotates around its origin and keeps parent placement', () => {
  const node = createDemo().nodes.find(n => n.id === 'door')!, door = new Group();
  applyJoint(door, node, 1);
  assert.deepEqual(door.position.toArray(), node.transform.position);
  assert.ok(new Vector3(1, 0, 0).applyQuaternion(door.quaternion).z > 0);
  applyJoint(door, node, 0); assert.ok(Math.abs(door.quaternion.w - 1) < 1e-12);
});
test('portable bundle round-trips scene, open drawer and exact asset bytes', () => {
  const scene = createDemo(); scene.nodes.find(n => n.id === 'drawer')!.joint!.value = 0.6;
  scene.view = { position: [1, 2, 3], target: [1, 2, 1] };
  const bytes = new Uint8Array([112, 108, 121, 10, 1, 2, 3]);
  const result = unpackScene(packScene(scene, new Map([['assets/demo-vase.ply', bytes]])));
  assert.deepEqual(result.scene, scene); assert.deepEqual(result.files.get('assets/demo-vase.ply'), bytes);
  assert.throws(() => packScene(scene, new Map()), /缺少模型/);
  scene.view.target = [...scene.view.position];
  assert.throws(() => parseScene(scene), /重合/);
});
