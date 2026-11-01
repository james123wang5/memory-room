import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { InspectionSession, applyJoint } from '../../../packages/scene/src/interactions';
import type { RoomScene, SceneNode } from '../../../packages/scene/src/schema';
import { makePrimitive } from './primitives';
import { nodeAccessible } from '../../../packages/scene/src/memory';

export function objectBounds(object: T.Object3D): T.Box3 {
  object.updateWorldMatrix(true, true);
  const box = new T.Box3();
  object.traverse(o => {
    if (o instanceof SplatMesh) box.union(o.getBoundingBox().clone().applyMatrix4(o.matrixWorld));
    else if (o instanceof T.Mesh) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (o.geometry.boundingBox) box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    }
  });
  return box;
}

async function loadLocalGLB(bytes: Uint8Array): Promise<T.Group> {
  const data = bytes.slice().buffer;
  const view = new DataView(data);
  if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== view.byteLength || view.getUint32(16, true) !== 0x4e4f534a) {
    throw new Error('请选择完整的 glTF 2.0 GLB 文件');
  }
  const length = view.getUint32(12, true);
  if (length > view.byteLength - 20) throw new Error('GLB 文件内容不完整');
  const manifest = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, length)));
  for (const resource of [...(manifest.buffers ?? []), ...(manifest.images ?? [])]) {
    if (resource.uri && !/^data:[^,]*;base64,/i.test(resource.uri)) {
      throw new Error('请导出包含全部贴图的 GLB；当前不加载外部文件或网络资源');
    }
  }
  if ((manifest.extensionsRequired ?? []).some((x: string) => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'].includes(x))) {
    throw new Error('此 GLB 使用了尚未接入的压缩扩展，请导出未压缩 GLB');
  }
  const manager = new T.LoadingManager();
  manager.setURLModifier(url => {
    if (!url.startsWith('blob:') && !url.startsWith('data:')) throw new Error('模型禁止读取外部资源');
    return url;
  });
  return (await new GLTFLoader(manager).parseAsync(data, '')).scene;
}

export class Viewport {
  readonly scene = new T.Scene();
  readonly camera = new T.PerspectiveCamera(40, 1, 0.01, 1000);
  readonly renderer: T.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly objects = new Map<string, T.Group>();
  readonly inspect = new InspectionSession();
  readonly anchor = new T.Group();
  private root = new T.Group();
  private manifest?: RoomScene;
  private selected?: string;
  private box = new T.Box3();
  private helper = new T.Box3Helper(this.box, new T.Color(0xc59956));
  private pointer?: { id: number; x: number; y: number; lastX: number; lastY: number; moved: boolean };
  private spark: SparkRenderer;
  private resizeObserver: ResizeObserver;
  private keys = new Set<string>();
  private lastTime = 0;
  private baseFov = 40;
  authoring = true;
  onSelect: (id: string) => void = () => {};
  onFrame: (fps: number) => void = () => {};
  onError: (message: string) => void = () => {};

