import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = 'http://127.0.0.1:4317/';
const openBrowser = () => {
  if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore' });
  else console.log(`请打开 ${url}`);
};
async function healthy() {
  try { const r = await fetch(`${url}api/health`, { signal: AbortSignal.timeout(1500) }); return (await r.json()).name === 'memoryroom'; }
  catch { return false; }
}
if (await healthy()) { openBrowser(); process.exit(0); }
if (!existsSync(resolve(root, 'node_modules/vite/bin/vite.js'))) {
  console.error('首次运行请在项目目录执行 npm install。依赖缓存会保存在移动硬盘。'); process.exit(1);
}
const child = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'apps/viewer', '--host', '127.0.0.1', '--port', '4317', '--strictPort'], { cwd: root, stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => child.kill('SIGTERM'));
for (let i = 0; i < 30; i++) {
  if (await healthy()) { openBrowser(); break; }
  await new Promise(r => setTimeout(r, 300));
}
