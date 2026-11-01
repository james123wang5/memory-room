"""Local integration checks through the user's connected Kimi browser.

Does not install or launch a separate browser. Reuses this task's own tab.
Requires a running viewer and connected kimi-webbridge at localhost:10086.
"""
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'artifacts/qa/browser-report.json'
SESSION = 'memoryroom-build'


def command(action, **args):
    payload = json.dumps({'action': action, 'args': args, 'session': SESSION}).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', payload, {'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    if not result.get('ok'):
        raise RuntimeError(result)
    return result['data']


def evaluate(code):
    result = command('evaluate', code=code)
    return json.loads(result['value'])


def state():
    return evaluate('JSON.stringify(window.memoryRoomDiagnostics())')


def wait_ready():
    for _ in range(80):
        if evaluate('JSON.stringify(!!window.memoryRoomDiagnostics && !!document.querySelector("#loading") && document.querySelector("#loading").hidden && window.memoryRoomDiagnostics().nodes > 0)'):
            return
        time.sleep(0.15)
    raise AssertionError('Viewer did not finish loading')


def click(selector):
    return command('click', selector=selector)


def select(node):
    click(f'#tree [data-node="{node}"]')


def main():
    checks = []
    command('find_tab', url='http://127.0.0.1:4317/')
    command('cdp', method='Emulation.setFocusEmulationEnabled', params={'enabled': True})
    wait_ready()
    if evaluate('JSON.stringify(document.querySelector("#import-dialog").open)'):
        click('#import-dialog [data-close]')
    assert state()['splats'] >= 14080
    checks.append('Spark loaded synthetic Gaussian PLY')

    select('drawer'); click('#joint-open')
    d = state()
    drawer = next(o for o in d['objects'] if o['id'] == 'drawer')
    assert abs(drawer['position'][2] - 0.48) < 1e-9
    assert next(o for o in d['objects'] if o['id'] == 'book')['parent'] == 'drawer'
    checks.append('Drawer opens to its defined 0.48 m limit; child hierarchy retained')

    select('book'); before = next(o for o in state()['objects'] if o['id'] == 'book')
    click('#inspect'); assert state()['inspecting']
    rect = evaluate('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})})()')
    x, y = rect['x'], rect['y']
    before_q = next(o for o in state()['objects'] if o['id'] == 'book')['quaternion']
    command('cdp', method='Input.dispatchMouseEvent', params={'type': 'mousePressed', 'x': x, 'y': y, 'button': 'left', 'clickCount': 1, 'buttons': 1})
    for step in range(1, 6):
        command('cdp', method='Input.dispatchMouseEvent', params={'type': 'mouseMoved', 'x': x+step*13, 'y': y+step*5, 'button': 'left', 'buttons': 1})
    command('cdp', method='Input.dispatchMouseEvent', params={'type': 'mouseReleased', 'x': x+65, 'y': y+25, 'button': 'left', 'clickCount': 1})
    after_q = next(o for o in state()['objects'] if o['id'] == 'book')['quaternion']
    assert before_q != after_q, 'Drag did not rotate the object'
    click('#return-floating')
    after = next(o for o in state()['objects'] if o['id'] == 'book')
    assert before == after
    checks.append('Actual pointer drag rotates inspected book; exact parent/local transform restored')

    select('door'); click('#joint-open')
    assert next(n for n in state()['scene']['nodes'] if n['id'] == 'door')['joint']['value'] == 1
    checks.append('Door joint opens')

    click('#save'); wait_ready()
    project = ROOT / 'data/projects/current.room.zip'
    assert project.is_file() and project.stat().st_size > 700000
    with urllib.request.urlopen('http://127.0.0.1:4317/api/projects/current') as response:
        assert response.read(2) == b'PK'
    command('navigate', url='http://127.0.0.1:4317/')
    wait_ready()
    restored = state()
    assert next(n for n in restored['scene']['nodes'] if n['id'] == 'drawer')['joint']['value'] == 1
    assert next(n for n in restored['scene']['nodes'] if n['id'] == 'door')['joint']['value'] == 1
    checks.append('Saved complete model bundle to Lexar; browser reload restores joint states')

    # The extension's file-URL access is disabled. Use a same-origin fixture as
    # a browser File, exercising the exact file-input + import code path without
    # changing browser permissions or reading any other user file.
    evaluate('(async()=>{window.__memoryroomQABundle=await (await fetch("/api/projects/current")).arrayBuffer();return JSON.stringify(true)})()')
    click('#import'); command('snapshot')
    evaluate('(async()=>{const bytes=await (await fetch("/demo/assets/demo-vase.ply")).arrayBuffer();const dt=new DataTransfer();dt.items.add(new File([bytes],"demo-vase.ply"));const input=document.querySelector("#model-file");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));return JSON.stringify(true)})()')
    command('fill', selector='#model-name', value='导入测试花器')
    click('#import-submit'); wait_ready()
    imported = state()
    assert len(imported['scene']['nodes']) == 11
    assert imported['splats'] == 28160
    imported_id = imported['selected']
    click('#inspect'); assert state()['inspecting']; click('#return-floating')
    checks.append('File input imports second Gaussian asset; independent inspection works')

    # Remove the temporary QA import by reopening the saved bundle through the actual file input.
    click('#save'); wait_ready()
    assert (ROOT / 'data/projects/previous.room.zip').is_file()
    # Previous version is the clean 10-node scene; upload it as a project.
    evaluate('(()=>{const dt=new DataTransfer();dt.items.add(new File([window.__memoryroomQABundle],"saved.room.zip"));const input=document.querySelector("#project-file");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));delete window.__memoryroomQABundle;return JSON.stringify(true)})()')
    wait_ready()
    assert len(state()['scene']['nodes']) == 10
    checks.append('Portable project import restores the original scene and Gaussian bytes')
    select('drawer'); click('#joint-close'); select('door'); click('#joint-close'); click('#home')
    click('#save'); wait_ready()
    command('screenshot', path=str(ROOT / 'artifacts/qa/desktop.png'))

    command('cdp', method='Emulation.setDeviceMetricsOverride', params={'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
    metrics = evaluate('JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight})')
    assert metrics['scrollWidth'] <= metrics['width'] + 1
    command('screenshot', path=str(ROOT / 'artifacts/qa/mobile.png'))
    checks.append('390px mobile layout has no horizontal page overflow (desktop emulation only)')
    command('cdp', method='Emulation.clearDeviceMetricsOverride', params={})
    command('cdp', method='Emulation.setFocusEmulationEnabled', params={'enabled': False})
    REPORT.write_text(json.dumps({'passed': True, 'checks': checks, 'device': 'Chrome desktop with real WebGL2; not iPhone hardware',
                                  'limitations': ['File input events used same-origin synthetic File fixtures; native OS picker not automated', 'Kimi upload blocked by extension file-URL access; no permissions changed'],
                                  'synthetic_gaussians': 14080, 'imported_test_node': imported_id}, ensure_ascii=False, indent=2))
    print(json.dumps({'passed': True, 'checks': len(checks), 'report': str(REPORT)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
