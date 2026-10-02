// ================================================================ basics
const WORLD=2400,CX=1200,CY=1200,FR=460,TAU=Math.PI*2,SQ=Math.SQRT1_2;
const rnd=(a,b)=>a+Math.random()*(b-a);
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const easeOutBack=t=>1+2.7*Math.pow(t-1,3)+1.7*Math.pow(t-1,2);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const ach=new Set(store.get('mw2-ach',[]));
const META_UP=[{id:'cash',k:'$',t:'開始資金',max:5,d:l=>`はじめから +$${l*40}`},{id:'bag',k:'籠',t:'大きなかご',max:5,d:l=>`運べる数 +${l*3}`},{id:'warm',k:'衣',t:'厚着',max:5,d:l=>`体温の下がり方 -${l*8}%`},
  {id:'wood',k:'薪',t:'よく燃える薪',max:5,d:l=>`薪1本の燃料 +${l}`},{id:'tower',k:'塔',t:'見張り台の設計図',max:5,d:l=>`見張り台の威力 +${l*20}%`},{id:'gun',k:'銃',t:'狩人の腕',max:5,d:l=>`銃の威力 +${l*12}%`},
  {id:'boots',k:'靴',t:'雪靴',max:5,d:l=>`移動の速さ +${l*5}%`},{id:'kiln',k:'炉',t:'頑丈なかまど',max:5,d:l=>`燃料の減り -${l*6}%`},{id:'folk',k:'人',t:'仲間',max:5,d:l=>`最初の町人 +${l}人`},
  {id:'trade',k:'商',t:'商売上手',max:5,d:l=>`売値 +${l*6}%`},{id:'sled',k:'犬',t:'はじめから犬ぞり',max:1,cost:[120],d:()=>'最初から犬ぞりが1台ある'},{id:'watch',k:'見',t:'はじめから見張り台',max:1,cost:[150],d:()=>'北の見張り台がLv1で建っている'}];
const META_COST=[15,40,80,140,220];
const META_CHARS=[{id:'Rogue_Hooded',t:'フードの弓使い',c:0},{id:'Rogue',t:'弓使い',c:40},{id:'Knight',t:'騎士',c:80},{id:'Barbarian',t:'熊帽子の戦士',c:80},{id:'Mage',t:'魔法使い',c:120}];
let meta=Object.assign({shards:0,up:{},chars:['Rogue_Hooded'],pick:'Rogue_Hooded',diffOpen:0},store.get('mw2-meta',{}));if(!meta.up)meta.up={};if(!meta.chars)meta.chars=['Rogue_Hooded'];if(!meta.pick)meta.pick='Rogue_Hooded';if(meta.diffOpen==null)meta.diffOpen=0;let gameDiff=0;
const mlv=id=>meta.up[id]||0;
// raid defense spots (pad = where you pay, m = where the tower stands)
const JOBPAD={guard:{x:1100,y:955},split:{x:985,y:995}};
const TOWERS=[{id:'N',n:'北',x:1303,y:845,mx:1287,my:774},{id:'E',n:'東',x:1556,y:1146,mx:1626,my:1114},{id:'W',n:'西',x:844,y:1254,mx:774,my:1287}];
const HOUSES=[[894,945],[998,855],[1089,816],[1433,875],[1518,958]];
const HCOL=['#e5483d','#2f7de0','#3fc157','#ff9a4d','#9b6bd6'];
let best=Object.assign({day:0,earned:0,cleared:false,area:1},store.get('mw2-best',{}));
let W=innerWidth,H=innerHeight;

// ================================================================ renderer
const cv=$('c');
const renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
let PR=Math.min(devicePixelRatio||1,2);renderer.setPixelRatio(PR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const lin=h=>new T.Color(h).convertSRGBToLinear();
const scene=new T.Scene();
const FOG_DAY=lin('#b8cadb'),FOG_NIGHT=lin('#1b2a44'),FOG_DES=lin('#ecd0a0');
scene.fog=new T.Fog(FOG_DAY.clone(),1400,3200);
const FOV=30,TANH=Math.tan(FOV*Math.PI/360);
const camera=new T.PerspectiveCamera(FOV,W/H,20,9000);
const YAW=Math.PI/4,PITCH=.9;
const camDir=new T.Vector3(Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH));
// story mode uses a free third-person camera (right-drag to orbit, wheel to zoom); survival keeps the fixed view
const CAMS={yaw:YAW,pitch:.6,zoom:1,drag:null,cur:YAW,curP:PITCH};
const hemi=new T.HemisphereLight(lin('#e3f0ff'),lin('#8397ad'),.55);scene.add(hemi);
const sun=new T.DirectionalLight(lin('#fff0dc'),1.0);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-760,right:760,top:760,bottom:-760,near:10,far:3000});sun.shadow.bias=-.0008;sun.shadow.normalBias=.6;scene.add(sun,sun.target);
// sky dome
const sky=new T.Mesh(new T.SphereGeometry(7000,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:lin('#6fa9d8')},mid:{value:lin('#bcd0e2')},bot:{value:lin('#c9d7e4')}},
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 bot;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=h>0.?mix(mid,top,smoothstep(0.,.5,h)):mix(mid,bot,smoothstep(0.,-.2,h));gl_FragColor=vec4(c,1.);}'}));
scene.add(sky);
// post-processing (bloom); falls back to direct rendering
let composer=null,bloom=null,useFX=!!(T.EffectComposer&&T.UnrealBloomPass&&T.GammaCorrectionShader);
function setupFX(){if(!useFX){renderer.outputEncoding=T.sRGBEncoding;return}
  try{const gl2=renderer.capabilities.isWebGL2;const rt=gl2&&T.WebGLMultisampleRenderTarget?new T.WebGLMultisampleRenderTarget(W*PR,H*PR,{format:T.RGBAFormat}):undefined;
    composer=new T.EffectComposer(renderer,rt);composer.addPass(new T.RenderPass(scene,camera));
    bloom=new T.UnrealBloomPass(new T.Vector2(W*PR/2,H*PR/2),.5,.5,.93);composer.addPass(bloom);composer.addPass(new T.ShaderPass(T.GammaCorrectionShader));
  }catch(e){useFX=false;composer=null;renderer.outputEncoding=T.sRGBEncoding}}
