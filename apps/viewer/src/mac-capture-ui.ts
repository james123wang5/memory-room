/// <reference types="vite/client" />
type Job = { id: string; status: string; title?: string; message: string; frames?: number; issues?: string[]; input_path?: string; remote_task_id?: string; remote?: { stage?: string; progress?: number; current?: number; total?: number; unit?: string }; elapsed_seconds?: number; eta_seconds?: number };
const esc = (s: string) => s.replace(/[&<>"']/g, c => (({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string, string>)[c]!));
const base = '/api/mac-reconstruction';
export function setupMacCapture(openResult: (bytes: Uint8Array) => Promise<void>) {
  const dialog = document.createElement('dialog'); dialog.id = 'mac-capture-dialog'; dialog.style.width = 'min(820px, calc(100vw - 32px))';
  dialog.innerHTML = `<div class="dialog-heading"><div><span class="eyebrow">PHONE → MAC → YOUR ROOM</span><h2>手机采集 · Mac 重建</h2></div><button id="mac-close" class="icon-button" aria-label="关闭">×</button></div>
    <p class="muted">先保留原始照片，再让 OOOSplat 重新配准相机并生成空间。导回后由你查看，满意再保存。</p>
  <form id="mac-upload"><label>手机采集包<input id="mac-file" type="file" accept=".capture.zip,.zip" required></label><button class="primary" type="submit">整理照片，交给 Mac 重建</button></form>
  <p class="small muted">采集包上限 8 GB；原始照片保留尺寸和文件内容。首次需安装 <a href="https://github.com/ooolabdev/ooosplat/releases" target="_blank" rel="noopener">OOOSplat 的 Mac Apple Silicon 版本</a>（macOS 15+）。</p>
  <p id="mac-feedback" class="small" role="status" hidden></p><div id="mac-current"></div>
  <details><summary>本机重建记录</summary><button id="mac-refresh" class="secondary" type="button">刷新记录</button><div id="mac-history"></div></details>`;
  document.body.append(dialog);
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => dialog.querySelector<T>(`#${id}`)!;
  const sidebar = document.querySelector<HTMLButtonElement>('#capture-import')!;
  let job: Job | undefined, timer = 0, epoch = 0, busy = false, disposed = false, thumbPage = 0;
  let upload: XMLHttpRequest | undefined;
  const feedback = (text: string) => { $('mac-feedback').hidden = !text; $('mac-feedback').textContent = text; };
  const request = async (url: string, method = 'GET', body?: BodyInit) => {
    const response = await fetch(url, { method, body, headers: method === 'POST' ? { 'X-MemoryRoom-Local': '1' } : {} });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? '本机操作未完成');
    return response;
  };
  const active = (status: string) => ['uploading', 'preparing', 'external'].includes(status);
  const choose = (next: Job) => { epoch++; clearTimeout(timer); job = next; thumbPage = 0; render(); if (active(next.status) && dialog.open) void poll(); };
  const operation = async (fn: () => Promise<void>) => {
    if (busy) return; busy = true; clearTimeout(timer); feedback('');
    dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
    try { await fn(); } catch (error) { feedback(error instanceof Error ? error.message : '操作失败'); }
    finally { busy = false; dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = false); if (job) { render(); if (active(job.status) && dialog.open) timer = window.setTimeout(poll, 15000); } }
  };
  async function history() {
    const records: Job[] = await (await request(`${base}/history`)).json(); if (disposed) return;
    $('mac-history').replaceChildren();
    for (const record of records) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'history-item secondary';
      button.textContent = `${record.title ?? record.id.slice(0, 8)} · ${record.message}`;
      button.onclick = () => { if (!busy) { feedback(''); choose(record); } }; $('mac-history').append(button);
    }
    if (!job && records.length) choose(records[0]);
  }
  async function poll() {
    if (!job || busy || disposed || !dialog.open) return;
    const id = job.id, selected = epoch;
    try {
      const next: Job = await (await request(`${base}/${id}`)).json();
      if (disposed || selected !== epoch || busy) return;
      job = next; render(); if (active(next.status)) timer = window.setTimeout(poll, next.status === 'external' ? 15000 : 2500);
    } catch (error) { if (selected === epoch && !disposed) { feedback(error instanceof Error ? error.message : '暂时无法读取进度'); timer = window.setTimeout(poll, 15000); } }
  }
  function render() {
    if (!job || disposed) return;
    const current = job, id = current.id;
    sidebar.textContent = current.status === 'ready' ? 'Mac 模型已导回 · 查看' : '手机采集 · Mac 重建';
    const prepared = !!current.input_path;
    $('mac-current').innerHTML = `<section class="capture-job"><h3>${esc(current.message)}</h3>
    ${current.frames ? `<p>已保留 ${current.frames} 个空间视角 · 原始尺寸</p>` : ''}
    ${current.elapsed_seconds != null ? `<p class="small muted">OOOSplat 已运行约 ${Math.floor(current.elapsed_seconds/60)} 分钟${current.eta_seconds != null ? ` · 应用估计剩余约 ${Math.ceil(current.eta_seconds/60)} 分钟` : ' · 暂无可靠剩余时间'}</p>` : ''}
    ${current.remote?.progress != null ? `<p class="small">当前阶段 ${esc(current.remote.stage ?? '')}：${Math.round(current.remote.progress)}%（不是整个任务百分比）</p>` : ''}
    ${current.issues?.length ? `<details><summary>采集记录与补拍建议（${current.issues.length}）</summary><ul>${current.issues.map(i => `<li>${esc(i)}</li>`).join('')}</ul></details>` : ''}
    ${prepared ? `<ol class="capture-steps"><li><strong>1. 查看原始照片与覆盖记录</strong><p>先确认拍到的范围。已发现表面覆盖率无法证明整间房都完整。</p><button id="mac-photos" class="secondary" type="button">查看照片</button> <a href="${base}/${id}/handoff" download="capture-handoff.json">下载采集记录</a><div id="mac-gallery"></div></li>
    <li><strong>2. 在 OOOSplat 重建</strong><p>选择普通图片，打开下方文件夹里的 images；询问顺序时选“已按拍摄顺序排列”。推荐先用均衡档，开启自动优化。</p><p class="small muted">输入目录：${esc(current.input_path!)}<br>项目保存到 Lexar / MemoryRoom / data / processed / ooosplat-projects。</p><button id="mac-folder" class="secondary" type="button">打开照片文件夹</button> <button id="mac-launch" class="secondary" type="button">打开 OOOSplat</button>
    <details><summary>从这里提交和读取进度（可选）</summary><p class="small">需要 OOOSplat 版本提供官方 MCP 本地接口。在其设置 → MCP 开启默认端口 39877，并授权本项目 data/processed/mac-reconstruction 输入目录；先把项目保存目录设置到本项目的 data/processed/ooosplat-projects。若安装包没有此设置，直接使用上面的文件夹方式。</p><button id="mac-start" class="secondary" type="button">${current.remote_task_id ? '恢复原任务连接' : '连接 OOOSplat 并开始均衡重建'}</button>${current.status === 'external' ? '<button id="mac-cancel" class="secondary" type="button">停止此重建任务</button>' : ''}</details></li>
    <li><strong>3. 导回模型</strong><p>选择此批照片生成的 final.ply，或从 OOOSplat 导出的标准高斯 PLY。此入口另存结果，不会自动覆盖当前房间。</p><input id="mac-model" type="file" accept=".ply"><button id="mac-import-model" class="secondary" type="button">导回所选模型</button>${current.status === 'external_ready' ? '<button id="mac-collect" class="primary" type="button">导回已完成的 OOOSplat 模型</button>' : ''}<p class="small muted">模型包暂限 256 MB；导回后仍需确认朝向与实际尺寸。独立物品和干净背景尚未自动生成。</p></li></ol>` : (current.status === 'failed' ? '<p class="small muted">整理没有完成，原件与任务目录中的 prepare.log 已保留。处理提示问题后，可重新导入采集包。</p>' : '<p class="small muted">正在整理时可以关闭此窗口；请保持工作台和移动硬盘连接。</p>')}
    ${current.status === 'ready' ? `<button id="mac-open-result" class="primary" type="button">打开新的空间预览</button> <a href="${base}/${id}/result" download>下载项目包</a>` : ''}
    <p class="small muted">时间预算：M1 Pro / 16 GB，局部先预留 1–3 小时，整屋 3–8 小时或更久。这是规划估算；实际随照片数量、配准和模型规模变化，不是完成承诺。</p></section>`;
    const startButton = dialog.querySelector<HTMLButtonElement>('#mac-start');
    if (startButton) startButton.disabled = !['prepared','external','external_stopped'].includes(current.status);
    const bind = (name: string, fn: () => Promise<void>) => dialog.querySelector(`#${name}`)?.addEventListener('click', () => void operation(fn));
    for (const name of ['folder','launch','start','cancel','collect']) bind(`mac-${name}`, async () => {
      const result = await (await request(`${base}/${id}/${name}`, 'POST')).json();
      if (result.id) job = result;
      if (name === 'folder') feedback('照片文件夹已打开。请选择其中的 images 文件夹。');
      if (name === 'launch') feedback('已请求打开 OOOSplat。请保持应用开启。');
    });
    bind('mac-import-model', async () => { const file = $<HTMLInputElement>('mac-model').files?.[0];
      if (!file || !file.name.toLowerCase().endsWith('.ply')) throw new Error('请选择该批照片生成的标准高斯 PLY');
      if (file.size > 255 * 1024 ** 2) throw new Error('模型超过当前容量，请在 OOOSplat 精简后导出标准 PLY');
      feedback('正在保存和整理模型…'); job = await (await request(`${base}/${id}/model`, 'POST', file)).json(); });
    bind('mac-open-result', async () => { const response = await request(`${base}/${id}/result`); await openResult(new Uint8Array(await response.arrayBuffer())); dialog.close(); });
    dialog.querySelector('#mac-photos')?.addEventListener('click', () => {
      if (!busy) void request(`${base}/${id}/handoff`).then(r => r.json()).then(data => {
        if (job?.id !== id || disposed) return;
        const display = () => {
          const gallery = dialog.querySelector<HTMLElement>('#mac-gallery'); if (!gallery) return;
          const list = data.frames.slice(thumbPage * 12, (thumbPage+1)*12);
          gallery.innerHTML = `<p class="small">第 ${thumbPage+1} / ${Math.ceil(data.frames.length/12)} 页 · 原片缩略图，仅供你查看</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${list.map((f: { index: number; name: string }) => `<figure style="margin:0"><img style="width:100%;height:90px;object-fit:contain" src="${base}/${id}/thumb?index=${String(f.index).padStart(6,'0')}" alt="原始照片 ${esc(f.name)}" loading="lazy"><figcaption class="small">${esc(f.name)}</figcaption></figure>`).join('')}</div><button id="mac-prev" type="button" class="secondary">上一页</button> <button id="mac-next" type="button" class="secondary">下一页</button>`;
          $<HTMLButtonElement>('mac-prev').disabled = thumbPage === 0; $<HTMLButtonElement>('mac-next').disabled = (thumbPage+1)*12 >= data.frames.length;
          $('mac-prev').onclick = () => { thumbPage--; display(); }; $('mac-next').onclick = () => { thumbPage++; display(); };
        }; display();
      }).catch(e => feedback(e.message));
    });
  }
  $('mac-upload').onsubmit = e => {
    e.preventDefault(); if (busy) return;
    const file = $<HTMLInputElement>('mac-file').files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.capture.zip')) { feedback('请选择手机导出的 .capture.zip'); return; }
    if (file.size > 8 * 1024 ** 3) { feedback('单次采集包上限 8 GB，请分区域采集'); return; }
    busy = true; epoch++; clearTimeout(timer); dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
    const xhr = upload = new XMLHttpRequest(); xhr.open('POST', base); xhr.setRequestHeader('X-MemoryRoom-Local', '1'); xhr.setRequestHeader('Content-Type', 'application/zip');
    const done = () => { upload = undefined; busy = false; dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = false); };
    xhr.upload.onprogress = event => feedback(`正在保存原始采集：${event.lengthComputable ? Math.round(event.loaded/event.total*100)+'%' : '传输中'}`);
    xhr.onload = () => { if (disposed) return; done(); try { const result = JSON.parse(xhr.responseText); if (xhr.status !== 202) throw new Error(result.error ?? '导入未完成'); choose({ id: result.id, status: 'preparing', message: '正在整理原始照片' }); feedback('原件已保存，尚未启动训练。'); } catch(e) { feedback(e instanceof Error ? e.message : '导入失败'); } };
    xhr.onerror = () => { if (disposed) return; done(); feedback('采集传输中断，请重新选择文件；已保存的原件不会覆盖。'); }; xhr.send(file);
  };
  sidebar.onclick = () => { dialog.showModal(); if (job) { render(); if (active(job.status)) void poll(); } void history().catch(e => feedback(e.message)); };
  $('mac-close').onclick = () => dialog.close(); dialog.addEventListener('close', () => clearTimeout(timer));
  $('mac-refresh').onclick = () => { if (!busy) void history().catch(e => feedback(e.message)); };
  import.meta.hot?.dispose(() => { disposed = true; clearTimeout(timer); upload?.abort(); dialog.remove(); });
}
