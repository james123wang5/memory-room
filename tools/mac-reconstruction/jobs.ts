import { spawn, type ChildProcess } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, open, readFile, readdir, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { OOOSplatClient } from './mcp';
import { packageModel } from './package';

const root = resolve(import.meta.dirname, '../..');
const jobsRoot = resolve(root, 'data/processed/mac-reconstruction');
const archivesRoot = resolve(root, 'data/raw/mac-imports');
const MAX_CAPTURE = 8 * 1024 ** 3;
const valid = (id: string) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);
const folder = (id: string) => { if (!valid(id)) throw new Error('无效任务编号'); return resolve(jobsRoot, id); };
async function save(id: string, values: object) {
  const dir = folder(id); let old = {};
  try { old = JSON.parse(await readFile(resolve(dir, 'status.json'), 'utf8')); } catch { /* new task */ }
  const next = { ...old, ...values, id, updated_at: Date.now()/1000 }, temp = resolve(dir, `${randomUUID()}.status.tmp`);
  await writeFile(temp, JSON.stringify(next)); await rename(temp, resolve(dir, 'status.json')); return next;
}
async function state(id: string): Promise<any> { return { ...JSON.parse(await readFile(resolve(folder(id), 'status.json'), 'utf8')), id }; }
async function within(path: string, base: string) {
  const a = await realpath(path), b = await realpath(base), rel = relative(b, a);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
async function receive(req: IncomingMessage, destination: string, limit: number) {
  if (Number(req.headers['content-length'] ?? 0) > limit) throw new Error('文件超过此入口容量');
  const file = await open(destination, 'wx'); let size = 0;
  try { for await (const chunk of req) { size += chunk.length; if (size > limit) throw new Error('文件超过此入口容量，未替换原件'); await file.writeFile(chunk); } }
  finally { await file.close(); }
  if (size < 16) throw new Error('文件为空或不完整');
}
async function client<T>(fn: (c: OOOSplatClient) => Promise<T>) {
  const c = new OOOSplatClient();
  try { await c.connect(); return await fn(c); }
  finally { await c.close(); }
}
class MacJobs {
  private mutations = new Set<string>();
  private children = new Map<string, ChildProcess>();
  private polls = new Map<string, Promise<any>>();
  private async poll(id: string) {
    const current = await state(id);
    if (!current.remote_task_id || current.status !== 'external' || Date.now()/1000 - (current.last_polled ?? 0) < 15) return current;
    if (this.polls.has(id)) return this.polls.get(id);
    const pending = (async () => {
      try {
        const task = await client(c => c.call('get_task_status', { task_id: current.remote_task_id }));
        const latest = await state(id);
        if (latest.status !== 'external' || this.mutations.has(id)) return latest;
        return await save(id, { status: task.status === 'completed' ? 'external_ready' : ['failed','cancelled','interrupted'].includes(task.status) ? 'external_stopped' : 'external',
          message: task.status === 'completed' ? 'OOOSplat 已生成，点击导回空间' : task.error?.message ?? `OOOSplat：${task.stage ?? task.status}`,
          last_polled: Date.now()/1000, remote: task, eta_seconds: task.eta_seconds ?? null, elapsed_seconds: typeof task.elapsed_ms === 'number' ? Math.floor(task.elapsed_ms/1000) : null });
      } catch (error) {
        const latest = await state(id);
        if (latest.status !== 'external' || this.mutations.has(id)) return latest;
        return await save(id, { last_polled: Date.now()/1000, message: '暂时无法读取 OOOSplat 进度。任务可能仍在应用内运行；重新打开连接后继续读取。' });
      }
    })().finally(() => this.polls.delete(id));
    this.polls.set(id, pending); return pending;
  }
  async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (!url.pathname.startsWith('/api/mac-reconstruction')) return false;
    const send = (code: number, value: unknown) => res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(value));
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? '') || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) { send(403, { error: '仅接受本机工作台请求' }); return true; }
    if (req.method === 'POST' && req.headers['x-memoryroom-local'] !== '1') { send(403, { error: '缺少本地请求标记' }); return true; }
    let mutation: string | undefined;
    try {
      await mkdir(jobsRoot, { recursive: true });
      if (url.pathname === '/api/mac-reconstruction/history' && req.method === 'GET') {
        const records = [];
        for (const id of await readdir(jobsRoot)) if (valid(id)) { try { records.push(await state(id)); } catch { /* preserve incomplete jobs */ } }
        records.sort((a, b) => b.updated_at-a.updated_at); send(200, records.slice(0, 30)); return true;
      }
      if (url.pathname === '/api/mac-reconstruction' && req.method === 'POST') {
        if (this.mutations.has('upload') || this.children.size) throw new Error('另一份素材正在整理，请稍后再导入');
        mutation = 'upload'; this.mutations.add(mutation);
        const id = randomUUID(), dir = folder(id); await mkdir(dir); await mkdir(archivesRoot, { recursive: true });
        await save(id, { status: 'uploading', message: '正在保存手机采集原件', created_at: Date.now()/1000 });
        try {
          const part = resolve(archivesRoot, `${id}.partial`), archive = resolve(archivesRoot, `${id}.capture.zip`);
          await receive(req, part, MAX_CAPTURE); await rename(part, archive);
          const log = await open(resolve(dir, 'prepare.log'), 'a');
          await save(id, { status: 'preparing', message: '正在保留原件并整理照片顺序、缩略图和采集记录' });
          try {
            const child = spawn(resolve(root, '.venv/bin/python'), [resolve(root, 'tools/mac-reconstruction/prepare.py'), archive, dir], { cwd: root, stdio: ['ignore', log.fd, log.fd] });
            this.children.set(id, child);
            child.once('error', () => { this.children.delete(id); void save(id, { status: 'failed', message: '无法启动素材整理，请检查项目 Python 环境；采集原件保留' }).catch(console.error); });
            child.once('exit', code => { this.children.delete(id); if (code) void state(id).then(s => s.status !== 'failed' ? save(id, { status: 'failed', message: '素材整理未完成，prepare.log 和原件已保留' }) : undefined).catch(console.error); });
          } finally { await log.close(); }
          send(202, { id });
        } catch (error) { await save(id, { status: 'failed', message: String(error) }); throw error; }
        return true;
      }
      const match = url.pathname.match(/^\/api\/mac-reconstruction\/([^/]+)(?:\/(folder|launch|start|cancel|collect|model|result|handoff|thumb))?$/);
      if (!match || !valid(match[1])) { send(404, { error: '没有这个任务' }); return true; }
      const [, id, action] = match, dir = folder(id);
      const current = await state(id);
      if (req.method === 'GET') {
        if (!action) send(200, await this.poll(id));
        else if (action === 'handoff') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(await readFile(resolve(dir, 'handoff.json')));
        } else if (action === 'thumb') {
          const index = url.searchParams.get('index') ?? ''; if (!/^\d{6}$/.test(index)) throw new Error('图片编号无效');
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private,max-age=3600' }).end(await readFile(resolve(dir, 'thumbs', `${index}.jpg`)));
        } else if (action === 'result') {
          const latest = JSON.parse(await readFile(resolve(dir, 'latest-result.json'), 'utf8'));
          if (!/^[a-f0-9-]+\.room\.zip$/.test(latest.filename)) throw new Error('结果文件名不兼容');
          const file = resolve(dir, latest.filename), info = await stat(file);
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': info.size, 'Content-Disposition': 'attachment; filename="ooosplat.room.zip"' });
          const stream = createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res);
        } else send(404, { error: '没有此读取操作' });
        return true;
      }
      if (req.method !== 'POST') { send(405, { error: '操作不支持' }); return true; }
      if (this.mutations.has(id)) throw new Error('此任务的上一个操作尚未结束');
      mutation = id; this.mutations.add(id);
      if (action === 'folder') {
        const input = resolve(dir, 'input'); await stat(input);
        spawn('open', [input], { stdio: 'ignore' }).on('error', () => {}); send(200, { path: input });
      } else if (action === 'launch') {
        let app: string | undefined;
        for (const candidate of [resolve(root, 'vendor/OOOSplat.app'), '/Volumes/Lexar/Applications/OOOSplat.app', '/Applications/OOOSplat.app']) {
          try { await stat(candidate); app = candidate; break; } catch { /* next known installation */ }
        }
        if (!app) throw new Error('尚未安装 OOOSplat。请从官方发行页安装 Mac Apple Silicon 版本；这个按钮不会自动下载或安装');
        spawn('open', [app], { stdio: 'ignore' }).on('error', () => {}); send(200, { opened: true });
      } else if (action === 'start') {
        if (!['prepared','external','external_stopped'].includes(current.status)) throw new Error('请先完成照片整理，或在 OOOSplat 中管理已经完成的任务');
        if (current.requires_general_matching && !current.remote_task_id) throw new Error('这批照片有换区或连续性未知。本机连接尚不能指定跨照片匹配，请打开照片文件夹，在 OOOSplat 选择普通无序图片/跨区域匹配；若版本不支持，请用可配置的 COLMAP 路线。');
        const input = resolve(dir, 'input/images');
        await client(async c => {
          if (current.remote_task_id) {
            const existing = await c.call('get_task_status', { task_id: current.remote_task_id });
            if (existing.status !== 'created') {
              await save(id, { status: existing.status === 'completed' ? 'external_ready' : ['failed','cancelled','interrupted'].includes(existing.status) ? 'external_stopped' : 'external', remote: existing, last_polled: 0, message: '已恢复原 OOOSplat 任务；未重新创建或训练' }); return;
            }
          }
          if (current.requires_general_matching) throw new Error('此草稿不能通过当前接口配置跨照片匹配，请在桌面应用中手动处理；没有启动训练');
          const app = await c.call('get_app_status', {});
          if (!app.can_start_task) throw new Error('OOOSplat 已有任务，先等待它结束；没有停止或替换其他任务');
          const allowed = await Promise.all((app.authorized_input_roots ?? []).map((p: string) => within(input, p).catch(() => false)));
          if (!allowed.some(Boolean)) throw new Error(`请在 OOOSplat 设置 → MCP 授权输入目录：${jobsRoot}，然后重试连接`);
          const task = current.remote_task_id ? await c.call('get_task_status', { task_id: current.remote_task_id }) : await c.call('create_generation_task', { input_path: input, quality: 'balanced', client_request_id: `memoryroom-${id}` });
          await save(id, { remote_task_id: task.task_id, remote: task });
          if (typeof task.projects_root !== 'string' || !await within(task.projects_root, root)) throw new Error(`请在 OOOSplat 将项目目录设置到 ${resolve(root, 'data/processed/ooosplat-projects')}。本次未启动；已创建的草稿保留其旧设置，请改用手动新建任务或新导入此采集`);
          const started = await c.call('start_task', { task_id: task.task_id });
          await save(id, { status: 'external', remote_task_id: task.task_id, remote_run_id: started.run_id, last_polled: 0, message: 'OOOSplat 已接手相机配准与重建；保持应用和硬盘连接' });
        });
        send(200, await state(id));
      } else if (action === 'cancel') {
        if (!current.remote_task_id) throw new Error('此任务尚未通过本机连接提交');
        await client(async c => { const task = await c.call('get_task_status', { task_id: current.remote_task_id });
          if (!['starting','running','cancelling'].includes(task.status) || !task.run_id) throw new Error('任务当前没有运行');
          await c.call('cancel_task', { task_id: task.task_id, run_id: task.run_id }); });
        await save(id, { last_polled: 0, message: '已请求停止此 OOOSplat 任务，原件保留' }); send(200, await state(id));
      } else if (action === 'collect' || action === 'model') {
        let model: string;
        if (action === 'collect') {
          if (!current.remote_task_id) throw new Error('手动生成的任务请直接选择导出的 PLY 文件');
          const task = await client(c => c.call('get_task_status', { task_id: current.remote_task_id }));
          if (task.status !== 'completed' || !task.result?.final_ply || task.project_deleted) throw new Error('OOOSplat 模型尚不可用');
          model = task.result.final_ply;
          if (!await within(model, root)) throw new Error('模型不在本项目目录内，请从 OOOSplat 手动导出并选择文件');
        } else {
          model = resolve(dir, `${randomUUID()}.ply`); await receive(req, model, 255 * 1024 ** 2);
        }
        const result = await packageModel(dir, model);
        await save(id, { status: 'ready', message: '模型已导回，请打开空间并确认方向、尺寸和画质', result }); send(200, await state(id));
      } else send(404, { error: '没有此操作' });
    } catch (error) {
      if (!res.headersSent) send(400, { error: error instanceof Error ? error.message : '操作失败，原件保留' });
    } finally { if (mutation) this.mutations.delete(mutation); }
    return true;
  }
}
const shared = globalThis as typeof globalThis & { memoryRoomMacJobs?: MacJobs };
export const macJobs = shared.memoryRoomMacJobs ??= new MacJobs();
