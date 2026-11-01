import { z } from 'zod';

const scalar = z.number().finite();
export const vec3 = z.tuple([scalar, scalar, scalar]);
const axis = vec3.refine(v => Math.abs(Math.hypot(...v) - 1) < 1e-4, '关节方向必须是单位向量');
export const assetPath = z.string().min(1).max(240).refine(p =>
  !p.startsWith('/') && !p.includes('\\') && !p.includes(':') && !p.includes('%') &&
  p.split('/').every(s => s !== '' && s !== '.' && s !== '..'), '资源必须使用包内相对路径');
const transform = z.object({
  position: vec3.default([0, 0, 0]), rotation: vec3.default([0, 0, 0]),
  scale: scalar.min(0.0001).max(10000).default(1),
});
const joint = z.object({
  type: z.enum(['slide', 'hinge']), axis,
  pivot: vec3.optional(),
  min: scalar, max: scalar, value: scalar.min(0).max(1).default(0),
}).refine(j => j.max > j.min, '关节最大值须大于最小值');
const asset = z.object({
  path: assetPath, type: z.enum(['splat', 'mesh', 'texture', 'media']),
  mime: z.enum(['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/mp4','video/mp4','video/webm','application/pdf']).optional(),
  revision: z.string().max(100).optional(),
  provenance: z.enum(['captured', 'generated', 'imported', 'procedural']).optional(),
  captureId: z.string().max(100).optional(),
  // Applied to the visual asset only. Node transforms remain in metres / Y-up.
  metersPerUnit: scalar.positive().max(10000).optional(),
  rotation: vec3.optional(),
  scaleStatus: z.enum(['capture-metric', 'user-confirmed', 'unknown']).optional(),
});
const gate = z.object({ nodeId: z.string().min(1).max(100), minimum: scalar.min(0.01).max(1) });
export const memorySchema = z.object({
  id: z.string().min(1).max(100), nodeId: z.string().max(100).nullable().default(null),
  title: z.string().trim().min(1).max(160), body: z.string().max(20000).default(''),
  date: z.string().max(100).default(''), tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  attachments: z.array(z.object({ assetId: z.string().max(100), name: z.string().min(1).max(240) })).max(30).default([]),
  links: z.array(z.object({ title: z.string().min(1).max(160), url: z.string().max(2048).url().refine(u => /^https?:\/\//i.test(u), '链接只支持 http 或 https') })).max(30).default([]),
  reveal: gate.optional(),
  destination: z.object({ sceneId: z.string().min(1).max(100), nodeId: z.string().min(1).max(100).optional() }).optional(),
});
export type MemoryCard = z.infer<typeof memorySchema>;
export const sceneSchema = z.object({
  version: z.literal(2), id: z.string().min(1).max(100), title: z.string().min(1).max(120),
  units: z.literal('meter'), coordinates: z.literal('right-handed-y-up'),
  source: z.enum(['procedural-demo', 'user-capture']),
  revision: z.string().max(100).optional(),
  parentRevision: z.string().max(100).optional(),
  captureId: z.string().max(100).optional(),
  reconstruction_status: z.enum(['unverified', 'checked-preview', 'preview-ready', 'user-accepted']).optional(),
  warnings: z.array(z.string().max(2000)).max(100).optional(),
  view: z.object({ position: vec3, target: vec3 }).refine(v =>
    Math.hypot(...v.position.map((p, i) => p - v.target[i])) > 0.01,
    '初始视角与目标不能重合').optional(),
  assets: z.record(z.string(), asset),
  memories: z.array(memorySchema).max(2000).optional(),
  nodes: z.array(z.object({
    id: z.string().min(1).max(100), name: z.string().min(1).max(120),
    parent: z.string().nullable().default(null), kind: z.enum(['group', 'primitive', 'splat', 'mesh']),
    primitive: z.enum(['room', 'desk', 'chair', 'cabinet', 'drawer', 'door', 'book', 'plant']).optional(),
    asset: z.string().optional(), proxyAsset: z.string().optional(),
    hotspot: z.object({ radius: scalar.min(0.01).max(2) }).optional(),
    visibleWhen: gate.optional(),
    transform: transform.default({}),
    interaction: z.enum(['static', 'inspect', 'joint']).default('static'),
    description: z.string().max(4000).default(''), joint: joint.optional(),
  })).min(1).max(2000),
}).superRefine((s, ctx) => {
  const byId = new Map(s.nodes.map(n => [n.id, n]));
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (byId.size !== s.nodes.length) issue('物品编号重复');
  const checkGate = (g: z.infer<typeof gate> | undefined) => {
    if (g && !byId.get(g.nodeId)?.joint) issue('显示条件必须指向有开合关节的部件');
  };
  for (const n of s.nodes) {
    checkGate(n.visibleWhen);
    if (n.visibleWhen) {
      let control: string | null | undefined = n.visibleWhen.nodeId;
      const visited = new Set<string>();
      while (control && !visited.has(control)) {
        if (control === n.id) { issue('显示条件不能由自身或其内部物品控制'); break; }
        visited.add(control); control = byId.get(control)?.parent;
      }
    }
    if (n.parent && !byId.has(n.parent)) issue(`${n.id} 的父物品不存在`);
    if (n.kind === 'splat' || n.kind === 'mesh') {
      if (!n.asset || s.assets[n.asset]?.type !== n.kind) issue(`${n.id} 缺少对应类型的模型资源`);
    }
    if (n.proxyAsset && s.assets[n.proxyAsset]?.type !== 'mesh') issue(`${n.id} 的拾取代理必须是网格`);
    if (n.kind === 'primitive' && !n.primitive) issue(`${n.id} 缺少演示形状`);
    if (n.interaction === 'joint' && !n.joint) issue(`${n.id} 缺少关节参数`);
    const seen = new Set([n.id]); let p = n.parent;
    while (p && byId.has(p)) {
      if (seen.has(p)) { issue(`${n.id} 的层级有循环`); break; }
      seen.add(p); p = byId.get(p)!.parent;
    }
  }
  const paths = Object.values(s.assets).map(a => a.path);
  if (new Set(paths).size !== paths.length) issue('资源路径重复');
  if (paths.some(p => !p.startsWith('assets/'))) issue('资产须保存在 assets/ 目录内');
  const memories = s.memories ?? [];
  if (new Set(memories.map(m => m.id)).size !== memories.length) issue('记忆编号重复');
  for (const m of memories) {
    if (m.nodeId && !byId.has(m.nodeId)) issue('记忆绑定的物品不存在');
    checkGate(m.reveal);
    for (const a of m.attachments) {
      if (s.assets[a.assetId]?.type !== 'media' || !s.assets[a.assetId]?.mime) issue('记忆附件缺少文件类型');
    }
  }
});
export type RoomScene = z.infer<typeof sceneSchema>;
export type SceneNode = RoomScene['nodes'][number];
export function parseScene(data: unknown): RoomScene {
  // Keep v1 files readable without touching their originals or changing object IDs.
  if (data && typeof data === 'object' && 'version' in data && data.version === 1) {
    return sceneSchema.parse({ ...data, version: 2 });
  }
  return sceneSchema.parse(data);
}
