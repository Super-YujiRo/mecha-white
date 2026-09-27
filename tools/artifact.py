#!/usr/bin/env python3
"""Pack a claude.ai artifact copy (assets inlined as base64 in assets.js) into /tmp/claude-0/art/."""
import os,json,base64,shutil
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O='/home/claude/art/'
os.makedirs(O,exist_ok=True)
man=json.load(open(R+'/assets/manifest.json'));M={}
for k,m in man.items():
    b=base64.b64encode(open(R+'/assets/'+m['f'],'rb').read()).decode()
    M[k]={'w':m['w'],'h':m['h'],'d':b} if 'w' in m else b
open(O+'assets.js','w').write('window.MW_ASSETS='+json.dumps(M)+';')
shutil.copy(R+'/game.js',O+'game.js')
html=open(R+'/index.html').read().replace('<script src="game.js','<script src="assets.js"></script><script src="game.js')
open(O+'index.html','w').write(html);print('ok',os.path.getsize(O+'assets.js'))
