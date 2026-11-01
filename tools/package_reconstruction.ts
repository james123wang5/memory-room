/** Package a trained room splat and real capture viewpoint. Raw data stays separate. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parseScene } from '../packages/scene/src/schema';
import { packScene } from '../packages/scene/src/bundle';

const [modelPath, sessionPath, outputPath] = process.argv.slice(2);
if (!modelPath || !sessionPath || !outputPath) throw new Error('需要：模型.ply session.json 输出.room.zip');
const capture = JSON.parse(await readFile(resolve(sessionPath), 'utf8'));
if (capture.source !== 'arkit' || capture.simulated !== false || capture.camera_axes !== 'opengl') {
  throw new Error('仅接受明确标记的真实 ARKit / OpenGL 采集');
}
const frame = capture.frames.find((f: { segment: string }) => f.segment === 'room');
if (!frame) throw new Error('采集中没有房间片段');
const matrix: number[][] = frame.camera_to_world;
const position = [matrix[0][3], matrix[1][3], matrix[2][3]];
const target = position.map((p, i) => p - matrix[i][2] * 1.5);
const scene = parseScene({ version: 1, id: capture.space_id ?? `capture-${capture.id}`, title: capture.title || '我的空间',
  source: 'user-capture', units: 'meter', coordinates: 'right-handed-y-up', view: { position, target },
  captureId: capture.id, revision: crypto.randomUUID(), reconstruction_status: 'preview-ready',
  warnings: capture.warnings ?? [],
  assets: { room: { path: 'assets/room.ply', type: 'splat', provenance: 'captured', captureId: capture.id, metersPerUnit: 1, scaleStatus: 'capture-metric' } },
  nodes: [{ id: 'captured-room', name: '我的房间 · 重建预览', kind: 'splat', asset: 'room',
    interaction: 'static', description: '来自 iPhone 的静态空间采集，由本机 Brush 生成。物品仍属于背景，尚未进行分离。拖动环绕、滚轮缩放，点击画面后可用 WASD 移动；初始视角返回采集位置。生成效果由你查看，满意后保存。' }] });
const bytes = new Uint8Array(await readFile(resolve(modelPath)));
await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), packScene(scene, new Map([['assets/room.ply', bytes]])), { flag: 'wx' });
console.log(`已生成真实房间项目包：${resolve(outputPath)}（${(bytes.length / 1024 / 1024).toFixed(1)} MB 模型）`);
