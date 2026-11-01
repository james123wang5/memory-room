import './style.css';
import { createDemo } from '../../../packages/scene/src/demo';
import { parseScene, type RoomScene, type SceneNode } from '../../../packages/scene/src/schema';
import { packScene, unpackScene, MAX_BUNDLE_BYTES } from '../../../packages/scene/src/bundle';
import { Viewport } from './viewport';
import { setupCaptureImport } from './capture-ui';
import { setupMacCapture } from './mac-capture-ui';
import { setupWorkspace } from './workspace-ui';
import { nodeAccessible, referencedAssets } from '../../../packages/scene/src/memory';

const icon = (name: string) => {
  const paths: Record<string, string> = {
    cube: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z"/>',
    folder: '<path d="M3 7V4h7l2 3h9v14H3V7Z"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
    scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10M12 7v10"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  };
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.cube}</svg>`;
};
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

$('#app').innerHTML = `
<header class="topbar">
  <a class="brand" href="/" aria-label="MemoryRoom 主页"><span class="brand-mark">${icon('cube')}</span><span>Memory<span class="brand-light">Room</span><small>让空间，留住生活。</small></span></a>
  <nav aria-label="工作区"><button class="nav-item active" aria-current="page">空间工作台 <span>01</span></button><button id="library" class="nav-item">空间库</button><button id="memories" class="nav-item">记忆</button><button id="mode" class="nav-item">进入漫游</button><button id="guide" class="nav-item">扫描指南 ${icon('arrow')}</button></nav>
  <div class="top-actions"><span id="save-state" class="save-state">尚未保存</span><button id="save" class="primary">${icon('save')} 保存到硬盘</button></div>
</header>
<main class="layout">
  <aside class="sidebar" aria-label="场景物品">
    <div class="sidebar-heading"><span class="eyebrow">YOUR SPACE</span><button id="new-scene" class="icon-button" title="新建空场景" aria-label="新建空场景">${icon('plus')}</button></div>
    <h1 id="scene-title">午后的房间</h1><p class="muted small">每一件物品，都有自己的位置。</p>
    <div class="scene-meta"><span class="dot"></span><span id="source-label">程序生成的演示场景</span></div>
    <div class="section-label">空间里的物品 <span id="object-count">—</span></div>
    <div id="tree" class="tree" role="group" aria-label="物品列表"></div>
    <button id="capture-import" class="add-object">${icon('scan')} 手机采集 · Mac 重建</button>
    <button id="legacy-capture-import" class="secondary small" type="button">旧链路 / 历史结果</button>
    <button id="import" class="add-object">${icon('plus')} 导入模型</button><button id="add-structure" class="secondary small">添加记忆点 / 容器</button><button id="providers" class="secondary small">生成与后续接入</button>
    <div class="sidebar-bottom"><div class="local-label">${icon('folder')} 本地工作空间</div><p>文件保存在 Lexar 移动硬盘。<br>这里的一切，由你保管。</p><div class="file-actions"><button id="open-project">打开项目包</button><button id="export">导出备份 ${icon('arrow')}</button></div></div>
  </aside>
  <section class="workspace" aria-label="三维空间">
    <div class="viewport-top"><div><span class="eyebrow">ROOM / 001</span><h2>回到这个空间</h2></div><span id="demo-badge" class="badge">结构演示 · 非真实扫描</span></div>
    <div id="viewport"></div>
    <div id="loading" class="loading" role="status"><span class="spinner"></span><strong>正在打开空间</strong><span>准备房间与独立物品…</span></div>
    <div id="inspect-hint" class="inspect-hint" hidden><span>物品观察中</span>拖动旋转 · Esc 放回原处<button id="return-floating">放回原处 ${icon('close')}</button></div>
    <div class="viewport-bottom"><div class="legend"><span class="key-icon">↖</span> 拖动环绕 <span class="separator"></span> 滚轮缩放 <span class="separator"></span> 点击物品</div><button id="home" class="view-home">${icon('home')} 初始视角</button></div>
  </section>
  <aside class="inspector" aria-label="物品详情"><div class="section-label">物品详情 <span>DETAILS</span></div><div id="details"></div><div class="inspector-note"><span class="note-line"></span><p>物品留在空间里。<br>故事也可以一起留下。</p></div></aside>
</main>
<footer class="statusbar"><span><span class="dot"></span> 本地运行 · 无需云端</span><span id="stats">准备渲染器…</span><span>MEMORYROOM <span class="version">v0.6 / 空间与记忆</span></span></footer>
<div id="toast" role="status" aria-live="polite" hidden></div>
<dialog id="import-dialog"><form id="import-form"><div class="dialog-heading"><div><span class="eyebrow">ADD AN OBJECT</span><h2>让物品进入空间</h2></div><button type="button" class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><p class="muted">导入已生成的高斯模型或含贴图的 GLB 网格。手机照片请使用“手机采集 · Mac 重建”，通过 OOOSplat 生成后导回。</p><label>模型文件<input id="model-file" type="file" accept=".ply,.spz,.splat,.ksplat,.glb" required /></label><label>物品名称<input id="model-name" type="text" maxlength="120" placeholder="例如：桌上的水壶" /></label><label>作为<select id="model-role"><option value="object">独立物品 · 可以拿起观察</option><option value="background">房间背景 · 固定显示</option></select></label><label>模型坐标单位<select id="model-unit"><option value="1">米 / 保留原始尺度</option><option value="0.01">厘米</option><option value="0.001">毫米</option></select></label><p class="small muted">保留原始位置与尺度，不再统一缩放物品。GLB 需包含全部贴图。项目包上限 256 MB，大模型仍会占用更多内存。</p><div class="dialog-actions"><button type="button" data-close class="secondary">取消</button><button id="import-submit" class="primary" type="submit">加入空间 ${icon('arrow')}</button></div></form></dialog>
<dialog id="guide-dialog"><div class="dialog-heading"><div><span class="eyebrow">CAPTURE GUIDE</span><h2>先保存一个属于你的空间</h2></div><button class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><p class="muted">第一批先扫描空间。暂时不用移动物品，也不用拍开合动作。</p><ol class="capture-steps"><li><strong>选择范围，准备环境</strong><p>第一次建议选“局部区域”，例如书桌和后方墙角。擦净镜头，保持均匀光线，家具和门保持不动。</p></li><li><strong>移动身体，自动采集</strong><p>局部区域先在正前方起拍，再向左右侧移，补高低视角；整间房沿可走路线慢走，连续拍到墙角、地面和家具。不要只在原地转手机。</p></li><li><strong>跟随当前提示补扫</strong><p>相邻画面保留共同的家具或墙角。出现“慢一点”就减速；追踪丢失时暂停。红格未记录、橙格需换角度、绿格已有多角度记录；未着色处可能未发现。补左右和高低视角，记录反光及无法到达的区域。</p></li><li><strong>导出采集包</strong><p>点“完成空间扫描”→“打包采集”→通过隔空投送或文件保存到 Mac。提示覆盖不足时可以补扫，也可以保留已有记录交给电脑生成预览。</p></li><li><strong>生成、预览、保存</strong><p>在工作台点“手机采集 · Mac 重建”，选择 .capture.zip。打开整理好的 images 文件夹，在 OOOSplat 选择普通图片、按顺序、均衡档和自动优化。完成后导回标准高斯 PLY；也可用支持版本的本地连接提交。满意再保存。</p></li></ol><div class="guide-note">所有采集与重建都保存在本机。第一批只生成静态空间；真实物品分离在第二批接入。</div></dialog>
<dialog id="structure-dialog"><form id="structure-form"><div class="dialog-heading"><h2>添加记忆点或容器</h2><button type="button" data-close class="icon-button">×</button></div><label>名称<input id="structure-name" maxlength="120" required placeholder="例如：抽屉里的照片"></label><label>类型<select id="structure-type"><option value="hotspot">可点击的记忆点</option><option value="group">组织物品的容器</option></select></label><p class="muted">先建立位置与内容，稍后可以替换成真实模型。记忆点出现在当前视线中心附近，可在摆放设置中调整。</p><button class="primary" type="submit">加入空间</button></form></dialog>
<input id="replacement-file" type="file" accept=".ply,.spz,.splat,.ksplat,.glb" hidden />
<input id="project-file" type="file" accept=".zip" hidden />`;

let scene: RoomScene = createDemo();
let files = new Map<string, Uint8Array>();
let selected: string | undefined;
let dirty = false, busy = false, authoring = true;
const libraryHeads = new Map<string,string>();
let workspace: ReturnType<typeof setupWorkspace>;
let replacementId: string | undefined;
let toastTimer = 0;
const toast = (message: string, error = false) => {
  const el = $('#toast'); el.textContent = message; el.classList.toggle('error', error); el.hidden = false;
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { el.hidden = true; }, error ? 8500 : 4500);
};
const markDirty = () => { dirty = true; $('#save-state').textContent = '有未保存的修改'; };
const setBusy = (value: boolean, text = '正在准备空间…') => {
  busy = value; $('#loading').hidden = !value; $('#loading strong').textContent = text;
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('#save, #import, #export, #new-scene, #open-project, #details button, #details input, #details select, #details textarea, #tree button, #library, #memories, #mode, #add-structure, #providers').forEach(b => { b.disabled = value; });
};
let world: Viewport;

function renderTree() {
  $('#scene-title').textContent = scene.title;
  $('#source-label').textContent = scene.source === 'procedural-demo' ? '程序生成的演示场景' : scene.captureId ? '自己的空间 · 重建预览' : '自己的空间 · 内容布置';
  $('#demo-badge').textContent = scene.source === 'procedural-demo' ? '结构演示 · 非真实扫描' : !scene.captureId ? '内容与资产 · 人工布置' : scene.reconstruction_status === 'user-accepted' ? '用户已确认的空间' : '真实采集 · 请查看生成效果';
  $('#object-count').textContent = `${scene.nodes.length}`;
  const children = (parent: string | null, depth = 0): string => scene.nodes.filter(n => n.parent === parent && (authoring || nodeAccessible(scene,n.id))).map(n => `
    <button class="tree-item ${n.id === selected ? 'selected' : ''}" data-node="${esc(n.id)}" style="--depth:${depth}" aria-pressed="${n.id === selected}">
    <span class="tree-icon">${icon(n.interaction === 'joint' ? 'chevron' : 'cube')}</span><span class="tree-name">${esc(n.name)}</span><span class="kind-dot ${n.kind === 'splat' ? 'splat' : ''}" title="${n.kind === 'splat' ? '高斯模型' : n.kind === 'mesh' ? '网格模型' : '场景结构'}"></span></button>${children(n.id, depth + 1)}`).join('');
  $('#tree').innerHTML = children(null);
  $('#tree').querySelectorAll<HTMLButtonElement>('[data-node]').forEach(b => b.onclick = () => select(b.dataset.node!));
}
const currentNode = () => scene.nodes.find(n => n.id === selected);
function select(id?: string) {
  if (id && !authoring && !nodeAccessible(scene,id)) return;
  world.endInspect(); selected = id; world.select(id); renderTree(); renderDetails();
  $('#inspect-hint').hidden = true; $('#viewport').classList.remove('inspecting');
}
function renderDetails() {
  $('#inspect-hint').hidden = !world.inspect.active;
  $('#viewport').classList.toggle('inspecting', world.inspect.active);
  const node = currentNode(), el = $('#details');
  if (!node) {
    el.innerHTML = `<div class="empty-detail"><div class="empty-cube">${icon('cube')}</div><h3>选一件物品，靠近一点。</h3><p>点击房间里的物品，<br>或从左侧列表中选择。<br>点击画面后可用 WASD 移动。</p><button id="try-vase" class="secondary">${scene.source === 'procedural-demo' ? '试试高斯花器' : '查看扫描空间'} ${icon('arrow')}</button></div>`;
    $('#try-vase').onclick = () => select(scene.nodes.find(n => n.kind === 'splat' && n.interaction === 'inspect')?.id ?? scene.nodes.find(n => n.kind === 'splat')?.id ?? scene.nodes.find(n => n.interaction === 'inspect')?.id);
    return;
  }
  const inspect = world.inspect.active;
  const kind = node.kind === 'splat' ? '3D GAUSSIAN' : node.kind === 'group' ? (node.hotspot ? '记忆点' : '容器') : node.kind === 'mesh' ? 'MESH' : 'DEMO MESH';
  el.innerHTML = `<div class="object-type">${icon('cube')} ${kind}<span>${node.interaction === 'joint' ? '可开合' : node.interaction === 'inspect' ? '可观察' : '固定'}</span></div>
    <h2 class="object-title">${esc(node.name)}</h2><p class="object-id">${esc(node.id)}</p>
    <p class="description">${esc(node.description || '已登记在这个空间中的物品。')}</p>
    <div class="object-actions">${node.interaction === 'inspect' ? `<button id="inspect" class="primary">${icon(inspect ? 'close' : 'eye')} ${inspect ? '放回原处' : '拿起观察'}</button>` : ''}<button id="focus" class="secondary">${icon('scan')} 靠近查看</button><button id="node-memories" class="secondary">相关记忆 · ${(scene.memories ?? []).filter(m => m.nodeId === node.id).length}</button></div>
    ${node.joint ? `<div class="joint-panel"><div><strong>${node.joint.type === 'slide' ? '抽屉行程' : '柜门角度'}</strong><output id="joint-output">${Math.round(node.joint.value * 100)}%</output></div><input aria-label="开合程度" id="joint-value" type="range" min="0" max="100" value="${node.joint.value * 100}" /><div class="range-labels"><span>关闭</span><span>完全打开</span></div><div class="joint-buttons"><button id="joint-close" class="secondary">关闭</button><button id="joint-open" class="secondary">打开</button></div></div>` : ''}
    <details class="settings" ${authoring ? '' : 'hidden'} ${node.kind === 'splat' ? 'open' : ''}><summary>摆放与设置</summary>
      <label>名称<input id="edit-name" value="${esc(node.name)}" maxlength="120" /></label>
      <label>说明<textarea id="edit-description" rows="3" maxlength="4000">${esc(node.description)}</textarea></label><button id="replace-model" class="secondary" type="button">替换为真实模型（保留记忆与编号）</button>
      <label>所属物品<select id="edit-parent"><option value="">房间根目录</option>${scene.nodes.filter(n => n.id !== node.id).map(n => `<option value="${esc(n.id)}" ${node.parent === n.id ? 'selected' : ''}>${esc(n.name)}</option>`).join('')}</select></label>
      <span class="field-label">位置 / 米（相对所属物品）</span><div class="xyz">${['X', 'Y', 'Z'].map((k, i) => `<label>${k}<input data-pos="${i}" aria-label="位置 ${k}" type="number" step="0.05" value="${node.transform.position[i].toFixed(3)}" /></label>`).join('')}</div>
      <span class="field-label">旋转 / 度</span><div class="xyz">${['X', 'Y', 'Z'].map((k, i) => `<label>${k}<input data-rot="${i}" aria-label="旋转 ${k}" type="number" step="5" value="${(node.transform.rotation[i] * 180 / Math.PI).toFixed(1)}" /></label>`).join('')}</div>
      <label>统一缩放<input id="edit-scale" type="number" min="0.0001" max="10000" step="any" value="${node.transform.scale}" /></label>
      <label>交互方式<select id="edit-interaction"><option value="static" ${node.interaction === 'static' ? 'selected' : ''}>固定背景</option><option value="inspect" ${node.interaction === 'inspect' ? 'selected' : ''}>拿起观察</option><option value="slide" ${node.joint?.type === 'slide' ? 'selected' : ''}>滑动部件</option><option value="hinge" ${node.joint?.type === 'hinge' ? 'selected' : ''}>旋转部件</option></select></label>
      ${node.joint ? `<label>运动轴<select id="edit-axis">${['X', 'Y', 'Z', '-X', '-Y', '-Z'].map((label, i) => { const axis = [0, 0, 0]; axis[i % 3] = i < 3 ? 1 : -1; return `<option value="${i}" ${axis.every((v, j) => v === node.joint!.axis[j]) ? 'selected' : ''}>${label}</option>`; }).join('')}</select></label><label>${node.joint.type === 'slide' ? '行程 / 米' : '最大角度 / 度'}<input id="edit-limit" type="number" min="0.01" step="0.05" value="${node.joint.type === 'slide' ? node.joint.max : (node.joint.max * 180 / Math.PI).toFixed(1)}" /></label>${node.joint.type === 'hinge' ? `<span class="field-label">铰链支点 / 部件本地坐标</span><div class="xyz">${['X','Y','Z'].map((label,i)=>`<label>${label}<input type="number" step="0.01" data-pivot="${i}" value="${(node.joint!.pivot ?? [0,0,0])[i]}" /></label>`).join('')}</div>` : ''}<p class="small muted">旋转支点相对部件原点，随部件统一缩放；内部物品需设为该部件的子物品。</p>` : ''}
      <label>这个物品何时显示<select id="edit-visible"><option value="">始终显示</option>${scene.nodes.filter(n=>n.joint&&n.id!==node.id).map(n=>`<option value="${esc(n.id)}" ${node.visibleWhen?.nodeId===n.id?'selected':''}>打开 ${esc(n.name)} 后</option>`).join('')}</select></label><label>至少打开到 / %<input id="edit-visible-min" type="number" min="1" max="100" value="${Math.round((node.visibleWhen?.minimum??0.5)*100)}" /></label>
      <button id="remove-node" class="danger-link">移除此物品及子物品</button>
    </details>`;
  $('#node-memories').onclick = () => void workspace.openMemories(node.id);
  $('#replace-model').onclick = () => { replacementId=node.id; $<HTMLInputElement>('#replacement-file').click(); };
  $<HTMLTextAreaElement>('#edit-description').onchange=e=>{node.description=(e.target as HTMLTextAreaElement).value;markDirty();renderDetails();};
  const changeVisibility=()=>guarded(async()=>{const next=structuredClone(scene),n=next.nodes.find(n=>n.id===node.id)!,control=$<HTMLSelectElement>('#edit-visible').value;n.visibleWhen=control?{nodeId:control,minimum:Number($<HTMLInputElement>('#edit-visible-min').value)/100}:undefined;await loadProject(parseScene(next),files);markDirty();select(node.id);});
  $<HTMLSelectElement>('#edit-visible').onchange=changeVisibility; $<HTMLInputElement>('#edit-visible-min').onchange=changeVisibility;
  $('#focus').onclick = () => { world.focus(node.id); renderDetails(); $('#inspect-hint').hidden = true; $('#viewport').classList.remove('inspecting'); };
  if (node.interaction === 'inspect') $('#inspect').onclick = () => {
    if (world.inspect.active) world.endInspect(); else world.beginInspect(node.id);
    $('#inspect-hint').hidden = !world.inspect.active; $('#viewport').classList.toggle('inspecting', world.inspect.active); renderDetails();
  };
  const setJoint = (value: number) => {
    world.setJoint(node, value); markDirty(); renderTree();
    $('#joint-output').textContent = `${Math.round(value * 100)}%`;
    $<HTMLInputElement>('#joint-value').value = `${value * 100}`;
  };
  if (node.joint) {
    $<HTMLInputElement>('#joint-value').oninput = e => setJoint(Number((e.target as HTMLInputElement).value) / 100);
    $('#joint-close').onclick = () => setJoint(0); $('#joint-open').onclick = () => setJoint(1);
    $<HTMLSelectElement>('#edit-axis').onchange = e => { const i = Number((e.target as HTMLSelectElement).value); node.joint!.axis = [0, 0, 0]; node.joint!.axis[i % 3] = i < 3 ? 1 : -1; setJoint(node.joint!.value); };
    $<HTMLInputElement>('#edit-limit').onchange = e => {
      const v = Number((e.target as HTMLInputElement).value);
      if (!Number.isFinite(v) || v <= 0) { toast('请输入大于零的行程或角度', true); renderDetails(); return; }
      node.joint!.max = node.joint!.type === 'slide' ? v : v * Math.PI / 180; setJoint(node.joint!.value);
    };
  }
  el.querySelectorAll<HTMLInputElement>('[data-pivot]').forEach(input=>input.onchange=()=>{const value=Number(input.value);if(!Number.isFinite(value)){toast('支点需要有效数字',true);renderDetails();return;}node.joint!.pivot ??= [0,0,0];node.joint!.pivot[Number(input.dataset.pivot)]=value;world.updateTransform(node);markDirty();});
  $<HTMLInputElement>('#edit-name').onchange = e => { const name = (e.target as HTMLInputElement).value.trim(); if (!name) return renderDetails(); node.name = name; markDirty(); renderTree(); renderDetails(); };
  el.querySelectorAll<HTMLInputElement>('[data-pos], [data-rot], #edit-scale').forEach(input => input.onchange = () => {
    const v = Number(input.value); if (!Number.isFinite(v)) { toast('请输入有效数字', true); renderDetails(); return; }
    if (input.dataset.pos !== undefined) node.transform.position[Number(input.dataset.pos)] = v;
    else if (input.dataset.rot !== undefined) node.transform.rotation[Number(input.dataset.rot)] = v * Math.PI / 180;
    else { if (v < 0.0001 || v > 10000) { toast('缩放须在 0.0001 到 10000 之间', true); renderDetails(); return; } node.transform.scale = v; }
    world.updateTransform(node); markDirty(); renderDetails();
  });
  $<HTMLSelectElement>('#edit-interaction').onchange = e => {
    world.endInspect(); const value = (e.target as HTMLSelectElement).value;
    if (!['slide','hinge'].includes(value) && (scene.nodes.some(n=>n.visibleWhen?.nodeId===node.id)||(scene.memories??[]).some(m=>m.reveal?.nodeId===node.id))) {toast('先解除依赖这个部件的显示条件，再移除开合功能',true);renderDetails();return;}
    node.interaction = value === 'slide' || value === 'hinge' ? 'joint' : value as 'static' | 'inspect';
    node.joint = value === 'slide' || value === 'hinge' ? { type: value, axis: value === 'slide' ? [0, 0, 1] : [0, 1, 0], min: 0, max: value === 'slide' ? 0.4 : Math.PI / 2, value: 0 } : undefined;
    world.updateTransform(node); markDirty(); select(node.id);
  };
  $<HTMLSelectElement>('#edit-parent').onchange = e => guarded(async () => {
    const next = structuredClone(scene), n = next.nodes.find(n => n.id === node.id)!;
    n.parent = (e.target as HTMLSelectElement).value || null;
    try { parseScene(next); await loadProject(next, files); markDirty(); select(node.id); toast('所属物品已更新；位置现在相对新的父物品'); }
    catch (e) { toast(`无法修改层级：${errorText(e)}`, true); renderDetails(); }
  });
  $('#remove-node').onclick = async () => {
    if (!confirm(`移除“${node.name}”及其子物品？尚未保存的更改可通过重新打开项目恢复。`)) return;
    const next = structuredClone(scene), removed = new Set([node.id]);
    let changed = true;
    while (changed) { changed = false; next.nodes.forEach(n => { if (n.parent && removed.has(n.parent) && !removed.has(n.id)) { removed.add(n.id); changed = true; } }); }
    next.nodes = next.nodes.filter(n => !removed.has(n.id));
    if (!next.nodes.length) next.nodes.push({ id: crypto.randomUUID(), name: '空间', parent: null, kind: 'group', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }, interaction: 'static', description: '' });
    for (const n of next.nodes) if(n.visibleWhen && removed.has(n.visibleWhen.nodeId)) delete n.visibleWhen;
    for (const memory of next.memories ?? []) { if(memory.nodeId && removed.has(memory.nodeId)) memory.nodeId=null; if(memory.reveal && removed.has(memory.reveal.nodeId)) delete memory.reveal; }
    const used = referencedAssets(next); Object.keys(next.assets).forEach(id => { if (!used.has(id)) delete next.assets[id]; });
    await guarded(async () => { await loadProject(next, files); markDirty(); });
  };
}
function errorText(e: unknown) { return e instanceof Error ? e.message : String(e); }
async function guarded(fn: () => Promise<void>) {
  if (busy) return;
  try { setBusy(true); await fn(); } catch (e) { console.error(e); toast(errorText(e), true); }
  finally { setBusy(false); }
}
async function loadProject(next: RoomScene, nextFiles: Map<string, Uint8Array>) {
  const valid = parseScene(next); await world.load(valid, nextFiles); scene = valid; files = new Map([...nextFiles].filter(([path])=>Object.values(valid.assets).some(a=>a.path===path))); world.setAuthoring(authoring); select(undefined); updateStats();
}
function updateStats(fps?: number) {
  const stats = world.stats;
  $('#stats').textContent = `${stats.nodes} 个节点 · ${stats.splats.toLocaleString()} 高斯 · WebGL2${fps ? ` · ${fps} FPS` : ''}`;
}
async function loadDemo() {
  const demo = createDemo(), demoFiles = new Map<string, Uint8Array>();
  for (const a of Object.values(demo.assets)) {
    const response = await fetch(`/demo/${a.path}`); if (!response.ok) throw new Error('演示模型读取失败，请运行 npm run demo:generate');
    demoFiles.set(a.path, new Uint8Array(await response.arrayBuffer()));
  }
  await loadProject(demo, demoFiles); world.home();
}

document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b => b.onclick = () => b.closest('dialog')!.close());
$('#guide').onclick = () => $<HTMLDialogElement>('#guide-dialog').showModal();
$('#import').onclick = () => $<HTMLDialogElement>('#import-dialog').showModal();
$('#home').onclick = () => { world.home(); renderDetails(); $('#inspect-hint').hidden = true; $('#viewport').classList.remove('inspecting'); };
$('#return-floating').onclick = () => { world.endInspect(); $('#inspect-hint').hidden = true; $('#viewport').classList.remove('inspecting'); renderDetails(); };
window.addEventListener('keydown', e => { if (e.key === 'Escape' && world?.inspect.active) $('#return-floating').click(); });
window.addEventListener('beforeunload', e => { if (dirty) e.preventDefault(); });

$<HTMLFormElement>('#import-form').onsubmit = async e => {
  e.preventDefault(); const file = $<HTMLInputElement>('#model-file').files?.[0]; if (!file) return;
  if (file.size > MAX_BUNDLE_BYTES) { toast('模型超过 256 MB 项目包上限', true); return; }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['ply', 'spz', 'splat', 'ksplat', 'glb'].includes(ext!)) { toast('请选择高斯 PLY / SPZ / SPLAT / KSPLAT 或 GLB 文件', true); return; }
  $<HTMLDialogElement>('#import-dialog').close();
  await guarded(async () => {
    const next = structuredClone(scene), nextFiles = new Map(files), id = crypto.randomUUID(), path = `assets/${id}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const currentBytes = [...nextFiles.values()].reduce((sum, b) => sum + b.byteLength, 0);
    if (currentBytes + bytes.byteLength > MAX_BUNDLE_BYTES - 1024 * 1024) throw new Error('项目模型合计接近 256 MB 上限，请先移除部分模型');
    const kind = ext === 'glb' ? 'mesh' : 'splat';
    const metersPerUnit = Number($<HTMLSelectElement>('#model-unit').value);
    next.assets[id] = { path, type: kind, metersPerUnit, provenance: 'imported', scaleStatus: 'unknown', revision: id }; nextFiles.set(path, bytes);
    const background = $<HTMLSelectElement>('#model-role').value === 'background';
    const name = $<HTMLInputElement>('#model-name').value.trim() || file.name.replace(/\.[^.]+$/, '');
    next.nodes.push({ id, name, kind, asset: id, parent: null,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }, interaction: background ? 'static' : 'inspect',
      description: `从本机导入：${file.name}。保留模型原始坐标，按所选单位换算成米。请确认实际尺寸和摆放位置。` });
    await loadProject(next, nextFiles);
    world.focus(id); select(id); markDirty(); toast('模型已加入。请确认方向、尺寸与位置。');
    $<HTMLFormElement>('#import-form').reset();
  });
};
async function saveCurrent() {
  world.endInspect();
  const saved = structuredClone(scene);
  saved.parentRevision = scene.revision; saved.revision = crypto.randomUUID();
  const bytes = packScene(saved, files);
  const response = await fetch('/api/projects/current', { method: 'PUT', headers: { 'Content-Type': 'application/zip', 'X-MemoryRoom-Local': '1', 'X-MemoryRoom-Base': libraryHeads.get(saved.id) ?? 'none' }, body: bytes.slice().buffer });
  const result=await response.json();
  if (!response.ok) throw new Error(result.error ?? '保存没有完成');
  libraryHeads.set(saved.id,result.snapshot);
  // Keep the same manifest object used by the viewport; update revision metadata only.
  scene.parentRevision=saved.parentRevision;scene.revision=saved.revision;renderTree();
  dirty = false; $('#save-state').textContent = `已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  toast('已保存到移动硬盘空间库；本次版本与此前版本分别保留。');
}
$('#save').onclick = () => guarded(saveCurrent);
$('#export').onclick = () => guarded(async () => {
  const bytes = packScene(scene, files), url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/zip' }));
  const a = document.createElement('a'); a.href = url; a.download = `${scene.title.replace(/[\\/:*?"<>|]/g, '-')}.room.zip`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000); toast('备份已交给浏览器下载，请按需要选择移动硬盘作为保存位置。');
});
$('#open-project').onclick = () => $<HTMLInputElement>('#project-file').click();
$<HTMLInputElement>('#project-file').onchange = e => guarded(async () => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  if (dirty && !confirm('打开项目包会替换未保存的修改，是否继续？')) return;
  if (file.size > MAX_BUNDLE_BYTES + 1024 * 1024) throw new Error('项目包超过大小上限');
  const data = unpackScene(new Uint8Array(await file.arrayBuffer()));
  await loadProject(data.scene, data.files); libraryHeads.delete(scene.id); world.home(); markDirty(); toast('项目包已打开；点击保存可写入当前硬盘项目');
  (e.target as HTMLInputElement).value = '';
});
$('#new-scene').onclick = () => guarded(async () => {
  if (!confirm('新建空场景？当前未保存的修改会被替换，硬盘中已保存的项目暂时保留。')) return;
  const next = parseScene({ version: 1, id: crypto.randomUUID(), title: '我的空间', source: 'user-capture', units: 'meter', coordinates: 'right-handed-y-up', assets: {}, nodes: [{ id: 'space', name: '空间', kind: 'group' }] });
  await loadProject(next, new Map()); world.home(); markDirty(); toast('空场景已建立，可以先导入房间背景，再导入独立物品');
});

async function start() {
  try {
    world = new Viewport($('#viewport')); world.onSelect = select; world.onFrame = updateStats; world.onError = m => toast(m, true);
    setBusy(true);
    const response = await fetch('/api/projects/current');
    if (response.ok) {
      try {
        const data = unpackScene(new Uint8Array(await response.arrayBuffer()));
        await loadProject(data.scene, data.files); const head=response.headers.get('x-memoryroom-head'); if(head) libraryHeads.set(scene.id,head); world.home(); $('#save-state').textContent = '已恢复硬盘项目';
      } catch (e) { toast(`上次项目无法打开，已载入演示；原文件仍保留。${errorText(e)}`, true); await loadDemo(); }
    } else { await loadDemo(); if (response.status !== 404) toast('暂时无法读取硬盘项目，已打开演示场景', true); }
    setBusy(false);
  } catch (e) {
    console.error(e); $('#loading strong').textContent = '空间未能打开';
    $('#loading > span:last-child').textContent = `${errorText(e)}。需要支持 WebGL2 的浏览器。`;
    $('#loading .spinner').classList.remove('spinner'); toast(errorText(e), true);
  }
}
void start();
const openCapturedResult = async (bytes: Uint8Array, head?: string) => {
  if (busy) throw new Error('工作台正在处理另一项操作，请稍后打开结果');
  if (dirty && !confirm('打开生成结果会替换当前未保存的编辑，是否继续？')) throw new Error('已保留当前编辑，生成结果仍可稍后打开');
  setBusy(true);
  try {
    const result = unpackScene(bytes); await loadProject(result.scene, result.files); if(head) libraryHeads.set(scene.id,head);else libraryHeads.delete(scene.id); world.home(); markDirty();
    toast('已打开生成预览。满意后点击保存到硬盘，原始采集仍然保留。');
  } finally { setBusy(false); }
};
setupCaptureImport(openCapturedResult);
setupMacCapture(openCapturedResult);
workspace = setupWorkspace({
  scene:()=>scene, files:()=>files, selected:()=>selected, authoring:()=>authoring, busy:()=>busy,
  open:openCapturedResult, notice:m=>toast(m,true), focus:id=>{select(id);world.focus(id);},
  commit:async(next,nextFiles=files)=>{if(busy)throw new Error('工作台正在处理另一个操作');const previous=selected;setBusy(true);try{await loadProject(next,nextFiles);markDirty();if(previous&&scene.nodes.some(n=>n.id===previous))select(previous);}finally{setBusy(false);}},
  saveCopy:async()=>{if(busy)throw new Error('工作台正在处理另一个操作');setBusy(true);const old=scene;
    try {const next=structuredClone(scene),oldId=next.id;next.id=crypto.randomUUID();next.title=(next.title+' · 副本').slice(0,120);next.parentRevision=next.revision;delete next.revision;for(const m of next.memories??[])if(m.destination?.sceneId===oldId)m.destination.sceneId=next.id;
      await loadProject(next,files);markDirty();await saveCurrent();
    }catch(e){if(scene.id!==old.id){await loadProject(old,files);markDirty();}throw e;}finally{setBusy(false);}},
});
$('#library').onclick=workspace.openLibrary;
$('#memories').onclick=()=>void workspace.openMemories();
$('#providers').onclick=workspace.openProviders;
$('#mode').onclick=()=>{if(busy)return;authoring=!authoring;world.setAuthoring(authoring);$('#mode').textContent=authoring?'进入漫游':'返回布置';$('#add-structure').hidden=!authoring;select(undefined);toast(authoring?'布置模式：可编辑物品、支点和记忆条件':'漫游模式：打开柜门后才显示内部物品和记忆');};
$('#add-structure').onclick=()=>{if(!busy)$<HTMLDialogElement>('#structure-dialog').showModal();};
$<HTMLFormElement>('#structure-form').onsubmit=e=>{e.preventDefault();void guarded(async()=>{const next=structuredClone(scene),id=crypto.randomUUID();next.nodes.push({id,name:$<HTMLInputElement>('#structure-name').value.trim(),parent:null,kind:'group',hotspot:$<HTMLSelectElement>('#structure-type').value==='hotspot'?{radius:0.06}:undefined,transform:{position:world.controls.target.toArray() as [number,number,number],rotation:[0,0,0],scale:1},interaction:'static',description:'用户设置的位置，尚未绑定独立扫描模型。'});await loadProject(next,files);markDirty();select(id);$<HTMLDialogElement>('#structure-dialog').close();$<HTMLFormElement>('#structure-form').reset();});};
$<HTMLInputElement>('#replacement-file').onchange=e=>{const input=e.target as HTMLInputElement,file=input.files?.[0],id=replacementId;input.value='';if(!file||!id)return;void guarded(async()=>{
  if(file.size>MAX_BUNDLE_BYTES-1024*1024)throw new Error('模型超过项目包容量');const ext=file.name.split('.').pop()?.toLowerCase();if(!ext||!['ply','spz','splat','ksplat','glb'].includes(ext))throw new Error('请选择高斯模型或 GLB');
  const next=structuredClone(scene),n=next.nodes.find(n=>n.id===id);if(!n)throw new Error('原物品已不存在');const nextFiles=new Map(files),assetId=crypto.randomUUID(),path=`assets/${assetId}.${ext}`,previous=n.asset?next.assets[n.asset]:undefined;
  n.kind=ext==='glb'?'mesh':'splat';n.asset=assetId;delete n.hotspot;delete n.proxyAsset;next.assets[assetId]={path,type:n.kind,provenance:'imported',metersPerUnit:previous?.metersPerUnit??1,scaleStatus:'unknown'};nextFiles.set(path,new Uint8Array(await file.arrayBuffer()));
  const used=referencedAssets(next);for(const [key,a] of Object.entries(next.assets))if(!used.has(key)){delete next.assets[key];nextFiles.delete(a.path);}
  if([...nextFiles.values()].reduce((sum,b)=>sum+b.length,0)>MAX_BUNDLE_BYTES-1024*1024)throw new Error('模型与记忆附件合计超过 256 MB');
  await loadProject(next,nextFiles);markDirty();select(id);toast('模型已替换，编号、记忆、层级和开合设置保留；请调整尺寸和位置。');
});};
import.meta.hot?.dispose(()=>workspace.dispose());


/** Read-only diagnostics for local QA; also useful when a user reports a model issue. */
export function diagnostics() {
  return { ...world.stats, frame: world.renderer.info.render.frame, dirty, selected,
    camera: { position: world.camera.position.toArray(), target: world.controls.target.toArray() },
    scene: structuredClone(scene), objects: [...world.objects].map(([id, o]) => ({ id, parent: o.parent?.userData.nodeId ?? null,
      position: o.position.toArray(), quaternion: o.quaternion.toArray(), scale: o.scale.toArray() })) };
}

// Read-only QA entry avoids re-importing the application module during Vite HMR.
Object.defineProperty(window, 'memoryRoomDiagnostics', { configurable: true, value: diagnostics });