setupFX();
function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);cv.style.width=W+'px';cv.style.height=H+'px';camera.aspect=W/H;camera.updateProjectionMatrix();if(composer){composer.setSize(W,H);bloom&&bloom.setSize(W*PR/2,H*PR/2)}}
addEventListener('resize',resize);resize();

// ================================================================ materials & textures
const matCache={};
function std(hex,o){const k=hex+JSON.stringify(o||{});if(matCache[k])return matCache[k];return matCache[k]=stdU(hex,o)}
function stdU(hex,o){o=o||{};const m=new T.MeshStandardMaterial({color:lin(hex),roughness:o.r??.78,metalness:o.m??0,flatShading:!!o.flat,transparent:!!o.t,opacity:o.op??1,side:o.side||T.FrontSide});
  if(o.e){m.emissive=lin(o.e);m.emissiveIntensity=o.ei??1}if(o.map)m.map=o.map;return m}
const glow=(hex,i)=>std(hex,{e:hex,ei:i??1.6,r:.5});
const basic=(hex,o)=>new T.MeshBasicMaterial(Object.assign({color:lin(hex)},o||{}));
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
const TEX={
  wood:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#b27a45';g.fillRect(0,0,w,h);for(let i=0;i<8;i++){const y=i*32;g.fillStyle=i%2?'#a86f3c':'#bb834d';g.fillRect(0,y,w,31);g.fillStyle='rgba(60,30,10,.5)';g.fillRect(0,y+30,w,2);
    g.strokeStyle='rgba(90,50,20,.35)';g.lineWidth=1.2;for(let k=0;k<5;k++){g.beginPath();g.moveTo(0,y+4+k*5+rnd(-1,1));for(let x=0;x<=w;x+=16)g.lineTo(x,y+4+k*5+Math.sin(x*.05+k+i)*1.5);g.stroke()}
    for(let k=0;k<2;k++){g.fillStyle='rgba(70,40,15,.45)';g.beginPath();g.ellipse(rnd(0,w),y+rnd(8,24),4,2.5,0,0,TAU);g.fill()}}},[1,1]),
  brick:canvasTex(256,128,(g,w,h)=>{g.fillStyle='#6d2c1e';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<9;c++){const x=c*32-(r%2)*16,y=r*16;g.fillStyle=['#b4533a','#a84a33','#c0603f','#9c432f'][(r*3+c)%4];g.fillRect(x+1.5,y+1.5,29,13);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+1.5,y+1.5,29,3)}}),
  stone:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#7c8794';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=['#8d98a5','#6f7a87','#98a3af'][i%3];g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(14,30),rnd(10,20),rnd(0,3),0,TAU);g.fill()}}),
  bark:canvasTex(128,256,(g,w,h)=>{g.fillStyle='#7a4f2c';g.fillRect(0,0,w,h);for(let i=0;i<30;i++){g.fillStyle=i%2?'rgba(50,28,12,.45)':'rgba(170,120,70,.3)';g.fillRect(rnd(0,w),0,rnd(2,5),h)}}),
};
function awningTex(c1,c2){return canvasTex(256,128,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?c2:c1;g.fillRect(i*32,0,32,h)}g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,0,w,18)})}
function radialTex(c0,c1){return canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,2,64,64,64);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(0,0,128,128)})}
const BLOB=new T.MeshBasicMaterial({map:radialTex('rgba(20,40,70,.5)','rgba(20,40,70,0)'),transparent:true,depthWrite:false});
const geoCache={};const geo=(k,f)=>geoCache[k]||(geoCache[k]=f());
function M_(g,m,cast=true,recv=false){const o=new T.Mesh(g,m);o.castShadow=cast;o.receiveShadow=recv;return o}
const mt=m=>typeof m==='string'?std(m):m;
const box=(w,h,d,m,c)=>M_(geo(`b${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d)),mt(m),c);
const rbox=(w,h,d,r,m,c)=>M_(geo(`rb${w},${h},${d},${r}`,()=>roundedBox(w,h,d,r)),mt(m),c);
const sph=(r,m,c,ws=18,hs=12)=>M_(geo(`s${r},${ws},${hs}`,()=>new T.SphereGeometry(r,ws,hs)),mt(m),c);
const cyl=(rt,rb,h,m,seg=16,c)=>M_(geo(`c${rt},${rb},${h},${seg}`,()=>new T.CylinderGeometry(rt,rb,h,seg)),mt(m),c);
const cone=(r,h,m,seg=14,c)=>M_(geo(`k${r},${h},${seg}`,()=>new T.ConeGeometry(r,h,seg)),mt(m),c);
const tor=(r,t,m,c,rs=10,ts=24)=>M_(geo(`t${r},${t},${rs},${ts}`,()=>new T.TorusGeometry(r,t,rs,ts)),mt(m),c);
const grp=(...ch)=>{const g=new T.Group();ch.forEach(c=>c&&g.add(c));return g};
const at=(o,x,y,z)=>{o.position.set(x,y,z);return o};
const rot=(o,x,y,z)=>{o.rotation.set(x,y,z);return o};
const scl=(o,x,y,z)=>{o.scale.set(x,y??x,z??x);return o};
function roundedBox(w,h,d,r){const s=new T.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new T.ExtrudeGeometry(s,{depth:h-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.6,bevelSegments:2,curveSegments:4});g.rotateX(-Math.PI/2);g.translate(0,-h/2+r,0);return g}
function fluffy(r,t,n){const g=new T.TorusGeometry(r,t,8,n||26);const p=g.attributes.position;for(let i=0;i<p.count;i++){const k=1+(Math.random()-.5)*.28;p.setXYZ(i,p.getX(i)*(1+(k-1)*.3),p.getY(i)*(1+(k-1)*.3),p.getZ(i)*k)}g.computeVertexNormals();return g}
// merge the static meshes of a part into one mesh per material (fewer draw calls on phones)
const _inv=new T.Matrix4(),_mm=new T.Matrix4();
function bake(root){if(!T.BufferGeometryUtils)return root;root.updateMatrixWorld(true);_inv.copy(root.matrixWorld).invert();const by=new Map(),rm=[];
  (function walk(o){for(const c of o.children){if(c.userData.keep||c.userData.anim)continue;if(c.isMesh&&!c.isInstancedMesh){rm.push(c)}else walk(c)}})(root);
  if(rm.length<2)return root;
  for(const o of rm){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();_mm.multiplyMatrices(_inv,o.matrixWorld);g.applyMatrix4(_mm);
    for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal'&&k!=='uv')g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();
    let e=by.get(o.material);if(!e){e={list:[],cast:false};by.set(o.material,e)}e.list.push(g);if(o.castShadow)e.cast=true;o.parent.remove(o)}
  for(const [mat,e] of by){const merged=T.BufferGeometryUtils.mergeBufferGeometries(e.list);if(!merged)continue;const m=new T.Mesh(merged,mat);m.castShadow=e.cast;root.add(m)}
  return root}
const keep=o=>{o.userData.keep=true;return o};
const anim=o=>{o.userData.anim=true;return o};
const OUTM=new T.MeshBasicMaterial({color:lin('#1a2433'),side:T.BackSide});
OUTM.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normal*1.7;')};
const OUTS=new Set();
function inkOutline(root){const list=[];root.traverse(o=>{if(o.isMesh&&o.castShadow&&!o.userData.noOut&&!o.material.transparent)list.push(o)});for(const o of list){const m=new T.Mesh(o.geometry,OUTM);m.userData.noOut=true;m.castShadow=false;m.visible=!window.GQ||GQ.tier===2;OUTS.add(m);o.add(m)}return root}
function noShadow(g){g.traverse(o=>{if(o.isMesh)o.castShadow=false});return g}
function blob(r){const m=M_(geo('blob',()=>new T.PlaneGeometry(1,1)),BLOB,false);m.rotation.x=-Math.PI/2;m.scale.set(r*2,r*2,1);m.position.y=.4;m.renderOrder=1;return m}


// ---- crash guard: one broken subsystem must never stop the whole game (it logs once and the rest keeps running)
const SFE={},ERRLOG=[];const PERF={t:{},fr:0,max:0,maxTop:'',long:0};function SAFE(n,f){const t0=performance.now();try{return f()}catch(e){const k=n+':'+(e&&e.message);if(!SFE[k]){SFE[k]=1;plogErr(n,e);console.error('['+n+']',e);const t=n+': '+String(e&&e.stack||e).split('\n').slice(0,3).join(' / ');ERRLOG.push(t);window.__lastErr=t;try{if(typeof toast==='function')toast('不具合を飛ばして続けます（'+n+'）。メニュー→プレイログをコピーで送ってね','cold',true)}catch(_){}}}finally{const d=performance.now()-t0;PERF.t[n]=(PERF.t[n]||0)+d;if(d>PERF.max){PERF.max=d;PERF.maxTop=n}}}
