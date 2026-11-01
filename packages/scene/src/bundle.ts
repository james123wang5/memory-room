import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
import { z } from 'zod';
import { parseScene, assetPath, memorySchema, type RoomScene } from './schema';

// Batch 1 remains an in-memory portable bundle. Streaming is a separate mobile milestone.
export const MAX_BUNDLE_BYTES = 256 * 1024 * 1024;
const stateSchema = z.object({
  version: z.literal(1), sceneId: z.string(),
  joints: z.record(z.string(), z.number().finite().min(0).max(1)),
});
const contentsSchema = z.object({
  version: z.literal(1), sceneId: z.string(),
  descriptions: z.record(z.string(), z.string().max(4000)),
  memories: z.array(memorySchema).max(2000).optional(),
});
export function packScene(scene: RoomScene, files: Map<string, Uint8Array>): Uint8Array {
  const validated = parseScene(scene);
  const layout = structuredClone(validated);
  delete layout.memories;
  const joints: Record<string, number> = {}, descriptions: Record<string, string> = {};
  for (const n of layout.nodes) {
    descriptions[n.id] = n.description; n.description = '';
    if (n.joint) { joints[n.id] = n.joint.value; n.joint.value = 0; }
  }
  const encode = (data: unknown) => strToU8(JSON.stringify(data, null, 2));
  const entries: Record<string, Uint8Array> = {
    'scene.json': encode(layout),
    'state.json': encode({ version: 1, sceneId: validated.id, joints }),
    'contents.json': encode({ version: 1, sceneId: validated.id, descriptions, memories: validated.memories ?? [] }),
  };
  let total = Object.values(entries).reduce((sum, bytes) => sum + bytes.length, 0);
  if (total > MAX_BUNDLE_BYTES) throw new Error('空间内容超过项目包容量');
  for (const asset of Object.values(validated.assets)) {
    const bytes = files.get(asset.path);
    if (!bytes) throw new Error(`缺少资产文件：${asset.path}`);
    total += bytes.byteLength;
    if (total > MAX_BUNDLE_BYTES) throw new Error('项目包上限为 256 MB，请减少或压缩资产');
    entries[asset.path] = bytes;
  }
  return zipSync(entries, { level: 0 });
}
export function unpackScene(bytes: Uint8Array): { scene: RoomScene; files: Map<string, Uint8Array> } {
  if (bytes.length > MAX_BUNDLE_BYTES + 1024 * 1024) throw new Error('项目包超过 256 MB 上限');
  let total = 0, count = 0;
  const names = new Set<string>();
  const entries = unzipSync(bytes, { filter: file => {
    if (file.name.endsWith('/')) return false;
    assetPath.parse(file.name);
    if (names.has(file.name)) throw new Error('项目包存在重复文件路径');
    names.add(file.name);
    if (++count > 10000) throw new Error('项目包文件数量过多');
    total += file.originalSize;
    if (total > MAX_BUNDLE_BYTES) throw new Error('解压后的项目超过 256 MB');
    return true;
  } });
  if (!entries['scene.json']) throw new Error('项目包缺少 scene.json');
  const raw = JSON.parse(strFromU8(entries['scene.json']));
  const scene = parseScene(raw);
  if (raw.version === 2 && (!entries['state.json'] || !entries['contents.json'])) {
    throw new Error('新版项目包缺少状态或内容文件');
  }
  if (entries['state.json']) {
    const state = stateSchema.parse(JSON.parse(strFromU8(entries['state.json'])));
    if (state.sceneId !== scene.id) throw new Error('状态文件不属于此空间');
    for (const n of scene.nodes) if (n.joint && Object.hasOwn(state.joints, n.id)) n.joint.value = state.joints[n.id];
  }
  if (entries['contents.json']) {
    const contents = contentsSchema.parse(JSON.parse(strFromU8(entries['contents.json'])));
    if (contents.sceneId !== scene.id) throw new Error('内容文件不属于此空间');
    for (const n of scene.nodes) if (Object.hasOwn(contents.descriptions, n.id)) n.description = contents.descriptions[n.id];
    scene.memories = contents.memories ?? scene.memories;
  }
  const complete = parseScene(scene);
  const files = new Map<string, Uint8Array>();
  for (const a of Object.values(scene.assets)) {
    if (!entries[a.path]) throw new Error(`项目包缺少资产：${a.path}`);
    files.set(a.path, entries[a.path]);
  }
  return { scene: complete, files };
}
