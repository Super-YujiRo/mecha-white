# Builds assets/bt_Bear.glb (polar bear) by reshaping the CC0 Quaternius wolf in Blender (pip install bpy). Run from the repo root: python3 tools/mkbear.py
import bpy,mathutils,sys
from collections import defaultdict
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='assets/bt_Wolf.glb')
me=bpy.data.objects['Wolf'];arm=bpy.data.objects['AnimalArmature']
B={b.name:b for b in arm.data.bones}
gn={g.index:g.name for g in me.vertex_groups}
def cat(n):
  if n.startswith('Tail'):return 'tail'
  if n.startswith('Ear'):return 'ear'+n[-1]
  if n=='Head':return 'head'
  if n.startswith('Neck'):return 'neck'
  if any(k in n for k in ('Leg','FF','IK','Shoulder')):return 'leg'
  return 'body'
P=lambda n:mathutils.Vector(B[n].head_local)
tail0=P('Tail1');hc=P('Head');earL=P('Ear1.L');earR=P('Ear1.R')
# leg centroids per dominant group
cent=defaultdict(lambda:[0,0,0,0])
for v in me.data.vertices:
  if not v.groups:continue
  g=max(v.groups,key=lambda g:g.weight);n=gn[g.group]
  if cat(n)=='leg':c=cent[n];c[0]+=v.co.x;c[1]+=v.co.z;c[2]+=1
for n,c in cent.items():c[0]/=c[2];c[1]/=c[2]
YC=-0.017
for v in me.data.vertices:
  if not v.groups:continue
  w=defaultdict(float)
  for g in v.groups:w[cat(gn[g.group])]+=g.weight
  s=sum(w.values()) or 1
  for k in w:w[k]/=s
  co=v.co.copy();o=co.copy()
  # stubby tail
  if w['tail']>0:t=tail0+(o-tail0)*0.18;co=co.lerp(t,w['tail'])
  # small round ears
  for side,base in (('L',earL),('R',earR)):
    we=w['ear'+side]
    if we>0:t=base+(o-base)*0.26;t.y=base.y+(o.y-base.y)*0.22;co=co.lerp(t,we)
  # ears that are skinned to the head: pull the pointed tips down into small round ears
  for base in (earL,earR):
    if (o-base).length<0.0055 and o.y<base.y-0.0004:
      t=base+(o-base)*0.33;co=co.lerp(t,min(1,w['head']+w['earL']+w['earR']+w['neck']))
  # head: shorter snout, wider skull
  wh=w['head']+0.6*(w['earL']+w['earR'])
  if w['head']>0:
    t=co.copy()
    t=hc+(t-hc)*1.22
    if t.z<hc.z:t.z=hc.z+(t.z-hc.z)*0.55
    t.x=t.x*1.2
    co=co.lerp(t,w['head'])
  # shorter neck: pull head/neck back & a little down
  wn=w['head']+w['earL']+w['earR']+0.55*w['neck']
  if wn>0:co=co+mathutils.Vector((0,0.0012,0.0042))*wn
  # heavy body
  wb=w['body']+0.5*w['neck']
  if wb>0:
    t=co.copy();t.x*=1.45;t.y=YC+(t.y-YC)*1.2
    if w['body']>0 and t.y<YC and -0.012<o.z<0.0:t.y-=0.0016  # shoulder hump
    co=co.lerp(t,wb)
  # thick legs
  if w['leg']>0:
    g=max(v.groups,key=lambda g:g.weight);n=gn[g.group]
    if n in cent:
      c=cent[n];t=co.copy();k=1.9 if any(q in n for q in ('Lower','FF','IK')) else 1.6;t.x=c[0]*1.25+(t.x-c[0])*k;t.z=c[1]+(t.z-c[1])*k;co=co.lerp(t,w['leg'])
  v.co=co
# colors
def setc(n,c):
  m=bpy.data.materials.get(n)
  if m and m.use_nodes:
    for nd in m.node_tree.nodes:
      if nd.type=='BSDF_PRINCIPLED':nd.inputs['Base Color'].default_value=c
setc('Main',(0.9,0.87,0.79,1));setc('Main_Light',(0.98,0.97,0.95,1));setc('Nose',(0.03,0.03,0.035,1))
for a in bpy.data.actions:a.name=a.name.replace('AnimalArmature|','AnimalArmature|')
ob=[o for o in bpy.data.objects if o.name=='Icosphere']
for o in ob:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.export_scene.gltf(filepath='assets/bt_Bear.glb',export_format='GLB',export_animations=True,export_animation_mode='ACTIONS')
print('done')
