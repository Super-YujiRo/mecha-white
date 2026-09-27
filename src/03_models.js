// ================================================================ models: items
let _meatM=null;const MEATM=()=>_meatM||(_meatM=new T.MeshStandardMaterial({vertexColors:true,roughness:.45}));
function meatGeo(ck){const ex=(sh,d,bv)=>{const g=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,curveSegments:10});g.rotateX(-Math.PI/2);g.translate(0,bv,0);return g};
  const L=[],paint=(g,hex)=>{g=g.index?g.toNonIndexed():g;for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);const c=lin(hex),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new T.BufferAttribute(a,3));L.push(g)};
  // body: top face and sides in different reds (group 0 = caps, 1 = sides)
  const body=ex(meatShape(),2.9,.75).toNonIndexed();const top=ck?lin('#8c4521'):lin('#d8303e'),side=ck?lin('#5e2c14'):lin('#a51e2d');const n=body.attributes.position.count,ca=new Float32Array(n*3);
  for(const gr of body.groups){const c=gr.materialIndex===0?top:side;for(let i=gr.start;i<gr.start+gr.count;i++){ca[i*3]=c.r;ca[i*3+1]=c.g;ca[i*3+2]=c.b}}
  for(const k of Object.keys(body.attributes))if(k!=='position'&&k!=='normal')body.deleteAttribute(k);body.setAttribute('color',new T.BufferAttribute(ca,3));body.clearGroups();L.push(body);
  const fat=ex(meatFatShape(),3.1,.72);fat.scale(1.03,1,1.03);fat.translate(0,-.1,0);paint(fat,ck?'#d9a052':'#f6e3d2');
  const b1=new T.CylinderGeometry(1.25,1.4,7,8);b1.rotateZ(Math.PI/2);b1.translate(-12.5,2.2,1);paint(b1,'#f4ecdc');const b2=new T.SphereGeometry(2.1,10,6);b2.scale(1,.9,1.25);b2.translate(-16.2,2.2,1);paint(b2,'#f4ecdc');
  if(ck){for(const x of[-6,-1.5,3]){const g=new T.BoxGeometry(1.3,.3,10);g.rotateY(.55);g.translate(x,4.45,0);paint(g,'#2e1406')}}
  else{for(const [x,z,sx,sz,r] of[[-3.5,-.5,3.6,.8,.4],[2.5,-2.6,3,.6,-.3],[-.5,2.6,2.2,.55,.1]]){const g=new T.SphereGeometry(1,8,4);g.scale(sx,.12,sz);g.rotateY(r);g.translate(x,4.42,z);paint(g,'#f7d0cb')}}
  return T.BufferGeometryUtils.mergeBufferGeometries(L)}
function meatFatShape(){const s=new T.Shape();s.moveTo(1.2,7.25);s.bezierCurveTo(8.5,6.4,11.5,2.5,10.4,-1.6);s.bezierCurveTo(10,-3.4,9,-4.6,8,-5.2);s.bezierCurveTo(8.6,-2,8.2,2.4,5.4,4.6);s.bezierCurveTo(4,5.6,2.6,6,1.2,7.25);return s}
function meatShape(){const s=new T.Shape();s.moveTo(-10.5,-1);s.bezierCurveTo(-11,5,-4,8,2.5,7.2);s.bezierCurveTo(8.5,6.4,11.5,2.5,10.4,-1.6);s.bezierCurveTo(9.4,-5.6,4.8,-7.4,-.4,-6.6);s.bezierCurveTo(-5.5,-5.8,-10,-5,-10.5,-1);return s}
const ITEM_H={water:10,salt:6,meat:4.6,steak:4.6,fish:5,grfish:5,fur:5.2,coat:6,log:8.5,coal:7,cash:3};
function itemMesh(k){
  if(k==='meat'||k==='steak')return M_(geo(k==='steak'?'steakAll':'meatAll',()=>meatGeo(k==='steak')),MEATM());
  if(k==='fish'||k==='grfish'){const c=k==='grfish'?'#d38a3a':'#6f93b0';const b=scl(sph(6,c,true,14,10),1.6,.7,1);b.position.y=2.6;return grp(b,at(rot(cone(4,6,c,4),0,0,Math.PI/2),-11,2.6,0),at(sph(1,'#16283a',false,6,4),7,3.6,3.5),k==='grfish'?at(rot(cyl(.6,.6,26,'#d9b27a',5),0,0,Math.PI/2),0,2.6,0):null)}
  if(k==='fur')return grp(at(rbox(20,5,16,2.4,std('#f3ece0',{r:1})),0,2.6,0),at(sph(3,std('#e6dccb',{r:1}),false,8,6),7,4,5));
  if(k==='coat')return grp(at(rbox(20,5,15,1.6,'#b03a48'),0,2.5,0),at(box(20.4,1.6,4,std('#f6efe4',{r:1}),false),0,4.6,-5.5),at(box(1,.6,10,'#ffd166',false),0,5.2,1));
  if(k==='log')return grp(rot(cyl(4.4,4.4,20,std('#7a4f2c',{map:TEX.bark}),10),0,0,Math.PI/2),at(rot(cyl(3.8,3.8,.6,'#e8bb82',10,false),0,0,Math.PI/2),10.2,0,0));
  if(k==='coal')return scl(M_(geo('coal',()=>new T.DodecahedronGeometry(6,0)),std('#2a2d33',{flat:true,r:.6,m:.2})),1,.8,1);
  if(k==='water')return grp(at(cyl(6.5,5,9,std('#b8683a',{r:.8}),10),0,4.5,0),at(cyl(3,5,3,std('#a45a30',{r:.8}),10,false),0,10,0),at(rot(M_(new T.CircleGeometry(3,10),std('#3fa7e0',{r:.1,e:'#1e6fa8',ei:.4}),false),-Math.PI/2,0,0),0,11.6,0));
  if(k==='salt')return grp(at(rot(box(9,6,7,std('#f7f1f4',{r:.4})),0,.3,0),0,3,0),at(rot(box(6,5,5,std('#f3d9e2',{r:.4})),.2,.8,.1),5,2.5,3),at(rot(box(5,4,5,std('#ffffff',{r:.3})),0,1.2,.2),-5,2,-2));
  if(k==='cash')return grp(rbox(20,2.6,11,.8,'#3fc157'),at(box(13,.4,6,'#8ff08f',false),0,1.4,0));
}
// stack of mixed items (on backs, shelves, piles)
class Stack{constructor(parent,layout){this.g=new T.Group();parent.add(this.g);this.items=[];this.layout=layout||'col';this.h=0}
  set(kinds,wob){const n=Math.min(kinds.length,36);let y=0;
    for(let i=0;i<n;i++){const k=kinds[i];let it=this.items[i];if(!it||it.k!==k){if(it)this.g.remove(it.m);const m=itemMesh(k);m.traverse(o=>{if(o.isMesh)o.renderOrder=6});this.g.add(m);it=this.items[i]={k,m}}
      it.m.visible=true;
      if(this.layout==='col'){it.m.position.set(Math.sin(i*.6)*.6+(wob||0)*i*.22,k==='log'?y+4.4:y,0);it.m.rotation.set(0,k==='log'?Math.PI/2:Math.sin(i*1.7)*.08,0);y+=ITEM_H[k]}
      else if(this.layout==='pile'){const c=i%4,l=Math.floor(i/4);it.m.position.set(c%2?11:-11,l*ITEM_H[k],c<2?-6.5:6.5);it.m.rotation.y=Math.sin(i*3.1)*.06;y=(l+1)*ITEM_H[k]}
      else if(this.layout==='pair'){const c=i%2,l=Math.floor(i/2);it.m.position.set(c?5:-5,l*ITEM_H[k]+(k==='log'?4.4:0),0);it.m.rotation.y=k==='log'?Math.PI/2:0;y=(l+1)*ITEM_H[k]}}
    for(let i=n;i<this.items.length;i++)this.items[i].m.visible=false;this.h=y}
  fill(k,n){if(!this._a)this._a=[];const a=this._a;a.length=0;for(let i=0;i<n;i++)a.push(k);this.set(a)}}

// ================================================================ models: characters
const HERO=[{coat:'#ff7a33',coat2:'#d94f18',scarf:'#1fb3a6',mit:'#1fb3a6',tag:'#ff9a55',tagText:'1P'},{coat:'#3d8bf0',coat2:'#2464c2',scarf:'#ffd23f',mit:'#ffd23f',tag:'#7fc3ff',tagText:'2P'}];
const SKIN='#ffd9bf',FUR='#fbf5ec';
function coatGeo(){return geo('coatL',()=>{const pts=[[0,0],[11.5,0],[12.8,1.5],[12.4,7],[11,13],[9.6,18],[8.4,21],[0,21.5]].map(([x,y])=>new T.Vector2(x,y));return new T.LatheGeometry(pts,22)})}
function face(head,r,o){ // eyes with highlights, brows, cheeks, mouth
  const z=r*.93;
  for(const s of [-1,1]){const e=scl(sph(r*.16,std('#1d1410',{r:.25}),false,12,10),1,1.25,.55);e.position.set(s*r*.34,r*.02,z);head.add(e);
    head.add(at(sph(r*.055,basic('#ffffff'),false,8,6),s*r*.34-r*.05,r*.12,z+r*.08));
    const ch=M_(geo('cheek',()=>new T.CircleGeometry(1,16)),std('#ff9d93',{t:true,op:.7}),false);ch.scale.setScalar(r*.18);ch.position.set(s*r*.58,-r*.24,r*.8);ch.rotation.y=s*.62;head.add(ch);
    if(o&&o.brow){const b=rot(box(r*.28,r*.06,1,'#3a2618',false),0,0,s*-.15);b.position.set(s*r*.34,r*.32,z-.3);head.add(b)}}
  const mouth=M_(geo('mouth',()=>new T.TorusGeometry(1,.35,6,12,Math.PI)),std('#8a3a2a'),false);mouth.rotation.z=Math.PI;mouth.scale.setScalar(r*.12);mouth.position.set(0,-r*.3,r*.95);head.add(mouth);
  head.add(at(sph(r*.08,std('#ffb49a'),false,8,6),0,-r*.12,r*.99));
}
function limb(len,r,m,handM){const p=new T.Group();p.add(at(cyl(r,r*.85,len,m,10),0,-len/2,0));p.add(at(sph(r*1.25,handM||m,true,10,8),0,-len,0));return p}
// ================================================================ 3D assets: KayKit (CC0, Kay Lousberg)
let KK=null;const KK_HIDE=/Shield|Sword|Axe|Crossbow|Staff|Wand|Spellbook|Knife|Throwable|Mug|Offhand/;
async function fetchAssets(){let man;try{man=await (await fetch('assets/manifest.json?v='+BUILD)).json()}catch(e){console.warn('manifest',e);return null}const A={},keys=Object.keys(man);let done=0;const el=$('loading');
  await Promise.all(keys.map(async k=>{const m=man[k];const r=await fetch('assets/'+m.f+'?v='+BUILD);if(!r.ok)throw new Error('asset '+m.f+' '+r.status);const buf=await r.arrayBuffer();A[k]=m.w?{w:m.w,h:m.h,d:buf}:buf;done++;if(el)el.textContent=`素材を読み込み中… ${done}/${keys.length}`}));return A}