  constructor(readonly host: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.domElement.setAttribute('aria-label', '可交互的三维房间；也可通过左侧物品列表选择物品');
    this.renderer.domElement.tabIndex = 0;
    host.append(this.renderer.domElement);
    this.scene.add(this.root, this.camera, this.helper);
    this.helper.visible = false;
    this.anchor.position.set(0, -0.03, -1.0); this.camera.add(this.anchor);
    this.spark = new SparkRenderer({ renderer: this.renderer });
    this.scene.add(this.spark);
    this.scene.add(new T.HemisphereLight(0xfff8e8, 0x899282, 2.2));
    const sun = new T.DirectionalLight(0xfff0ce, 3.2);
    sun.position.set(-1.8, 6, 3.5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
    sun.shadow.normalBias = 0.025; this.scene.add(sun);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.09;
    this.controls.minDistance = 0.2; this.controls.maxDistance = 35;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.home();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host);
    this.bindPointer();
    this.renderer.domElement.addEventListener('keydown', e => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.keys.add(e.key.toLowerCase()); e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
    this.renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault(); this.onError('图形连接中断，请保存项目后刷新页面。');
    });
    this.renderer.setAnimationLoop(time => {
      const dt = Math.min((time - this.lastTime) / 1000 || 0, 0.05); this.lastTime = time;
      this.move(dt); this.controls.update();
      if (this.selected && !this.inspect.active) {
        const object = this.objects.get(this.selected);
        if (object) this.box.copy(objectBounds(object));
      }
      this.renderer.render(this.scene, this.camera);
      if (Math.floor(time / 1000) !== Math.floor((time - dt * 1000) / 1000)) this.onFrame(Math.round(1 / Math.max(dt, 0.001)));
    });
  }
  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    this.camera.aspect = w / Math.max(h, 1);
    // Preserve a useful horizontal field of view on portrait screens.
    this.camera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.tan(T.MathUtils.degToRad(this.baseFov) / 2) / Math.min(1, this.camera.aspect)));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  private move(dt: number) {
    if (this.inspect.active || !this.keys.size) return;
    const forward = new T.Vector3(); this.camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const right = new T.Vector3().crossVectors(forward, T.Object3D.DEFAULT_UP);
    const f = Number(this.keys.has('w') || this.keys.has('arrowup')) - Number(this.keys.has('s') || this.keys.has('arrowdown'));
    const r = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    const delta = forward.multiplyScalar(f).addScaledVector(right, r).multiplyScalar(dt * 1.4);
    this.camera.position.add(delta); this.controls.target.add(delta);
  }
  private bindPointer() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false };
      if (this.inspect.active) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      const p = this.pointer; if (!p || e.pointerId !== p.id) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 5) p.moved = true;
      if (this.inspect.active) this.inspect.rotate((e.clientX - p.lastX) * 0.009, (e.clientY - p.lastY) * 0.009);
      p.lastX = e.clientX; p.lastY = e.clientY;
    });
    canvas.addEventListener('pointerup', e => {
      const p = this.pointer; this.pointer = undefined;
      if (!p || p.id !== e.pointerId || p.moved || this.inspect.active) return;
      const rect = canvas.getBoundingClientRect();
      const ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), this.camera);
      const hits = ray.intersectObject(this.root, true);
      for (const hit of hits) {
        let o: T.Object3D | null = hit.object;
        let visible = true, ancestor: T.Object3D | null = o;
        while (ancestor) { if (!ancestor.visible) { visible = false; break; } ancestor = ancestor.parent; }
        if (!visible) continue;
        while (o && !o.userData.nodeId) o = o.parent;
        if (o?.userData.nodeId) { this.onSelect(o.userData.nodeId); break; }
      }
    });
    canvas.addEventListener('pointercancel', () => { this.pointer = undefined; });
  }
  async load(manifest: RoomScene, files: Map<string, Uint8Array>) {
    const nextRoot = new T.Group(), nextObjects = new Map<string, T.Group>();
    try {
      for (const node of manifest.nodes) {
        const group = new T.Group(); group.name = node.name; group.userData.nodeId = node.id;
        group.position.fromArray(node.transform.position); group.rotation.set(...node.transform.rotation);
        group.scale.setScalar(node.transform.scale);
        nextRoot.add(group); nextObjects.set(node.id, group);
        const visual = new T.Group(); group.add(visual);
        const metadata = node.asset ? manifest.assets[node.asset] : undefined;
        visual.scale.setScalar(metadata?.metersPerUnit ?? 1);
        if (metadata?.rotation) visual.rotation.set(...metadata.rotation);
        if (node.kind === 'primitive') group.add(makePrimitive(node.primitive));
        if (node.hotspot) {
          const marker = new T.Mesh(new T.SphereGeometry(node.hotspot.radius, 16, 12), new T.MeshBasicMaterial({ color: 0xd1a563, transparent: true, opacity: 0.85 }));
          marker.name = 'memory-marker'; group.add(marker);
        }
        if (node.kind === 'splat') {
          const asset = manifest.assets[node.asset!], bytes = files.get(asset.path);
          if (!bytes) throw new Error(`模型文件未找到：${asset.path}`);
          const splat = new SplatMesh({ fileBytes: bytes.slice(), fileName: asset.path, raycastable: true, lod: false });
          visual.add(splat); await splat.initialized;
          const b = splat.getBoundingBox();
          if (b.isEmpty() || !Number.isFinite(b.max.lengthSq() + b.min.lengthSq())) throw new Error(`${node.name} 没有可用的高斯数据`);
        }
        if (node.kind === 'mesh') {
          const asset = manifest.assets[node.asset!], bytes = files.get(asset.path);
          if (!bytes) throw new Error(`网格文件未找到：${asset.path}`);
          visual.add(await loadLocalGLB(bytes));
        }
        if (node.proxyAsset) {
          const asset = manifest.assets[node.proxyAsset], bytes = files.get(asset.path);
          if (!bytes) throw new Error(`拾取代理未找到：${asset.path}`);
          const proxy = await loadLocalGLB(bytes);
          proxy.scale.multiplyScalar(asset.metersPerUnit ?? 1);
          if (asset.rotation) proxy.rotation.set(...asset.rotation);
          proxy.traverse(o => {
            if (o instanceof T.Mesh) {
              const materials = Array.isArray(o.material) ? o.material : [o.material];
              materials.forEach(m => { m.colorWrite = false; m.depthWrite = false; });
            }
          });
          group.add(proxy);
        }
      }
      for (const node of manifest.nodes) if (node.parent) nextObjects.get(node.parent)!.add(nextObjects.get(node.id)!);
      for (const node of manifest.nodes) if (node.joint) applyJoint(nextObjects.get(node.id)!, node, node.joint.value);
    } catch (e) { this.disposeRoot(nextRoot); throw e; }
    this.endInspect(); this.disposeRoot(this.root); this.root.removeFromParent(); this.root = nextRoot;
    this.scene.add(this.root); this.objects.clear(); nextObjects.forEach((v, k) => this.objects.set(k, v));
    this.manifest = manifest; this.select(undefined);
    this.refreshVisibility();
    this.controls.maxPolarAngle = manifest.source === 'user-capture' ? Math.PI - 0.01 : Math.PI * 0.49;
    this.baseFov = manifest.source === 'user-capture' ? 60 : 40;
    this.resize();
  }
  private disposeRoot(root: T.Object3D) {
    root.traverse(o => {
      if (o instanceof SplatMesh) o.dispose();
      else if (o instanceof T.Mesh) {
        o.geometry.dispose(); const m = Array.isArray(o.material) ? o.material : [o.material];
        m.forEach(x => {
          for (const value of Object.values(x)) if (value instanceof T.Texture) {
            const image = value.source?.data;
            if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
            value.dispose();
          }
          x.dispose();
        });
      }
    });
  }
  home() {
    this.endInspect();
    if (this.manifest?.view) {
      this.camera.position.fromArray(this.manifest.view.position);
      this.controls.target.fromArray(this.manifest.view.target);
    } else {
      this.camera.position.set(6.5, 4.9, 7.3); this.controls?.target.set(0, 0.85, -0.2);
    }
    this.controls?.update();
  }
  select(id?: string) { this.selected = id; this.helper.visible = !!id && !this.inspect.active && (this.authoring || !!this.manifest && nodeAccessible(this.manifest, id)); }
  setAuthoring(value: boolean) { this.endInspect(); this.authoring = value; this.refreshVisibility(); }
  refreshVisibility() {
    if (!this.manifest) return;
    for (const node of this.manifest.nodes) {
      const object = this.objects.get(node.id); if (object) object.visible = this.authoring || nodeAccessible(this.manifest, node.id);
    }
    this.select(this.selected);
  }
  beginInspect(id: string) {
    const object = this.objects.get(id); if (!object) return;
    const box = objectBounds(object), center = box.getCenter(new T.Vector3());
    if (box.isEmpty()) { this.onError('这个容器还没有可观察的模型，请先加入独立资产或记忆点。'); return; }
    const local = object.worldToLocal(center.clone());
    this.inspect.begin(object, this.anchor, box.getBoundingSphere(new T.Sphere()).radius, local);
    this.controls.enabled = false; this.helper.visible = false;
  }
  endInspect() { this.inspect.restore(); if (this.controls) this.controls.enabled = true; this.helper.visible = !!this.selected; }
  focus(id: string) {
    this.endInspect(); const object = this.objects.get(id); if (!object) return;
    const box = objectBounds(object); if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new T.Sphere());
    const d = Math.max(sphere.radius * 3.7, 0.65);
    this.controls.target.copy(sphere.center); this.camera.position.copy(sphere.center).add(new T.Vector3(0.9, 0.55, 1).normalize().multiplyScalar(d));
    this.controls.update();
  }
  setJoint(node: SceneNode, value: number) { this.endInspect(); applyJoint(this.objects.get(node.id)!, node, value); this.refreshVisibility(); }
  updateTransform(node: SceneNode) {
    this.endInspect(); const object = this.objects.get(node.id)!;
    object.position.fromArray(node.transform.position); object.rotation.set(...node.transform.rotation); object.scale.setScalar(node.transform.scale);
    if (node.joint) applyJoint(object, node, node.joint.value);
    this.refreshVisibility();
  }
  normalizeObject(node: SceneNode) {
    const object = this.objects.get(node.id)!;
    const b = objectBounds(object), center = b.getCenter(new T.Vector3());
    const size = b.getSize(new T.Vector3()), factor = 0.45 / Math.max(size.x, size.y, size.z, 0.001);
    node.transform.scale *= factor;
    node.transform.position = [-center.x * factor, 0.85 - b.min.y * factor, -center.z * factor];
    this.updateTransform(node);
  }
  get stats() {
    let splats = 0;
    this.root.traverse(o => { if (o instanceof SplatMesh) splats += o.packedSplats?.numSplats ?? 0; });
    return { nodes: this.objects.size, splats, inspecting: this.inspect.active, renderer: 'Spark WebGL2' };
  }
}
