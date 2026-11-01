/** OOOSplat's documented local Streamable HTTP transport; no app configuration edits. */
const endpoint = 'http://127.0.0.1:39877/mcp';
export class OOOSplatClient {
  private session?: string;
  private protocol = '2025-03-26';
  private serial = 0;
  private initialized = false;
  private async send(method: string, params: unknown, notification = false): Promise<any> {
    const id = notification ? undefined : ++this.serial;
    const response = await fetch(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        ...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
        ...(this.initialized ? { 'MCP-Protocol-Version': this.protocol } : {}) },
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }),
    });
    if (!response.ok) throw new Error(`OOOSplat 连接未完成（${response.status}）。请确认已打开支持 MCP 的版本，并在设置中启用本地连接。`);
    this.session = response.headers.get('mcp-session-id') ?? this.session;
    if (notification || response.status === 202) { await response.body?.cancel(); return; }
    let reply: any;
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body!.getReader(), decoder = new TextDecoder(); let buffer = '', size = 0;
      try {
        for (;;) {
          const part = await reader.read(); if (part.done) break;
          size += part.value.length; if (size > 4 * 1024 * 1024) throw new Error('OOOSplat 返回数据过大');
          buffer += decoder.decode(part.value, { stream: true }); buffer = buffer.replace(/\r\n/g, '\n');
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
            if (!data) continue;
            const event = JSON.parse(data); if (event.id === id) { reply = event; break; }
          }
          if (reply) break;
        }
      } finally { await reader.cancel(); }
    } else reply = await response.json();
    if (!reply || reply.id !== id) throw new Error('OOOSplat 未返回对应操作的结果；请查看原任务，不要重复新建');
    if (reply.error) throw new Error(reply.error.message ?? 'OOOSplat 操作失败');
    return reply.result;
  }
  async connect() {
    const response = await this.send('initialize', { protocolVersion: this.protocol, capabilities: {}, clientInfo: { name: 'MemoryRoom', version: '0.5.0' } });
    this.protocol = response.protocolVersion; this.initialized = true;
    await this.send('notifications/initialized', {}, true);
    const list = await this.send('tools/list', {});
    const names = new Set((list.tools ?? []).map((t: { name: string }) => t.name));
    for (const name of ['get_app_status', 'create_generation_task', 'start_task', 'get_task_status']) {
      if (!names.has(name)) throw new Error('此 OOOSplat 版本缺少任务接口，请使用文件夹交接方式');
    }
  }
  async call(name: string, args: object): Promise<any> {
    const result = await this.send('tools/call', { name, arguments: args });
    if (result.isError) throw new Error((result.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') || 'OOOSplat 返回错误');
    if (result.structuredContent) return result.structuredContent;
    const content = (result.content ?? []).find((c: any) => c.type === 'text');
    if (!content) throw new Error('OOOSplat 未提供结构化结果');
    return JSON.parse(content.text);
  }
  async close() {
    if (!this.session) return;
    try { await fetch(endpoint, { method: 'DELETE', redirect: 'error', signal: AbortSignal.timeout(3000), headers: { 'Mcp-Session-Id': this.session, 'MCP-Protocol-Version': this.protocol } }); } catch { /* Disconnect never cancels a submitted job. */ }
  }
}
