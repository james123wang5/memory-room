/** Isolated batch-2 assembly UI. Does not import the reconstruction job service. */
import { createServer, type IncomingMessage } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MAX_BUNDLE_BYTES, packScene, unpackScene } from '../../packages/scene/src/bundle';
import { parseScene, type RoomScene } from '../../packages/scene/src/schema';

const root = fileURLToPath(new URL('../../', import.meta.url));
const origin = 'http://127.0.0.1:4320';
const token = randomUUID();
let project: ReturnType<typeof unpackScene> | undefined;
let dirty = false;
let busy = false;
const added = new Set<string>();
const removed = new Set<string>();
const outputRoot = resolve(root, 'data/processed/assembly');
async function body(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw new Error('文件过大，请缩小资产后再导入');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function number(value: unknown, name: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${name}必须是有限数字`);
  return value;
}
function vector(value: unknown, name: string): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${name}需要三个数字`);
  return value.map(v => number(v, name)) as [number, number, number];
}
function requireProject() {
  if (!project) throw new Error('请先打开一个房间项目包');
  return project;
}
function model(bytes: Buffer, extension: string) {
  if (extension === 'glb') {
    if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('需要完整的 GLB 2.0 文件');
    const length = bytes.readUInt32LE(12);
    if (bytes.readUInt32LE(16) !== 0x4e4f534a || length > bytes.length - 20) throw new Error('GLB 缺少模型说明');
    const doc = JSON.parse(bytes.toString('utf8', 20, 20 + length).trim());
    if ([...(doc.buffers ?? []), ...(doc.images ?? [])].some((item: { uri?: string }) => item.uri && !item.uri.startsWith('data:'))) throw new Error('请导出内嵌贴图的 GLB；暂不支持外链文件');
    if ((doc.extensionsRequired ?? []).some((e: string) => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'].includes(e))) throw new Error('请导出未压缩的 GLB 网格及普通贴图');
    return 'mesh' as const;
  }
  if (extension === 'ply') {
    const header = bytes.subarray(0, 16384).toString('ascii');
    if (!header.startsWith('ply') || !header.includes('end_header') || !/property float (?:scale_0|f_dc_0)/.test(header)) throw new Error('需要训练后的高斯 PLY，不能用普通点云替代');
    return 'splat' as const;
  }
  if (extension === 'spz') {
    if (bytes.length < 16) throw new Error('SPZ 文件不完整');
    return 'splat' as const;
  }
  throw new Error('只支持 GLB、3DGS PLY 和 SPZ');
}
function status() {
  return { scene: project?.scene ?? null, dirty, added: [...added], removed: [...removed] };
}
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.headers.host !== '127.0.0.1:4320' || (req.headers.origin && req.headers.origin !== origin)) {
    res.writeHead(403).end('请使用本机入口'); return;
  }
  const url = new URL(req.url ?? '/', origin);
  let ownsBusy = false;
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      const html = await readFile(new URL('./workbench.html', import.meta.url), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html.replace('__TOKEN__', token)); return;
    }
    if (req.headers['x-memoryroom-token'] !== token) { res.writeHead(403).end('请重新打开工作台'); return; }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(status())); return;
    }
    if (req.method !== 'POST') { res.writeHead(404).end(); return; }
    if (busy) throw new Error('上一个操作尚未结束，请稍候');
    busy = true; ownsBusy = true;
    if (url.pathname === '/api/open') {
      const next = unpackScene(new Uint8Array(await body(req, MAX_BUNDLE_BYTES + 1024 * 1024)));
      if (next.scene.source !== 'user-capture') throw new Error('请打开真实扫描项目包，演示空间不能作为真实背景');
      project = next; added.clear(); removed.clear(); dirty = false;
    } else if (url.pathname === '/api/asset') {
      const p = requireProject();
      const name = (url.searchParams.get('name') ?? '').trim();
      if (!name || name.length > 120) throw new Error('物品名称需为 1–120 个字');
      const extension = url.searchParams.get('extension') ?? '';
      const bytes = await body(req, 128 * 1024 * 1024);
      const kind = model(bytes, extension);
      if ([...p.files.values()].reduce((sum, b) => sum + b.byteLength, bytes.length) > MAX_BUNDLE_BYTES - 1024 * 1024) throw new Error('组合后超过 256 MB，请先精简资产');
      const id = `object-${randomUUID()}`, path = `assets/${id}.${extension}`;
      const scene = structuredClone(p.scene);
      scene.assets[id] = { path, type: kind, provenance: 'imported', metersPerUnit: 1, scaleStatus: 'unknown' };
      scene.nodes.push({ id, name, parent: null, kind, asset: id, interaction: 'inspect', description: '独立导入的物品，位置与尺度需人工确认。', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 } });
      p.scene = parseScene(scene); p.files.set(path, new Uint8Array(bytes)); added.add(id); dirty = true;
    } else if (url.pathname === '/api/update') {
      const p = requireProject(); const input = JSON.parse((await body(req, 65536)).toString('utf8'));
      const next = structuredClone(p.scene), node = next.nodes.find(n => n.id === input.id);
      if (!node || !added.has(node.id) || !node.asset) throw new Error('本入口只编辑本次新增物品');
      node.name = input.name; node.description = input.description;
      node.transform.position = vector(input.position, '位置');
      node.transform.rotation = vector(input.rotation, '旋转').map(v => v * Math.PI / 180) as [number, number, number];
      node.transform.scale = number(input.scale, '比例');
      const units = number(input.metersPerUnit, '单位');
      if (![1, 0.01, 0.001].includes(units)) throw new Error('请选择米、厘米或毫米');
      next.assets[node.asset].metersPerUnit = units;
      next.assets[node.asset].scaleStatus = input.scaleConfirmed === true ? 'user-confirmed' : 'unknown';
      p.scene = parseScene(next); dirty = true;
    } else if (url.pathname === '/api/remove') {
      const p = requireProject(); const input = JSON.parse((await body(req, 65536)).toString('utf8'));
      const node = p.scene.nodes.find(n => n.id === input.id);
      if (!node || !added.has(node.id) || !node.asset) throw new Error('只可移除本次新增物品');
      const path = p.scene.assets[node.asset].path;
      p.scene.nodes = p.scene.nodes.filter(n => n.id !== node.id); delete p.scene.assets[node.asset]; p.files.delete(path);
      added.delete(node.id); removed.add(node.id); dirty = true;
    } else if (url.pathname === '/api/export') {
      const p = requireProject(); const input = JSON.parse((await body(req, 65536)).toString('utf8'));
      if (added.size && input.background !== 'clean' && input.background !== 'retained') throw new Error('请明确背景是否仍包含这些物品');
      const next: RoomScene = structuredClone(p.scene);
      next.parentRevision = next.revision; next.revision = randomUUID(); next.reconstruction_status = 'unverified';
      next.warnings = [...new Set([...(next.warnings ?? []), '本版为人工组装；位置、尺度及外观尚待用户查看。', ...(added.size && input.background === 'retained' ? ['背景保留了原物品外观；拿起独立物品后仍可能看到重影，需要干净背景重建。'] : [])])];
      const bytes = packScene(next, p.files);
      const folder = resolve(outputRoot, next.revision); await mkdir(folder, { recursive: true });
      await writeFile(resolve(folder, 'scene.room.zip'), bytes, { flag: 'wx' });
      await writeFile(resolve(folder, 'assembly.json'), JSON.stringify({ version: 1, sceneId: next.id, captureId: next.captureId, revision: next.revision, parentRevision: next.parentRevision, createdAt: new Date().toISOString(), added: [...added], removed: [...removed], background: input.background ?? 'unchanged', status: 'assembled-not-reviewed' }, null, 2), { flag: 'wx' });
      p.scene = next; dirty = false;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="assembled.room.zip"');
      res.end(bytes); return;
    } else { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(status()));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : '操作失败，原始文件未覆盖' }));
  } finally { if (ownsBusy) busy = false; }
});
server.requestTimeout = 300000;
server.on('error', error => { console.error('无法打开物品工作台：', error.message); process.exitCode = 1; });
server.listen(4320, '127.0.0.1', () => console.log(`物品工作台：${origin}（关闭此窗口结束；独立于当前生成任务）`));
