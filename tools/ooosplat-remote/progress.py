#!/usr/bin/env python3
"""Read only the current OOOSplat production pipeline, refresh every 30s."""
import json
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parent

def read(path):
    try:return json.loads(path.read_text())
    except (OSError,ValueError):return {}

def tail(path,n=10):
    try:
        with path.open('rb') as f:
            f.seek(max(0,path.stat().st_size-20000));text=f.read().decode(errors='replace')
        return '\n'.join(text.replace('\r','\n').splitlines()[-n:])
    except OSError:return ''

def counts():
    p=ROOT/'work/colmap/database.db'
    if not p.exists():return '?','?'
    con=None
    try:
        con=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True,timeout=.2)
        a=con.execute('SELECT count(*) FROM keypoints').fetchone()[0]
        b=con.execute('SELECT count(*) FROM two_view_geometries WHERE rows>0').fetchone()[0]
        return a,b
    except sqlite3.Error:return '?','?'
    finally:
        if con:con.close()

def show():
    jobs=read(ROOT/'jobs.json');s=read(ROOT/'status.json')
    print('MemoryRoom · OOOSplat 学校任务\n'+'='*62)
    print('引擎：COLMAP 4.2.1 → OOOBrush ooo-v1.0.0（不是 Splatfacto）')
    ids=','.join(str(v) for k,v in jobs.items() if k.endswith('_job'))
    account=''
    if ids:
        p=subprocess.run(['sacct','-j',ids,'-X','--format=JobID,JobName,State,ExitCode,Elapsed'],capture_output=True,text=True)
        account=p.stdout
        print(account)
    a,b=counts()
    labels={'feature_extraction':'照片特征提取','matching':'照片匹配','mapping':'房间配准',
            'ready_for_training':'配准完成，等待GPU训练','training':'OOOBrush高斯训练',
            'completed':'模型已生成','failed':'处理失败'}
    print('当前阶段：'+labels.get(s.get('stage'),'等待启动'))
    print('照片数：493；特征已处理：%s；有效匹配图像对：%s'%(a,b))
    print('配准后端：CPU/Ceres（官方CUDA包要求580驱动，学校为570）')
    print('训练后端：OOOBrush / Vulkan GPU，均衡档 15000 步')
    r=read(ROOT/'registration-report.json')
    if r:
        print('选中模型：%s，相机 %s/%s，三维点 %s'%(r.get('selected_model'),r.get('registered_images'),r.get('input_images'),r.get('points')))
        if r.get('warning'):print('覆盖警告：当前配准不完整，模型可能仅包含部分房间。')
    if s.get('stage')=='failed':print('错误：'+str(s.get('error')))
    print('\n最新引擎进度：')
    stage=s.get('stage')
    name={'feature_extraction':'colmap-features.log','matching':'colmap-matching.log',
          'mapping':'colmap-mapper.log','training':'ooobrush-training.log','completed':'ooobrush-training.log'}.get(stage)
    if stage=='failed':
        name='ooobrush-training.log' if s.get('failed_stage')=='train' else 'colmap-mapper.log'
    if name:print(tail(ROOT/'logs'/name,12))
    if s.get('stage')=='completed':print('\n学校模型位置：'+str(s.get('output'))+'\n模型尚需下载回Mac，成片质量尚未验收。')
    print('\n每30秒刷新；Ctrl+C仅关闭查看，不取消学校作业。')
    return s.get('stage') in ('completed','failed')

try:
    while True:
        if sys.stdout.isatty():print('\033[2J\033[H',end='')
        ended=show();sys.stdout.flush()
        if '--watch' not in sys.argv or ended:break
        time.sleep(30)
except KeyboardInterrupt:
    print('\n已关闭进度窗口，任务继续由Slurm管理。')
