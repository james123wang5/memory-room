import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { unpackScene, packScene, MAX_BUNDLE_BYTES } from '../packages/scene/src/bundle';
import { providerCatalog, reconstructionRequestSchema } from '../packages/scene/src/providers';

const root = resolve(import.meta.dirname, '../data/projects');
const library = resolve(root, 'library');
const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const keyFor = (id: string) => createHash('sha256').update(id).digest('hex');
const keyValid = (key: string) => /^[a-f0-9]{64}$/.test(key);
type Snapshot = { key: string; snapshot: string; sceneId: string; revision: string; title: string; createdAt: string; nodes: number; memories: number; source: string };
async function json(path: string) { return JSON.parse(await readFile(path, 'utf8')); }
async function optional(path: string) { try { return await json(path); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw e; } }
async function atomic(path: string, data: string | Uint8Array) {
  const temporary = `${path}.${randomUUID()}.tmp`; await writeFile(temporary, data, { flag: 'wx' }); await rename(temporary, path);
}
async function body(req: IncomingMessage, limit: number) {
  if (Number(req.headers['content-length'] ?? 0) > limit) throw new Error('内容超过当前容量');
  const parts: Buffer[] = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw new Error('内容超过当前容量'); parts.push(chunk); }
  return Buffer.concat(parts);
}
class LibraryService {
  private writing = false;
  async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    // Leave the original reconstruction job routes to captureJobs.
    if (!(url.pathname === '/api/projects/current' || url.pathname.startsWith('/api/library') ||
          url.pathname === '/api/reconstruction/providers' || url.pathname === '/api/reconstruction/requests')) return false;
    const send = (status: number, value: unknown) => res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(JSON.stringify(value));
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? '') || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) { send(403, { error: '请使用本机工作台' }); return true; }
    if (req.method !== 'GET' && req.headers['x-memoryroom-local'] !== '1') { send(403, { error: '缺少本机请求标记' }); return true; }
    let ownLock = false;
    const stream = async (path: string, head?: string) => {
      const info = await stat(path);
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'Content-Disposition': 'attachment; filename="memoryroom.room.zip"', ...(head ? { 'X-MemoryRoom-Head': head } : {}) });
      const file = createReadStream(path); file.on('error', () => res.destroy()); file.pipe(res);
    };
    try {
      if (url.pathname === '/api/reconstruction/providers' && req.method === 'GET') { send(200, providerCatalog); return true; }
      if (url.pathname === '/api/reconstruction/requests' && req.method === 'POST') {
        const draft = reconstructionRequestSchema.parse(JSON.parse((await body(req, 32768)).toString('utf8')));
        if (this.writing) { send(409, { error: '另一个保存正在完成，请稍后重试' }); return true; }
        this.writing = ownLock = true;
        const dir = resolve(root, '../processed/reconstruction-requests'); await mkdir(dir, { recursive: true });
        const request = { ...draft, id: randomUUID(), status: 'draft', createdAt: new Date().toISOString(), message: '仅保存接入计划，尚未提交或启动生成' };
        await atomic(resolve(dir, `${request.id}.json`), JSON.stringify(request, null, 2)); send(201, request); return true;
      }
      if (url.pathname === '/api/reconstruction/requests' && req.method === 'GET') {
        const dir = resolve(root, '../processed/reconstruction-requests'), drafts = [];
        for (const name of await readdir(dir).catch(() => [])) if (name.endsWith('.json') && uuid.test(name.slice(0,-5))) drafts.push(await json(resolve(dir,name)));
        send(200, drafts.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,100)); return true;
      }
      if (url.pathname === '/api/library' && req.method === 'GET') {
        const spaces: Snapshot[] = [];
        for (const key of await readdir(library).catch((e: NodeJS.ErrnoException) => { if (e.code === 'ENOENT') return []; throw e; })) {
          if (keyValid(key)) { const head = await optional(resolve(library,key,'head.json')); if (head) spaces.push(head); }
        }
        send(200, spaces.sort((a,b) => b.createdAt.localeCompare(a.createdAt))); return true;
      }
      if (url.pathname === '/api/projects/current' && req.method === 'GET') {
        const pointer = await optional(resolve(root,'current-pointer.json'));
        if (pointer) {
          if (!keyValid(pointer.key) || !uuid.test(pointer.snapshot)) throw new Error('当前空间记录损坏，请从空间库恢复版本');
          const head = await json(resolve(library,pointer.key,'head.json'));
          await stream(resolve(library,pointer.key,`${pointer.snapshot}.room.zip`),head.snapshot);
        } else await stream(resolve(root,'current.room.zip'));
        return true;
      }
      if (url.pathname === '/api/projects/current' && req.method === 'PUT') {
        if (this.writing) { send(409, { error: '另一个保存正在完成，请稍后重试' }); return true; }
        this.writing = ownLock = true;
        const data = unpackScene(new Uint8Array(await body(req, MAX_BUNDLE_BYTES + 1024*1024))), scene = data.scene;
        const key = keyFor(scene.id), dir = resolve(library,key); await mkdir(dir, { recursive:true });
        const head: Snapshot | undefined = await optional(resolve(dir,'head.json'));
        if ((req.headers['x-memoryroom-base'] ?? 'none') !== (head?.snapshot ?? 'none')) {
          send(409, { error: '此空间已有更新版本。先导出当前编辑作为备份，再从空间库重新打开；也可另存为新空间。没有覆盖已有版本。' }); return true;
        }
        scene.revision ??= randomUUID();
        const record: Snapshot = { key, snapshot: randomUUID(), sceneId: scene.id, revision: scene.revision, title: scene.title,
          createdAt: new Date().toISOString(), nodes: scene.nodes.length, memories: (scene.memories ?? []).length, source: scene.source };
        await atomic(resolve(dir, `${record.snapshot}.room.zip`), packScene(scene, data.files));
        await atomic(resolve(dir, `${record.snapshot}.json`), JSON.stringify(record));
        await atomic(resolve(dir,'head.json'), JSON.stringify(record));
        await atomic(resolve(root,'current-pointer.json'), JSON.stringify({ key, snapshot: record.snapshot }));
        send(200, { saved:true, ...record }); return true;
      }
      const match = url.pathname.match(/^\/api\/library\/([a-f0-9]{64})(?:\/(revisions|[a-f0-9-]+))?$/);
      if (match && req.method === 'GET') {
        const [, key, action] = match, dir = resolve(library,key), head: Snapshot = await json(resolve(dir,'head.json'));
        if (action === 'revisions') {
          const list: Snapshot[] = [];
          for (const name of await readdir(dir)) if (name.endsWith('.json') && uuid.test(name.slice(0,-5))) list.push(await json(resolve(dir,name)));
          send(200, list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
        } else {
          const snapshot = action ?? head.snapshot; if (!uuid.test(snapshot)) throw new Error('版本编号无效');
          await stream(resolve(dir,`${snapshot}.room.zip`),head.snapshot);
        }
        return true;
      }
      send(404,{error:'没有此本地接口'});
    } catch (e) {
      if (!res.headersSent) send((e as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 400,{error:e instanceof Error ? e.message : '读取或保存未完成，旧版本仍保留'});
    } finally { if (ownLock) this.writing = false; }
    return true;
  }
}
const shared = globalThis as typeof globalThis & { memoryRoomLibrary?: LibraryService };
export const libraryService = shared.memoryRoomLibrary ??= new LibraryService();
