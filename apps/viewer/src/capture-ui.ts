/// <reference types="vite/client" />
type Job = { id: string; status: string; message: string; progress: number; issues?: string[]; elapsed_seconds?: number; iteration?: number; steps?: number; profile?: string; title?: string; updated_at?: number };
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function setupCaptureImport(openResult: (bytes: Uint8Array) => Promise<void>) {
  const dialog = document.createElement('dialog'); dialog.id = 'capture-dialog';
  dialog.innerHTML = `<form id="capture-import-form"><div class="dialog-heading"><div><span class="eyebrow">CAPTURE → YOUR ROOM</span><h2>旧链路与历史任务</h2></div><button type="button" id="close-capture" class="icon-button" aria-label="关闭采集导入">×</button></div><p class="muted">先在手机完成扫描并导出 .capture.zip，再选择文件。这里保留 ARKit 位姿直接重建的旧流程与历史结果。新采集建议使用“手机采集 · Mac 重建”。</p><label>采集包<input id="capture-file" type="file" accept=".zip" required /></label><label>生成方式<select id="capture-profile"><option value="standard">旧链路标准预览 · 使用 ARKit 位姿</option><option value="quick">快速预览 · 较少细节与计算量</option></select></label><p class="small muted">单次采集包上限 1 GB。第一批只生成静态空间，物品片段保留供后续使用。处理不上传云端，也不运行自动画质评测。</p><button id="start-reconstruction" class="primary" type="submit">保存采集并生成空间</button></form><p id="capture-feedback" class="small" role="status" hidden></p><div id="capture-job" class="capture-job" hidden aria-live="polite"></div><details class="capture-history"><summary>之前的生成任务</summary><button id="refresh-capture-history" class="secondary" type="button">刷新记录</button><div id="capture-history-list"></div></details>`;
  document.body.append(dialog);
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const panel = dialog.querySelector<HTMLDivElement>('#capture-job')!;
  const feedback = dialog.querySelector<HTMLElement>('#capture-feedback')!;
  const fileInput = dialog.querySelector<HTMLInputElement>('#capture-file')!;
  const profile = dialog.querySelector<HTMLSelectElement>('#capture-profile')!;
  const submit = dialog.querySelector<HTMLButtonElement>('#start-reconstruction')!;
  const sidebar = document.querySelector<HTMLButtonElement>('#legacy-capture-import')!;
  let job: Job | undefined, timer = 0, uploading = false, generation = 0, disposed = false;
  let upload: XMLHttpRequest | undefined;
  const terminal = (status: string) => ['ready', 'needs_rescan', 'failed', 'cancelled', 'interrupted'].includes(status);
  const message = (text: string) => { feedback.hidden = !text; feedback.textContent = text; };
  const errorText = (error: unknown) => error instanceof Error ? error.message : '操作未完成';
  const api = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error ?? `请求未完成（${response.status}）`);
    }
    return response;
  };
  const post = (url: string) => api(url, { method: 'POST', headers: { 'X-MemoryRoom-Local': '1' } });
  const choose = (next: Job) => {
    generation++; clearTimeout(timer); job = next; render();
    if (!terminal(next.status)) void poll();
  };
  const loadHistory = async () => {
    try {
      const jobs: Job[] = await (await api('/api/reconstruction/history')).json();
      if (disposed) return;
      const list = dialog.querySelector<HTMLElement>('#capture-history-list')!;
      list.replaceChildren();
      if (!jobs.length) { list.textContent = '还没有生成任务'; return; }
      for (const item of jobs) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'history-item secondary';
        button.textContent = `${item.title ?? item.id.slice(0, 8)} · ${item.message}`;
        button.onclick = () => {
          if (uploading) { message('请等待当前采集包保存完成'); return; }
          choose(item); message('');
        };
        list.append(button);
      }
    } catch (error) { message(errorText(error)); }
  };
  const render = () => {
    if (!job || disposed) return;
    const current = job, id = current.id;
    panel.hidden = false;
    const elapsed = current.elapsed_seconds === undefined ? '' : `<p class="small muted">已生成 ${Math.floor(current.elapsed_seconds / 60)} 分 ${current.elapsed_seconds % 60} 秒${current.iteration != null ? ` · ${current.iteration} / ${current.steps} 步` : ' · 进度以本机重建器输出为准'}</p>`;
    panel.innerHTML = `<h3>${escape(current.message)}</h3><progress max="100" value="${Math.max(0, Math.min(100, current.progress))}"></progress>${elapsed}${current.issues?.length ? `<details><summary>拍摄记录与建议（${current.issues.length}）</summary><ul>${current.issues.map(s => `<li>${escape(s)}</li>`).join('')}</ul></details>` : ''}${current.status === 'ready' ? '<button id="open-capture-result" class="primary" type="button">打开空间预览</button><p class="small muted">生成完成不代表画质已经合格。打开后由你查看，再点击工作台的“保存到硬盘”。</p>' : terminal(current.status) ? '<p class="small muted">原始采集保留，当前工作台空间未被替换。</p>' : '<p class="small muted">可以关闭此窗口继续使用工作台，请保持电脑与移动硬盘连接。刷新页面不会重复启动生成。</p><button id="cancel-reconstruction" class="secondary" type="button">停止生成，保留原件</button>'}${terminal(current.status) ? '<div class="dialog-actions"><button id="retry-capture-quick" class="secondary" type="button">重新生成快速预览</button><button id="retry-capture-standard" class="secondary" type="button">重新标准生成</button></div>' : ''}<p><a href="/api/reconstruction/${encodeURIComponent(id)}/report" download>下载本次处理记录</a></p>`;
    submit.disabled = uploading || !terminal(current.status);
    sidebar.textContent = terminal(current.status) ? '旧链路 / 历史结果' : '旧链路正在生成 · 查看进度';
    panel.querySelector<HTMLButtonElement>('#open-capture-result')?.addEventListener('click', async e => {
      const button = e.currentTarget as HTMLButtonElement; button.disabled = true; message('');
      try {
        const response = await api(`/api/reconstruction/${id}/result`);
        await openResult(new Uint8Array(await response.arrayBuffer())); dialog.close();
      } catch (error) { message(errorText(error)); }
      finally { button.disabled = false; }
    });
    panel.querySelector<HTMLButtonElement>('#cancel-reconstruction')?.addEventListener('click', async e => {
      const button = e.currentTarget as HTMLButtonElement; button.disabled = true;
      try { await post(`/api/reconstruction/${id}/cancel`); message('正在停止，请等待本机任务结束'); }
      catch (error) { button.disabled = false; message(errorText(error)); }
    });
    for (const mode of ['quick', 'standard']) panel.querySelector<HTMLButtonElement>(`#retry-capture-${mode}`)?.addEventListener('click', async () => {
      if (uploading) return;
      uploading = true; submit.disabled = true;
      panel.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
      try {
        const result = await (await post(`/api/reconstruction/${id}/retry?profile=${mode}`)).json();
        choose({ id: result.id, status: 'importing', message: '正在使用保留的采集重新生成', progress: 2 });
        message('新建了生成任务，之前的结果和原始采集均保留。');
      } catch (error) { message(errorText(error)); }
      finally { uploading = false; if (job) render(); }
    });
  };
  const poll = async () => {
    if (!job || disposed) return;
    const id = job.id, epoch = generation;
    try {
      const current: Job = await (await api(`/api/reconstruction/${id}`)).json();
      if (disposed || generation !== epoch) return;
      job = current; render();
      if (!terminal(current.status)) timer = window.setTimeout(poll, 2500);
      else void loadHistory();
    } catch (error) {
      if (disposed || generation !== epoch) return;
      message(errorText(error)); timer = window.setTimeout(poll, 5000);
    }
  };
  sidebar.onclick = () => { if (!dialog.open) dialog.showModal(); if (job) render(); void loadHistory(); };
  dialog.querySelector('#close-capture')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('#refresh-capture-history')!.addEventListener('click', () => void loadHistory());
  form.onsubmit = e => {
    e.preventDefault(); if (uploading) return;
    if (job && !terminal(job.status)) { message('已有任务正在生成，请等待或先停止。'); return; }
    const file = fileInput.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.capture.zip')) { message('请选择手机导出的 .capture.zip 文件'); return; }
    if (file.size > 1024 ** 3) { message('单次采集包上限为 1 GB，请缩小扫描范围'); return; }
    uploading = true; generation++; clearTimeout(timer); submit.disabled = true;
    const request = upload = new XMLHttpRequest(); request.open('POST', `/api/reconstruction?profile=${encodeURIComponent(profile.value)}`);
    request.setRequestHeader('Content-Type', 'application/zip'); request.setRequestHeader('X-MemoryRoom-Local', '1');
    request.upload.onprogress = event => message(`正在保存到移动硬盘：${event.lengthComputable ? Math.round(event.loaded / event.total * 100) + '%' : '传输中…'}`);
    request.onload = () => {
      if (disposed) return;
      uploading = false; submit.disabled = false;
      try {
        const result = JSON.parse(request.responseText);
        if (request.status !== 202) throw new Error(result.error ?? '导入未完成');
        choose({ id: result.id, status: 'importing', message: '正在读取采集素材', progress: 5 }); message('');
      } catch (error) { message(errorText(error)); }
    };
    request.onerror = () => { uploading = false; submit.disabled = false; message('传输中断，请保持工作台运行并重新选择采集包。'); };
    request.send(file);
  };
  const initialEpoch = generation;
  void fetch('/api/reconstruction/latest').then(async response => {
    if (!response.ok) return;
    const latest: Job = await response.json();
    if (!disposed && !uploading && generation === initialEpoch) choose(latest);
  }).catch(() => {});
  import.meta.hot?.dispose(() => { disposed = true; clearTimeout(timer); upload?.abort(); dialog.remove(); });
}
