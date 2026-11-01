import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { packScene, MAX_BUNDLE_BYTES } from '../../packages/scene/src/bundle';
import { parseScene } from '../../packages/scene/src/schema';

// Standard binary PLY only. Other formats stay available through the existing importer.
function framing(bytes: Buffer) {
  const headerEnd = bytes.indexOf(Buffer.from('end_header\n'));
  if (headerEnd < 0 || headerEnd > 65536) throw new Error('请在 OOOSplat 导出标准 binary little-endian 高斯 PLY');
  const header = bytes.toString('ascii', 0, headerEnd + 11);
  if (!header.startsWith('ply\n') || !header.includes('format binary_little_endian 1.0')) throw new Error('此入口需要标准 binary little-endian PLY；压缩格式请先在 OOOSplat 转为标准 PLY');
  const count = Number(header.match(/element vertex (\d+)/)?.[1]);
  const properties: { name: string; offset: number; type: string }[] = []; let stride = 0, vertices = false;
  const sizes: Record<string, number> = { char: 1, uchar: 1, int8: 1, uint8: 1, short: 2, ushort: 2, int16: 2, uint16: 2, int: 4, uint: 4, int32: 4, uint32: 4, float: 4, float32: 4, double: 8, float64: 8 };
  for (const line of header.split('\n')) {
    if (line.startsWith('element ')) vertices = line.startsWith('element vertex ');
    if (vertices && line.startsWith('property ')) {
      const [, type, name] = line.trim().split(/\s+/);
      if (!sizes[type]) throw new Error('不支持此 PLY 属性布局');
      properties.push({ name, offset: stride, type }); stride += sizes[type];
    }
  }
  if (!Number.isSafeInteger(count) || count < 1 || !stride || headerEnd + 11 + count * stride > bytes.length) throw new Error('PLY 不完整，不能作为房间模型导入');
  const required = ['scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3','opacity','f_dc_0','f_dc_1','f_dc_2'];
  if (required.some(name => !properties.some(p => p.name === name))) throw new Error('模型缺少标准高斯属性，请选择 OOOSplat 导出的标准高斯 PLY');
  const xyz = ['x', 'y', 'z'].map(name => {
    const p = properties.find(p => p.name === name); if (!p || !['float', 'float32', 'double', 'float64'].includes(p.type)) throw new Error('高斯模型缺少坐标'); return p;
  });
  const samples: number[][] = [[], [], []];
  for (let i = 0; i < count; i += Math.max(1, Math.ceil(count / 8192))) {
    const v = xyz.map(p => p.type.startsWith('double') || p.type === 'float64' ? bytes.readDoubleLE(headerEnd + 11 + i * stride + p.offset) : bytes.readFloatLE(headerEnd + 11 + i * stride + p.offset));
    if (v.every(Number.isFinite)) v.forEach((value, axis) => samples[axis].push(value));
  }
  if (!samples[0].length) throw new Error('模型没有可用于显示的有限坐标');
  // Robust framing avoids flying the initial camera out to isolated floaters.
  const bounds = samples.map(values => { values.sort((a, b) => a-b); return [values[Math.floor(values.length * 0.02)], values[Math.min(values.length-1, Math.floor(values.length * 0.98))]]; });
  return { center: bounds.map(([a, b]) => (a+b)/2), radius: Math.max(0.5, Math.hypot(...bounds.map(([a, b]) => b-a))/2), count };
}
export async function packageModel(work: string, model: string) {
  const handoff = JSON.parse(await readFile(resolve(work, 'handoff.json'), 'utf8'));
  const info = await stat(model);
  if (!info.isFile() || info.size > MAX_BUNDLE_BYTES - 1024 * 1024) throw new Error('模型超出当前容量或不是文件；请保留原件并导出较小的标准高斯 PLY');
  const bytes = await readFile(model);
  if (bytes.length > MAX_BUNDLE_BYTES - 1024 * 1024) throw new Error('模型超过当前 256 MB 项目包容量。原模型保留；请在 OOOSplat 裁掉无用范围并导出较小的标准 PLY，再导回');
  const bounds = framing(bytes), revision = randomUUID(), asset = 'assets/room.ply';
  const scene = parseScene({ version: 2, id: handoff.space_id, title: handoff.title,
    source: 'user-capture', units: 'meter', coordinates: 'right-handed-y-up', captureId: handoff.capture_id,
    revision, reconstruction_status: 'unverified',
    warnings: ['OOOSplat / COLMAP 输出的尺度和朝向尚未配准到 ARKit；请先确认方向与实际尺寸，不能直接把模型坐标当作真实米数。', '导入完成不代表画质合格；原始采集与模型保留。'],
    view: { position: [bounds.center[0], bounds.center[1] + bounds.radius * 0.6, bounds.center[2] + bounds.radius * 2.2], target: bounds.center },
    assets: { room: { path: asset, type: 'splat', provenance: 'imported', captureId: handoff.capture_id, scaleStatus: 'unknown' } },
    nodes: [{ id: 'captured-room', name: '我的空间 · OOOSplat 重建', kind: 'splat', asset: 'room', interaction: 'static',
      description: '来自原始手机照片的外部重建模型。尺度与朝向待确认。物品仍属于背景，独立物品需另行建模。' }] });
  const temporary = resolve(work, `${revision}.room.zip`);
  await writeFile(temporary, packScene(scene, new Map([[asset, new Uint8Array(bytes)]])), { flag: 'wx' });
  // Keep every returned model as a revision; the active project is never overwritten here.
  await writeFile(resolve(work, 'latest-result.tmp'), JSON.stringify({ filename: `${revision}.room.zip`, revision, splats: bounds.count }));
  await rename(resolve(work, 'latest-result.tmp'), resolve(work, 'latest-result.json'));
  return { revision, splats: bounds.count };
}
