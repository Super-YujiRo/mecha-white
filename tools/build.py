#!/usr/bin/env python3
"""Build: concatenates src/*.js (in name order) into game.js inside one closure,
and writes index.html from tools/index.template.html with a cache-busting build id."""
import glob,os,time,sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
build=time.strftime('%Y%m%d%H%M%S')
parts=[open(f,encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(R,'src','*.js')))]
game="/* めちゃホワイト — built from src/*.js by tools/build.py. Edit the sources, not this file. */\n(()=>{const BUILD='"+build+"';"+''.join(parts)+"})();\n"
open(os.path.join(R,'game.js'),'w',encoding='utf-8').write(game)
tpl=open(os.path.join(R,'tools','index.template.html'),encoding='utf-8').read()
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(tpl.replace('@@BUILD@@',build))
print('built',build,len(game),'bytes')
