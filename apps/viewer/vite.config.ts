import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { captureJobs } from '../../tools/capture_jobs.ts';
import { macJobs } from '../../tools/mac-reconstruction/jobs';
import { libraryService } from '../../tools/library';

const localStore = (): Plugin => {
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      if (await libraryService.handle(req, res)) return;
      if (await macJobs.handle(req, res)) return;
      if (await captureJobs.handle(req, res)) return;
      if (req.url === '/api/health') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ name: 'memoryroom', version: '0.6.0' })); return; }
      next();
    } catch (error) {
      console.error('Local workspace request:', error);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({error:'本机请求未完成，请检查硬盘连接；旧版本仍保留'}));
      else res.destroy();
    }
  };
  return { name: 'memoryroom-local-store',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
};
export default defineConfig({
  plugins: [localStore()],
  server: { fs: { allow: [resolve(import.meta.dirname, '../..')] } },
  build: { chunkSizeWarningLimit: 6500 },
});
