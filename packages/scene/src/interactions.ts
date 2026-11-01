import { Object3D, Quaternion, Vector3 } from 'three';
import type { SceneNode } from './schema';

/** Joint values are absolute, never incremental, so slider motion cannot accumulate drift. */
export function applyJoint(object: Object3D, node: SceneNode, fraction: number) {
  const j = node.joint;
  if (!j) throw new Error('物品没有关节');
  const value = Math.min(1, Math.max(0, fraction));
  const displacement = j.min + (j.max - j.min) * value;
  object.position.fromArray(node.transform.position);
  object.rotation.set(...node.transform.rotation);
  const direction = new Vector3(...j.axis);
  if (j.type === 'slide') object.position.addScaledVector(direction, displacement);
  else {
    const base = object.quaternion.clone(), pivot = new Vector3().fromArray(j.pivot ?? [0, 0, 0]).multiplyScalar(node.transform.scale);
    object.quaternion.multiply(new Quaternion().setFromAxisAngle(direction, displacement));
    object.position.add(pivot.clone().applyQuaternion(base)).sub(pivot.applyQuaternion(object.quaternion));
  }
  j.value = value;
  object.updateMatrixWorld(true);
}

export class InspectionSession {
  private center = new Vector3();
  private home?: { object: Object3D; parent: Object3D; position: Vector3; quaternion: Quaternion; scale: Vector3 };
  get active() { return !!this.home; }
  get object() { return this.home?.object; }
  begin(object: Object3D, anchor: Object3D, worldRadius: number, localCenter = new Vector3()) {
    this.restore();
    if (!object.parent) throw new Error('物品未加入场景');
    object.updateWorldMatrix(true, true);
    const worldScale = object.getWorldScale(new Vector3());
    this.home = { object, parent: object.parent, position: object.position.clone(),
      quaternion: object.quaternion.clone(), scale: object.scale.clone() };
    anchor.attach(object);
    object.position.set(0, 0, 0);
    object.quaternion.identity();
    // Only uniform scaling is allowed by the manifest and Gaussian renderer.
    object.scale.copy(worldScale).multiplyScalar(0.28 / Math.max(worldRadius, 0.01));
    this.center.copy(localCenter);
    object.position.copy(localCenter).multiply(object.scale).negate();
    object.updateMatrixWorld(true);
  }
  rotate(dx: number, dy: number) {
    const object = this.home?.object;
    if (!object) return;
    object.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx));
    object.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy));
    // Keep an imported model's visual centre fixed even when its origin is far away.
    object.position.copy(this.center).multiply(object.scale).applyQuaternion(object.quaternion).negate();
  }
  restore() {
    if (!this.home) return;
    const h = this.home;
    h.parent.add(h.object);
    h.object.position.copy(h.position); h.object.quaternion.copy(h.quaternion); h.object.scale.copy(h.scale);
    h.object.updateMatrixWorld(true);
    this.home = undefined;
  }
}
