import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, open, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const root = resolve(import.meta.dirname, '..');
const archiveRoot = resolve(root, 'data/raw/capture-imports');
const jobRoot = resolve(root, 'data/processed/jobs');
const MAX_UPLOAD = 1024 * 1024 * 1024;
export const validJobId = (id: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
const terminal = (s: string) => ['ready', 'needs_rescan', 'failed', 'cancelled', 'interrupted'].includes(s);
type Status = { id: string; status: string; message: string; progress: number; issues?: string[]; pid?: number; profile?: string; updated_at?: number };
type Source = { archiveId: string; profile: 'quick' | 'standard'; retryOf?: string };
const alive = (pid?: number) => {
  if (!pid || !Number.isSafeInteger(pid) || pid <= 1) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
};

class CaptureJobs {
  private active?: string;
  private child?: ChildProcess;
  private async set(id: string, status: string, message: string, progress: number) {
    const folder = resolve(jobRoot, id);
    await mkdir(folder, { recursive: true });
    const temp = resolve(folder, `${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify({ id, status, message, progress, updated_at: Date.now()/1000 }));
    await rename(temp, resolve(folder, 'status.json'));
  }
  private async status(id: string): Promise<Status> {
    if (!validJobId(id)) throw new Error('无效任务编号');
    let value = JSON.parse(await readFile(resolve(jobRoot, id, 'status.json'), 'utf8')) as Status;
    if (!terminal(value.status) && this.active !== id && !alive(value.pid)) {
      await this.set(id, 'interrupted', '上次任务已中断，原始采集保留，可重新生成', value.progress);
      value = JSON.parse(await readFile(resolve(jobRoot, id, 'status.json'), 'utf8'));
    }
    return { ...value, id };
  }
  private async running(): Promise<string | undefined> {
    if (this.active) return this.active;
    await mkdir(jobRoot, { recursive: true });
    for (const id of await readdir(jobRoot)) {
      if (!validJobId(id)) continue;
      try { if (!terminal((await this.status(id)).status)) return id; } catch { /* Older incomplete folders remain preserved. */ }
    }
  }
  private async launch(id: string, source: Source) {
    if (!validJobId(source.archiveId)) throw new Error('采集来源编号无效');
    await writeFile(resolve(jobRoot, id, 'source.json'), JSON.stringify(source));
    const latest = resolve(jobRoot, `${id}.latest.tmp`);
    await writeFile(latest, id); await rename(latest, resolve(jobRoot, 'latest.txt'));
    const archive = resolve(archiveRoot, `${source.archiveId}.capture.zip`);
    this.child = spawn(resolve(root, '.venv/bin/python'), [resolve(root, 'tools/automatic_reconstruction.py'),
      archive, resolve(jobRoot, id), '--node', process.execPath, '--profile', source.profile], { cwd: root, stdio: 'ignore' });
    const child = this.child;
    child.once('error', () => {
      void this.set(id, 'failed', '本地生成程序无法启动，请检查项目 Python 环境', 0).finally(() => {
        if (this.active === id) { this.active = undefined; this.child = undefined; }
      }).catch(console.error);
    });
    child.once('exit', code => {
      void (async () => {
        try {
          const state = await this.status(id);
          if (!terminal(state.status)) await this.set(id, 'interrupted', `生成任务停止（${code ?? '中断'}），可以重试`, state.progress);
        } finally {
          if (this.active === id) { this.active = undefined; this.child = undefined; }
        }
      })().catch(console.error);
    });
  }
  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const parsed = new URL(req.url ?? '/', 'http://127.0.0.1');
    const url = parsed.pathname;
    if (!url.startsWith('/api/reconstruction')) return false;
    const send = (code: number, value: unknown) => res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(value));
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) { send(403, { error: '只接受本机工作台请求' }); return true; }
    if (req.method === 'POST' && req.headers['x-memoryroom-local'] !== '1') { send(403, { error: '缺少本地请求标记' }); return true; }
    try {
      if (url === '/api/reconstruction' && req.method === 'POST') {
        const running = await this.running();
        if (running) { send(409, { error: '已有生成任务，请等待或先停止', id: running }); return true; }
        if (Number(req.headers['content-length'] ?? 0) > MAX_UPLOAD) { send(413, { error: '单次采集包上限 1 GB' }); return true; }
        // Reserve ownership before any further I/O. running() may have yielded.
        if (this.active) { send(409, { error: '已有任务正在导入' }); return true; }
        const id = randomUUID(); this.active = id;
        try {
          await mkdir(archiveRoot, { recursive: true });
          await this.set(id, 'importing', '正在保存采集包', 2);
          const temporary = resolve(archiveRoot, `${id}.partial`), archive = resolve(archiveRoot, `${id}.capture.zip`);
          const file = await open(temporary, 'wx'); let size = 0;
          try {
            for await (const chunk of req) {
              size += chunk.length;
              if (size > MAX_UPLOAD) throw new Error('采集包超过 1 GB，上次空间未改动');
              await file.writeFile(chunk);
            }
          } finally { await file.close(); }
          if (size < 4) throw new Error('采集包为空');
          await rename(temporary, archive);
          await this.launch(id, { archiveId: id, profile: parsed.searchParams.get('profile') === 'quick' ? 'quick' : 'standard' });
          send(202, { id });
        } catch (error) {
          this.active = undefined;
          await this.set(id, 'failed', error instanceof Error ? error.message : '导入中断', 0);
          throw error;
        }
      } else if (url === '/api/reconstruction/latest' && req.method === 'GET') {
        const id = (await readFile(resolve(jobRoot, 'latest.txt'), 'utf8')).trim(); send(200, await this.status(id));
      } else if (url === '/api/reconstruction/history' && req.method === 'GET') {
        await mkdir(jobRoot, { recursive: true });
        const jobs: Status[] = [];
        for (const id of await readdir(jobRoot)) if (validJobId(id)) {
          try { jobs.push(await this.status(id)); } catch { /* Preserve unreadable historical folders. */ }
        }
        jobs.sort((a, b) => (b.updated_at ?? 0)-(a.updated_at ?? 0));
        send(200, jobs.slice(0, 30));
      } else {
        const match = url.match(/^\/api\/reconstruction\/([^/]+)(\/(?:result|cancel|retry|report))?$/);
        if (!match || !validJobId(match[1])) { send(404, { error: '没有这个任务' }); return true; }
        const [, id, action] = match;
        if (req.method === 'GET' && !action) send(200, await this.status(id));
        else if (req.method === 'GET' && action === '/result') {
          if ((await this.status(id)).status !== 'ready') { send(409, { error: '预览尚未生成' }); return true; }
          const bytes = await readFile(resolve(jobRoot, id, 'result.room.zip'));
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Cache-Control': 'no-store' }).end(bytes);
        } else if (req.method === 'POST' && action === '/cancel') {
          const state = await this.status(id);
          if (!terminal(state.status)) await writeFile(resolve(jobRoot, id, 'cancel.request'), 'cancel');
          send(202, { stopping: !terminal(state.status) });
        } else if (req.method === 'POST' && action === '/retry') {
          if (!terminal((await this.status(id)).status)) { send(409, { error: '请先停止当前任务' }); return true; }
          if (await this.running() || this.active) { send(409, { error: '已有生成任务，请等待结束' }); return true; }
          let source: Source;
          try { source = JSON.parse(await readFile(resolve(jobRoot, id, 'source.json'), 'utf8')); }
          catch { source = { archiveId: id, profile: 'standard' }; }
          if (!validJobId(source.archiveId)) throw new Error('原始采集来源无效，请重新导入保留的采集包');
          const next = randomUUID(); this.active = next;
          try {
            await this.set(next, 'importing', '使用保留的原始采集重新生成', 2);
            await this.launch(next, { ...source, retryOf: id, profile: parsed.searchParams.get('profile') === 'quick' ? 'quick' : 'standard' });
            send(202, { id: next });
          } catch (error) { this.active = undefined; await this.set(next, 'failed', '重新生成未启动，原始文件保留', 0); throw error; }
        } else if (req.method === 'GET' && action === '/report') {
          const state = await this.status(id);
          let input: unknown = null;
          try { input = JSON.parse(await readFile(resolve(jobRoot, id, 'input-summary.json'), 'utf8')); } catch { /* Import may have failed early. */ }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="memoryroom-${id}.json"`, 'Cache-Control': 'no-store' })
            .end(JSON.stringify({ job: state, input, note: '处理记录；没有进行自动画质评测。原始素材与日志保存在本机。' }, null, 2));
        } else send(405, { error: '操作不支持' });
      }
    } catch (error) {
      if (!res.headersSent) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') send(404, { error: '没有这个任务或原始文件，请确认移动硬盘已连接' });
        else send(500, { error: error instanceof Error ? error.message : '本机处理失败' });
      }
    }
    return true;
  }
}
const shared = globalThis as typeof globalThis & { memoryRoomCaptureJobs?: CaptureJobs };
export const captureJobs = shared.memoryRoomCaptureJobs ??= new CaptureJobs();
