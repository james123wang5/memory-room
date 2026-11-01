import json,sys,tomllib,urllib.request
from pathlib import Path
config=tomllib.loads((Path.home()/'.codex/config.toml').read_text())['mcp_servers']['anysearch']
headers={**config.get('http_headers',{}),'Content-Type':'application/json','Accept':'application/json, text/event-stream'}
def rpc(method,params,i):
 request=urllib.request.Request(config['url'],data=json.dumps({'jsonrpc':'2.0','id':i,'method':method,'params':params}).encode(),headers=headers)
 with urllib.request.urlopen(request,timeout=55) as response:
  session=response.headers.get('Mcp-Session-Id')
  if session:headers['Mcp-Session-Id']=session
  body=response.read().decode()
  if body.lstrip().startswith('{'):return json.loads(body)
  for line in body.splitlines():
   if line.startswith('data:'):
    event=json.loads(line[5:])
    if event.get('id')==i:return event
  raise RuntimeError('No matching MCP response')
def main():
 request=json.load(sys.stdin)
 rpc('initialize',{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'research','version':'1.0'}},1)
 if request['name']=='list':
  r=rpc('tools/list',{},2)
  r=[t for t in r.get('result',{}).get('tools',[]) if t['name']=='score']
 else:r=rpc('tools/call',request,2)
 print(json.dumps(r,ensure_ascii=False))
if __name__=='__main__':
 try:main()
 except Exception as e:print(json.dumps({'error_type':type(e).__name__}));sys.exit(1)
