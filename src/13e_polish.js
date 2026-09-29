// ================================================================ polish: fade buildings that hide your character, armor you can see
// ---- occluder fade (story mode): anything big between the camera and you turns see-through as a whole
const OCC={t:0,list:[],lt:0,faded:new Set()},_oRay=new T.Ray(),_oP=new T.Vector3(),_oHit=new T.Vector3();
function occCandidates(){const L=[];const add=o=>{if(o&&o.visible!==false)L.push(o)};
  for(const id in G.stations||{})for(const o of G.stations[id].parts||[])add(o);for(const h of G.houses||[])add(h.g);for(const k in G.towerV||{})add(G.towerV[k].g);
  if(G.townS)for(const g of G.townS.list)if(g.visible)for(const c of g.children)add(c);
  if(G.advV&&G.advV.visible)for(const c of G.advV.children)add(c);
  for(const k in G.dgV||{}){const V=G.dgV[k];if(V.visible)for(const c of V.children)if(c.isMesh&&c.geometry&&c.geometry.type==='BoxGeometry')add(c)}
  if(G.abyV&&G.abyV.visible)for(const c of G.abyV.children)if(c.isMesh&&c.geometry&&c.geometry.type==='BoxGeometry')add(c);if(G.monV&&G.monV.visible)add(G.monV);if(G.pzV&&G.pzV.userData&&G.pzV.userData.door)add(G.pzV.userData.door);return L}
function occBox(o){if(!o.userData._ob||o.userData._obT!==o.visible){o.updateMatrixWorld(true);o.userData._ob=new T.Box3().setFromObject(o);o.userData._obT=o.visible}return o.userData._ob}
function occSet(o,on){o.traverse(m=>{if(!m.isMesh||!m.material)return;const U=m.userData;if(on){if(!U._fm){U._fm=m.material;m.material=m.material.clone();m.material.skinning=!!U._fm.skinning;m.material.morphTargets=!!U._fm.morphTargets;m.material.transparent=true;m.material.depthWrite=false}m.material.opacity=.28}else if(U._fm){m.material.dispose&&m.material.dispose();m.material=U._fm;U._fm=null}})}
function occFx(){if(!G||!running)return;const on=isRPG(),me=G.players[G.me]||G.players[0];const now=performance.now();
  if(!on||!me){if(OCC.faded.size){for(const o of OCC.faded)occSet(o,false);OCC.faded.clear()}return}
  if(now-OCC.lt>2000){OCC.lt=now;OCC.list=occCandidates();for(const o of OCC.list)o.userData._ob=null}if(now-OCC.t<120)return;OCC.t=now;
  _oP.set(me.x,26+(me.jz||0),me.y);const d=camera.position.distanceTo(_oP);_oRay.origin.copy(camera.position);_oRay.direction.copy(_oP).sub(camera.position).normalize();
  const want=new Set();for(const o of OCC.list){const b=occBox(o);if(b.isEmpty())continue;if(b.max.y<34)continue;const h=_oRay.intersectBox(b,_oHit);if(h&&camera.position.distanceTo(_oHit)<d-28)want.add(o)}
  for(const o of OCC.faded)if(!want.has(o)){occSet(o,false);OCC.faded.delete(o)}for(const o of want)if(!OCC.faded.has(o)){occSet(o,true);OCC.faded.add(o)}}
// ---- armor pieces on the character (shoulder guards + chest plate, colored by the equipped armor)
function armorCol(id){const n=(ITEMS[id]&&ITEMS[id].n)||'';return /氷|霜/.test(n)?['#bfe9ff','#4fb8ff']:/星|勇者|太陽|王/.test(n)?['#ffd76a','#ffb020']:/鋼|鉄/.test(n)?['#aab3bd',null]:/クモ|包帯/.test(n)?['#f3ecdf',null]:/殻|サソリ/.test(n)?['#b0503a',null]:/古木|盾/.test(n)?['#9a6a3a',null]:/狼|牙/.test(n)?['#e8e8f0',null]:['#8a7058',null]}
function armorPiece(p,m){if(!m.kk||!m.model)return;const id=isRPG()&&p.eq?p.eq.a:null;if(m._aid===id)return;m._aid=id;if(m.armorV){m.armorV.parent&&m.armorV.parent.remove(m.armorV);m.armorV=null}if(!id)return;
  const bone=m.model.getObjectByName('chest')||m.model.getObjectByName('spine');if(!bone)return;const [c,e]=armorCol(id);const mat=std(c,{m:.55,r:.35,e:e||undefined,ei:e?.3:0});const g=new T.Group();
  const S=m.model.scale.x||1;g.scale.setScalar(1/S);
  for(const s of [-1,1]){const sh=at(scl(sph(6.5,mat,true,10,7),1.2,.7,1.1),s*11,9,0);g.add(sh);g.add(at(rot(cone(2,5,mat,5),0,0,s*-.5),s*14,12,0))}
  g.add(at(box(17,11,4,mat,true),0,3,6.5));g.add(at(box(6,6,1,std(e||'#ffe38a',{e:e||'#ffb020',ei:.5}),false),0,4,8.8));bone.add(g);m.armorV=g}
// ---- keep the sandworm in its valley
function wormLeash(){if(!ADV())return;for(const b of G.bears){if(b.nm!=='巨大サンドワーム'||b.dead)continue;const d=dist(b.x,b.y,VALLEY.x,VALLEY.y),R=360;if(d>R){b.x=VALLEY.x+(b.x-VALLEY.x)/d*R;b.y=VALLEY.y+(b.y-VALLEY.y)/d*R;b.m.g.position.set(b.x,0,b.y)}}}
