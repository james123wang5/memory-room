import { parseScene, memorySchema, type RoomScene, type MemoryCard } from '../../../packages/scene/src/schema';
import { MAX_BUNDLE_BYTES } from '../../../packages/scene/src/bundle';
import { searchMemories, memoryAccessible, referencedAssets } from '../../../packages/scene/src/memory';

export interface WorkspaceContext {
  scene():RoomScene; files():Map<string,Uint8Array>; selected():string|undefined; authoring():boolean; busy():boolean;
  commit(scene:RoomScene,files?:Map<string,Uint8Array>):Promise<void>;
  open(bytes:Uint8Array,head?:string):Promise<void>;
  focus(id:string):void; saveCopy():Promise<void>; notice(message:string):void;
}
type Space = { key:string; snapshot:string; sceneId:string; title:string; createdAt:string; memories:number; nodes:number };
const esc = (s:string) => s.replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[c]);
const mimeByExtension:Record<string,string> = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',webm:'video/webm',m4a:'audio/mp4',mp4:'video/mp4',pdf:'application/pdf' };
export function setupWorkspace(ctx:WorkspaceContext) {
  const dialog = document.createElement('dialog'); dialog.className = 'workspace-dialog'; document.body.append(dialog);
  let panel:'library'|'memories'|'providers' = 'memories', scope:string|null|undefined, query = '', spaces:Space[] = [];
  let draft:MemoryCard|undefined, draftDirty = false, working = false, generation = 0;
  let searchTimer = 0;
  const pending = new Map<string,{asset:RoomScene['assets'][string];bytes:Uint8Array}>();
  let urls:string[] = [], recorder:MediaRecorder|undefined, microphone:MediaStream|undefined;
  const warnUnsaved = (event:BeforeUnloadEvent) => { if(draftDirty || recorder) event.preventDefault(); };
  window.addEventListener('beforeunload',warnUnsaved);
  const clearMedia = () => { urls.forEach(u => URL.revokeObjectURL(u)); urls=[]; };
  const stopMic = () => { if (recorder?.state === 'recording') recorder.stop(); microphone?.getTracks().forEach(t=>t.stop()); microphone=undefined; };
  const $ = <T extends HTMLElement = HTMLElement>(id:string) => dialog.querySelector<T>(`#${id}`)!;
  const message = (text:string) => { const el=dialog.querySelector<HTMLElement>('#workspace-message'); if(el) el.textContent=text; else ctx.notice(text); };
  async function request(url:string,method='GET',body?:BodyInit) {
    const response=await fetch(url,{method,body,headers:method==='GET'?{}:{'X-MemoryRoom-Local':'1','Content-Type':'application/json'}});
    if(!response.ok) throw new Error((await response.json().catch(()=>({}))).error ?? '操作没有完成'); return response;
  }
  async function action(fn:()=>Promise<void>) {
    if(working || ctx.busy()) return;
    working=true; dialog.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLTextAreaElement|HTMLSelectElement>('button,input,textarea,select').forEach(b=>b.disabled=true);
    try { await fn(); } catch(e) { message(e instanceof Error?e.message:'操作没有完成'); }
    finally { working=false; dialog.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLTextAreaElement|HTMLSelectElement>('button,input,textarea,select').forEach(b=>b.disabled=false); }
  }
  const bind = (id:string,fn:()=>Promise<void>) => { const el=dialog.querySelector(`#${id}`); el?.addEventListener('click',()=>void action(fn)); };
  function discard() { if(working) return false; if(draftDirty && !confirm('尚未保存这张记忆卡片，放弃本次编辑？')) return false; generation++; clearTimeout(searchTimer); stopMic(); draft=undefined; draftDirty=false; pending.clear(); return true; }
  function close() { if(!discard()) return; dialog.close(); clearMedia(); }
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{generation++;stopMic();clearMedia();});
  function shell(title:string,html:string) {
    clearTimeout(searchTimer); clearMedia();
    dialog.innerHTML=`<div class="dialog-heading"><h2>${esc(title)}</h2><button id="workspace-close" class="icon-button" aria-label="关闭">×</button></div><p id="workspace-message" role="status" class="workspace-message"></p>${html}`;
    $('workspace-close').onclick=close;
  }
  async function openPanel(next:typeof panel) {
    if(ctx.busy() || working) return;
    if(!discard()) return; panel=next; scope=undefined; query='';
    if(!dialog.open) dialog.showModal();
    shell('正在读取…','');
    const turn=++generation;
    try { spaces=await (await request('/api/library')).json(); } catch(e) { spaces=[]; ctx.notice(e instanceof Error?e.message:'空间库暂时无法读取'); }
    if(turn!==generation || !dialog.open) return;
    if(panel==='library') renderLibrary(); else if(panel==='providers') await renderProviders(); else renderMemories();
  }
  function renderLibrary() {
    shell('我的空间',`<p class="muted">每个空间单独保存，每次保存保留一个版本。打开历史版本后再保存，会新增版本。</p>
    <label>当前空间名称<input id="space-title" maxlength="120" value="${esc(ctx.scene().title)}"></label><button id="space-rename" class="secondary">更新名称</button> <button id="space-copy" class="secondary">另存为新空间</button>
    <div class="memory-grid">${spaces.map(s=>`<article class="memory-card"><h3>${esc(s.title)}</h3><p class="small muted">${s.nodes} 个节点 · ${s.memories} 条记忆<br>${esc(new Date(s.createdAt).toLocaleString('zh-CN'))}</p><button data-open-space="${s.key}" class="primary">打开空间</button> <button data-versions="${s.key}" class="secondary">历史版本</button></article>`).join('')||'<p>空间库还没有记录。保存当前空间后会出现在这里；原来的 current.room.zip 仍保留。</p>'}</div><div id="space-versions"></div>`);
    bind('space-rename',async()=>{const next=structuredClone(ctx.scene());next.title=$<HTMLInputElement>('space-title').value.trim();await ctx.commit(parseScene(next));message('名称已更新，点击主界面“保存到硬盘”保存。');});
    bind('space-copy',async()=>{await ctx.saveCopy();spaces=await(await request('/api/library')).json();renderLibrary();message('已另存为新空间，旧空间保留。');});
    dialog.querySelectorAll<HTMLButtonElement>('[data-open-space]').forEach(b=>b.onclick=()=>void action(async()=>openSpace(b.dataset.openSpace!)));
    dialog.querySelectorAll<HTMLButtonElement>('[data-versions]').forEach(b=>b.onclick=()=>void action(async()=>{
      const list:Space[]=await(await request(`/api/library/${b.dataset.versions}/revisions`)).json();
      $('space-versions').innerHTML=`<h3>历史版本</h3>${list.map(s=>`<p><button data-version="${s.snapshot}" class="secondary">${esc(new Date(s.createdAt).toLocaleString('zh-CN'))} · ${s.memories} 条记忆</button></p>`).join('')}`;
      dialog.querySelectorAll<HTMLButtonElement>('[data-version]').forEach(v=>v.onclick=()=>void action(async()=>openSpace(b.dataset.versions!,v.dataset.version)));
    }));
  }
  async function openSpace(key:string,snapshot?:string,node?:string) {
    const response=await request(`/api/library/${key}${snapshot?'/'+snapshot:''}`);
    await ctx.open(new Uint8Array(await response.arrayBuffer()),response.headers.get('x-memoryroom-head')??undefined);
    dialog.close(); if(node && ctx.scene().nodes.some(n=>n.id===node)) ctx.focus(node);
  }
  function renderMemories() {
    draft=undefined;draftDirty=false;pending.clear();
    const scene=ctx.scene(), options=scene.nodes.map(n=>`<option value="node:${esc(n.id)}" ${scope===n.id?'selected':''}>${esc(n.name)}</option>`).join('');
    const list=searchMemories(scene,query,ctx.authoring()).filter(m=>scope===undefined || m.nodeId===scope);
    shell('空间里的记忆',`<div class="memory-toolbar"><input id="memory-search" aria-label="搜索记忆" placeholder="搜索文字、人物、日期或标签" value="${esc(query)}"><select id="memory-scope" aria-label="记忆范围"><option value="all" ${scope===undefined?'selected':''}>整个空间</option><option value="space" ${scope===null?'selected':''}>空间故事</option>${options}</select>${ctx.authoring()?'<button id="memory-new" class="primary">添加记忆</button>':''}</div>
    <p class="small muted">${ctx.authoring()?'布置模式会显示所有卡片及其开合条件。':'漫游模式只显示当前可访问的内容；打开柜门后再查看内部记忆。'} ${list.length} 条</p><div id="memory-list" class="memory-grid">${list.map(m=>`<article class="memory-card"><p class="eyebrow">${esc(m.date||'未注明时间')}</p><h3>${esc(m.title)}</h3><p class="memory-excerpt">${esc(m.body.slice(0,180))}</p><p class="small muted">${esc(m.tags.join(' · '))}${!memoryAccessible(scene,m)?' · 需要打开部件':''}</p><button data-read="${esc(m.id)}" class="secondary">打开记忆</button>${ctx.authoring()?` <button data-edit="${esc(m.id)}" class="secondary">编辑</button>`:''}</article>`).join('')||'<p class="muted">这里还没有可显示的记忆。可以先建立空间故事或记忆点，等模型导入后再绑定物品。</p>'}</div>`);
    $<HTMLInputElement>('memory-search').oninput=e=>{query=(e.target as HTMLInputElement).value;clearTimeout(searchTimer);const turn=generation;searchTimer=window.setTimeout(()=>{if(dialog.open&&turn===generation&&!draft){renderMemories();const field=$<HTMLInputElement>('memory-search');field.focus();field.setSelectionRange(query.length,query.length);}},250);};
    $<HTMLSelectElement>('memory-scope').onchange=e=>{const value=(e.target as HTMLSelectElement).value;scope=value==='all'?undefined:value==='space'?null:value.slice(5);renderMemories();};
    bind('memory-new',async()=>{const now=new Date().toISOString();draft=memorySchema.parse({id:crypto.randomUUID(),title:'新的记忆',nodeId:scope??null,createdAt:now,updatedAt:now});renderEditor();});
    dialog.querySelectorAll<HTMLButtonElement>('[data-read]').forEach(b=>b.onclick=()=>readMemory(scene.memories!.find(m=>m.id===b.dataset.read)!));
    dialog.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(b=>b.onclick=()=>{draft=structuredClone(scene.memories!.find(m=>m.id===b.dataset.edit)!);renderEditor();});
  }
  function blobURL(id:string) {
    const asset=ctx.scene().assets[id],bytes=ctx.files().get(asset.path);if(!bytes) return undefined;
    const url=URL.createObjectURL(new Blob([bytes.slice().buffer],{type:asset.mime}));urls.push(url);return url;
  }
  function readMemory(card:MemoryCard) {
    if(!ctx.authoring()&&!memoryAccessible(ctx.scene(),card)) {renderMemories();return;}
    shell(card.title,`<p class="small muted">${esc(card.date)} · ${esc(card.tags.join(' · '))}</p><div class="memory-prose">${esc(card.body)}</div><div id="memory-media"></div><p>${card.links.map(l=>`<a class="secondary" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title)} ↗</a>`).join(' ')}</p><div class="dialog-actions"><button id="memory-back" class="secondary">返回记忆列表</button>${card.nodeId?'<button id="memory-locate" class="secondary">找到这件物品</button>':''}${card.destination?'<button id="memory-destination" class="primary">进入关联空间</button>':''}</div>`);
    for(const attachment of card.attachments) {
      const asset=ctx.scene().assets[attachment.assetId],url=blobURL(attachment.assetId); if(!url) continue;
      const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=attachment.name;
      if(asset.mime?.startsWith('image/')) {const img=document.createElement('img');img.src=url;img.alt=attachment.name;figure.append(img);}
      else if(asset.mime?.startsWith('audio/')||asset.mime?.startsWith('video/')) {const media=document.createElement(asset.mime.startsWith('audio/')?'audio':'video');media.controls=true;media.preload='metadata';media.src=url;figure.append(media);}
      const download=document.createElement('a');download.href=url;download.download=attachment.name;download.textContent=asset.mime==='application/pdf'?'下载文档':'保存附件';download.className='small';figure.append(caption,download);$('memory-media').append(figure);
    }
    $('memory-back').onclick=renderMemories;
    bind('memory-locate',async()=>{dialog.close();ctx.focus(card.nodeId!);});
    bind('memory-destination',async()=>{const list:Space[]=await(await request('/api/library')).json(),dest=list.find(s=>s.sceneId===card.destination!.sceneId);if(!dest)throw new Error('关联空间还没有保存在此硬盘的空间库中');await openSpace(dest.key,undefined,card.destination?.nodeId);});
  }
  function readFields() {
    if(!draft) throw new Error('请先选择卡片');
    draft.title=$<HTMLInputElement>('mem-title').value.trim();draft.body=$<HTMLTextAreaElement>('mem-body').value;draft.date=$<HTMLInputElement>('mem-date').value.trim();
    draft.tags=[...new Set($<HTMLInputElement>('mem-tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean))];
    draft.nodeId=$<HTMLSelectElement>('mem-node').value||null;
    const control=$<HTMLSelectElement>('mem-gate').value;draft.reveal=control?{nodeId:control,minimum:Number($<HTMLInputElement>('mem-minimum').value)/100}:undefined;
    const destination=$<HTMLSelectElement>('mem-destination').value;draft.destination=destination?{sceneId:destination,...(draft.destination?.sceneId===destination&&draft.destination.nodeId?{nodeId:draft.destination.nodeId}:{})}:undefined;
    draft.links=$<HTMLTextAreaElement>('mem-links').value.split('\n').map(s=>s.trim()).filter(Boolean).map(url=>({title:draft!.links.find(l=>l.url===url)?.title??url.slice(0,160),url}));
  }
  function renderEditor() {
    if(!draft) return;const m=draft,scene=ctx.scene();
    shell('编辑记忆',`<form id="memory-editor"><label>标题<input id="mem-title" maxlength="160" value="${esc(m.title)}" required></label>
    <div class="memory-columns"><label>时间（允许大致年份）<input id="mem-date" maxlength="100" placeholder="例如：2018 年暑假" value="${esc(m.date)}"></label><label>标签，用逗号分隔<input id="mem-tags" value="${esc(m.tags.join('，'))}"></label></div>
    <label>故事与记忆<textarea id="mem-body" rows="8" maxlength="20000">${esc(m.body)}</textarea></label><div class="memory-prompts">${['它是怎么来到这里的？','和谁有关？发生过什么？','它为什么值得留下？'].map(p=>`<button type="button" class="secondary small" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <label>关联位置<select id="mem-node"><option value="">空间故事（不绑定物品）</option>${scene.nodes.map(n=>`<option value="${esc(n.id)}" ${m.nodeId===n.id?'selected':''}>${esc(n.name)}</option>`).join('')}</select></label>
    <div class="memory-columns"><label>何时可见<select id="mem-gate"><option value="">始终可见</option>${scene.nodes.filter(n=>n.joint).map(n=>`<option value="${esc(n.id)}" ${m.reveal?.nodeId===n.id?'selected':''}>打开 ${esc(n.name)} 后</option>`).join('')}</select></label><label>至少打开到 / %<input id="mem-minimum" type="number" min="1" max="100" value="${Math.round((m.reveal?.minimum??0.5)*100)}"></label></div>
    <label>照片、录音、视频或 PDF<input id="mem-files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.pdf"></label><p class="small muted">每份附件最多 20 MB，和模型一起计入 256 MB 项目包；保留原文件，不自动转写或上传。</p>
    <div>${m.attachments.map((a,i)=>`<p>${esc(a.name)} <button type="button" data-remove-attachment="${i}" class="secondary small">移除附件</button></p>`).join('')}</div><button id="mem-record" type="button" class="secondary">${recorder?.state==='recording'?'停止并加入录音':'录一段声音'}</button>
    <label>关联网页（每行一个 http / https 地址）<textarea id="mem-links" rows="2">${esc(m.links.map(l=>l.url).join('\n'))}</textarea></label>
    <label>关联其他空间<select id="mem-destination"><option value="">不关联</option>${spaces.map(s=>`<option value="${esc(s.sceneId)}" ${m.destination?.sceneId===s.sceneId?'selected':''}>${esc(s.title)}</option>`).join('')}${m.destination&&!spaces.some(s=>s.sceneId===m.destination!.sceneId)?`<option value="${esc(m.destination.sceneId)}" selected>原关联空间（此硬盘尚未保存）</option>`:''}</select></label>
    <div class="dialog-actions"><button id="mem-cancel" type="button" class="secondary">取消</button><button type="submit" class="primary">保存卡片到当前空间</button><button id="mem-delete" type="button" class="danger-link">删除这张卡片</button></div></form>`);
    $<HTMLFormElement>('memory-editor').oninput=()=>{draftDirty=true;};
    $<HTMLFormElement>('memory-editor').onsubmit=e=>{e.preventDefault();void action(async()=>{
      if(recorder?.state==='recording') throw new Error('请先停止录音，再保存卡片');
      readFields();const card=memorySchema.parse({...draft,updatedAt:new Date().toISOString()}),next=structuredClone(ctx.scene()),nextFiles=new Map(ctx.files());
      next.memories=[...(next.memories??[]).filter(x=>x.id!==card.id),card];
      for(const [id,p] of pending) if(card.attachments.some(a=>a.assetId===id)){next.assets[id]=p.asset;nextFiles.set(p.asset.path,p.bytes);}
      cleanup(next,nextFiles);ensureSize(nextFiles);await ctx.commit(parseScene(next),nextFiles);draftDirty=false;draft=undefined;renderMemories();message('卡片已加入当前编辑。点击主界面“保存到硬盘”持久保存。');
    });};
    $('mem-cancel').onclick=()=>{if(discard())renderMemories();};
    bind('mem-delete',async()=>{if(!confirm('从当前空间移除这张卡片？已保存的历史版本仍保留。'))return;const next=structuredClone(ctx.scene()),nextFiles=new Map(ctx.files());next.memories=(next.memories??[]).filter(x=>x.id!==m.id);cleanup(next,nextFiles);await ctx.commit(next,nextFiles);draftDirty=false;generation++;stopMic();renderMemories();});
    dialog.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach(b=>b.onclick=()=>{const field=$<HTMLTextAreaElement>('mem-body');field.value+=(field.value?'\n\n':'')+b.dataset.prompt+'\n';draftDirty=true;field.focus();});
    dialog.querySelectorAll<HTMLButtonElement>('[data-remove-attachment]').forEach(b=>b.onclick=()=>{readFields();const removed=draft!.attachments.splice(Number(b.dataset.removeAttachment),1);if(removed[0])pending.delete(removed[0].assetId);draftDirty=true;renderEditor();});
    $<HTMLInputElement>('mem-files').onchange=()=>void action(async()=>{
      if(recorder)throw new Error('请先停止录音，再添加其他附件');
      const selected=[...($<HTMLInputElement>('mem-files').files??[])];readFields();
      for(const file of selected) await addAttachment(file);
      renderEditor();
    });
    bind('mem-record',async()=>{
      if(recorder?.state==='recording'){recorder.stop();return;}
      if(recorder)throw new Error('正在整理上一段录音，请稍等');
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('此浏览器不能录音，请导入手机录音文件');
      readFields();const turn=generation,cardId=draft!.id;
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(turn!==generation||draft?.id!==cardId){stream.getTracks().forEach(t=>t.stop());return;}
      microphone=stream;const mime=['audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!mime){stopMic();throw new Error('不支持当前浏览器的录音格式，请导入音频文件');}
      let rec:MediaRecorder;
      try { rec=recorder=new MediaRecorder(stream,{mimeType:mime}); } catch(e) { stream.getTracks().forEach(t=>t.stop());microphone=undefined;throw e; }
      const chunks:Blob[]=[];let bytes=0,oversize=false;
      rec.ondataavailable=e=>{bytes+=e.data.size;if(bytes>20*1024**2){oversize=true;if(rec.state==='recording')rec.stop();}else chunks.push(e.data);};
      rec.onerror=()=>{stream.getTracks().forEach(t=>t.stop());if(recorder===rec)recorder=undefined;message('录音没有完成，请重新录制或导入文件');};
      rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(recorder===rec)recorder=undefined;
        if(turn!==generation||draft?.id!==cardId)return;
        void action(async()=>{if(oversize)throw new Error('录音超过 20 MB，没有加入附件，请缩短录音');readFields();await addAttachment(new File(chunks,`录音-${Date.now()}.${mime==='audio/mp4'?'m4a':mime==='audio/ogg'?'ogg':'webm'}`,{type:mime}),mime);renderEditor();});
      };
      try { rec.start(1000); } catch(e) { stream.getTracks().forEach(t=>t.stop());recorder=undefined;microphone=undefined;throw e; }
      draftDirty=true;$('mem-record').textContent='停止并加入录音';message('正在录音；点击停止后加入当前卡片。');
    });
  }
  async function addAttachment(file:File,mimeOverride?:string) {
    if(!draft) return;
    if(file.size===0||file.size>20*1024**2)throw new Error(`${file.name} 为空或超过 20 MB`);
    if(draft.attachments.length>=30)throw new Error('每张卡片最多 30 个附件');
    const extension=file.name.split('.').pop()?.toLowerCase()??'',mime=mimeOverride??mimeByExtension[extension];
    if(!mime)throw new Error('只支持照片、常见音频/视频和 PDF');
    const id=crypto.randomUUID(),path=`assets/memory-${id}.${extension}`;
    const bytes=new Uint8Array(await file.arrayBuffer());
    const total=[...ctx.files().values()].reduce((n,b)=>n+b.length,0)+[...pending.values()].reduce((n,p)=>n+p.bytes.length,0)+bytes.length;
    if(total>MAX_BUNDLE_BYTES-1024*1024)throw new Error('模型和附件合计超过当前项目包容量');
    pending.set(id,{asset:{path,type:'media',mime:mime as RoomScene['assets'][string]['mime'],provenance:'imported'},bytes});
    draft.attachments.push({assetId:id,name:file.name});draftDirty=true;
  }
  function cleanup(scene:RoomScene,files:Map<string,Uint8Array>) {
    const used=referencedAssets(scene);
    for(const [id,a] of Object.entries(scene.assets)) if(a.type==='media'&&!used.has(id)){delete scene.assets[id];files.delete(a.path);}
  }
  function ensureSize(files:Map<string,Uint8Array>) {if([...files.values()].reduce((n,b)=>n+b.length,0)>MAX_BUNDLE_BYTES-1024*1024)throw new Error('项目包容量不足');}
  async function renderProviders() {
    const turn=generation;
    const catalog:{id:string;title:string;availability:string;message:string}[]=await(await request('/api/reconstruction/providers')).json();
    const drafts:{id:string;provider:string;message:string;createdAt:string;sceneId:string}[]=await(await request('/api/reconstruction/requests')).json();
    if(turn!==generation||!dialog.open)return;
    shell('生成入口与后续接入',`<p class="muted">房间和独立物品最终使用同一套场景格式。下面保存的是接入计划，不会启动训练、连接学校或调用收费服务。</p><div class="memory-grid">${catalog.map(p=>`<article class="memory-card"><h3>${esc(p.title)}</h3><p>${esc(p.message)}</p><span class="small muted">${p.availability==='handoff'?'已有交接入口':'尚未启用执行'}</span></article>`).join('')}</div>
    <form id="provider-form"><label>生成方式<select id="provider-choice">${catalog.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('')}</select></label><label>用途<select id="provider-purpose"><option value="room">房间</option><option value="object">独立物品</option><option value="clean-background">干净背景</option></select></label><label>备注<textarea id="provider-notes" maxlength="2000"></textarea></label><button class="secondary" type="submit">保存后续接入计划</button></form><h3>当前空间的计划</h3>${drafts.filter(d=>d.sceneId===ctx.scene().id).map(d=>`<p class="small">${esc(catalog.find(p=>p.id===d.provider)?.title ?? d.provider)} · ${esc(d.message)} · ${esc(new Date(d.createdAt).toLocaleString('zh-CN'))}</p>`).join('')||'<p class="muted">还没有计划记录。</p>'}`);
    $<HTMLFormElement>('provider-form').onsubmit=e=>{e.preventDefault();void action(async()=>{
      await request('/api/reconstruction/requests','POST',JSON.stringify({sceneId:ctx.scene().id,captureId:ctx.scene().captureId,provider:$<HTMLSelectElement>('provider-choice').value,purpose:$<HTMLSelectElement>('provider-purpose').value,quality:'balanced',notes:$<HTMLTextAreaElement>('provider-notes').value}));
      await renderProviders();message('已保存计划，尚未提交生成。');
    });};
  }
  return {
    openLibrary:()=>void openPanel('library').catch(e=>message(e.message)),
    openProviders:()=>void openPanel('providers').catch(e=>message(e.message)),
    openMemories:async(node?:string)=>{try{await openPanel('memories');if(dialog.open&&panel==='memories'&&!draft){scope=node;renderMemories();}}catch(e){message(e instanceof Error?e.message:'无法读取记忆');}},
    dispose:()=>{generation++;clearTimeout(searchTimer);stopMic();clearMedia();window.removeEventListener('beforeunload',warnUnsaved);dialog.remove();},
  };
}