function b64Assets(M){const A={},u=b=>{const s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a.buffer};for(const k in M){const v=M[k];A[k]=typeof v==='string'?u(v):{w:v.w,h:v.h,d:u(v.d)}}return A}
async function loadKK(){if(!T.GLTFLoader||!T.SkeletonUtils)return;const L=new T.GLTFLoader(),A=window.MW_ASSETS?b64Assets(window.MW_ASSETS):await fetchAssets();if(!A)return;
  const parse=buf=>new Promise((res,rej)=>L.parse(buf.slice(0),'',res,rej));
  const out={chars:{},h:{},clips:{},kit:{},kitW:{},kitH:{}};
  for(const n of ['Knight','Barbarian','Mage','Rogue','Rogue_Hooded']){const g=await parse(A['ch_'+n]);g.scene.traverse(o=>{if(o.isMesh&&KK_HIDE.test(o.name))o.visible=false});const bb=new T.Box3();g.scene.traverse(o=>{if(o.isMesh&&o.visible){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone();bb.union(b)}});out.chars[n]=g.scene;out.h[n]=Math.max(1,bb.max.y-bb.min.y)}
  out.h.Knight=3.1;out.h.Barbarian=3.0;out.h.Mage=3.3;out.h.Rogue=2.55;out.h.Rogue_Hooded=2.55;
  const an=await parse(A.anims);for(const c of an.animations)out.clips[c.name]=c;
  const kit=await parse(A.kit);for(const sc of kit.scenes){sc.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});const bb=new T.Box3().setFromObject(sc);out.kit[sc.name]=sc;out.kitW[sc.name]=bb.max.x-bb.min.x;out.kitH[sc.name]=bb.max.y-bb.min.y}
  const dtex=k=>{const t=A[k];if(!t)return null;const u=new Uint8Array(t.d);const x=new T.DataTexture(u,t.w,t.h,T.RGBAFormat);x.encoding=T.sRGBEncoding;x.wrapS=x.wrapT=T.RepeatWrapping;x.magFilter=T.LinearFilter;x.minFilter=T.LinearMipmapLinearFilter;x.generateMipmaps=true;x.needsUpdate=true;return x};
  const snow=(m,a)=>{m.vertexColors=true;m.onBeforeCompile=sh=>{sh.uniforms.uSnow=window.SNOWU;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSnow;').replace('#include <color_fragment>','diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.96,1.),clamp(vColor.r*'+a.toFixed(2)+'*uSnow,0.,1.));')}};
  out.nat={};out.natH={};const TX={leaf:dtex('tx_leaf'),bark:dtex('tx_bark'),rock:dtex('tx_rock'),bush:dtex('tx_bush'),dead:dtex('tx_dead'),grass:dtex('tx_grass'),peb:dtex('tx_peb')};
  if(TX.leaf)for(const k of ['pine5','pine4','rock1','rock2','rock3','bush','dead','grass','peb']){if(!A[k])continue;const g=await parse(A[k]);g.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material,n=m.name||'';
      if(/Leaves_Pine/.test(n)){m.map=TX.leaf;m.alphaTest=.4;m.side=T.DoubleSide;m.color.setScalar(2.1);snow(m,.5)}else if(/TwistedTree/.test(n)){m.map=TX.leaf;m.alphaTest=.4;m.side=T.DoubleSide;m.color.setRGB(1.7,2,1.8);snow(m,.55)}else if(/Bark_Dead/.test(n)){m.map=TX.dead;snow(m,.6)}else if(/Bark/.test(n)){m.map=TX.bark;snow(m,.6)}else if(/Grass/.test(n)){m.map=TX.grass;m.alphaTest=.4;m.side=T.DoubleSide;m.color.setScalar(1.4);snow(m,.45)}else if(/PathRocks/.test(n)){m.map=TX.peb;snow(m,.7)}else{m.map=TX.rock;snow(m,.8)}m.needsUpdate=true;o.castShadow=true;o.receiveShadow=true});
    const bb=new T.Box3().setFromObject(g.scene);out.nat[k]=g.scene;out.natH[k]=bb.max.y-bb.min.y}
  out.beast={};out.prop={};for(const k of Object.keys(A)){if(/^bt_/.test(k)){try{const g=await parse(A[k]);const n=k.slice(3),clips={};for(const c of g.animations){clips[c.name.split('|').pop().replace(/^(Spider|Rat)_/,'')]=c}g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});const bb=new T.Box3().setFromObject(g.scene);out.beast[n]={scene:g.scene,clips,h:bb.max.y-bb.min.y,l:Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)}}catch(e){console.warn('beast',k,e)}}
    else if(/^pr_/.test(k)){try{const g=await parse(A[k]);g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true}});const bb=new T.Box3().setFromObject(g.scene);out.prop[k.slice(3)]={scene:g.scene,h:bb.max.y-bb.min.y,w:Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)}}catch(e){console.warn('prop',k,e)}}}
  KK=out}
function kkProp(name,width){const src=KK.kit[name];const o=src.clone(true);const s=width/(KK.kitW[name]||1);const g=new T.Group();o.scale.setScalar(s);g.add(o);return g}
function kkChar(name,o){o=o||{};const model=T.SkeletonUtils.clone(KK.chars[name]);const S=(o.height||40)/KK.h[name];model.scale.setScalar(S);
  const tint=lin(o.tint||'#ffffff'),mats=[],mm=new Map();
  model.traverse(n=>{if(!n.isMesh)return;n.renderOrder=6;if(KK_HIDE.test(n.name)){n.visible=false;return}let c=mm.get(n.material);if(!c){c=n.material.clone();c.color.copy(tint);mm.set(n.material,c);mats.push(c)}n.material=c;n.castShadow=!o.noShadow;n.frustumCulled=false});
  const g=new T.Group();g.add(model,blob(o.blob||13));
  const mixer=new T.AnimationMixer(model),acts={};for(const k in KK.clips)acts[k]=mixer.clipAction(KK.clips[k]);acts.Idle.play();mixer.update(Math.random()*2);
  const hs=model.getObjectByName('handslot.r')||model;const hand=new T.Group();hand.scale.setScalar(1/S);hs.add(hand);
  const d=()=>new T.Group();const back=at(new T.Group(),0,o.backY||12,-13);g.add(back);
  const r={g,model,kk:{mixer,acts,cur:'Idle',want:null,last:performance.now()},legL:d(),legR:d(),armL:d(),armR:d(),head:d(),body:d(),back,hand,mats,coatM:mats[0],hatM:mats[0],skinM:mats[0],base:{coat:tint.clone(),hat:tint.clone(),skin:tint.clone()}};
  const tool=(k)=>{if(k==='gun'){const cb=KK.kit.crossbow.clone(true);cb.rotation.set(0,0,0);const w=new T.Group();w.add(cb);const fl=at(sph(.14,basic('#fff2b0',{transparent:true,opacity:.95}),false,8,6),0,0,.6);fl.visible=false;w.add(fl);w.userData.flash=fl;hs.add(w);return w}
    if(k==='axe'||k==='pick'){const a=KK.kit.axe1.clone(true);const w=new T.Group();w.add(a);hs.add(w);return w}
    if(k==='rod'){const a=KK.kit.staff.clone(true);const w=new T.Group();w.add(a);hs.add(w);return w}return null};
  r.mkTool=tool;return r}
function kkAct(m,name){const k=m.kk;if(!k||k.cur===name||!k.acts[name])return;const a=k.acts[name],b=k.acts[k.cur];a.reset();a.setEffectiveTimeScale(1);a.play();if(b)a.crossFadeFrom(b,.18,false);k.cur=name}
function kkTick(m,moving,run){const k=m.kk;if(!k)return;const now=performance.now(),dt=Math.min(.1,(now-k.last)/1000);k.last=now;if(k.paused)return;
  kkAct(m,k.want||(moving?(run?'Running_A':'Walking_A'):'Idle'));k.want=null;k.mixer.update(dt)}
const CLS={Rogue_Hooded:{n:'クロスボウ',d:'ふつうの遠距離。安全に戦える',rng:190,rate:1,dmg:1,anim:'1H_Ranged_Shooting',w:null,fx:'bolt'},
  Rogue:{n:'大型クロスボウ',d:'射程が一番長く一撃が重い。連射は遅い',rng:250,rate:1.6,dmg:2.2,anim:'2H_Ranged_Shooting',w:['2H_Crossbow'],fx:'bolt'},
  Knight:{n:'剣と盾',d:'近づいて斬る。受けるダメージ40%減・狼が少しひるむ・斬ると少し回復',rng:90,rate:.9,dmg:2,anim:'1H_Melee_Attack_Slice_Diagonal',w:['1H_Sword','Round_Shield'],fx:'slash',armor:.6,stun:.35,heal:2},
  Barbarian:{n:'大斧',d:'回転斬りで周りの狼をまとめて攻撃・受けるダメージ20%減',rng:105,rate:1.15,dmg:1.9,cleave:true,anim:'2H_Melee_Attack_Spin',w:['2H_Axe'],fx:'spin',armor:.8,stun:.2,heal:1.5},
  Mage:{n:'魔法の杖',d:'魔法弾が爆発して周りにもダメージ。群れに強い',rng:215,rate:1.15,dmg:1.3,splash:70,anim:'Spellcast_Shoot',w:['2H_Staff'],fx:'magic'}};
const clsOf=p=>CLS[(G&&G.charOf&&G.charOf[G.players.indexOf(p)])||'Rogue_Hooded']||CLS.Rogue_Hooded;
const armorOf=t=>G.players.includes(t)?(clsOf(t).armor||1)*(1-Math.min(.6,eqv(t,'def')+(isRPG()?(rlv(t)-1)*.02:0))):1;
function heroKK(look,i){const nm=(G&&G.charOf&&G.charOf[i])||(i?'Knight':'Rogue_Hooded');const r=kkChar(KK.chars[nm]?nm:'Rogue_Hooded',{height:52,blob:15});
  r.gun=r.mkTool('gun');r.gun.visible=false;r.axe=r.mkTool('axe');r.rod=r.mkTool('rod');r.rod.visible=false;
  const cl=CLS[nm]||CLS.Rogue_Hooded;r.cls=cl;if(cl.w){r.clsW=cl.w.map(n=>r.model.getObjectByName(n)).filter(Boolean);for(const o of r.clsW){o.traverse(q=>{q.visible=true});o.visible=false}const fl={visible:false};r.gun=new T.Group();r.gun.userData.flash=fl;r.g.add(r.gun)}
  const ring=at(rot(M_(geo('pring',()=>new T.RingGeometry(16,19.5,32)),basic(look.tag,{transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0),0,.7,0);
  const ice=M_(geo('pice',()=>new T.IcosahedronGeometry(26,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.7,roughness:.08,metalness:.1,flatShading:true}),false);ice.scale.set(1,1.45,1);ice.position.y=28;ice.visible=false;
  r.g.add(ring,ice);r.ice=ice;r.back.position.set(0,14,-12);return r}
const KK_ROLE={hunter:['Barbarian','#ffffff'],lumber:['Barbarian','#e6f3dc'],fisher:['Rogue','#e2f0ff'],cashier:['Mage','#fff0e6'],stoker:['Barbarian','#ffe9d6'],guard:['Knight','#ffffff'],splitter:['Barbarian','#fff6d6']};
const KK_TOWN=['Rogue','Rogue_Hooded','Mage','Barbarian','Knight'];
function villagerKK(pal,o){const pi=Math.max(0,PALS.indexOf(pal));let name=KK_TOWN[pi%KK_TOWN.length],tint=new T.Color('#ffffff').lerp(new T.Color(pal.coat),.28).getStyle();
  if(o.tool==='gun'&&o.hat==='ushanka')name=o.beard?'Barbarian':'Knight';else if(o.tool==='axe'&&o.plaid)name='Barbarian';else if(o.tool==='rod')name='Rogue';else if(o.apron)name='Mage';
  const r=kkChar(name,{height:(o.scale||1)*46,noShadow:o.noShadow,tint:o.tool?'#ffffff':tint});r.tool=o.tool?r.mkTool(o.tool):null;if(r.tool&&o.tool==='gun')r.tool.userData.flash=r.tool.userData.flash;if(o.scale)r.g.scale.setScalar(1);return r}

function makeHero(look){if(KK)return heroKK(look,HERO.indexOf(look));
  const g=new T.Group(),coat=std(look.coat,{r:.7}),fur=std(FUR,{r:1});
  const legL=at(new T.Group(),-4.2,8,0),legR=at(new T.Group(),4.2,8,0);
  for(const l of [legL,legR]){l.add(at(cyl(3.3,3,6,'#2f3c55',10),0,-3,0));l.add(at(scl(sph(4.6,'#4a2f22',true,12,8),1,.75,1.35),0,-6.4,1.4));l.add(at(rot(tor(3.6,1.3,fur,false,6,14),Math.PI/2,0,0),0,-4,0))}
  const body=new T.Group();body.add(at(M_(coatGeo(),coat),0,6,0));body.add(at(rot(M_(geo('furB',()=>fluffy(12.2,2.6)),fur),Math.PI/2,0,0),0,7.2,0));
  body.add(at(box(1.4,17,1.2,std(look.coat2),false),0,15,10.6));body.add(at(rbox(6,4.5,1.4,.6,look.coat2,false),-5.5,11,10.3));body.add(at(rbox(6,4.5,1.4,.6,look.coat2,false),5.5,11,10.3));
  // wooden carry frame on the back
  body.add(at(box(14,20,2,std('#8a5a30',{map:TEX.wood}),true),0,16,-10.5));body.add(at(box(16,2.5,10,'#6e4524'),0,6.5,-14));
  const head=at(new T.Group(),0,37,0);
  head.add(at(sph(14.2,coat,true,20,14),0,1.2,-3));
  head.add(at(M_(geo('furH',()=>fluffy(10.6,3.8,30)),fur),0,0,5.2));
  const faceG=at(new T.Group(),0,-.5,1.2);faceG.add(sph(11.5,std(SKIN,{r:.6}),true,22,16));face(faceG,11.5,{brow:true});head.add(faceG);
  head.add(at(sph(3,fur,true,10,8),0,15,-3));
  const scarf=at(rot(tor(9.2,2.8,look.scarf,true,8,20),Math.PI/2,0,0),0,27.5,0);
  const tail=at(rot(rbox(5,12,2.4,.8,look.scarf),.25,0,0),-6,21,-8.5);
  const armL=at(new T.Group(),-11,25.5,0),armR=at(new T.Group(),11,25.5,0);armL.add(limb(11,3,coat,std(look.mit)));armR.add(limb(11,3,coat,std(look.mit)));
  const axe=new T.Group();axe.add(at(cyl(1.3,1.3,25,'#7a5234',8),0,-1,0));axe.add(at(rbox(2.4,9,10,.8,std('#c7d2dc',{m:.6,r:.35})),0,8,4.5));axe.add(at(box(2.6,9.4,1.2,std('#eef4f8',{m:.7,r:.2}),false),0,8,9.5));axe.position.set(0,-12,0);armR.add(axe);
  const gun=new T.Group();gun.add(at(rbox(4.2,5.2,13,1,std('#7a4f2c',{map:TEX.wood})),0,0,-2));gun.add(at(rot(cyl(1.5,1.5,24,std('#2b3440',{m:.5,r:.4}),8),Math.PI/2,0,0),0,1.4,15));gun.add(at(box(3.6,2.6,7,std('#46505e',{m:.4,r:.4})),0,3.6,6));
  const flash=at(sph(5.5,basic('#fff2b0',{transparent:true,opacity:.95}),false,8,6),0,1.4,28);flash.visible=false;gun.add(flash);gun.userData.flash=flash;gun.position.set(0,22,10);
  const rod=new T.Group();rod.add(at(rot(cyl(.7,.9,40,'#5a3a22',6),-.9,0,0),0,8,14));rod.position.set(0,-10,0);armR.add(rod);rod.visible=false;
  const back=at(new T.Group(),0,10,-17);
  const ring=at(rot(M_(geo('pring',()=>new T.RingGeometry(16,19.5,32)),basic(look.tag,{transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0),0,.7,0);
  keep(axe);keep(rod);bake(body);bake(head);bake(legL);bake(legR);bake(armL);bake(armR);
  const ice=M_(geo('pice',()=>new T.IcosahedronGeometry(26,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.7,roughness:.08,metalness:.1,flatShading:true}),false);ice.scale.set(1,1.45,1);ice.position.y=28;ice.visible=false;
  g.add(blob(15),legL,legR,body,head,scarf,tail,armL,armR,gun,back,ring,ice);inkOutline(body);inkOutline(head);[legL,legR,armL,armR].forEach(inkOutline);
  return{g,legL,legR,armL,armR,head,body,axe,gun,rod,back,ice}
}
const PALS=[{coat:'#8a5236',hat:'#3e5a74'},{coat:'#4a66a0',hat:'#c23b2f'},{coat:'#7a7338',hat:'#6a3f70'},{coat:'#9a3f5e',hat:'#2f6a58'},{coat:'#3f7a74',hat:'#a8652a'},{coat:'#b0503a',hat:'#d4a632'},{coat:'#5a4a8a',hat:'#e07a3a'}];
function makeVillager(pal,o={}){if(KK)return villagerKK(pal,o);
  const g=new T.Group(),coatM=stdU(pal.coat,{r:.75}),hatM=stdU(pal.hat,{r:.85}),skinM=stdU(SKIN,{r:.6}),fur=std(FUR,{r:1});
  const legL=at(new T.Group(),-3.6,7,0),legR=at(new T.Group(),3.6,7,0);for(const l of [legL,legR]){l.add(at(cyl(2.9,2.7,5,'#3d3a44',8),0,-2.5,0));l.add(at(scl(sph(4,'#3a2618',true,10,8),1,.75,1.35),0,-5.6,1.2))}
  const body=new T.Group();body.add(at(scl(M_(coatGeo(),coatM),.85,.85,.85),0,5,0));body.add(at(rot(M_(geo('furV',()=>fluffy(10.4,2.2)),fur),Math.PI/2,0,0),0,6,0));
  if(o.apron)body.add(at(rbox(11,13,1.4,.5,'#fbf7ee',false),0,14,9.4));
  if(o.plaid){body.add(at(scl(M_(coatGeo(),std('#2a4a2a',{r:.9}),false),.87,.08,.87),0,15,0));body.add(at(scl(M_(coatGeo(),std('#2a4a2a',{r:.9}),false),.9,.08,.9),0,10,0))}
  const head=at(new T.Group(),0,31,0);const fg=new T.Group();fg.add(M_(geo('vhead',()=>new T.SphereGeometry(9.6,20,14)),skinM));face(fg,9.6);head.add(fg);
  if(o.hat==='ushanka'){head.add(at(scl(sph(10.6,hatM,true,16,10),1,.72,1),0,5,-.5));for(const s of [-1,1])head.add(at(rbox(4,9,8,1.5,hatM),s*9.6,-1,0));head.add(at(rbox(18,4,3,1.2,fur),0,7,8))}
  else if(o.hat==='bucket'){head.add(at(cyl(8.5,10,6,hatM,16),0,8,0));head.add(at(cyl(14,14,1.2,hatM,18),0,5,0))}
  else if(o.hat==='visor'){head.add(at(M_(geo('vbean',()=>new T.SphereGeometry(10.1,16,8,0,TAU,0,Math.PI/2)),hatM),0,1.5,0));head.add(at(rbox(12,1.2,8,.5,hatM),0,2.5,9))}
  else if(o.hat==='top'){head.add(at(cyl(7,7,12,'#2a2230',14),0,12,0));head.add(at(cyl(11,11,1.2,'#2a2230',16),0,6.5,0));head.add(at(cyl(7.2,7.2,2,'#c23b2f',14,false),0,8,0))}
  else{head.add(at(M_(geo('beanie',()=>new T.SphereGeometry(10.2,16,8,0,TAU,0,Math.PI/2)),hatM),0,1.8,-.4));head.add(at(rot(tor(9.6,1.9,fur,false,6,18),Math.PI/2,0,0),0,2.4,-.4));head.add(at(sph(3,fur,true,8,6),0,12.4,-.4))}
  if(o.beard)head.add(at(scl(sph(6.6,'#6b3a1e',false,12,8),1,.8,.8),0,-5,5));
  const armL=at(new T.Group(),-9,22,0),armR=at(new T.Group(),9,22,0);armL.add(limb(9,2.6,coatM,std(pal.hat)));armR.add(limb(9,2.6,coatM,std(pal.hat)));
  let tool=null;
  if(o.tool==='axe'){tool=new T.Group();tool.add(at(cyl(1.2,1.2,22,'#7a5234',6),0,-2,0));tool.add(at(rbox(2,7,8,.6,std('#c7d2dc',{m:.6,r:.35})),0,7,3.6));tool.position.set(0,-10,0);armR.add(tool)}
  if(o.tool==='pick'){tool=new T.Group();tool.add(at(cyl(1.2,1.2,22,'#7a5234',6),0,-2,0));tool.add(at(rot(cone(1.8,18,std('#9aa6b2',{m:.6,r:.35}),6),Math.PI/2,0,0),0,9,0));tool.position.set(0,-10,0);armR.add(tool)}
  if(o.tool==='gun'){tool=new T.Group();tool.add(at(rbox(3.6,4.5,10,.8,std('#7a4f2c',{map:TEX.wood})),0,0,-2));tool.add(at(rot(cyl(1.3,1.3,20,std('#2b3440',{m:.5,r:.4}),8),Math.PI/2,0,0),0,1,12));const fl=at(sph(4.5,basic('#fff2b0',{transparent:true,opacity:.95}),false,8,6),0,1,23);fl.visible=false;tool.add(fl);tool.userData.flash=fl;tool.position.set(0,19,9);g.add(tool)}
  if(o.tool==='rod'){tool=new T.Group();tool.add(at(rot(cyl(.7,.9,38,'#5a3a22',6),-.9,0,0),0,8,14));tool.position.set(0,-9,0);armR.add(tool)}
  const back=at(new T.Group(),0,9,-12);const hand=at(new T.Group(),0,16,12);
  if(tool)keep(tool);bake(body);bake(head);bake(legL);bake(legR);bake(armL);bake(armR);
  g.add(blob(12),legL,legR,body,head,armL,armR,back,hand);if(o.scale)g.scale.setScalar(o.scale);if(o.noShadow)noShadow(g);
  return{g,legL,legR,armL,armR,head,body,tool,back,hand,coatM,hatM,skinM,base:{coat:lin(pal.coat),hat:lin(pal.hat),skin:lin(SKIN)}}
}
const ICEB=lin('#a8d8f0'),ICES=lin('#d6eefa');
function tintCold(v,k){if(v.mats){for(const m of v.mats)m.color.copy(v.base.coat).lerp(ICEB,k*.8);return}v.coatM.color.copy(v.base.coat).lerp(ICEB,k);v.hatM.color.copy(v.base.hat).lerp(ICEB,k);v.skinM.color.copy(v.base.skin).lerp(ICES,k)}
function animWalk(m,step,moving,amp=.7){if(m.kk){kkTick(m,moving,m.kkRun);return}const s=moving?Math.sin(step):0;m.legL.rotation.x=s*amp;m.legR.rotation.x=-s*amp;if(!m._armL)m.armL.rotation.set(-s*amp*.8,0,0);if(!m._armR)m.armR.rotation.set(s*amp*.8,0,0);m.body.position.y=moving?Math.abs(Math.cos(step))*1.4:Math.sin(performance.now()/400)*.3;m.head.position.y=(m._hy??(m._hy=m.head.position.y))+m.body.position.y}
function makeBear(kind,key){const r_=DES()?makeScorpion(kind):(beastKK(kind,key)||makeBear0(kind));r_.g.traverse(o=>{if(o.isMesh)o.renderOrder=6});return r_}
function makeScorpion(kind){const g=new T.Group();const c=kind==='boss'?'#3b1f18':kind==='big'?'#6e3522':'#9a5a32';const fur=stdU(c,{r:.55,m:.15}),dk=std('#2a1810',{r:.5}),eye=glow('#ff3b3b',2.4);
  g.add(at(scl(sph(12,fur,true,16,10),1.1,.55,1.5),0,11,0),at(scl(sph(8,fur,true,12,8),1,.55,1.1),0,11,-18));
  const head=at(new T.Group(),0,11,15);head.add(scl(sph(8,fur,true,12,8),1.1,.6,1));for(const sx of [-1,1]){const arm=at(new T.Group(),sx*7,0,4);arm.add(at(rot(cyl(2.2,2.2,12,fur,6),Math.PI/2,0,sx*.5),sx*3,0,6));const cl=at(scl(sph(5,fur,true,10,8),1,.6,1.5),sx*6,0,14);arm.add(cl);arm.add(at(rot(cone(1.8,8,dk,5),Math.PI/2,0,0),sx*8,0,20));head.add(arm)}
  const brow=grp(at(sph(1.3,eye,false,6,4),-2.5,3.5,6),at(sph(1.3,eye,false,6,4),2.5,3.5,6));brow.visible=false;head.add(brow);g.add(head);
  let prev=g,z=-28,y=12;const tail=new T.Group();g.add(tail);for(let i=0;i<5;i++){const seg=at(scl(sph(4.4-i*.5,fur,true,10,8),1,1,1.2),0,y+i*6.5,z-i*3+i*i*1.3);tail.add(seg)}tail.add(at(rot(cone(2.6,9,dk,6),-2.2,0,0),0,y+36,z+8));
  const legs=[-1,1].flatMap(sx=>[0,1]).map((_,i)=>{const sx=i<2?-1:1,zz=i%2?-6:6;const l=at(new T.Group(),0,10,zz);for(const k of [0,1]){const lg=at(rot(cyl(1.4,1,18,dk,5),0,0,sx*1.1),sx*(13+k*2),-4,k*7-3);l.add(lg)}g.add(l);return l});
  const ring=M_(geo('bring',()=>new T.RingGeometry(26,35,36)),new T.MeshBasicMaterial({color:lin('#ff3b4a'),transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=.9;g.add(ring);
  if(kind==='boss'){const gm=glow('#ffc629',.9);const cr=new T.Group();for(let i=0;i<5;i++){const a=i/5*TAU;cr.add(at(cone(1.6,5,gm,5),Math.cos(a)*5,3,Math.sin(a)*5))}cr.position.set(0,6,0);head.add(cr)}
  const bb=blob(30);bb.material=new T.MeshBasicMaterial({map:radialTex('rgba(10,20,40,.75)','rgba(10,20,40,0)'),transparent:true,depthWrite:false});g.add(bb);keep(brow);keep(ring);anim(head);legs.forEach(l=>anim(l));inkOutline(g);
  const sc=kind==='boss'?2.1:kind==='big'?1.35:1;g.scale.setScalar(sc);return{g,fur,head,legs,brow,ring}}

// ---- animated beasts (Quaternius, CC0): wolves in the snow, a stag for chargers
function beastKK(kind,key){const B=KK&&KK.beast;if(!B)return null;key=key||'Wolf';const src=B[key];if(!src)return null;
  const model=T.SkeletonUtils.clone(src.scene);const L=key==='Stag'?76:key==='Spider'?60:84;model.scale.setScalar(L/Math.max(1,src.l));
  const tint=kind==='boss'?'#f3f6fa':kind==='big'?'#8f98a3':'#e6edf4';const mats=new Map();let fur=null;
  model.traverse(o=>{if(!o.isMesh)return;const cl=m=>{let c=mats.get(m);if(!c){c=m.clone();c.metalness=0;c.roughness=Math.max(.6,c.roughness||0);mats.set(m,c);if(key==='Wolf'&&/Main/.test(m.name||'')){c.color.copy(lin(/Light/.test(m.name)?'#ffffff':tint));if(!fur&&!/Light/.test(m.name))fur=c}}return c};o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material)});
  if(!fur)fur=[...mats.values()].sort((a,b)=>(b.color.r+b.color.g+b.color.b)-(a.color.r+a.color.g+a.color.b))[0]||new T.MeshStandardMaterial();if(!fur.emissive)fur.emissive=new T.Color(0);
  const g=new T.Group();g.add(model);const mixer=new T.AnimationMixer(model),acts={};for(const k in src.clips)acts[k]=mixer.clipAction(src.clips[k]);const idle=acts.Idle;if(idle){idle.play();mixer.update(Math.random()*2)}
  const ring=M_(geo('bring',()=>new T.RingGeometry(26,35,36)),new T.MeshBasicMaterial({color:lin('#ff3b4a'),transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=.9;g.add(ring);
  const bb=blob(30);bb.material=new T.MeshBasicMaterial({map:radialTex('rgba(10,20,40,.75)','rgba(10,20,40,0)'),transparent:true,depthWrite:false});g.add(bb);
  const d=()=>new T.Group(),head=d(),brow=d();g.add(head,brow);const sc=kind==='boss'?2.1:kind==='big'?1.35:1;g.scale.setScalar(sc);
  return{g,fur,head,legs:[d(),d(),d(),d()],brow,ring,mx:{mixer,acts,cur:'Idle',last:performance.now()},key}}
function beastAct(m,name,once){const X=m.mx;if(!X.acts[name])name=name==='Attack'&&X.acts.Attack_Headbutt?'Attack_Headbutt':name==='Gallop'&&X.acts.Run?'Run':X.acts[name]?name:'Idle';if(X.cur===name||!X.acts[name])return;const a=X.acts[name],b=X.acts[X.cur];a.reset();a.setEffectiveTimeScale(1);if(once){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}a.play();if(b)a.crossFadeFrom(b,.2,false);X.cur=name}
function beastAnim(m,b){const X=m.mx,now=performance.now(),dt=Math.min(.1,(now-X.last)/1000);X.last=now;
  if(b.dead)beastAct(m,'Death',true);else if(b.hide)beastAct(m,'Idle');else if(b.swipe>0||b.ph==='ac'||b.ph==='ws'||b.ph==='we')beastAct(m,b.ph==='ac'?'Gallop':'Attack');else if(b.ph==='st')beastAct(m,'Idle_HitReact_Left');else if(b.moving)beastAct(m,(b.raid||b.state==='chase')?'Gallop':'Walk');else beastAct(m,'Idle');
  X.mixer.update(dt*(b.ph==='ac'?1.6:1))}

function makeBear0(kind){
  const dz_=DES(),g=new T.Group(),furC=dz_?(kind==='boss'?'#a8683a':'#c48a55'):(kind==='boss'?'#f3dcae':'#f7e8c8'),fur=stdU(furC,{r:.9}),shade=std(dz_?'#8e5c33':'#d8c29c',{r:1}),dark=std('#1d2228',{r:.25});
  const body=at(scl(sph(15,fur,true,22,16),1.08,1,1.62),0,19,0);g.add(body);g.add(at(scl(sph(12,fur,true,16,12),1,.9,1),0,27,-8));g.add(at(scl(sph(10,shade,false,14,10),1.1,.6,1.5),0,10,0));
  const head=at(new T.Group(),0,26,24);head.add(scl(sph(10.5,fur,true,20,14),1,.95,1.05));head.add(at(scl(sph(5.8,shade,true,14,10),1,.85,1.1),0,-2.8,9));head.add(at(scl(sph(2.4,dark,false,10,8),1.3,1,1),0,-1.4,14.6));
  for(const s of [-1,1]){head.add(at(sph(3.7,fur,true,10,8),s*6.6,8,-1));head.add(at(sph(1.9,std('#e8b8b8'),false,8,6),s*6.6,8,1.6));const e=scl(sph(1.6,dark,false,10,8),1,1.2,.8);e.position.set(s*4.2,3.2,8.8);head.add(e);head.add(at(sph(.55,basic('#ffffff'),false,6,4),s*4.2-.5,3.9,10))}
  const brow=grp(at(rot(box(4.4,1.3,1,dark,false),0,0,-.5),-4.2,6.4,9.4),at(rot(box(4.4,1.3,1,dark,false),0,0,.5),4.2,6.4,9.4));brow.visible=false;head.add(brow);
  let crown=null;if(kind==='boss'){crown=new T.Group();const gm=glow('#ffc629',.9);crown.add(at(cyl(7,7,4,gm,10),0,0,0));for(let i=0;i<6;i++){const a=i/6*TAU;crown.add(at(cone(1.8,6,gm,5),Math.cos(a)*6,4,Math.sin(a)*6))}crown.position.set(0,11,0);head.add(crown);for(const s of [-1,1])head.add(at(sph(1.3,glow('#ff3b3b',3),false,8,6),s*4.2,3.4,10.2))}
  g.add(head);
  const legs=[[-8,-14],[8,-14],[-8,14],[8,14]].map(([x,z])=>{const l=at(new T.Group(),x,15,z);l.add(at(cyl(5,4.4,14,fur,10),0,-6,0));l.add(at(scl(sph(5.2,fur,true,10,8),1,.55,1.2),0,-13.4,1.2));l.add(at(scl(sph(2.8,dark,false,8,6),1,.3,1),0,-14.8,4.4));g.add(l);return l});
  g.add(at(sph(3.2,fur,true,8,6),0,24,-26));
  const ring=M_(geo('bring',()=>new T.RingGeometry(26,35,36)),new T.MeshBasicMaterial({color:lin('#ff3b4a'),transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=.9;g.add(ring);
  const bb=blob(30);bb.material=new T.MeshBasicMaterial({map:radialTex('rgba(10,20,40,.75)','rgba(10,20,40,0)'),transparent:true,depthWrite:false});g.add(bb);keep(brow);if(crown)keep(crown);keep(ring);anim(head);legs.forEach(l=>{bake(l);anim(l)});bake(head);bake(g);inkOutline(g);
  const s=kind==='boss'?2.1:kind==='big'?1.35:1;g.scale.setScalar(s);
  return{g,fur,head,legs,brow,ring}
}

// ================================================================ instanced trees
const CHK=480,chunkKey=(x,y)=>Math.floor(x/CHK)+','+Math.floor(y/CHK);
function chunkBox(key,m){const [cx,cz]=key.split(',').map(Number);return new T.Box3(new T.Vector3(cx*CHK-m,-10,cz*CHK-m),new T.Vector3(cx*CHK+CHK+m,m+140,cz*CHK+CHK+m))}
class Forest{
  constructor(trees){this.trees=trees;const N=trees.length;const bark=std('#6b4630',{map:TEX.bark}),leaf=std('#2a6250',{r:.85,flat:true}),leaf2=std('#1f4e40',{r:.85,flat:true}),snowM=std('#f7fbff',{r:.9,flat:true});
    const VP=[];
    if(DES()){const cm=std('#5f9446',{r:.75}),fm=std('#f29ab8',{r:.7});const mk=(h,arms)=>{const L=[];const c=new T.CylinderGeometry(7,8,h,9);c.translate(0,h/2,0);L.push(c.toNonIndexed());const t=new T.SphereGeometry(7,9,6,0,TAU,0,Math.PI/2);t.translate(0,h,0);L.push(t.toNonIndexed());for(const [s,y,l] of arms){const a=new T.CylinderGeometry(4.5,4.5,l,8);a.rotateZ(Math.PI/2);a.translate(s*(l/2+5),y,0);L.push(a.toNonIndexed());const u=new T.CylinderGeometry(4.5,4.5,l*.9,8);u.translate(s*(l+5),y+l*.45,0);L.push(u.toNonIndexed());const ut=new T.SphereGeometry(4.5,8,5,0,TAU,0,Math.PI/2);ut.translate(s*(l+5),y+l*.9,0);L.push(ut.toNonIndexed())}return T.BufferGeometryUtils.mergeBufferGeometries(L.map(g=>{for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);return g}))};
      VP[0]=[{g:mk(62,[[1,26,13],[-1,36,10]]),m:cm,l:new T.Matrix4()},{g:new T.SphereGeometry(3,6,4),m:fm,l:new T.Matrix4().makeTranslation(0,69,0)}];VP[1]=[{g:mk(48,[[1,22,11]]),m:cm,l:new T.Matrix4()}];
      const sg=(()=>{const L=[];for(const [x,z,h,r,ry] of [[0,0,34,9,.2],[10,4,24,6,.9],[-9,5,20,6,-.5],[3,-9,18,5,1.4]]){const c=new T.CylinderGeometry(0,r,h*.35,6);c.translate(0,h*.82,0);const b=new T.CylinderGeometry(r,r*1.1,h*.65,6);b.translate(0,h*.33,0);for(const q of [c,b]){q.rotateY(ry);q.rotateZ(x*.02);q.translate(x,0,z);L.push(q.toNonIndexed())}}return T.BufferGeometryUtils.mergeBufferGeometries(L.map(g=>{for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);return g}))})();VP[2]=[{g:sg,m:std('#f6e8ef',{r:.25,flat:true}),l:new T.Matrix4()}]}
    else if(KK&&KK.nat&&KK.nat.pine5){['pine5','pine4'].forEach((k,v)=>{const src=KK.nat[k];src.updateMatrixWorld(true);const sc=(v?118:104)/(KK.natH[k]||1),S_=new T.Matrix4().makeScale(sc,sc,sc);const L=VP[v]=[];src.traverse(o=>{if(o.isMesh)L.push({g:o.geometry,m:o.material,l:o.matrixWorld.clone().premultiply(S_)})})})}
    else{const L=VP[0]=[];const add=(g,m,x,y,z,sx,sy,sz)=>L.push({g,m,l:new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(sx||1,sy||1,sz||1))});add(new T.CylinderGeometry(3.6,5,20,8),bark,0,10,0);
    [[30,26,14,leaf],[25,24,31,leaf2],[19,22,47,leaf],[12,18,61,leaf2]].forEach(([r,h,y,m])=>{add(new T.ConeGeometry(r,h,8),m,0,y+h/2-2,0);add(new T.ConeGeometry(r*.74,h*.5,8),snowM,0,y+h*.7,0)})}
    // bucket trees by map chunk and variant so off-screen chunks can be skipped entirely
    const bk=new Map();trees.forEach((t,i)=>{t.i=i;const v=i%VP.length;const v2=(DES()&&t.x>1720&&t.y>620&&t.y<1780)?2:v;t.item=(DES()&&v2===2)?'salt':'log';const key=chunkKey(t.x,t.y)+'|'+v2;let B=bk.get(key);if(!B){B={key,v:v2,ids:[],box:chunkBox(chunkKey(t.x,t.y),120)};bk.set(key,B)}t.bk=B;t.slot=B.ids.length;B.ids.push(i)});
    this.B=[...bk.values()];this.all=[];for(const B of this.B){B.ims=VP[B.v].map(p=>{const im=new T.InstancedMesh(p.g,p.m,B.ids.length);im.frustumCulled=false;im.castShadow=true;im.receiveShadow=false;scene.add(im);this.all.push(im);return im});B.ls=VP[B.v].map(p=>p.l)}
    this.stumps=new T.InstancedMesh(new T.CylinderGeometry(9,10,6,10),std('#8a5a32'),N);scene.add(this.stumps);this.m4=new T.Matrix4();this.b=new T.Matrix4();this.q=new T.Quaternion();this.e=new T.Euler();this.v=new T.Vector3();this.s=new T.Vector3();this.zero=new T.Matrix4().makeScale(0,0,0);
    trees.forEach(t=>this.upd(t))}
  upd(t){const i=t.i,B=t.bk,j=t.slot;
    if(!t.alive){for(const im of B.ims)im.setMatrixAt(j,this.zero);this.v.set(t.x,3,t.y);this.s.set(1,1,1);this.b.compose(this.v,this.q.identity(),this.s);this.stumps.setMatrixAt(i,this.b)}
    else{this.stumps.setMatrixAt(i,this.zero);const sc=t.s*(t.grow<1?Math.max(.01,easeOutBack(t.grow)):1);
      let rx=0,rz=0;if(t.fall>0){const e=t.fall*t.fall*Math.PI/2*.98;rx=Math.cos(t.fallDir)*e;rz=-Math.sin(t.fallDir)*e}else if(t.shake>0){rx=Math.sin(t.shake*70)*.07}
      this.e.set(rx,t.ry,rz);this.q.setFromEuler(this.e);this.v.set(t.x,0,t.y);this.s.set(sc,sc,sc);this.b.compose(this.v,this.q,this.s);
      B.ims.forEach((im,k)=>{this.m4.multiplyMatrices(this.b,B.ls[k]);im.setMatrixAt(j,this.m4)})}
    for(const im of B.ims)im.instanceMatrix.needsUpdate=true;this.stumps.instanceMatrix.needsUpdate=true}
  cull(fr){for(const B of this.B){const v=fr.intersectsBox(B.box);for(const im of B.ims)im.visible=v}}
  dispose(){for(const im of this.all)scene.remove(im);scene.remove(this.stumps)}}
const FRU=new T.Frustum(),FRM=new T.Matrix4();
function cullWorld(){camera.updateMatrixWorld();FRM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);FRU.setFromProjectionMatrix(FRM);if(forest)forest.cull(FRU);
  if(G&&G.decor)for(const im of G.decor)im.visible=im.count>0&&FRU.intersectsBox(im.userData.box)}

// ================================================================ models: buildings & stations
function makeTextPlate(text,w,h,bg,fg,fs){const c=document.createElement('canvas');c.width=w*4;c.height=h*4;const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true}));
  m.userData.draw=t=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);if(bg!=='none'){g.fillStyle=bg;rr(g,4,4,c.width-8,c.height-8,26);g.fill();g.strokeStyle=fg;g.lineWidth=8;g.stroke()}g.fillStyle=fg;g.font=`900 ${c.height*(fs||.58)}px "M PLUS Rounded 1c",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,c.width/2,c.height/2+4);tex.needsUpdate=true};
  m.userData.draw(text);return m}
function makeWell(){const g=new T.Group(),sand=std('#d8a86a',{r:.9,flat:true}),brick=std('#b8703f',{r:.85}),wood=std('#8a5a32',{map:TEX.wood});
  for(let i=0;i<18;i++){const a=i/18*TAU;const b=at(rbox(24,26,14,2,i%2?sand:brick),Math.cos(a)*44,13,Math.sin(a)*44);b.rotation.y=-a;g.add(b)}
  const coals=at(rot(M_(new T.CircleGeometry(40,32),std('#1f78c0',{e:'#1f78c0',ei:.5,r:.1,m:.2}),false),-Math.PI/2,0,0),0,22,0);g.add(coals);
  g.add(at(box(6,80,6,wood),-46,40,0),at(box(6,80,6,wood),46,40,0),at(box(104,6,8,wood),0,80,0),at(rot(cyl(4,4,70,wood,8),0,0,Math.PI/2),0,68,0));
  const roof=at(rot(cone(62,26,std('#c9553d',{r:.8}),4),0,Math.PI/4,0),0,96,0);g.add(roof);const bucket=at(cyl(7,5.5,10,std('#7a5234'),10),0,48,0);g.add(bucket);g.add(at(cyl(.6,.6,20,std('#d9c49a'),4,false),0,60,0));
  const flames=['#2f8fd6','#6fc3f0','#e4f6ff'].map((c,i)=>{const f=at(cyl(3+i*2,6+i*3,20,std(c,{e:c,ei:.5,t:true,op:.55}),10,false),Math.cos(i*2)*18,32,Math.sin(i*2)*18);g.add(f);return f});
  const light=new T.PointLight(lin('#bfe6ff'),1.6,600,1.4);light.position.set(0,90,0);g.add(light);
  const plate=makeTextPlate('Lv1',70,28,'#5b4636','#ffe38a');plate.position.set(0,2,78);plate.rotation.set(-Math.PI/2,0,YAW);g.add(plate);
  const tiers=[0,1,2].map(i=>{const t=new T.Group();for(let k=0;k<3+i*2;k++){const a=k/(3+i*2)*TAU+i;t.add(at(scl(sph(8,std('#5f9446'),true,8,6),1,1.4,1),Math.cos(a)*(70+i*14),10,Math.sin(a)*(70+i*14)))}return t});tiers.forEach(t=>{t.visible=false;g.add(t)});
  return{g,flames,light,coals,plate,tiers}}
function makeOasis(){const g=new T.Group();const water=M_(new T.CircleGeometry(1,40),std('#3fb4d8',{e:'#1f86b0',ei:.35,r:.1,m:.2,t:true,op:.92}),false,true);water.rotation.x=-Math.PI/2;water.scale.set(118,88,1);water.position.y=3;g.add(water);
  const trunk=std('#8a5a32',{r:.9}),leaf=std('#4f8f3a',{r:.8,flat:true});
  for(let i=0;i<9;i++){const a=i/9*TAU+.3,r=150+(i%3)*18;const p=new T.Group();p.position.set(Math.cos(a)*r,0,Math.sin(a)*r*.8);const h=70+(i%3)*12;const tr=at(rot(cyl(3.5,5,h,trunk,7),0,0,.12),4,h/2,0);p.add(tr);for(let k=0;k<6;k++){const la=k/6*TAU;const l=at(rot(scl(sph(14,leaf,true,6,4),1.8,.18,.6),0,-la,-.35),Math.cos(la)*18+8,h+2,Math.sin(la)*18);p.add(l)}g.add(p)}
  const guests=[];for(let i=0;i<9;i++){const a=i/9*TAU,h=grp(sph(9.6,std(SKIN,{r:.6})),at(scl(sph(6,std('#ffffff',{r:1}),false,10,8),1.2,.6,1.2),0,9,0));face(h,9.6);h.position.set(Math.cos(a)*72,4,Math.sin(a)*52);h.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a))+Math.PI;h.visible=false;g.add(h);guests.push(h)}
  const pump=new T.Group();pump.add(at(box(30,40,24,std('#b8703f',{r:.8})),0,20,0),at(cyl(3,3,50,std('#6b6f78',{m:.5}),8),0,55,0));const bFire=at(box(14,8,1,stdU('#7fd4ff',{e:'#7fd4ff',ei:1.6,r:.5}),false),0,12,12.5);pump.add(bFire);pump.position.set(190,0,-40);g.add(pump);
  const sign=makeTextPlate('オアシス',70,24,'#fbf3e6','#2f8f6a');sign.position.set(0,60,-100);g.add(sign);g.add(at(cyl(2,2,50,'#6e4524',6),-24,25,-102),at(cyl(2,2,50,'#6e4524',6),24,25,-102));
  return{g,water,guests,bFire}}
function desertDecor(){const sand=std('#e7bf82',{r:1}),rock=std('#b86a3e',{r:.95,flat:true}),rock2=std('#9a5634',{r:.95,flat:true}),stone=std('#d9c3a0',{r:.9,flat:true});
  // dunes
  for(let i=0;i<26;i++){const x=rnd(100,2300),y=rnd(80,2320);if(dist(x,y,CX,CY)<FR+220||inZone(x,y))continue;const d=scl(sph(1,sand,false,16,8),rnd(120,260),rnd(18,40),rnd(70,150));d.position.set(x,-6,y);d.rotation.y=rnd(0,TAU);d.receiveShadow=true;world.add(d)}
  // canyon mesas in zone C
  for(let i=0;i<16;i++){const x=rnd(70,650),y=rnd(680,1740);const h=rnd(60,150),w=rnd(40,90);const m=grp(at(cyl(w*.8,w,h,i%2?rock:rock2,7),0,h/2,0),at(cyl(w*.85,w*.8,8,rock2,7),0,h+2,0));m.position.set(x,0,y);m.rotation.y=rnd(0,TAU);world.add(m)}
  // ancient ruins
  for(let i=0;i<10;i++){const x=rnd(300,2100),y=rnd(140,640);const r=new T.Group();r.position.set(x,0,y);for(let k=0;k<4;k++){const h=rnd(20,70);r.add(at(cyl(7,8,h,stone,10),Math.cos(k*1.6)*40,h/2,Math.sin(k*1.6)*40))}r.add(at(rot(box(60,8,14,stone),0,0,.15),10,6,-20));world.add(r)}}
function makeFurnace(){
  const g=new T.Group(),stoneM=std('#7c8794',{map:TEX.stone,r:.9});
  g.add(at(cyl(56,62,14,stoneM,24),0,7,0));g.add(at(rot(tor(56,5,std('#6a7582',{r:.9}),true,8,32),Math.PI/2,0,0),0,14,0));
  const iron=std('#3a3f48',{m:.6,r:.45});g.add(at(cyl(44,48,26,iron,24),0,27,0));g.add(at(rot(tor(46,2.4,std('#c9a24a',{m:.8,r:.3}),false,6,32),Math.PI/2,0,0),0,38,0));
  for(let i=0;i<8;i++){const a=i/8*TAU;g.add(at(box(6,28,6,iron),Math.cos(a)*47,27,Math.sin(a)*47))}
  const coals=at(cyl(40,40,3,glow('#ff5a1a',2.2),24,false),0,40.5,0);g.add(coals);
  for(const r of [0,1.05,2.1])g.add(at(rot(cyl(4.5,4.5,64,std('#4a2e1c',{map:TEX.bark}),8),Math.PI/2,r,0),0,44,0));
  const flames=[['#ff5a1a',28,70,1.8],['#ffa23d',19,54,2.2],['#fff1b0',10,34,2.8]].map(([c,r,h,ei])=>{const f=at(cone(r,h,std(c,{e:c,ei,t:true,op:.92}),12,false),0,h/2+42,0);g.add(f);return f});
  for(let i=0;i<14;i++){const a=i/14*TAU;const s=at(scl(sph(5,std('#f8fbff',{r:.9}),false,8,6),1.4,.5,1.4),Math.cos(a)*57,14,Math.sin(a)*57);g.add(s)}
  // tiers that appear as the furnace levels up (Lv3 / Lv5 / Lv7)
  const t2=new T.Group();for(let i=0;i<6;i++){const a=i/6*TAU+.26,px=Math.cos(a)*78,pz=Math.sin(a)*78;t2.add(at(cyl(6,7.5,46,stoneM,8),px,23,pz));t2.add(at(cyl(8.5,8.5,4,std('#6a7582',{r:.9}),8),px,48,pz));t2.add(at(sph(4.2,glow('#ffb347',2.6),false,8,6),px,54,pz))}
  const t3=new T.Group();t3.add(at(cyl(94,100,6,stoneM,28),0,3,0));t3.add(at(rot(tor(96,3,std('#c9a24a',{m:.8,r:.3}),false,6,40),Math.PI/2,0,0),0,6,0));
  for(let i=0;i<10;i++){const a=i/10*TAU;t3.add(at(cone(5,24,std('#ffcf4a',{m:.85,r:.25}),6),Math.cos(a)*90,18,Math.sin(a)*90))}
  t3.add(at(rot(tor(50,3.4,std('#ffcf4a',{m:.85,r:.25,e:'#a86a00',ei:.3}),false,6,32),Math.PI/2,0,0),0,41,0));
  const t4=new T.Group();t4.add(at(rot(tor(72,3,glow('#ffd166',2.4),false,6,48),Math.PI/2,0,0),0,150,0));for(let i=0;i<6;i++){const a=i/6*TAU;t4.add(at(scl(M_(geo('oct7',()=>new T.OctahedronGeometry(7,0)),glow('#9fe0ff',2.2),false),1,1.8,1),Math.cos(a)*72,150,Math.sin(a)*72))}
  const tiers=[t2,t3,t4];tiers.forEach(t=>{t.visible=false;g.add(t)});
  const light=new T.PointLight(lin('#ff9a4a'),2.4,700,1.4);light.position.set(0,90,0);g.add(light);
  const plate=makeTextPlate('Lv1',70,28,'#5b4636','#ffe38a');plate.position.set(0,2,78);plate.rotation.set(-Math.PI/2,0,YAW);g.add(plate);
  if(KK&&KK.kit.d_pillar){kkSkin(g,[plate,...flames,coals]);for(const f of flames)f.position.y-=26;coals.position.y-=26;
    for(let i=0;i<12;i++){const a=i/12*TAU;g.add(kkP('d_pillar',15,Math.cos(a)*52,0,Math.sin(a)*52,-a))}g.add(kkP('lumber',64,0,2,0,.3),kkP('lumber',56,0,8,0,1.9));
    const T3=[[['d_torch',12,4,70]],[['d_banner_r',22,4,80]],[['d_banner_b',22,4,96],['d_crates',30,2,110]]];
    tiers.forEach((t,ti)=>{kkSkin(t,[]);for(const [nm,w,n,r] of T3[ti])for(let k=0;k<n;k++){const a=k/n*TAU+ti*.4+.39;t.add(kkP(nm,w,Math.cos(a)*r,nm==='d_banner_r'||nm==='d_banner_b'?0:0,Math.sin(a)*r,-a-Math.PI/2))}})}
  return{g,flames,light,coals,plate,tiers}
}
function makeCounter(o){ // wooden stall with striped awning
  const g=new T.Group(),woodM=std('#c18a52',{map:TEX.wood});const w=o.w||150;
  g.add(at(rbox(w,24,30,3,woodM),0,12,0));g.add(at(rbox(w+8,4,36,1.5,std('#e7b57c',{map:TEX.wood})),0,26,0));
  for(const s of [-1,1]){g.add(at(cyl(2.4,2.4,74,std('#8a5a30',{map:TEX.wood}),8),s*(w/2),37,-14))}
  const aw=M_(new T.BoxGeometry(w+22,3,46),new T.MeshStandardMaterial({map:awningTex(o.c1,o.c2),roughness:.85}));aw.position.set(0,74,4);aw.rotation.x=-.32;g.add(aw);
  for(let i=0;i<Math.floor((w+22)/12);i++){const t=at(rot(cone(6.2,9,std(i%2?o.c1:o.c2),3,true),Math.PI,Math.PI/6,0),-(w+22)/2+6+i*12,62,27);g.add(t)}
  const sign=makeTextPlate(o.name,70,20,'#fff7ea',o.c1,.6);sign.position.set(0,90,-4);g.add(sign);
  const bulbs=[];for(let i=0;i<6;i++){const b=at(sph(1.8,glow(['#ffd166','#ff8ad8','#7fe3ff'][i%3],2.2),false,6,4),-(w+14)/2+i*(w+14)/5,64,30);g.add(b);bulbs.push(b)}
  const reg=new T.Group();reg.position.set(o.regX||w/2-24,28,0);reg.add(at(rbox(22,12,16,2,std('#3a4a5a',{m:.3,r:.5})),0,6,0));reg.add(rot(at(box(18,9,1,glow('#9fe39f',1.2),false),0,15,-2),-.4,0,0));
  const lamp=at(sph(2.6,stdU('#ff6b6b',{e:'#ff6b6b',ei:2,r:.5}),false,8,6),10,18,0);reg.add(lamp);g.add(reg);
  const price=makeTextPlate('$10',34,16,'#fffaf0','#1f7a33');price.position.set((o.regX||w/2-24)-34,40,10);g.add(price);
  // shop tiers: 屋台 → 小屋 → 店
  const woodD=std('#8a5a30',{map:TEX.wood}),snowM=std('#f7fbff',{r:.9});
  const k1=new T.Group();k1.add(at(box(w+20,86,6,woodM),0,43,-26));for(const s of [-1,1])k1.add(at(box(6,86,40,woodM),s*(w/2+10),43,-8));
  k1.add(at(rot(box(w+36,6,52,woodD),-.1,0,0),0,98,-22));k1.add(at(rot(box(w+30,5,46,snowM),-.1,0,0),0,102,-22));
  for(const s of [-1,1]){k1.add(at(cyl(1,1,10,woodD,6),s*(w/2+14),78,20));k1.add(at(sph(4.2,glow('#ffb347',2.4),false,8,6),s*(w/2+14),70,20))}
  const k2=new T.Group();const bigSign=makeTextPlate('★'+o.name+'★',124,30,o.c1,'#fff7c0',.55);bigSign.position.set(0,130,-20);k2.add(bigSign);
  const gl=glow('#ffd166',2.4);k2.add(at(box(130,3,3,gl,false),0,147,-21));k2.add(at(box(130,3,3,gl,false),0,113,-21));
  for(const s of [-1,1]){k2.add(at(cyl(1.6,1.6,60,std('#c9a24a',{m:.8,r:.3}),6),s*(w/2+16),128,-26));k2.add(at(box(18,11,1,std(o.c1,{side:T.DoubleSide}),false),s*(w/2+16)+s*10,152,-26))}
  k2.add(at(cone(8,14,std('#ffcf4a',{m:.85,r:.25,e:'#a86a00',ei:.4}),5),0,162,-20));
  const tiers=[k1,k2];tiers.forEach(t=>{t.visible=false;g.add(t)});
  if(false&&KK&&KK.kit.market){kkSkin(g,[reg,price]);g.add(kkP(o.c1==='#2f8fd6'||o.c1==='#8a3fb0'?'market_blue':'market',w*1.05,0,0,-4,Math.PI));
    kkSkin(k1,[]);k1.add(kkP('d_crates',30,-w/2-22,0,4),kkP('d_barrel',18,-w/2-20,0,-26),kkP('crate_steak',24,w/2+20,0,6));kkSkin(k2,[]);k2.add(kkP('d_banner_r',22,-w/2+6,40,-30),kkP('d_banner_b',22,w/2-6,40,-30),kkP('h_lantern',10,-w/2-6,0,20),kkP('h_lantern',10,w/2+6,0,20))}
  return{g,lamp,price,tiers}
}
function makeGrill(){const g=new T.Group();
  g.add(at(rbox(80,26,40,3,std('#b4533a',{map:TEX.brick,r:.9})),0,13,0));g.add(at(box(34,10,1,glow('#ff8a3d',2.4),false),0,11,20.3));
  g.add(at(box(84,4,44,std('#30353d',{m:.5,r:.45})),0,28,0));for(let i=-32;i<=32;i+=8)g.add(at(box(1.6,1,42,std('#9aa3ad',{m:.7,r:.3}),false),i,30.4,0));
  g.add(at(rbox(40,20,30,3,std('#3a3f48',{m:.5,r:.45})),-18,44,-8));g.add(at(cyl(4,4,40,std('#3a3f48',{m:.5,r:.45}),10),-30,70,-14));
  const coal=at(box(70,2,36,stdU('#ff5a1a',{e:'#ff5a1a',ei:1.8,r:.5}),false),0,29.6,0);g.add(coal);
  const on=grp(at(itemMesh('meat'),-10,31,0),at(itemMesh('meat'),12,31,4));const done=grp(at(itemMesh('steak'),-10,31,0),at(itemMesh('steak'),12,31,4));g.add(on,done);
  if(false&&KK&&KK.kit.stove_multi){kkSkin(g,[on,done,coal]);coal.visible=false;g.add(kkP('stove_multi',80,0,0,0,0),kkP('crate_steak',30,-58,0,4));on.position.y=done.position.y=20}
  return{g,coal,on,done}}
function makeFishGrill(){const g=new T.Group();
  g.add(at(rbox(72,14,36,3,std('#7c8794',{map:TEX.stone})),0,7,0));const coal=at(box(58,2,26,stdU('#ff5a1a',{e:'#ff5a1a',ei:1.8,r:.5}),false),0,15,0);g.add(coal);
  for(const s of [-1,1])g.add(at(cyl(1.6,1.6,40,std('#8a5a30',{map:TEX.wood}),6),s*32,26,0));g.add(at(rot(cyl(1.2,1.2,70,std('#8a5a30'),6),0,0,Math.PI/2),0,44,0));
  const on=new T.Group();for(let i=0;i<5;i++){const f=itemMesh('fish');f.rotation.set(0,0,Math.PI/2);f.position.set(-24+i*12,34,0);on.add(f)}g.add(on);
  const done=new T.Group();for(let i=0;i<5;i++){const f=itemMesh('grfish');f.rotation.set(0,0,Math.PI/2);f.position.set(-24+i*12,34,0);done.add(f)}g.add(done);
  if(false&&KK&&KK.kit.stove_single){kkSkin(g,[on,done]);coal.visible=false;g.add(kkP('stove_single',48,-18,0,0),kkP('pot_large',30,26,0,0),kkP('d_barrel',18,52,0,-10));on.position.set(-18,-12,0);done.position.set(-18,-12,0);on.scale.setScalar(.6);done.scale.setScalar(.6)}
  return{g,coal,on,done}}
function makeTailor(){const g=new T.Group(),woodM=std('#9a6536',{map:TEX.wood});
  g.add(at(rbox(80,22,40,3,woodM),0,11,0));g.add(at(rbox(24,14,16,3,std('#3a3f48',{m:.4,r:.4})),-16,29,0));g.add(at(cyl(6,6,4,std('#c9a24a',{m:.8,r:.3}),12),-16,38,0));
  for(let i=0;i<3;i++)g.add(at(rot(cyl(5,5,22,std(['#f3ece0','#e6dccb','#d9c7ad'][i],{r:1}),10),0,0,Math.PI/2),16,26+i*9,-6+i*4));
  const man=new T.Group();man.add(at(cyl(1.4,1.4,30,'#5a3a22',6),0,15,0));man.add(at(scl(M_(coatGeo(),std('#b03a48')),.75,.9,.75),0,24,0));man.add(at(rot(tor(8,2,std(FUR,{r:1}),false,6,14),Math.PI/2,0,0),0,42,0));man.position.set(48,0,-10);g.add(man);
  const on=at(itemMesh('fur'),16,23,10);const done=at(itemMesh('coat'),16,23,10);g.add(on,done);
  const coal=at(sph(2.4,stdU('#ffd166',{e:'#ffd166',ei:2,r:.5}),false,8,6),-16,42,0);g.add(coal);
  if(false&&KK&&KK.kit.d_table){kkSkin(g,[on,done,man,coal]);g.add(kkP('d_table',80,0,0,0),kkP('d_crates',26,-54,0,-6));on.position.y=done.position.y=42}
  return{g,coal,on,done}}
function makeCabin(roofC,signTxt){const g=new T.Group(),woodM=std('#a86f3c',{map:TEX.wood});
  g.add(at(rbox(70,40,50,2,woodM),0,20,0));
  const roof=M_(new T.CylinderGeometry(33,33,80,3),std(roofC,{r:.8}));roof.rotation.set(Math.PI/2,0,Math.PI/2);roof.scale.set(1,1,.9);roof.position.set(0,52,0);g.add(roof);
  const snowR=M_(new T.CylinderGeometry(27,27,82,3),std('#f7fbff',{r:.9}),false);snowR.rotation.set(Math.PI/2,0,Math.PI/2);snowR.scale.set(1,1,.9);snowR.position.set(0,59,0);g.add(snowR);
  for(let i=0;i<9;i++)g.add(at(rot(cone(1.2,rnd(5,10),std('#dff3ff',{r:.2,m:.1}),5,false),Math.PI,0,0),-34+i*8.5,31,25.6));
  g.add(at(rbox(16,26,2,1,std('#3a2416')),0,13,25.4));g.add(at(box(13,11,1,glow('#ffc766',1.6),false),22,26,25.4));g.add(at(box(9,20,9,'#5a4a42'),22,70,-8));
  if(signTxt){const s=makeTextPlate(signTxt,44,16,'#fbf3e6','#8a3f2a');s.position.set(-20,34,25.8);g.add(s)}
  return g}
function makeChest(){const g=new T.Group();g.add(at(rbox(24,13,17,2,'#b5652a'),0,6.5,0));const gold=std('#ffcf4a',{m:.8,r:.3});g.add(at(box(25,3,18,gold),0,3,0));g.add(at(box(3,14,18,gold),-8,7,0));g.add(at(box(3,14,18,gold),8,7,0));
  const lid=at(new T.Group(),0,13,-8.5);lid.add(at(rbox(24,6,17,2,'#c9772f'),0,3,8.5));lid.add(at(box(25,2,18,gold),0,6,8.5));lid.add(at(box(5,5,2,glow('#ffe07a',1.4)),0,1,17.5));g.add(lid);g.userData.lid=lid;
  const beam=at(cyl(10,16,180,basic('#ffffff',{transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}),16,false),0,90,0);g.add(beam);g.userData.beam=beam;g.add(blob(16));return g}
function makeSpa(){const g=new T.Group(),stoneM=std('#8b96a3',{map:TEX.stone,r:.9});
  for(let i=0;i<22;i++){const a=i/22*TAU;const s=at(scl(M_(geo('spast',()=>new T.DodecahedronGeometry(14,0)),stoneM),1.2,.7,1),Math.cos(a)*120,6,Math.sin(a)*90);s.rotation.y=a;g.add(s)}
  const water=M_(new T.CircleGeometry(1,40),std('#5fc8e8',{e:'#2b9fd0',ei:.35,r:.1,m:.2,t:true,op:.92}),false,true);water.rotation.x=-Math.PI/2;water.scale.set(114,84,1);water.position.y=5;g.add(water);
  const guests=[];for(let i=0;i<9;i++){const a=i/9*TAU,h=grp(sph(9.6,std(SKIN,{r:.6})),at(scl(sph(6,std('#ffffff',{r:1}),false,10,8),1.2,.6,1.2),0,9,0));face(h,9.6);h.position.set(Math.cos(a)*72,6,Math.sin(a)*52);h.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a))+Math.PI;h.visible=false;g.add(h);guests.push(h)}
  const boiler=new T.Group();boiler.add(at(cyl(20,22,40,std('#3a3f48',{m:.5,r:.45}),16),0,20,0));boiler.add(at(cyl(5,5,40,std('#3a3f48',{m:.5,r:.45}),10),10,55,0));const bFire=at(box(18,10,1,stdU('#ff8a3d',{e:'#ff8a3d',ei:2.4,r:.5}),false),0,10,21);boiler.add(bFire);boiler.position.set(190,0,-40);g.add(boiler);
  const sign=makeTextPlate('温泉',60,24,'#fbf3e6','#c24f7a');sign.position.set(0,60,-100);g.add(sign);g.add(at(cyl(2,2,50,'#6e4524',6),-24,25,-102),at(cyl(2,2,50,'#6e4524',6),24,25,-102));
  return{g,water,guests,bFire}}
function makeHole(){const g=new T.Group();g.add(at(rot(tor(14,4,std('#e6f6ff',{r:.3,m:.1}),true,8,20),Math.PI/2,0,0),0,1,0));const w=M_(new T.CircleGeometry(12,20),std('#1d4f73',{r:.1,m:.3,e:'#0e2f4a',ei:.3}),false);w.rotation.x=-Math.PI/2;w.position.y=1.2;g.add(w);return g}
function makeOre(){const g=new T.Group();const r=M_(geo('ore',()=>new T.DodecahedronGeometry(20,1)),std('#6b7480',{flat:true,r:.85}));r.scale.set(1.2,.8,1);r.position.y=12;g.add(r);
  for(let i=0;i<5;i++){const c=M_(geo('orec',()=>new T.OctahedronGeometry(4,0)),std('#1f2227',{flat:true,r:.4,m:.3}));c.position.set(rnd(-16,16),rnd(8,22),rnd(-12,12));g.add(c)}
  g.add(at(scl(sph(14,std('#f7fbff',{r:.9}),false,10,6),1.2,.4,1),0,24,0));return g}
function makeMonument(){const g=new T.Group(),goldM=std('#ffcf4a',{m:.85,r:.25});g.add(at(rbox(90,30,90,4,std('#8b96a3',{map:TEX.stone})),0,15,0));g.add(at(rbox(60,20,60,3,std('#a4afbb',{map:TEX.stone})),0,40,0));
  const b=makeBear('normal');b.g.scale.setScalar(2.2);b.g.position.y=50;b.g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&!o.material.transparent)o.material=goldM});b.head.rotation.x=-.4;b.ring.visible=false;g.add(b.g);
  const fl=at(cone(10,30,std('#ffa23d',{e:'#ffa23d',ei:2.5,t:true,op:.95}),10,false),0,150,40);g.add(fl);g.userData.flame=fl;return g}
function makeLamp(){if(KK&&KK.kit.h_post_lantern){const g=new T.Group();g.add(kkP('h_post_lantern',16,0,0,0,rnd(0,TAU)));g.add(at(sph(3,glow('#ffcf7a',3),false,8,6),0,58,6));return g}const g=new T.Group();g.add(at(cyl(2,2.6,60,std('#2b3440',{m:.5,r:.4}),8),0,30,0));g.add(at(rbox(12,14,12,2,std('#2b3440',{m:.5,r:.4})),0,64,0));g.add(at(sph(4.6,glow('#ffcf7a',3),false,10,8),0,64,0));g.add(at(cone(9,7,std('#2b3440',{m:.5,r:.4}),4),0,74,0));g.add(blob(8));return g}
function kkInst(name,w,list){const src=KK.kit[name];const _ims=[];if(!src||!list.length)return _ims;src.updateMatrixWorld(true);const sc=w/(KK.kitW[name]||1),o3=new T.Object3D(),m4=new T.Matrix4();
  src.traverse(o=>{if(!o.isMesh)return;const im=new T.InstancedMesh(o.geometry,o.material,list.length);im.castShadow=true;im.receiveShadow=true;list.forEach(([x,z,ry],i)=>{o3.position.set(x,0,z);o3.rotation.set(0,ry,0);o3.scale.setScalar(sc);o3.updateMatrix();m4.multiplyMatrices(o3.matrix,o.matrixWorld);im.setMatrixAt(i,m4)});world.add(im);_ims.push(im)});return _ims}
function kkSkin(g,keep){const ks=new Set();for(const k of keep)if(k)k.traverse(o=>ks.add(o));g.traverse(o=>{if(o.isMesh&&!ks.has(o))o.visible=false})}
function kkP(name,w,x,y,z,ry){if(!KK||!KK.kit[name])return new T.Group();const o=kkProp(name,w);o.position.set(x||0,y||0,z||0);o.rotation.y=ry||0;o.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true}});return o}
function makeTower(){const g=new T.Group(),wood=std('#a8743f',{map:TEX.wood}),dark=std('#5a3a20',{map:TEX.bark}),iron=std('#3a3f48',{m:.6,r:.45});
  const l1=new T.Group();for(const [x,z] of [[-14,-14],[14,-14],[-14,14],[14,14]])l1.add(at(cyl(2.6,3.4,70,dark,6),x,35,z));
  l1.add(at(rbox(42,6,42,2,wood),0,70,0));for(const s_ of [-1,1]){l1.add(at(box(42,10,3,wood),0,78,s_*20));l1.add(at(box(3,10,42,wood),s_*20,78,0))}
  for(const [x,z] of [[-19,-19],[19,-19],[-19,19],[19,19]])l1.add(at(cyl(1.6,1.6,26,dark,5),x,92,z));
  l1.add(at(rot(cone(34,20,std('#b4533a',{map:TEX.brick}),4),0,Math.PI/4,0),0,114,0));l1.add(at(rot(cone(26,10,std('#f7fbff',{r:.9}),4),0,Math.PI/4,0),0,121,0));
  const gun=keep(new T.Group());gun.position.set(0,84,0);gun.add(at(rot(cyl(3.2,4.2,26,iron,10),Math.PI/2,0,0),0,0,9));gun.add(sph(6,iron,true,10,8));l1.add(gun);bake(l1);inkOutline(l1);
  const l2=new T.Group();l2.add(at(cyl(1.5,1.5,44,std('#c9a24a',{m:.8,r:.3}),6),0,146,0));l2.add(at(box(20,12,1,std('#e5483d',{side:T.DoubleSide}),false),11,160,0));for(const [x,z] of [[-21,21],[21,21]])l2.add(at(sph(3.4,glow('#ffd166',2.6),false,8,6),x,72,z));
  const l3=new T.Group();l3.add(at(cyl(26,30,26,std('#7c8794',{map:TEX.stone,r:.9}),8),0,13,0));l3.add(at(rot(tor(22,2.4,std('#c9a24a',{m:.8,r:.3}),false,6,24),Math.PI/2,0,0),0,74,0));l3.add(at(sph(5,std('#ffcf4a',{m:.85,r:.25,e:'#a86a00',ei:.5}),false,10,8),0,126,0));
  g.add(l1,l2,l3,blob(34));
  if(KK&&KK.kit.tower){kkSkin(l1,[gun]);l1.add(kkP('tower',54,0,0,0,Math.PI/4));gun.position.set(0,122,0);gun.scale.setScalar(.8);
    kkSkin(l2,[]);l2.add(kkP('d_banner_r',20,0,52,30),kkP('d_banner_r',20,30,52,0,Math.PI/2));kkSkin(l3,[]);l3.add(kkP('d_torch',10,-26,0,24),kkP('d_torch',10,26,0,24),kkP('d_barrel',20,-30,0,-26),kkP('d_crates',26,30,0,-24))}
  return{g,gun,tiers:[l1,l2,l3]}}
function makeTrap(){const g=new T.Group(),base=new T.Group(),iron=std('#5d6670',{m:.25,r:.55}),rim=std('#a7aeb6',{map:TEX.stone,r:.9}),hole=std('#23272c',{r:1});
  base.add(at(cyl(47,49,4,rim,28),0,2,0),at(cyl(40,40,1,iron,28),0,4.2,0));
  for(let i=0;i<14;i++){const a=i/14*TAU;base.add(at(rot(box(4,1,9,std(i%2?'#2a2a2a':'#f2c230',{r:.8})),0,-a,0),Math.cos(a)*43.5,4.3,Math.sin(a)*43.5))}
  const P=[];for(let r=0;r<3;r++){const n=r?r*7:1;for(let k=0;k<n;k++){const a=k/n*TAU+r*.3,d=r*13;P.push([Math.cos(a)*d,Math.sin(a)*d])}}
  for(const [x,z] of P)base.add(at(cyl(3.4,3.4,.6,hole,8),x,4.9,z));bake(base);g.add(base);
  const sp=new T.Group(),steel=std('#e4eaf0',{m:.35,r:.28});for(const [x,z] of P){sp.add(at(cone(3,20,steel,6),x,10,z));sp.add(at(cyl(3.2,3.2,3,iron,6),x,1.5,z))}bake(sp);sp.position.y=-22;g.add(sp);g.userData.sp=sp;g.userData.up=0;return g}
function makeTent(i){const g=new T.Group();const t=rot(cone(30,40,std(HCOL[i%5],{r:.9}),4),0,Math.PI/4,0);t.position.y=20;t.scale.set(1,1,1.3);g.add(t);g.add(at(box(12,20,2,std('#3a2a1e'),false),0,10,20));g.add(at(cyl(1.2,1.2,14,std('#5a3a20'),5),0,44,0));g.add(at(box(10,6,1,std('#ffd23f',{side:T.DoubleSide}),false),5,49,0));bake(g);g.add(blob(34));return g}
function makeHouse(i){const g=new T.Group(),wood=std('#a86f3c',{map:TEX.wood}),roof=std(HCOL[i%5],{r:.8}),snowM=std('#f7fbff',{r:.9});g.add(at(rbox(58,34,46,2,wood),0,17,0));
  g.add(at(rot(box(66,5,34,roof),-.62,0,0),0,45,-12));g.add(at(rot(box(66,5,34,roof),.62,0,0),0,45,12));g.add(at(rot(box(60,4,30,snowM),-.62,0,0),0,49,-12));g.add(at(rot(box(60,4,30,snowM),.62,0,0),0,49,12));
  g.add(at(box(9,24,9,std('#7c8794',{map:TEX.stone})),17,58,-8));g.add(at(box(14,12,1.5,glow('#ffcf7a',2),false),-13,20,23.5));g.add(at(box(12,22,1.5,std('#5a3a20'),false),12,11,23.5));bake(g);inkOutline(g);g.add(blob(42));return g}
function makeManor(i){const g=new T.Group(),stone=std('#c9ced6',{map:TEX.stone}),roof=std(HCOL[i%5],{r:.6,m:.2}),gold=std('#ffcf4a',{m:.85,r:.25}),snowM=std('#f7fbff',{r:.9});
  g.add(at(rbox(72,40,52,2,stone),0,20,0));g.add(at(rbox(62,30,46,2,std('#e8d9c0',{map:TEX.wood})),0,55,0));
  g.add(at(rot(box(80,5,36,roof),-.6,0,0),0,82,-13));g.add(at(rot(box(80,5,36,roof),.6,0,0),0,82,13));g.add(at(rot(box(74,4,30,snowM),-.6,0,0),0,86,-13));g.add(at(rot(box(74,4,30,snowM),.6,0,0),0,86,13));
  for(const x of [-22,0,22]){g.add(at(box(11,13,1.5,glow('#ffcf7a',2.2),false),x,24,26.5));g.add(at(box(10,11,1.5,glow('#ffcf7a',2.2),false),x,56,23.5))}
  g.add(at(box(76,3,4,gold),0,40.5,26));g.add(at(box(66,3,3,gold),0,70,23.5));g.add(at(cone(5,14,gold,6),0,100,0));g.add(at(box(10,26,10,stone),24,96,-10));bake(g);inkOutline(g);g.add(blob(54));return g}

