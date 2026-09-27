/* めちゃホワイト — built from src/*.js by tools/build.py. Edit the sources, not this file. */
(()=>{const BUILD='20260927135129';
const $=id=>document.getElementById(id);
if(!window.THREE){$('loading').textContent='3Dの読み込みに失敗しました。再読み込みしてください';return}
const T=THREE;
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

// ================================================================ ground, scenery
function paintGround(g,S){
  const k=S/WORLD;g.save();g.scale(k,k);
  const bg=g.createRadialGradient(CX,CY,100,CX,CY,WORLD*.8);bg.addColorStop(0,'#f2f6fa');bg.addColorStop(1,'#d5e2ed');g.fillStyle=bg;g.fillRect(0,0,WORLD,WORLD);
  for(let i=0;i<520;i++){const x=rnd(0,WORLD),y=rnd(0,WORLD),w=rnd(50,180),h=w*rnd(.22,.35);g.fillStyle='rgba(90,130,170,.28)';g.beginPath();g.ellipse(x,y+h*.4,w,h,0,0,TAU);g.fill();g.fillStyle='rgba(240,246,252,.55)';g.beginPath();g.ellipse(x-w*.1,y,w*.85,h*.7,0,0,TAU);g.fill()}
  for(let i=0;i<7000;i++){g.fillStyle=Math.random()<.5?'rgba(140,175,205,.12)':'rgba(255,255,255,.6)';g.fillRect(rnd(0,WORLD),rnd(0,WORLD),rnd(1,3),rnd(1,2))}
  // camp: trodden packed snow + dirt around the furnace
  const cg=g.createRadialGradient(CX,CY,40,CX,CY,FR+10);cg.addColorStop(0,'#b99a7c');cg.addColorStop(.35,'#d8c3ab');cg.addColorStop(.8,'#e9e1d6');cg.addColorStop(1,'rgba(233,225,214,0)');g.fillStyle=cg;g.beginPath();g.arc(CX,CY,FR+10,0,TAU);g.fill();
  for(let i=0;i<1500;i++){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*FR;g.fillStyle=Math.random()<.5?'rgba(120,80,50,.1)':'rgba(255,255,255,.35)';g.fillRect(CX+Math.cos(a)*r,CY+Math.sin(a)*r,rnd(1,4),rnd(1,3))}
  // stone plaza under the market
  g.fillStyle='rgba(150,130,110,.35)';rr(g,1010,1410,580,300,30);g.fill();
  for(let x=1020;x<1580;x+=34)for(let y=1420;y<1700;y+=24){g.fillStyle=`rgba(${160+rnd(-15,15)|0},${140+rnd(-15,15)|0},${120+rnd(-15,15)|0},.35)`;rr(g,x+((y/24|0)%2)*17,y,30,20,5);g.fill()}
  // paths from gates
  g.strokeStyle='rgba(185,160,135,.45)';g.lineWidth=70;g.lineCap='round';g.beginPath();g.moveTo(CX,CY-FR+30);g.lineTo(CX,420);g.moveTo(CX+FR-30,CY);g.lineTo(1800,CY);g.moveTo(CX-FR+30,CY);g.lineTo(600,CY);g.moveTo(1300,1700);g.lineTo(1300,2000);g.stroke();
  // frozen lake (zone B)
  const lx=2020,ly=1210;const lg=g.createRadialGradient(lx-80,ly-80,20,lx,ly,420);lg.addColorStop(0,'#e6f8ff');lg.addColorStop(.6,'#aee0f5');lg.addColorStop(1,'#8fcbe8');
  g.fillStyle='rgba(110,160,190,.35)';g.beginPath();g.ellipse(lx,ly+10,340,450,0,0,TAU);g.fill();g.fillStyle=lg;g.beginPath();g.ellipse(lx,ly,330,440,0,0,TAU);g.fill();
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=3;for(let j=0;j<22;j++){g.beginPath();let cx=lx+rnd(-280,280),cy=ly+rnd(-380,380);g.moveTo(cx,cy);for(let s=0;s<4;s++){cx+=rnd(-40,40);cy+=rnd(-40,40);g.lineTo(cx,cy)}g.stroke()}
  g.fillStyle='rgba(255,255,255,.55)';for(let j=0;j<10;j++){g.beginPath();g.ellipse(lx+rnd(-250,250),ly+rnd(-350,350),rnd(30,80),rnd(6,12),-.4,0,TAU);g.fill()}
  // spa plaza (zone D)
  g.fillStyle='rgba(140,125,115,.45)';g.beginPath();g.ellipse(1200,2070,250,190,0,0,TAU);g.fill();
  // deep forest tint (zone C)
  g.fillStyle='rgba(120,150,170,.12)';g.fillRect(40,640,640,1120);
  g.restore();
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
let groundTex=null;
let groundTexD=null;
function paintDesert(g,S){const k=S/WORLD;g.save();g.scale(k,k);
  const bg=g.createRadialGradient(CX,CY,100,CX,CY,WORLD*.8);bg.addColorStop(0,'#f3d9a4');bg.addColorStop(1,'#e2b36e');g.fillStyle=bg;g.fillRect(0,0,WORLD,WORLD);
  g.lineWidth=5;for(let i=0;i<260;i++){const x=rnd(0,WORLD),y=rnd(0,WORLD),w=rnd(120,320);g.strokeStyle=Math.random()<.5?'rgba(180,120,60,.18)':'rgba(255,240,210,.35)';g.beginPath();for(let t=0;t<=1;t+=.1){const px=x+t*w,py=y+Math.sin(t*6+i)*10;t?g.lineTo(px,py):g.moveTo(px,py)}g.stroke()}
  for(let i=0;i<6000;i++){g.fillStyle=Math.random()<.5?'rgba(160,100,50,.12)':'rgba(255,245,220,.4)';g.fillRect(rnd(0,WORLD),rnd(0,WORLD),rnd(1,3),rnd(1,2))}
  // salt flat (zone B)
  g.fillStyle='#f4eee8';g.beginPath();g.ellipse(2040,1200,360,500,0,0,TAU);g.fill();g.strokeStyle='rgba(190,170,160,.55)';g.lineWidth=3;
  for(let j=0;j<140;j++){const cx=2040+rnd(-320,320),cy=1200+rnd(-450,450);g.beginPath();for(let q=0;q<6;q++){const a=q/6*TAU;const px=cx+Math.cos(a)*34,py=cy+Math.sin(a)*34;q?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.stroke()}
  // red canyon floor (zone C)
  const cg2=g.createLinearGradient(40,0,680,0);cg2.addColorStop(0,'#a8502e');cg2.addColorStop(1,'#cf8a52');g.fillStyle=cg2;g.globalAlpha=.75;g.fillRect(40,640,640,1120);g.globalAlpha=1;
  for(let j=0;j<40;j++){g.strokeStyle='rgba(90,40,20,.35)';g.lineWidth=rnd(2,6);g.beginPath();let x=rnd(60,660),y=rnd(660,1740);g.moveTo(x,y);for(let q=0;q<5;q++){x+=rnd(-50,50);y+=rnd(-40,40);g.lineTo(x,y)}g.stroke()}
  // oasis (zone D): grass ring
  const og=g.createRadialGradient(1200,2070,60,1200,2070,330);og.addColorStop(0,'#6fae4a');og.addColorStop(.7,'#9cc45e');og.addColorStop(1,'rgba(200,190,110,0)');g.fillStyle=og;g.beginPath();g.ellipse(1200,2070,340,260,0,0,TAU);g.fill();
  // town: packed earth + adobe plaza
  const tg=g.createRadialGradient(CX,CY,40,CX,CY,FR+10);tg.addColorStop(0,'#c69866');tg.addColorStop(.5,'#dcb482');tg.addColorStop(1,'rgba(230,200,150,0)');g.fillStyle=tg;g.beginPath();g.arc(CX,CY,FR+10,0,TAU);g.fill();
  for(let x=1020;x<1580;x+=34)for(let y=1420;y<1700;y+=24){g.fillStyle=`rgba(${190+rnd(-15,15)|0},${130+rnd(-15,15)|0},${80+rnd(-10,10)|0},.4)`;rr(g,x+((y/24|0)%2)*17,y,30,20,4);g.fill()}
  // dry riverbeds from the gates
  g.strokeStyle='rgba(150,95,50,.35)';g.lineWidth=60;g.lineCap='round';g.beginPath();g.moveTo(CX,CY-FR+30);g.lineTo(CX,420);g.moveTo(CX+FR-30,CY);g.lineTo(1800,CY);g.moveTo(CX-FR+30,CY);g.lineTo(600,CY);g.moveTo(1300,1700);g.lineTo(1300,2000);g.stroke();
  g.restore()}
function makeGround(){
  if(DES()){if(!groundTexD)groundTexD=canvasTex(2048,2048,(g,w)=>paintDesert(g,w))}else if(!groundTex)groundTex=canvasTex(2048,2048,(g,w)=>paintGround(g,w));
  const plane=M_(new T.PlaneGeometry(WORLD,WORLD),new T.MeshStandardMaterial({map:DES()?groundTexD:groundTex,roughness:.95,color:lin(DES()?'#ffffff':'#b9cbdb')}),false,true);plane.rotation.x=-Math.PI/2;plane.position.set(CX,0,CY);
  const outer=M_(new T.PlaneGeometry(WORLD*5,WORLD*5),new T.MeshStandardMaterial({color:lin(DES()?'#e0b273':'#a9bccd'),roughness:1}),false,true);outer.rotation.x=-Math.PI/2;outer.position.set(CX,-.6,CY);
  return grp(plane,outer);
}
// distant mountains
function makeMountains(){const g=new T.Group();const rock=std(DES()?'#c07a45':'#8397ad',{flat:true,r:.95}),snow=std(DES()?'#dca066':'#f6f9fc',{flat:true,r:.9});
  for(let i=0;i<46;i++){const a=i/46*TAU+rnd(-.05,.05),d=rnd(2050,2500),h=rnd(420,980),r=h*rnd(.55,.8);const m=grp(M_(new T.ConeGeometry(r,h,7),rock,false),at(M_(new T.ConeGeometry(r*.46,h*.46,7),snow,false),0,h*.28,0));
    m.position.set(CX+Math.cos(a)*d,h/2-40,CY+Math.sin(a)*d);m.rotation.y=rnd(0,TAU);g.add(m)}return g}
// ground sparkles
const sparkle=(()=>{const N=2200,pos=new Float32Array(N*3),ph=new Float32Array(N);for(let i=0;i<N;i++){pos[i*3]=rnd(0,WORLD);pos[i*3+1]=1.2;pos[i*3+2]=rnd(0,WORLD);ph[i]=rnd(0,100)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aPh',new T.BufferAttribute(ph,1));
  const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uS:{value:1}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:'attribute float aPh;uniform float uT;uniform float uS;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vA=pow(max(0.,sin(uT*1.7+aPh)),14.);gl_PointSize=5.*uS/-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=abs(c.x)*abs(c.y)*40.+length(c)*2.;float a=clamp(1.-d,0.,1.)*vA;gl_FragColor=vec4(1.,1.,1.,a);}'});
  const p=new T.Points(g,m);p.frustumCulled=false;scene.add(p);return m})();

// ================================================================ particles
const PS_V=`attribute float aSize;attribute float aAlpha;attribute vec3 aColor;uniform float uScale;varying float vA;varying vec3 vC;void main(){vA=aAlpha;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uScale/-mv.z;gl_Position=projectionMatrix*mv;}`;
const PS_F=`varying float vA;varying vec3 vC;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;float a=smoothstep(0.5,0.15,d)*vA;gl_FragColor=vec4(vC,a);}`;
class PS{constructor(max,additive){this.max=max;this.pos=new Float32Array(max*3);this.col=new Float32Array(max*3);this.size=new Float32Array(max);this.alpha=new Float32Array(max);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(this.pos,3));g.setAttribute('aColor',new T.BufferAttribute(this.col,3));g.setAttribute('aSize',new T.BufferAttribute(this.size,1));g.setAttribute('aAlpha',new T.BufferAttribute(this.alpha,1));
    this.geo=g;this.mat=new T.ShaderMaterial({uniforms:{uScale:{value:1}},vertexShader:PS_V,fragmentShader:PS_F,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
    this.pts=new T.Points(g,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=5;this.list=[];scene.add(this.pts)}
  emit(p){if(this.list.length<this.max)this.list.push(p)}
  clear(){this.list.length=0}
  update(dt,scale){const L=this.list;let n=0;
    for(let i=0;i<L.length;i++){const p=L[i];p.life-=dt;if(p.life<=0)continue;p.vy-=(p.g??0)*dt;const dr=p.drag??0;p.vx*=1-dr*dt;p.vz*=1-dr*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
      if(p.y<0&&!p.air){p.y=0;p.vy*=-.3;p.vx*=.5;p.vz*=.5}
      const age=1-p.life/p.max;const c=p.fire?(age<.25?FIRE[0]:age<.55?FIRE[1]:FIRE[2]):p.c;
      this.pos[n*3]=p.x;this.pos[n*3+1]=p.y;this.pos[n*3+2]=p.z;this.col[n*3]=c.r;this.col[n*3+1]=c.g;this.col[n*3+2]=c.b;this.size[n]=p.r*(1+(p.grow||0)*age);this.alpha[n]=(p.a??1)*Math.min(1,p.life/(p.fade??.3));L[n++]=p}
    L.length=n;this.geo.setDrawRange(0,n);for(const k of ['position','aColor','aSize','aAlpha'])this.geo.attributes[k].needsUpdate=true;this.mat.uniforms.uScale.value=scale}}
const colCache={};const C=h=>colCache[h]||(colCache[h]=lin(h));
const FIRE=[lin('#fff4c8'),lin('#ffa640'),lin('#e04415')];
const psN=new PS(2600,false),psA=new PS(1600,true);
function burst(x,z,h,n,o){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(o.s0??40,o.s1??140);(o.add?psA:psN).emit({x,y:h,z,vx:Math.cos(a)*s,vz:Math.sin(a)*s,vy:rnd(o.u0??80,o.u1??240),g:o.g??480,life:rnd(o.l0??.4,o.l1??.8),max:o.l1??.8,r:rnd(o.r0??5,o.r1??9),c:C(o.c[i%o.c.length]),drag:o.drag??.8,fade:.25})}}
function puff(x,z,h,o){psN.emit({x,y:h,z,vx:o.vx??0,vz:o.vz??0,vy:o.vy??18,g:0,life:o.life??1.2,max:o.life??1.2,r:o.r??10,grow:o.grow??1.8,c:C(o.c??'#ffffff'),a:o.a??.6,fade:.8,air:true})}
let snowTint=false;const snow=(()=>{const N=2400,pos=new Float32Array(N*3),col=new Float32Array(N*3).fill(1),size=new Float32Array(N),alpha=new Float32Array(N),v=[];
  for(let i=0;i<N;i++){pos[i*3]=rnd(-900,900);pos[i*3+1]=rnd(0,700);pos[i*3+2]=rnd(-900,900);const z=Math.random();size[i]=2.5+z*4.5;alpha[i]=.6+z*.4;v.push(.5+z)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aColor',new T.BufferAttribute(col,3));g.setAttribute('aSize',new T.BufferAttribute(size,1));g.setAttribute('aAlpha',new T.BufferAttribute(alpha,1));
  const m=new T.ShaderMaterial({uniforms:{uScale:{value:1}},vertexShader:PS_V,fragmentShader:PS_F,transparent:true,depthWrite:false});const pts=new T.Points(g,m);pts.frustumCulled=false;pts.renderOrder=9;scene.add(pts);
  return{update(dt,cx,cz,wind,storm,scale){const t=performance.now()/900;for(let i=0;i<N;i++){pos[i*3+1]-=v[i]*70*dt*(1+storm);pos[i*3]+=(20+wind*70)*v[i]*dt*(1+storm);pos[i*3+2]+=Math.sin(i+t)*9*dt;
      if(pos[i*3+1]<0)pos[i*3+1]+=700;const dx=pos[i*3]-cx,dz=pos[i*3+2]-cz;if(dx>900)pos[i*3]-=1800;if(dx<-900)pos[i*3]+=1800;if(dz>900)pos[i*3+2]-=1800;if(dz<-900)pos[i*3+2]+=1800}
    if(snowTint!==DES()){snowTint=DES();const c=snowTint?[.95,.8,.55]:[1,1,1];for(let i=0;i<N;i++){col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2]}g.attributes.aColor.needsUpdate=true}
    g.setDrawRange(0,Math.floor(N*storm*GQ.snow*(snowTint?.5:1)));g.attributes.position.needsUpdate=true;m.uniforms.uScale.value=scale}}})();

// ================================================================ DOM labels
const labelsEl=$('labels'),lpool=[];let lused=0;const pv=new T.Vector3();
function toScreen(x,h,z){pv.set(x,h,z).project(camera);return{x:(pv.x+1)/2*W,y:(1-pv.y)/2*H,on:pv.z<1}}
function label(x,y,h,html,cls,op,sc){const s=toScreen(x,h,y);if(!s.on||s.x<-90||s.x>W+90||s.y<-50||s.y>H+60)return;
  let el=lpool[lused];if(!el){el=document.createElement('div');labelsEl.appendChild(el);lpool.push(el);el._h='';el._c=''}
  lused++;if(el._h!==html){el.innerHTML=html;el._h=html}const c='lb '+(cls||'');if(el._c!==c){el.className=c;el._c=c}
  el.style.display='';el.style.opacity=op??1;el.style.transform=`translate(${s.x|0}px,${s.y|0}px) translate(-50%,-100%) scale(${sc??1})`}
function endLabels(){for(let i=lused;i<lpool.length;i++)if(lpool[i].style.display!=='none')lpool[i].style.display='none';lused=0}
const bar=(pct,kind)=>`<i class="bar ${kind||''}"><b style="width:${Math.max(4,Math.min(100,pct))|0}%"></b></i>`;

// ================================================================ input
const keys={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(e.key.startsWith('Arrow')||k===' ')e.preventDefault();if(!$('perk').hidden&&['1','2','3'].includes(k)){const b=$('perks').children[+k-1];if(b)b.click()}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
const joys=[{on:false},{on:false}];let nPlayers=1;
cv.addEventListener('pointerdown',e=>{if(!running||G.paused)return;const slot=0;const j=joys[slot];if(j.on)return;
  Object.assign(j,{on:true,id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY});try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{for(const j of joys)if(j.on&&j.id===e.pointerId){j.x=e.clientX;j.y=e.clientY}});
const endJ=e=>{for(const j of joys)if(j.on&&j.id===e.pointerId)j.on=false};cv.addEventListener('pointerup',endJ);cv.addEventListener('pointercancel',endJ);
function inputVec(i){let x=0,y=0;const two=false;
  const L=i===0?(keys['a']||(!two&&keys['arrowleft'])):keys['arrowleft'],R=i===0?(keys['d']||(!two&&keys['arrowright'])):keys['arrowright'];
  const U=i===0?(keys['w']||(!two&&keys['arrowup'])):keys['arrowup'],D=i===0?(keys['s']||(!two&&keys['arrowdown'])):keys['arrowdown'];
  if(L)x-=1;if(R)x+=1;if(U)y-=1;if(D)y+=1;
  const j=joys[i];if(j.on){const dx=j.x-j.ox,dy=j.y-j.oy,m=Math.hypot(dx,dy);if(m>6){const k=Math.min(m,60)/60;x=dx/m*k;y=dy/m*k}}
  const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return{x:(x+y)*SQ,y:(-x+y)*SQ}}

// ================================================================ toasts, banners, sound
const tq=[];let toastTimer=0;
function toast(msg,kind,local){if(tq.length<4)tq.push({msg,kind});if(!local&&NET.mode==='host'&&NET.outT.length<3)NET.outT.push([msg,kind||''])}
function tickToast(dt){tickTalk(dt);if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('on')}else toastTimer-=dt;
  if(toastTimer<=-.15&&tq.length){const {msg,kind}=tq.shift();const t=$('toast');t.textContent=msg;t.className='toast '+(kind||'');void t.offsetWidth;t.classList.add('on');toastTimer=1.9}}
let bnT=null;function banner(sub,main,note,cls,local){if(!local&&NET.mode==='host'&&NET.outB.length<2)NET.outB.push([sub,main,note||'',cls||'']);const b=$('banner');$('bnSub').textContent=sub;$('bnMain').textContent=main;$('bnNote').textContent=note||'';b.className='banner '+(cls||'');b.hidden=true;void b.offsetWidth;b.hidden=false;clearTimeout(bnT);bnT=setTimeout(()=>b.hidden=true,cls==='combo'?1400:2800)}
const AC=window.AudioContext||window.webkitAudioContext;let actx=null,muted=false,lastCoin=0,lastShot=0,lastChop=0;
function audioOn(){if(!actx&&AC){try{actx=new AC()}catch(_){}}if(actx&&actx.state==='suspended')actx.resume()}
addEventListener('pointerdown',audioOn);addEventListener('keydown',audioOn);
function tone(f,d,type,v,slide,delay){if(!actx||muted)return;const t=actx.currentTime+(delay||0);const o=actx.createOscillator(),g=actx.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*slide),t+d);g.gain.setValueAtTime(v||.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+d+.03)}
function noise(d,v,f){if(!actx||muted)return;const t=actx.currentTime,b=actx.createBuffer(1,Math.floor(actx.sampleRate*d),actx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=actx.createBufferSource();s.buffer=b;const fl=actx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f||1200;const g=actx.createGain();g.gain.value=v||.1;s.connect(fl);fl.connect(g);g.connect(actx.destination);s.start(t)}
const SFX={
  coin:k=>{const n=performance.now();if(n-lastCoin<45)return;lastCoin=n;tone(988*Math.pow(1.045,Math.min(k||0,30)),.08,'square',.04)},
  cash:k=>{tone(1319*Math.pow(1.03,Math.min(k||0,30)),.06,'square',.04);tone(1760*Math.pow(1.03,Math.min(k||0,30)),.14,'square',.04,0,.05)},
  chop:()=>{const n=performance.now();if(n-lastChop<90)return;lastChop=n;noise(.07,.15,900);tone(170,.06,'triangle',.1,.6)},
  shot:()=>{const n=performance.now();if(n-lastShot<60)return;lastShot=n;noise(.06,.1,2600);tone(260,.05,'square',.025,.4)},
  kill:()=>{tone(523,.08,'square',.06);tone(784,.08,'square',.06,0,.06);tone(1047,.16,'square',.06,0,.12)},
  pop:()=>tone(620,.07,'triangle',.08,1.8),bad:()=>tone(320,.25,'sawtooth',.06,.5),splash:()=>{noise(.25,.12,1800);tone(900,.12,'sine',.05,.5)},
  level:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,'square',.05,0,i*.07)),
  build:()=>[392,523,784].forEach((f,i)=>tone(f,i===2?.3:.1,'square',.055,0,i*.08)),
  chest:()=>[392,494,587,784].forEach((f,i)=>tone(f,.12,'triangle',.08,0,i*.05)),
  rare:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.18,'square',.045,0,i*.05)),
  ssr:()=>{[523,659,784,1047,1319,1568,2093,2637].forEach((f,i)=>tone(f,.3,'square',.045,0,i*.06));noise(.8,.05,5000)},
  fever:()=>[440,554,659,880,1109,1319,1760].forEach((f,i)=>tone(f,.16,'sawtooth',.04,0,i*.045)),
  area:()=>{[392,523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.07,0,i*.12));[196,262].forEach((f,i)=>tone(f,1,'sine',.06,0,i*.2))},
  combo:n=>tone(392*Math.pow(1.0595,Math.min(n,36)),.09,'square',.04),
  wave:()=>{tone(180,1.2,'sawtooth',.05,.5);noise(1.2,.08,600)}};
$('mute').addEventListener('click',()=>{muted=!muted;$('mute').textContent=muted?'音 OFF':'音 ON'});

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
async function loadKK(){if(!T.GLTFLoader||!T.SkeletonUtils)return;const L=new T.GLTFLoader(),A=await fetchAssets();if(!A)return;
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
function makeTrap(){const g=new T.Group(),m=std('#a9b5c1',{m:.7,r:.35});g.add(at(cyl(44,44,1.4,std('#6a5040',{r:.95}),20,false),0,.8,0));for(let i=0;i<16;i++){const a=rnd(0,TAU),r=rnd(5,38);const c=at(cone(3.2,rnd(10,17),m,5),Math.cos(a)*r,5,Math.sin(a)*r);c.rotation.z=rnd(-.3,.3);g.add(c)}bake(g);return g}
function makeTent(i){const g=new T.Group();const t=rot(cone(30,40,std(HCOL[i%5],{r:.9}),4),0,Math.PI/4,0);t.position.y=20;t.scale.set(1,1,1.3);g.add(t);g.add(at(box(12,20,2,std('#3a2a1e'),false),0,10,20));g.add(at(cyl(1.2,1.2,14,std('#5a3a20'),5),0,44,0));g.add(at(box(10,6,1,std('#ffd23f',{side:T.DoubleSide}),false),5,49,0));bake(g);g.add(blob(34));return g}
function makeHouse(i){const g=new T.Group(),wood=std('#a86f3c',{map:TEX.wood}),roof=std(HCOL[i%5],{r:.8}),snowM=std('#f7fbff',{r:.9});g.add(at(rbox(58,34,46,2,wood),0,17,0));
  g.add(at(rot(box(66,5,34,roof),-.62,0,0),0,45,-12));g.add(at(rot(box(66,5,34,roof),.62,0,0),0,45,12));g.add(at(rot(box(60,4,30,snowM),-.62,0,0),0,49,-12));g.add(at(rot(box(60,4,30,snowM),.62,0,0),0,49,12));
  g.add(at(box(9,24,9,std('#7c8794',{map:TEX.stone})),17,58,-8));g.add(at(box(14,12,1.5,glow('#ffcf7a',2),false),-13,20,23.5));g.add(at(box(12,22,1.5,std('#5a3a20'),false),12,11,23.5));bake(g);inkOutline(g);g.add(blob(42));return g}
function makeManor(i){const g=new T.Group(),stone=std('#c9ced6',{map:TEX.stone}),roof=std(HCOL[i%5],{r:.6,m:.2}),gold=std('#ffcf4a',{m:.85,r:.25}),snowM=std('#f7fbff',{r:.9});
  g.add(at(rbox(72,40,52,2,stone),0,20,0));g.add(at(rbox(62,30,46,2,std('#e8d9c0',{map:TEX.wood})),0,55,0));
  g.add(at(rot(box(80,5,36,roof),-.6,0,0),0,82,-13));g.add(at(rot(box(80,5,36,roof),.6,0,0),0,82,13));g.add(at(rot(box(74,4,30,snowM),-.6,0,0),0,86,-13));g.add(at(rot(box(74,4,30,snowM),.6,0,0),0,86,13));
  for(const x of [-22,0,22]){g.add(at(box(11,13,1.5,glow('#ffcf7a',2.2),false),x,24,26.5));g.add(at(box(10,11,1.5,glow('#ffcf7a',2.2),false),x,56,23.5))}
  g.add(at(box(76,3,4,gold),0,40.5,26));g.add(at(box(66,3,3,gold),0,70,23.5));g.add(at(cone(5,14,gold,6),0,100,0));g.add(at(box(10,26,10,stone),24,96,-10));bake(g);inkOutline(g);g.add(blob(54));return g}

// ================================================================ the town grows with the furnace level
const TOWN={1:{n:'野営地',d:''},2:{n:'灯りの集落',d:'道ができて、飾り電球が灯った'},3:{n:'きこりの村',d:'製材所と街灯が建った'},4:{n:'広場のある村',d:'石畳の広場とベンチができた'},5:{n:'風車の町',d:'石畳の道・風車・旗が並んだ'},6:{n:'教会の町',d:'教会の鐘が鳴る'},7:{n:'石壁の街',d:'柵が石の城壁になり、酒場ができた'},8:{n:'光の都',d:'黄金の門と、夜空に花火'}};
const TSPOTS=[[760,770],[1640,770],[780,1650],[1655,1690]];
let _roadTex=null,_cobTex=null;
function roadTex(cob){const make=(cob)=>canvasTex(128,512,(g,w,h)=>{h=h||512;g.clearRect(0,0,w,h);
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const e=Math.min(x,w-x)/(w*.5);const a=Math.min(1,e*2.6);if(a<=0)continue;let r,gg,b;
    if(cob){const cx=(x+(Math.floor(y/16)%2)*8)%16,cy=y%16;const edge=cx<2||cy<2;const v=edge?-38:Math.random()*22-8;r=158+v;gg=164+v;b=172+v}else{const v=Math.random()*30-12;r=176+v;gg=160+v*.9;b=138+v*.8;if(Math.random()<.18){r=gg=b=236}}
    g.fillStyle=`rgba(${r|0},${gg|0},${b|0},${a*(cob?.97:.85)})`;g.fillRect(x,y,2,2)}});
  if(cob)return _cobTex||(_cobTex=make(true));return _roadTex||(_roadTex=make(false))}
function makeTownStages(){const S=[];for(let i=0;i<8;i++){const g=new T.Group();g.visible=false;world.add(g);S.push(g)}
  const rv=makeRankVisuals();const mv=(src,dst,fx)=>{for(const c of [...src.children]){if(fx)fx(c);dst.add(c)}world.remove(src)};
  const roads=[[-Math.PI/2,FR+10],[0,FR+10],[Math.PI,FR+10],[Math.PI/2,380]];
  const strip=(a,len,wd,cob,y)=>{const t=roadTex(cob).clone();t.needsUpdate=true;t.wrapS=T.ClampToEdgeWrapping;t.wrapT=T.RepeatWrapping;t.repeat.set(1,len/(cob?110:200));
    const m=M_(new T.PlaneGeometry(wd,len),new T.MeshStandardMaterial({map:t,alphaTest:.45,depthWrite:false,roughness:.95}),false,true);m.rotation.set(-Math.PI/2,0,-a+Math.PI/2);const r0=100,mid=r0+len/2;m.position.set(CX+Math.cos(a)*mid,y,CY+Math.sin(a)*mid);m.renderOrder=1;return m};
  // Lv2 灯りの集落: trampled roads + string lights and gate flags
  for(const [a,r] of roads)S[1].add(strip(a,r-100,86,false,.32));mv(rv[0],S[1]);
  // Lv3 きこりの村: lamps along the roads + lumber mill
  const padNear=(x,y)=>G.pads.some(p=>Math.abs(p.x-x)<62&&Math.abs(p.y-y)<62)||Object.values(STN).some(q=>dist(q.conv.x,q.conv.y,x,y)<70||dist(q.counter.x,q.counter.y,x,y)<90);
  for(const [a,r] of roads.slice(0,3))for(let d=190,k=0;d<r-50;d+=105,k++){const sd=k%2?1:-1,x=CX+Math.cos(a)*d-Math.sin(a)*sd*62,y=CY+Math.sin(a)*d+Math.cos(a)*sd*62;if(padNear(x,y))continue;const l=makeLamp();l.position.set(x,0,y);S[2].add(l)}
  if(KK){const [x,y]=TSPOTS[0];S[2].add(kkP('lumbermill',120,x,0,y,Math.PI*.75),kkP('lumber',44,x+70,0,y+40,.4),kkP('wheelbarrow',30,x+40,0,y+80,1.2),kkP('crate',24,x-60,0,y+50,.3))}
  // Lv4 広場のある村: paved plaza + benches
  mv(rv[1],S[3]);
  // Lv5 風車の町: cobblestone roads, windmill, banners on the fence
  for(const [a,r] of roads)S[4].add(strip(a,r-100,70,true,.42));
  if(KK){const [x,y]=TSPOTS[1];S[4].add(kkP('windmill',120,x,0,y,Math.PI*.25),kkP('sack',22,x-60,0,y+60,.5),kkP('sack',22,x-44,0,y+72,1.1),kkP('barrel',22,x+60,0,y+50,0))}
  {const cols=['#e5483d','#2f7de0','#ffcf4a','#3fc157'];let i=0;for(let a=-Math.PI;a<Math.PI;a+=.2){const gap=GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<.2)||(a>SOUTH[0]-.05&&a<SOUTH[1]+.05);if(gap)continue;const x=CX+Math.cos(a)*(FR+16),y=CY+Math.sin(a)*(FR+16);const f=new T.Group();f.position.set(x,0,y);f.rotation.y=-a;
    f.add(at(cyl(1.4,1.6,74,std('#5a3a20',{map:TEX.bark}),6),0,37,0));const cl=M_(new T.PlaneGeometry(22,30),std(cols[i++%4],{side:T.DoubleSide,r:.8}),false);cl.position.set(0,58,11);cl.rotation.y=Math.PI/2;f.add(cl);f.add(at(sph(2.2,std('#ffcf4a',{m:.8,r:.3}),false,6,4),0,75,0));S[4].add(f)}}
  // Lv6 教会の町: church (moved out to the south-west corner)
  mv(rv[2],S[5],c=>{c.position.set(TSPOTS[2][0],0,TSPOTS[2][1]);c.rotation.y=-Math.PI*.25;c.scale.multiplyScalar(1.15)});
  // Lv7 石壁の街: stone wall replaces the wooden fence + tavern
  {const seg=[],pil=[];const L=64,step=L/FR;for(let a=-Math.PI;a<Math.PI-step/2;a+=step){const an=a+step/2;const gap=q=>GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(q-g),Math.cos(q-g)))<.13)||(q>SOUTH[0]&&q<SOUTH[1]);if(gap(an))continue;seg.push(an);pil.push(a);if(gap(a+step))pil.push(a+step)}
    const stone=std('#aeb6c0',{map:TEX.stone,r:.9}),cap=std('#f4f8fc',{r:.9}),o=new T.Object3D();const mk=(geo,mat,list,f)=>{const im=new T.InstancedMesh(geo,mat,list.length);im.castShadow=im.receiveShadow=true;list.forEach((a,i)=>{f(o,a);o.updateMatrix();im.setMatrixAt(i,o.matrix)});im.visible=false;world.add(im);return im};
    const wallW=mk(new T.BoxGeometry(L+2,44,14),stone,seg,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,22,CY+Math.sin(a)*FR);o.rotation.set(0,-a-Math.PI/2,0)});
    const wallC=mk(new T.BoxGeometry(L+4,4,18),cap,seg,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,46,CY+Math.sin(a)*FR);o.rotation.set(0,-a-Math.PI/2,0)});
    const tw=mk(new T.CylinderGeometry(12,14,62,8),stone,pil,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,31,CY+Math.sin(a)*FR);o.rotation.set(0,a,0)});
    const twc=mk(new T.ConeGeometry(15,18,8),std('#2f5f8f',{r:.6}),pil,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,71,CY+Math.sin(a)*FR);o.rotation.set(0,a,0)});
    G.wallIM=[wallW,wallC,tw,twc]}
  if(KK){const [x,y]=TSPOTS[3];S[6].add(kkP('tavern',110,x,0,y,-Math.PI*.75),kkP('barrel',22,x-66,0,y-30,0),kkP('barrel',22,x-60,0,y-10,.6),kkP('crate',24,x-40,0,y-62,.2))}
  // Lv8 光の都: golden gate + light pillars at the landmarks
  mv(rv[3],S[7]);for(const [x,y] of TSPOTS){const b=M_(new T.CylinderGeometry(16,16,700,12,1,true),new T.MeshBasicMaterial({color:lin('#ffe38a'),transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);b.position.set(x,350,y);S[7].add(b)}
  for(const g of S)for(const c of g.children)c.userData.s0=c.scale.clone();
  return{list:S,lv:null}}
function setWall(k){if(!G.wallIM)return;const on=k>0;for(const m of G.wallIM){m.visible=on;m.scale.y=Math.max(.001,k)}for(const m of G.fenceIM||[]){if(m.userData.hid)continue;m.scale.y=Math.max(.001,1-k);m.visible=k<1}}
function syncStages(dt){const TS=G.townS;if(!TS)return;const L=clamp(G.level||1,1,8);
  if(TS.lv==null){TS.lv=L;TS.list.forEach((g,i)=>g.visible=i<L);setWall(L>=7?1:0);for(const m of G.fenceIM||[])if(!m.visible&&L<7)m.userData.hid=1;return}
  if(L>TS.lv){for(let i=TS.lv;i<L;i++){const g=TS.list[i];g.visible=true;g.userData.t=0;for(const c of g.children){c.userData.dl=.7+dist(c.position.x,c.position.z,CX,CY)/800;c.scale.setScalar(.001)}}
    if(TS.lv<7&&L>=7)TS.wallT=0;TS.lv=L;townFx(L)}
  for(const g of TS.list){const u=g.userData;if(!g.visible||u.t==null||u.t>4)continue;u.t+=dt;for(const c of g.children){const q=c.userData,k=clamp((u.t-q.dl)/.5,0,1),e=k<=0?.001:Math.max(.001,easeOutBack(k));c.scale.set(q.s0.x*e,q.s0.y*e,q.s0.z*e);
      if(k>0&&!q.pf){q.pf=1;if(Math.random()<.5)burst(c.position.x,c.position.z,10,6,{c:['#ffffff','#ffd23f','#dff3ff'],s0:30,s1:110,u0:60,u1:160,l0:.4,l1:.8,r0:3,r1:6})}}}
  if(TS.wallT!=null&&TS.wallT<1){TS.wallT=Math.min(1,TS.wallT+dt*.45);setWall(TS.wallT<.3?0:(TS.wallT-.3)/.7);if(TS.wallT>.3&&Math.random()<dt*20){const a=rnd(-Math.PI,Math.PI);puff(CX+Math.cos(a)*FR,CY+Math.sin(a)*FR,10,{c:'#c9d3dd',r:14,life:1.2,a:.6,vy:30,grow:2})}}}
function townFx(L){const t=TOWN[L];if(!t)return;G.camPan={x:CX,y:CY+40,t:0,z:.4,d:4.2};SFX.area();G.shake=Math.max(G.shake||0,8);
  setTimeout(()=>{if(running)burst(CX,CY,80,60,{c:['#ffd23f','#ffffff','#ff8ad8','#9fe0ff'],s0:120,s1:380,u0:260,u1:520,l0:.9,l1:1.6,add:true,r0:6,r1:12})},500);
  setTimeout(()=>{if(running)float(CX,CY,170,`町のすがた「${t.n}」`,'gold',true)},900)}

function makeRankVisuals(){const out=[];
  // 村: string lights + gate flags
  const r1=new T.Group();const pairs=[[[1030,1400],[1240,1400]],[[1240,1400],[1450,1400]],[[1030,1700],[1450,1700]],[[800,1400],[1030,1400]]];const bc=['#ffd166','#ff8ad8','#7fe3ff','#8ff08f'];
  for(const [[x0,y0],[x1,y1]] of pairs){const n=Math.round(dist(x0,y0,x1,y1)/18);for(let i=1;i<n;i++){const k=i/n;r1.add(at(sph(2.4,glow(bc[i%4],2.6),false,6,4),lerp(x0,x1,k),62-Math.sin(k*Math.PI)*16,lerp(y0,y1,k)))}}
  for(const a of GATE_ANG)for(const sd of [-1,1]){const aa=a+sd*.13,x=CX+Math.cos(aa)*FR,y=CY+Math.sin(aa)*FR;r1.add(at(cyl(1.4,1.4,40,std('#c9a24a',{m:.8,r:.3}),6),x,100,y));r1.add(at(rot(box(1,14,22,std(sd<0?'#e5483d':'#2f7de0',{side:T.DoubleSide}),false),0,a,0),x,112,y+0))}
  out.push(r1);
  // 町: paved plaza around the furnace + benches
  const r2=new T.Group();const pave=M_(new T.RingGeometry(78,158,48),std('#9aa4b0',{map:TEX.stone,r:.85}),false,true);pave.rotation.x=-Math.PI/2;pave.position.set(CX,.5,CY);r2.add(pave);
  const edge=M_(new T.RingGeometry(156,162,64),std('#c9a24a',{m:.6,r:.4}),false);edge.rotation.x=-Math.PI/2;edge.position.set(CX,.7,CY);r2.add(edge);
  for(let i=0;i<6;i++){if(i===1)continue;const a=i/6*TAU+.5,x=CX+Math.cos(a)*140,y=CY+Math.sin(a)*140;const b=new T.Group();b.add(at(box(30,3,10,std('#a8743f',{map:TEX.wood})),0,9,0));b.add(at(box(30,10,2,std('#a8743f',{map:TEX.wood})),0,15,-5));for(const sx of [-12,12])b.add(at(box(2,9,8,std('#3a3f48')),sx,4.5,0));b.position.set(x,0,y);b.rotation.y=Math.atan2(CX-x,CY-y);r2.add(b)}
  out.push(r2);
  // 街: clock tower
  const r3=new T.Group();const ct=new T.Group();ct.position.set(895,0,1470);const stone=std('#b8c0ca',{map:TEX.stone});ct.add(at(rbox(44,110,44,3,stone),0,55,0));ct.add(at(rbox(52,8,52,2,std('#8b96a3')),0,114,0));
  ct.add(at(rot(cone(38,46,std('#2f5f8f',{r:.6}),4),0,Math.PI/4,0),0,141,0));ct.add(at(cone(4,16,std('#ffcf4a',{m:.85,r:.25}),6),0,170,0));
  for(const [rx,ry,z] of [[0,0,22.6],[0,Math.PI/2,22.6],[0,Math.PI,22.6],[0,-Math.PI/2,22.6]]){const f=new T.Group();f.rotation.y=ry;const face=at(cyl(13,13,1.5,glow('#fff4d0',1.2),24,false),0,90,z);face.rotation.x=Math.PI/2;f.add(face);f.add(at(box(1.6,9,1,std('#16283a'),false),0,93,z+1.2));f.add(at(box(7,1.6,1,std('#16283a'),false),3,90,z+1.2));ct.add(f)}
  bake(ct);inkOutline(ct);ct.add(blob(40));if(KK){const ch=kkProp('church',92);ch.position.set(895,0,1470);ch.rotation.y=Math.PI*.25;r3.add(ch)}else r3.add(ct);out.push(r3);
  // 都: golden gate over the market
  const r4=new T.Group();const gold=std('#ffcf4a',{m:.85,r:.25,e:'#a86a00',ei:.25});const gx=CX,gy=CY-FR;for(const sx of [-72,72]){r4.add(at(cyl(8,10,120,gold,12),gx+sx,60,gy));r4.add(at(sph(12,gold,true,12,10),gx+sx,126,gy))}
  r4.add(at(box(160,12,12,gold),gx,114,gy));const sign=makeTextPlate('めちゃホワイト',130,24,'#5b4636','#ffe38a',.6);sign.position.set(gx,96,gy+7);r4.add(sign);
  for(let i=0;i<8;i++)r4.add(at(sph(3,glow(bc[i%4],2.8),false,6,4),gx-70+i*20,106,gy+7));out.push(r4);
  for(const o of out){o.visible=false;world.add(o)}return out}
function makeHusky(){const g=new T.Group(),fur=std('#8d97a3',{r:.9}),white=std('#f4f6f8',{r:.9}),dark=std('#1a2433');
  const body=new T.Group();body.add(at(scl(sph(7,fur,true,10,8),1,.85,1.6),0,11,0));body.add(at(scl(sph(5.4,white,true,10,8),1,.7,1.3),0,8.6,1));g.add(body);
  const head=new T.Group();head.position.set(0,16,10);head.add(sph(5,fur,true,10,8));head.add(at(scl(sph(3.4,white,true,8,6),1,.8,1.2),0,-1.4,3.6));head.add(at(sph(1.1,dark,false,6,4),0,-.4,7.6));
  for(const sx of [-1,1]){head.add(at(rot(cone(1.9,5,fur,4),0,0,sx*-.2),sx*2.8,5.2,-.4));head.add(at(sph(.9,std('#6fb8ff',{e:'#6fb8ff',ei:.6}),false,6,4),sx*2,1.2,4.2))}g.add(head);
  const tail=at(rot(cone(2.2,9,fur,6),-.9,0,0),0,15,-10);g.add(tail);
  const legs=[[-3.5,5],[3.5,5],[-3.5,-6],[3.5,-6]].map(([x,z])=>{const l=at(new T.Group(),x,8,z);l.add(at(cyl(1.5,1.3,9,white,6),0,-4,0));g.add(l);return l});inkOutline(g);return{g,legs,head,tail}}
function makeSledMesh(){const pv_=makeVillager(PALS[3],{noShadow:true});const g=new T.Group(),wood=std('#a8743f',{map:TEX.wood}),red=std('#e5483d',{r:.6});
  for(const sx of [-9,9]){g.add(at(box(2.4,2,44,std('#3a3f48',{m:.6,r:.4})),sx,1,0));g.add(at(rot(box(2.4,2,8,std('#3a3f48',{m:.6,r:.4})),-.8,0,0),sx,3.4,24))}
  g.add(at(box(22,3,34,wood),0,5,-2));for(const sx of [-10,10])g.add(at(box(2,8,30,red),sx,10,-2));g.add(at(box(22,14,2,red),0,12,-18));
  const dogs=[makeHusky(),makeHusky()];dogs.forEach((d,i)=>{d.g.position.set(i?9:-9,0,40);g.add(d.g)});g.add(at(box(1,1,26,std('#d9b77a'),false),0,10,30));inkOutline(g);g.add(blob(40));pv_.g.position.set(0,6,-10);pv_.g.scale.setScalar(.8);pv_.g.visible=false;g.add(pv_.g);g.scale.setScalar(1.35);return{g,dogs,pas:pv_}}
function makeHaul(big){const g=new T.Group(),wood=std('#8a5a30',{map:TEX.wood});for(const s_ of [-1,1])g.add(at(rbox(6,4,78,2,std('#5a3a20')),s_*20,2,0));g.add(at(rbox(48,5,62,2,wood),0,7,0));
  const meat=itemMesh('meat');meat.scale.setScalar(big>1?4.4:3.4);meat.position.y=20;g.add(meat);g.add(at(rot(tor(20,1.6,std('#d9b77a'),false,6,20),Math.PI/2,0,0),0,22,0));g.add(blob(44));return g}
function makeHeli(){const g=new T.Group();g.add(at(scl(sph(26,std('#e8452f',{r:.4,m:.3}),true,18,12),1.6,1,1),0,30,0));g.add(at(scl(sph(18,std('#bfe6ff',{r:.1,m:.5,t:true,op:.8}),false,14,10),1,.8,1),22,34,0));
  g.add(at(box(70,6,6,'#e8452f'),-56,34,0));g.add(at(box(6,20,4,'#ffffff'),-90,40,0));const rotor=at(new T.Group(),0,58,0);rotor.add(box(160,1.6,6,'#2b3440'),rot(box(160,1.6,6,'#2b3440'),0,Math.PI/2,0));g.add(rotor,at(cyl(2,2,10,'#2b3440',6),0,52,0));
  for(const s of [-1,1])g.add(at(box(70,3,3,'#2b3440'),0,4,s*16));g.userData.rotor=rotor;return g}

// ================================================================ world layout
const ZONES=[
  {id:'B',pop:6,name:'氷の湖',sub:'魚はかまどLv3の材料にも・焼き魚屋台',rect:[1720,620,2360,1780],cost:400,lv:2,pad:{x:1580,y:1070},col:'#2f8fd6'},
  {id:'C',pop:10,name:'奥地の森',sub:'毛皮はかまどLv4の材料にも・ボスも出る',rect:[40,620,680,1780],cost:1600,lv:3,pad:{x:820,y:1070},col:'#5a7a3a'},
  {id:'D',pop:14,name:'温泉郷',sub:'沸かすとまわりが暖かい第2のかまどに（放置でも稼ぐ）',rect:[660,1820,1740,2370],cost:4000,lv:4,pad:{x:1235,y:1760},col:'#c24f7a'}];
const HUNT_A=[260,100,2140,690];for(const z of ZONES)z.o={name:z.name,sub:z.sub};
const DZN={B:{name:'塩の湖',sub:'塩の結晶がたくさん・キャラバンが高く買う'},C:{name:'岩の渓谷',sub:'大サソリの巣・甲殻がとれる'},D:{name:'オアシス',sub:'泉のまわりは涼しく、放っておいても稼ぐ'}};
function zoneNames(){for(const z of ZONES){const n=DES()?DZN[z.id]:z.o;z.name=n.name;z.sub=n.sub}}
const GATE_ANG=[-Math.PI/2,0,Math.PI];const SOUTH=[.64,2.5];
const STN={
  steak:{conv:{x:1110,y:1310},counter:{x:1090,y:1452},lane:1138,pile:{x:1172,y:1452},stand:{x:1138,y:1414},in:'meat',out:'steak',time:1.3,base:7,step:3,zone:null,name:'肉屋',c1:'#e5483d',c2:'#fff4ea',maker:makeGrill},
  fish:{conv:{x:1312,y:1368},counter:{x:1300,y:1452},lane:1348,pile:{x:1382,y:1452},stand:{x:1348,y:1414},in:'fish',out:'grfish',time:1.6,base:28,step:10,zone:'B',name:'焼き魚',c1:'#2f8fd6',c2:'#f4fbff',maker:makeFishGrill},
  coat:{conv:{x:1432,y:1348},counter:{x:1500,y:1452},lane:1548,pile:{x:1582,y:1452},stand:{x:1548,y:1414},in:'fur',out:'coat',time:2.4,base:90,step:30,zone:'C',name:'コート',c1:'#8a3fb0',c2:'#fbf2ff',maker:makeTailor}};
const SPA={x:1200,y:2070,pile:{x:1030,y:1960},boiler:{x:1390,y:2030}};
const HOLES=[[1950,980],[2080,1060],[1980,1200],[2130,1260],[2000,1400],[2100,1500]];
const ORES=[];
const MON={x:1200,y:1345};const ROAD={x:2215,y:190};const WOOD={x:1070,y:1090};
function inZone(x,y,r){for(const z of ZONES){const [x0,y0,x1,y1]=z.rect;if(x>x0-(r||0)&&x<x1+(r||0)&&y>y0-(r||0)&&y<y1+(r||0))return z}return null}
function zoneOpen(id){return !id||G.zones[id]}

// ================================================================ game state
let G=null,running=false,world=null,forest=null;
function float(x,y,h,txt,cls,big,local){if(!local&&NET.mode==='host'&&NET.outF.length<10)NET.outF.push([x|0,y|0,h|0,String(txt),cls||'',big?1:0]);G.floats.push({x,y,h,txt,cls:(cls||'')+(big?' big':''),life:big?1.6:1.1,max:big?1.6:1.1})}
function flyItem(kind,sx,sy,sh,tx,ty,th,land,sp){const m=itemMesh(kind);world.add(m);G.flying.push({m,sx,sy,sh,tx,ty,th,t:0,sp:sp||2.8,land,rot:rnd(0,TAU)})}
const SLED_CAP=25,cap=p=>15+G.pm.cap+((p&&p.lv)?p.lv.bag:0)*6+(p&&p.riding?SLED_CAP:0)+eqv(p,'cap');
const heatBase=()=>(150+G.level*50)*((G&&G.stele>=3)?1.2:1);
const heatR=()=>G.fuel>0?heatBase()*(.7+.3*G.fuel/100)*(1+(G.rank||0)*.04):0;
const isNight=()=>((G.t%G.DAY)/G.DAY)>.72;
const MODS_B=[{id:'forest',t:'豊かな森',d:'木を切るのが速く、薪がよく燃える',ap:m=>{m.chop=.7;m.wood=2}},{id:'herd',t:'オオカミの当たり年',d:'オオカミが多く、肉が1個多く落ちる',ap:m=>{m.bears=1.4;m.meat=1}},
  {id:'spring',t:'温かい土地',d:'みんな体温が下がりにくい',ap:m=>{m.cold*=.8}},{id:'boom',t:'好景気',d:'売値が3割高い',ap:m=>{m.price=1.3}},{id:'crowd',t:'人が集まる町',d:'生存者がよく来て、SOSの人数が多い',ap:m=>{m.surv=.65;m.sos=1}}];
const MODS_C=[{id:'frost',t:'極寒の年',d:'寒さが1.3倍、気温-8℃',ap:m=>{m.cold*=1.3;m.temp=-8}},{id:'fierce',t:'凶暴なオオカミ',d:'夜の襲撃のオオカミが1.5倍',ap:m=>{m.raid=1.5}},{id:'storm',t:'吹雪の地',d:'大寒波が2日おきに来る',ap:m=>{m.wave=2}},
  {id:'scarce',t:'やせた森',d:'木が少ない',ap:m=>{m.trees=.55}},{id:'cheap',t:'不景気',d:'売値が2割安い',ap:m=>{m.price=.8}},{id:'lonely',t:'さびれた土地',d:'生存者があまり来ない',ap:m=>{m.surv=1.5}}];
const DIFFS=[{n:'ふつう',cold:1,burn:1,raid:1,hp:1,up:1,atk:1,price:1,sh:1},{n:'きびしい',cold:1.4,burn:1.35,raid:1.75,hp:1.6,up:1.5,atk:1.35,price:.9,sh:1.8},{n:'地獄',cold:1.85,burn:1.7,raid:2.6,hp:2.4,up:2.1,atk:1.8,price:.78,sh:3}];
const altCh=(h,g)=>g&&g!==h?g:(h==='Knight'?'Rogue_Hooded':'Knight');
window.SNOWU={value:1};const BIOS=[{id:'snow',n:'雪原の町',cold:1,burn:1,raid:1,hp:1,up:1,atk:1,price:1,sh:1},{id:'desert',n:'砂漠の町',cold:1.3,burn:1.25,raid:1.4,hp:1.4,up:1.3,atk:1.25,price:.92,sh:1.6}];
function calcDM(){const d=DIFFS[(G&&G.diff)||0],b=BIOS[(G&&G.biome)||0];const o={n:d.n+(b.id!=='snow'?'・'+b.n:'')};for(const k of ['cold','burn','raid','hp','up','atk','price','sh'])o[k]=d[k]*b[k];return o}
const DM=()=>(G&&G._dm)||(G?(G._dm=calcDM()):DIFFS[0]);const DES=()=>CUR_BIO===1;const TW=()=>DES()?'水分':'体温';
const DNAME={meat:'干し肉',log:'木材',water:'水',salt:'塩',fur:'甲殻',fish:'魚',coal:'石炭'};
const WXD={blizzard:{n:'砂嵐',ic:'🌪',d:'まわりが見えない・のどの渇き1.4倍'},snap:{n:'熱波',ic:'🔥',d:'渇き1.9倍・井戸の水が早く減る'},clear:{n:'涼しい風',ic:'🍃',d:'渇き半分'},aurora:{n:'満天の星',ic:'✦',d:'町の税が2倍・経験値1.5倍'}};const WXN=w=>DES()?Object.assign({},w,WXD[w.id]):w;
const DHOLES=[[760,560],[1180,470],[1620,540],[2010,420]];const CAR_STOP={x:1200,y:1480};const YR=()=>(G&&G.year)||1;
const GOALS=[{n:'町のシンボル像',c:9000,lv:5,pop:18},{n:'氷の大灯台',c:18000,lv:6,pop:24},{n:'オーロラの塔',c:30000,lv:7,pop:30}];
const goalOf=y=>GOALS[y-1]||{n:`${y}年目の記念碑`,c:30000+14000*(y-3),lv:8,pop:Math.min(40,30+3*(y-3))};
const waveDayN=d=>d>=3&&d%(G.mod?G.mod.wave:3)===0;
const inBath=p=>!!(G.zones.D&&((p.x-SPA.x)/92)**2+((p.y-SPA.y)/62)**2<1);
const spaWarm=(x,y)=>!!(G.zones.D&&G.spa.fuel>0&&dist(x,y,SPA.x,SPA.y)<280);
const RANKS=[{n:'集落',p:0},{n:'村',p:8},{n:'町',p:14},{n:'街',p:20},{n:'都',p:28}];
const rankOf=n=>RANKS.reduce((a,r,i)=>n>=r.p?i:a,0);
const popNow=()=>G.surv.filter(s=>!s.frozen).length+G.workers.length;
const HCAP=[0,3,6,10],HNAME=['','テント','小屋','宿屋'],HCOST=[[100,380,1100],[140,450,1250],[180,520,1400],[220,600,1600],[260,700,1800]];
const houseLv=i=>G.lv['house_'+i]||0,nextHouse=()=>{for(let l=0;l<3;l++)for(let i=0;i<HOUSES.length;i++)if(houseLv(i)===l)return i;return -1},houseCap=()=>Math.max(6,G.baseCap||6)+HOUSES.reduce((a,_,i)=>a+HCAP[houseLv(i)],0),houseFull=()=>popNow()>=houseCap();
const tempC=()=>Math.round((G.mod?G.mod.temp:0)-(G.wx&&G.wx.type==='snap'?15:G.wx&&G.wx.type==='clear'?-8:0)-12-G.day*2.5-(isNight()?10:0)-(G.wave?15:0));
const price=id=>Math.round((STN[id].base+STN[id].step*G.lv['price_'+id]+G.pm.price*(id==='steak'?1:id==='fish'?2.5:6))*(G.mod?G.mod.price:1)*(G&&G._dm?G._dm.price:1));
const logFuel=()=>9+G.level*1.2+G.pm.wood+(G.mod?G.mod.wood:0);
const WXS=[{id:'blizzard',n:'猛吹雪',ic:'🌨',d:'まわりが見えない・寒さ1.4倍',cool:1.4},{id:'snap',n:'急な冷え込み',ic:'❄',d:'寒さ1.9倍・燃料の減りも速い',cool:1.9},{id:'clear',n:'晴れ間',ic:'☀',d:'寒さ半分・お客さんが増える',cool:.5},{id:'aurora',n:'オーロラの夜',ic:'✦',d:'町の税が2倍・経験値1.5倍',cool:1}];
const wxIs=id=>G.wx&&G.wx.type===id;
const coolMul=()=>DM().cold*(1+(YR()-1)*.18)*(DES()?(isNight()?.4:1.9):(isNight()?1.5:1))*(G.wave?2.2:1)*(G.wx&&G.wx.type?WXS.find(w=>w.id===G.wx.type).cool:1);
function mult(){return (1+Math.min(2,Math.floor(G.combo/5)*.25))*(G.feverT>0?2:1)}

let CUR_BIO=0;
function newGame(np,opts){opts=opts||{};CUR_BIO=opts.biome||0;zoneNames();let RS=(opts.seed||((Math.random()*1e9)|0))|0;const SEED0=RS;const srng=()=>{RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const sr=(a,b)=>a+srng()*(b-a);
  if(world){scene.remove(world)}if(forest)forest.dispose();psN.clear();psA.clear();
  world=new T.Group();scene.add(world);world.add(makeGround(),makeMountains());
  G={rank:0,year:1,biome:opts.biome||0,diff:opts.diff||0,charOf:opts.chars||[meta.pick||'Rogue_Hooded','Knight'],t:0,DAY:75,day:1,wave:false,waveWarned:0,players:[],floats:[],flying:[],shake:0,paused:false,mission:0,missionCd:0,endless:false,newAch:[],achT:0,wind:0,
    combo:0,comboT:0,fever:0,feverT:0,chests:[],luck:0,plv:1,xp:0,pendingLv:0,perkCount:{},cashShow:0,
    cash:0,earned:0,rep:3,fuel:100,woodpile:0,level:1,zones:{},bears:[],pickups:[],surv:[],workers:[],customers:[],trees:[],ores:[],holes:[],pads:[],
    stations:{},sleds:[],wx:{type:null,t:0,max:0},wxDay:0,wxAt:0,spa:{on:false,lv:0,fuel:0,pile:0,t:0},monument:false,rescue:null,hauls:[],raid:{on:false,total:0,left:0,spawn:0,spawnT:0,kills:0,night:0,warn:0},raidWins:0,metaGiven:0,
    lv:{bag:0,gun:0,price_steak:0,price_fish:0,price_coat:0,cook_steak:0,cook_fish:0,cook_coat:0,spa:0,tw_N:0,tw_E:0,tw_W:0,trap:0},
    pm:{rate:1,dmg:0,cap:0,speed:1,price:0,cook:1,magnet:0,wood:0,burn:1,cold:1,chop:1,thaw:1,tower:1},
    stats:{bears:0,grilled:0,sold:0,soldFish:0,soldCoat:0,chopped:0,fed:0,fish:0,fur:0,boss:0,thawed:0,haul:0,raidKills:0},
    bearT:0,survT:4,bossT:90,sparkT:0,nid:0,me:0};G.seed=SEED0;
  {let ms=(RS^0x5bd1e995)|0;const mr=()=>{ms=ms+0x6D2B79F5|0;let t=Math.imul(ms^ms>>>15,1|ms);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const bo=MODS_B[Math.floor(mr()*MODS_B.length)];let cu=MODS_C[Math.floor(mr()*MODS_C.length)];if(bo.id==='crowd'&&cu.id==='lonely')cu=MODS_C[0];
    G.mod={price:1,bears:1,meat:0,surv:1,raid:1,wave:3,temp:0,cold:1,chop:1,wood:0,trees:1,sos:0};bo.ap(G.mod);cu.ap(G.mod);G.mods=[bo,cu]}
  G.cash+=mlv('cash')*40;G.pm.cap+=mlv('bag')*3;G.pm.cold*=1-mlv('warm')*.08;G.pm.wood+=mlv('wood');G.pm.tower=1+mlv('tower')*.2;G.pm.dmg+=mlv('gun')*.15;G.pm.speed*=1+mlv('boots')*.05;G.pm.burn*=1-mlv('kiln')*.06;G.mod.price*=1+mlv('trade')*.06;if(mlv('watch'))G.lv.tw_N=1;
  // fence (instanced posts around the ring, gaps at gates and the southern market)
  const posts=[];for(let i=0;i<220;i++){const a=i/220*TAU-Math.PI;const an=Math.atan2(Math.sin(a),Math.cos(a));if(GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(an-g),Math.cos(an-g)))<.12))continue;if(an>SOUTH[0]&&an<SOUTH[1])continue;posts.push([CX+Math.cos(an)*FR,CY+Math.sin(an)*FR,rnd(40,48)])}
  const pI=new T.InstancedMesh(new T.CylinderGeometry(7,7.6,1,8),std('#9a6a3a',{map:TEX.bark}),posts.length),tI=new T.InstancedMesh(new T.ConeGeometry(7,11,8),std('#8a5a30'),posts.length),cI=new T.InstancedMesh(new T.SphereGeometry(6.5,8,5,0,TAU,0,Math.PI/2),std('#f7fbff',{r:.9}),posts.length);
  pI.castShadow=tI.castShadow=true;const o=new T.Object3D();
  const bulbN=Math.ceil(posts.length/3),bI=new T.InstancedMesh(new T.SphereGeometry(2.2,8,6),glow('#ffffff',2.6),bulbN);let bi=0;const bc=[lin('#ffd166'),lin('#ff8ad8'),lin('#7fe3ff'),lin('#8ff08f')];
  posts.forEach(([x,y,h],i)=>{o.rotation.set(0,0,0);o.position.set(x,h/2,y);o.scale.set(1,h,1);o.updateMatrix();pI.setMatrixAt(i,o.matrix);o.position.set(x,h+5.5,y);o.scale.set(1,1,1);o.updateMatrix();tI.setMatrixAt(i,o.matrix);o.position.set(x,h+7,y);o.scale.set(1,.6,1);o.updateMatrix();cI.setMatrixAt(i,o.matrix);
    if(i%3===0&&bi<bulbN){o.position.set(x,h-4,y);o.scale.set(1,1,1);o.updateMatrix();bI.setMatrixAt(bi,o.matrix);bI.setColorAt(bi,bc[bi%4]);bi++}});
  world.add(pI,tI,cI,bI);G.fenceIM=[pI,tI,cI,bI];
  if(KK&&KK.kit.h_fence){pI.visible=tI.visible=cI.visible=bI.visible=false;const seg=[],pil=[];const L=58,step=L/FR;
    for(let a=-Math.PI;a<Math.PI-step/2;a+=step){const an=a+step/2;const gap=q=>GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(q-g),Math.cos(q-g)))<.13)||(q>SOUTH[0]&&q<SOUTH[1]);if(gap(an))continue;seg.push([CX+Math.cos(an)*FR,CY+Math.sin(an)*FR,-an-Math.PI/2]);pil.push([CX+Math.cos(a)*FR,CY+Math.sin(a)*FR,-a]);if(gap(a+step))pil.push([CX+Math.cos(a+step)*FR,CY+Math.sin(a+step)*FR,-a])}
    G.fenceIM=[...kkInst('h_fence',L,seg),...kkInst('h_fence_p',L*.125*1.3,pil)]}
  for(const a of GATE_ANG){for(const s of [-1,1]){const aa=a+s*.13;if(KK&&KK.kit.d_pillar)world.add(kkP('d_pillar',22,CX+Math.cos(aa)*FR,0,CY+Math.sin(aa)*FR,-aa));else world.add(at(cyl(9,9,80,std('#7a4a2a',{map:TEX.bark}),10),CX+Math.cos(aa)*FR,40,CY+Math.sin(aa)*FR))}}
  // lamps around the plaza
  for(const [x,y] of [[1030,1400],[1240,1400],[1450,1400],[1030,1700],[1450,1700],[1600,1600],[800,1400]]){const l=makeLamp();l.position.set(x,0,y);world.add(l)}
  // furnace
  const f=DES()?makeWell():makeFurnace();f.g.position.set(CX,0,CY);world.add(f.g);
  const heat=M_(new T.CircleGeometry(1,64),new T.MeshBasicMaterial({map:DES()?radialTex('rgba(120,200,240,.38)','rgba(90,170,230,0)'):radialTex('rgba(255,170,90,.42)','rgba(255,130,60,0)'),transparent:true,depthWrite:false}),false);heat.rotation.x=-Math.PI/2;heat.position.set(CX,.8,CY);heat.renderOrder=1;world.add(heat);
  const ring=M_(new T.RingGeometry(.985,1,128),new T.MeshBasicMaterial({color:lin('#ffa04d'),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.set(CX,1.1,CY);world.add(ring);
  const embers=[];for(let i=0;i<30;i++){const e=M_(geo('emb',()=>new T.OctahedronGeometry(3.4,0)),glow(DES()?'#7fd4ff':'#ffb347',2.2),false);world.add(e);embers.push(e)}
  G.v={f,heat,ring,embers};
  // stations
  for(const id in STN){const s=STN[id];const conv=s.maker();conv.g.position.set(s.conv.x,0,s.conv.y);conv.g.rotation.y=Math.PI*.12;world.add(conv.g);
    const ct=makeCounter({name:s.name,c1:s.c1,c2:s.c2,w:150});ct.g.position.set(s.counter.x,0,s.counter.y);world.add(ct.g);
    const pileG=new T.Group();pileG.position.set(s.pile.x,0,s.pile.y);pileG.add(at(cyl(26,28,1.2,std('#2fb14a',{r:.6}),20,false),0,.6,0));world.add(pileG);
    const st={id,def:s,conv,ct,q:[],shelf:0,pile:0,cookT:0,serveT:0,queue:[],inStack:new Stack(conv.g,'col'),shelfStack:new Stack(ct.g,'col'),pileStack:new Stack(pileG,'pile'),cashier:null,frozen:false,custT:rnd(1,3),open:!s.zone,ice:null};
    st.inStack.g.position.set(-56,0,10);st.shelfStack.g.position.set(-50,28,2);
    const ice=M_(new T.BoxGeometry(96,64,52),std('#cdeefc',{t:true,op:.55,r:.1,m:.1}),false);ice.position.set(0,30,0);ice.visible=false;conv.g.add(ice);st.ice=ice;
    st.parts=[conv.g,ct.g,pileG];if(!st.open){st.parts.forEach(o=>o.visible=false);const sg=makeTextPlate(`${s.name}：${ZONES.find(z=>z.id===s.zone).name}で解放`,120,22,'rgba(255,250,240,.88)','#8a7058',.5);sg.rotation.set(-Math.PI/2,0,YAW);sg.position.set(s.counter.x,1.5,s.counter.y-20);world.add(sg);st.sign=sg}
    if(DES()){st.open=false;st.parts.forEach(o=>o.visible=false);if(st.sign)st.sign.visible=false}
    G.stations[id]=st}
  if(KK){for(let i=0;i<16;i++){const a=i/16*TAU+.2,r=1650+(i%3)*180;const m=kkProp(i%4===3?'hill':'mountain',420+(i%3)*120);m.position.set(CX+Math.cos(a)*r,-6,CY+Math.sin(a)*r);m.rotation.y=i*1.7;world.add(m)}
    for(let i=0;i<14;i++){const x=sr(120,WORLD-120),y=sr(120,WORLD-120);if(dist(x,y,CX,CY)<FR+140||inZone(x,y))continue;const rk=['rock1','rock2','rock3'][i%3];const m=KK.nat&&KK.nat[rk]?(()=>{const g=new T.Group(),o=KK.nat[rk].clone(true);o.scale.setScalar(sr(34,60)/(KK.natH[rk]||1));g.add(o);return g})():kkProp(i%2?'rockA':'rockC',sr(40,70));m.position.set(x,0,y);m.rotation.y=sr(0,TAU);world.add(m)}}
  // decor: bushes, grass tufts, dead trees and pebbles (instanced, no collision)
  G.decor=[];if(KK&&KK.nat&&KK.nat.bush){const o3=new T.Object3D();for(const [k,n,s0,s1] of (DES()?[['dead',34,80,120],['peb',260,12,24]]:[['bush',160,34,60],['grass',420,26,44],['dead',12,90,130],['peb',140,10,20]])){const src=KK.nat[k];if(!src)continue;src.updateMatrixWorld(true);const H=KK.natH[k]||1;const list=[];
      let g2=0;while(list.length<n&&g2++<n*20){const x=sr(40,WORLD-40),y=sr(40,WORLD-40);const d=dist(x,y,CX,CY);if(d<FR+(k==='dead'?140:60))continue;if(x>900&&x<1700&&y>1580&&y<1840)continue;if(dist(x,y,SPA.x,SPA.y)<260)continue;if(!DES()&&TSPOTS.some(q=>dist(x,y,q[0],q[1])<130))continue;if(!DES()&&x>CAVE_BOX[0]-60&&y>CAVE_BOX[1]-60)continue;list.push([x,y,sr(s0,s1)/H,sr(0,TAU)])}
      const byC=new Map();for(const it of list){const key=chunkKey(it[0],it[1]);if(!byC.has(key))byC.set(key,[]);byC.get(key).push(it)}
      for(const [key,cl] of byC){const box=chunkBox(key,k==='dead'?200:90);src.traverse(o=>{if(!o.isMesh)return;const im=new T.InstancedMesh(o.geometry,o.material,cl.length);im.frustumCulled=false;im.castShadow=k==='bush'||k==='dead';im.receiveShadow=true;im.userData.n=cl.length;im.userData.box=box;im.count=Math.floor(cl.length*QL[GQ.tier].decor*(k==='dead'&&GQ.tier<2?0:1));im.visible=im.count>0;G.decor.push(im);
        cl.forEach(([x,y,sc,r],i)=>{o3.position.set(x,0,y);o3.rotation.set(0,r,0);o3.scale.setScalar(sc);o3.updateMatrix();const m4=new T.Matrix4().multiplyMatrices(o3.matrix,o.matrixWorld);im.setMatrixAt(i,m4)});world.add(im)})}}}
  // watchtowers, gate traps and house slots (they appear as the town grows)
  G.towerV={};for(const tw of TOWERS){const m=makeTower();m.g.position.set(tw.mx,0,tw.my);m.g.visible=false;m.lv=0;m.pop=1;world.add(m.g);G.towerV[tw.id]=m}
  G.trapV=GATE_ANG.map(a=>{const m=makeTrap();m.position.set(CX+Math.cos(a)*FR,0,CY+Math.sin(a)*FR);m.visible=false;world.add(m);return m});
  G.rankV=makeRankVisuals();G.rankO={};
  G.houses=HOUSES.map(([x,y],i)=>{const tent=KK?kkProp('tent',54):makeTent(i),cab=KK?kkProp(['home_A_red','home_B_blue','home_A_blue','home_B_red','home_A_red'][i],66):makeHouse(i),man=KK?kkProp('tavern',80):makeManor(i);man.visible=false;const g=grp(tent,cab,man);g.position.set(x,0,y);g.rotation.y=Math.atan2(CX-x,CY-y);tent.visible=cab.visible=false;world.add(g);return{x,y,g,tent,cab,man,lv:0,pop:1,need:[7,10,13,17,21][i]}});
  // zone fog curtains
  for(const z of ZONES){const [x0,y0,x1,y1]=z.rect;const fogM=new T.MeshStandardMaterial({color:lin(DES()?'#ecc98f':'#eef5fb'),transparent:true,opacity:.93,roughness:1});
    const m=M_(new T.BoxGeometry(x1-x0,240,y1-y0),fogM,false);m.position.set((x0+x1)/2,120,(y0+y1)/2);world.add(m);
    const sign=makeTextPlate(`${z.name}`,140,40,'#fffaf0','#5b4636',.55);sign.position.set(z.pad.x,120,z.pad.y);sign.userData.bb=true;world.add(sign);
    G.zones[z.id]=false;z.fog=m;z.sign=sign;z.fogT=-1}
  // trees
  let guard=0;const trees=[];
  while(trees.length<Math.round(360*G.mod.trees)&&guard++<30000){const x=sr(60,WORLD-60),y=sr(60,WORLD-60);const d=dist(x,y,CX,CY);if(d<FR+70)continue;if(x>900&&x<1700&&y>1580&&y<1840)continue;
    if(!DES()&&dist(x,y,2020,1210)<470&&x>1720)continue;if(DES()&&DHOLES.some(h=>dist(h[0],h[1],x,y)<110))continue;if(dist(x,y,ROAD.x,ROAD.y)<230)continue;if(dist(x,y,SPA.x,SPA.y)<260)continue;if(Math.abs(x-CX)<60&&y<CY)continue;if(!DES()&&TSPOTS.some(q=>dist(x,y,q[0],q[1])<150))continue;if(!DES()&&x>CAVE_BOX[0]-60&&y>CAVE_BOX[1]-60)continue;if(Math.abs(y-CY)<60&&(x<CX||x>CX))continue;
    if(trees.some(t=>dist(t.x,t.y,x,y)<54))continue;trees.push({x,y,s:sr(.85,1.25),ry:sr(0,TAU),hp:4,alive:true,regrow:0,shake:0,fall:0,fallDir:0,grow:1,zone:(inZone(x,y)||{}).id||null})}
  G.trees=trees;forest=new Forest(trees);makeSecrets(trees,sr);makeRoad();applyBiome();
  // ores (zone C? no — rocky outcrops in the east of the north field feed coal)
  // fishing holes (zone B)
  if(!DES()){const m=makeHole();m.scale.setScalar(1.5);m.position.set(BIGHOLE.x,0,BIGHOLE.y);world.add(m);const fish=itemMesh('fish');fish.visible=false;world.add(fish);G.holes.push({x:BIGHOLE.x,y:BIGHOLE.y,m,fish,t:0,user:null,jump:0,rq:2})}
  for(const [x,y] of (DES()?DHOLES:HOLES)){const m=makeHole();m.position.set(x,0,y);world.add(m);const fish=itemMesh(DES()?'water':'fish');fish.visible=false;world.add(fish);G.holes.push({x,y,m,fish,t:0,user:null,jump:0})}
  // spa
  const spa=DES()?makeOasis():makeSpa();spa.g.position.set(SPA.x,0,SPA.y);world.add(spa.g);G.spaV=spa;const spaPile=new T.Group();spaPile.position.set(SPA.pile.x,0,SPA.pile.y);world.add(spaPile);G.spaStack=new Stack(spaPile,'pile');
  const wp=new T.Group();wp.position.set(WOOD.x,0,WOOD.y);wp.add(at(rbox(60,4,40,2,std('#6e4524',{map:TEX.wood})),0,2,0));world.add(wp);G.woodStack=new Stack(wp,'pair');G.woodStack.g.position.y=4;
  // monument placeholder plinth
  const mon=makeMonument();mon.position.set(MON.x,0,MON.y);mon.visible=false;world.add(mon);G.monV=mon;
  // players
  for(let i=0;i<np;i++)addPlayer(i);G.me=opts.guest?1:0;G.guest=!!opts.guest;if(opts.guest)G.players[0].remote=true;
  // pads
  buildPads();
  G.townS=DES()?null:makeTownStages();
  G.sledV=[];
  if(!opts.guest&&mlv('sled'))G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});
  G.baseCap=Math.max(6,5+mlv('folk')+1);
  if(!opts.guest){for(let i=0;i<5+mlv('folk');i++)spawnSurvivor(true);for(let i=0;i<6;i++)spawnBear('A',true)}
  return G;
}
function addPlayer(i){const p={lv:{gun:0,bag:0},life:{},id:i,x:CX-30+i*60,y:CY+110,vx:0,vy:0,dir:Math.PI*.8,step:0,moving:false,bag:[],warm:100,hp:100,breath:rnd(0,1),bb:0,actT:0,depT:0,padT:0,cashT:0,flash:0,chopping:null,shooting:null,fishing:null,hurt:0,inv:0};
  p.m=makeHero(HERO[i]);p.stack=new Stack(p.m.back,'col');world.add(p.m.g);G.players[i]=p;return p}
// ================================================================ pads
const meP=()=>G.players[G.me]||G.players[0];
function persPad(d){d.personal=true;d.pp={};d.cost=()=>{const q=meP();return q?d.costP(q):null};d.lvText=()=>{const q=meP();return q?d.lvP(q):''};return padDef(d)}
function padDef(d){d.paid=0;d.pulse=0;d.shown=false;d.rise=0;return d}
function buildPads(){
  const P=[];
  const need=(pad)=>pad.pop?1:0;
  P.push(padDef({id:'furnace',mp:{fish:0,fur:0},mix:()=>{const sm=G.players.length>1?1:.85,t=[[0,0],[0,0],[8,0],[10,6],[12,10],[15,12],[18,15],[20,20]][G.level]||[0,0];return{fish:Math.round(t[0]*sm),fur:Math.round(t[1]*sm)}},x:1200,y:1020,name:'かまど強化',k:'炉',pay:'log',vis:()=>G.level<8,cost:()=>Math.round([12,20,30,45,60,80,100][G.level-1]*(G.players.length>1?1:.85)),lvText:()=>`Lv${G.level}→${G.level+1}`,buy:()=>{G.level++;G.waveFx=0;G.fuel=Math.min(100,G.fuel+30);banner('かまど強化！ 町が育った',`Lv${G.level}「${(TOWN[G.level]||TOWN[8]).n}」`,`${DES()?'':(TOWN[G.level]||TOWN[8]).d+'・'}熱の範囲が広がった${G.level===2?'・氷の湖を解放できる':G.level===3?'・奥地の森を解放できる':G.level===4?'・温泉郷を解放できる':''}`);G.shake=10}}));
  P.push(padDef({id:'hunter',x:990,y:1110,name:'猟師',k:'猟',pay:'cash',pop:true,vis:()=>G.workers.filter(w=>w.role==='hunter').length<5,cost:()=>[60,140,260,420,600][G.workers.filter(w=>w.role==='hunter').length],lvText:()=>`${G.workers.filter(w=>w.role==='hunter').length}人`,buy:(pad)=>hire('hunter',pad)}));
  P.push(padDef({id:'lumber',x:990,y:1220,name:'木こり',k:'斧',pay:'cash',pop:true,vis:()=>G.workers.filter(w=>w.role==='lumber').length<4,cost:()=>[40,100,200,340][G.workers.filter(w=>w.role==='lumber').length],lvText:()=>`${G.workers.filter(w=>w.role==='lumber').length}人`,buy:(pad)=>hire('lumber',pad)}));
  P.push(padDef({id:'price_steak',x:990,y:1330,name:'肉の値上げ',k:'値',pay:'cash',vis:()=>G.lv.price_steak<3,cost:()=>[60,150,300][G.lv.price_steak],lvText:()=>`$${price('steak')}`,buy:()=>{G.lv.price_steak++;toast(`肉 1個 $${price('steak')}`,'cash')}}));
  P.push(persPad({id:'gun',x:1410,y:1110,name:'武器（自分用）',k:'武',pay:'cash',vis:()=>G.players.some(q=>q.lv.gun<6),costP:q=>q.lv.gun<6?[40,100,200,380,600,900][q.lv.gun]:null,lvP:q=>q.lv.gun<6?`Lv${q.lv.gun+1}`:'MAX',buyP:q=>{q.lv.gun++;float(q.x,q.y,80,`武器 Lv${q.lv.gun+1}！`,'gold',true)}}));
  P.push(persPad({id:'bag',x:1410,y:1220,name:'背負いかご（自分用）',k:'籠',pay:'cash',vis:()=>G.players.some(q=>q.lv.bag<5),costP:q=>q.lv.bag<5?[30,80,160,300,500][q.lv.bag]:null,lvP:q=>q.lv.bag<5?`${cap(q)+6}個`:'MAX',buyP:q=>{q.lv.bag++;float(q.x,q.y,80,`${cap(q)}個まで運べる`,'gold',true)}}));
  P.push(padDef({id:'house',x:850,y:1420,name:'家を建てる',k:'家',pay:'cash',vis:()=>nextHouse()>=0,
    req:()=>{const i=nextHouse();return i>=0&&houseLv(i)===2&&G.rank<2?'「町」になると宿屋を建てられる':null},cost:()=>{const i=nextHouse();return HCOST[i][houseLv(i)]},lvText:()=>{const i=nextHouse(),l=houseLv(i);return `${HNAME[l+1]}（住める人 +${HCAP[l+1]-HCAP[l]}）`},
    buy:()=>{const i=nextHouse();G.lv['house_'+i]=houseLv(i)+1;const h=G.houses[i];float(h.x,h.y,90,HNAME[houseLv(i)]+'が建った！','gold',false,true);toast(`${HNAME[houseLv(i)]}が建った！ 住める人数 ${houseCap()}人`,'cash');SFX.build()}}));
for(const tw of TOWERS)P.push(padDef({id:'tw_'+tw.id,x:tw.x,y:tw.y,name:`見張り台(${tw.n})`,k:'塔',pay:'cash',vis:()=>G.lv['tw_'+tw.id]<3,cost:()=>[80,240,600][G.lv['tw_'+tw.id]],lvText:()=>`Lv${G.lv['tw_'+tw.id]+1}`,buy:()=>{G.lv['tw_'+tw.id]++;toast(`見張り台(${tw.n}) Lv${G.lv['tw_'+tw.id]}！ 襲ってくるオオカミを自動で撃つ`,'cash')}}));
  P.push(padDef({id:'guard',x:JOBPAD.guard.x,y:JOBPAD.guard.y,name:'見張り番',k:'番',pay:'cash',pop:true,vis:()=>{const b=TOWERS.filter(t=>G.lv['tw_'+t.id]>0).length;return b>0&&wc('guard')<b*2},cost:()=>[60,90,130,180,240,300][wc('guard')]||300,lvText:()=>`${wc('guard')}人`,
    buy:(pad)=>{const built=TOWERS.filter(t=>G.lv['tw_'+t.id]>0);const tw=built.reduce((a,t)=>guardsAt(t.id)<guardsAt(a.id)?t:a);if(!hire('guard',pad))return false;const w=G.workers[G.workers.length-1];w.tw=tw.id;w.slot=guardsAt(tw.id)-1;toast(`見張り台(${tw.n})に見張り番！ 射撃が強くなる`,'cash')}}));
  P.push(padDef({id:'split',x:JOBPAD.split.x,y:JOBPAD.split.y,name:'薪割り',k:'割',pay:'cash',pop:true,vis:()=>wc('splitter')<3,cost:()=>[50,100,160][wc('splitter')],lvText:()=>`${wc('splitter')}人`,
    buy:(pad)=>{if(!hire('splitter',pad))return false;const w=G.workers[G.workers.length-1];w.slot=wc('splitter')-1;toast('薪割り係が薪置き場に薪をためてくれる','cash')}}));
  P.push(padDef({id:'sled',x:1500,y:1265,name:'犬ぞり',k:'犬',pay:'cash',vis:()=>G.sleds.length<Math.max(1,G.players.length),cost:()=>[220,320][G.sleds.length]||320,lvText:()=>'',buy:()=>{G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});banner('犬ぞり','ハスキーが仲間に！','乗ると速く走れて寒さに強い。柵の中に戻ると降りる','area');SFX.rare()}}));
  P.push(padDef({id:'trap',x:1300,y:1000,name:'門のトゲ罠',k:'罠',pay:'cash',vis:()=>G.lv.trap<3,cost:()=>[120,350,800][G.lv.trap],lvText:()=>`Lv${G.lv.trap+1}`,buy:()=>{G.lv.trap++;toast(`3つの門にトゲ罠 Lv${G.lv.trap}！ 通るオオカミが遅くなりダメージ`,'cash')}}));
  P.push(padDef({id:'cook_steak',x:1025,y:1545,name:'グリル',k:'焼',pay:'cash',vis:()=>G.lv.cook_steak<4,cost:()=>[40,90,180,320][G.lv.cook_steak],lvText:()=>`Lv${G.lv.cook_steak+1}`,buy:()=>{G.lv.cook_steak++;toast('グリルが速くなった','cash')}}));
  P.push(padDef({id:'cashier_steak',x:1025,y:1655,name:'肉屋のレジ係',k:'レ',pay:'cash',pop:true,vis:()=>!G.stations.steak.cashier,cost:()=>80,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'steak')}));
  // zone B
  P.push(padDef({id:'cook_fish',x:1235,y:1545,name:'焼き魚台',k:'焼',pay:'cash',zone:'B',vis:()=>G.lv.cook_fish<3,cost:()=>[120,260,500][G.lv.cook_fish],lvText:()=>`Lv${G.lv.cook_fish+1}`,buy:()=>{G.lv.cook_fish++;toast('焼き魚が速くなった','cash')}}));
  P.push(padDef({id:'cashier_fish',x:1235,y:1655,name:'魚屋のレジ係',k:'レ',pay:'cash',pop:true,zone:'B',vis:()=>!G.stations.fish.cashier,cost:()=>200,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'fish')}));
  P.push(padDef({id:'fisher',x:1580,y:1070,name:'釣り人',k:'釣',pay:'cash',pop:true,zone:'B',vis:()=>G.workers.filter(w=>w.role==='fisher').length<4,cost:()=>[120,260,480,700][G.workers.filter(w=>w.role==='fisher').length],lvText:()=>`${G.workers.filter(w=>w.role==='fisher').length}人`,buy:(pad)=>hire('fisher',pad)}));
  P.push(padDef({id:'price_fish',x:1440,y:1545,name:'魚の値上げ',k:'値',pay:'cash',zone:'B',vis:()=>G.lv.price_fish<2,cost:()=>[150,350][G.lv.price_fish],lvText:()=>`$${price('fish')}`,buy:()=>{G.lv.price_fish++;toast(`焼き魚 1本 $${price('fish')}`,'cash')}}));
  // zone C
  P.push(padDef({id:'cook_coat',x:820,y:1070,name:'仕立て台',k:'縫',pay:'cash',zone:'C',vis:()=>G.lv.cook_coat<3,cost:()=>[300,700,1200][G.lv.cook_coat],lvText:()=>`Lv${G.lv.cook_coat+1}`,buy:()=>{G.lv.cook_coat++;toast('コートを縫うのが速くなった','cash')}}));
  P.push(padDef({id:'cashier_coat',x:1440,y:1655,name:'コート屋のレジ係',k:'レ',pay:'cash',pop:true,zone:'C',vis:()=>!G.stations.coat.cashier,cost:()=>500,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'coat')}));
  P.push(padDef({id:'price_coat',x:1640,y:1300,name:'コートの値上げ',k:'値',pay:'cash',zone:'C',vis:()=>G.lv.price_coat<2,cost:()=>[400,900][G.lv.price_coat],lvText:()=>`$${price('coat')}`,buy:()=>{G.lv.price_coat++;toast(`コート 1着 $${price('coat')}`,'cash')}}));
  // zone D
  P.push(padDef({id:'spa',x:1235,y:1760,name:'温泉',k:'湯',pay:'cash',zone:'D',vis:()=>G.lv.spa<3,cost:()=>[800,1600,3000][G.lv.spa],lvText:()=>`Lv${G.lv.spa+1}`,buy:()=>{G.lv.spa++;toast(`温泉 Lv${G.lv.spa+1}！ 客が増えた`,'cash')}}));
  P.push(padDef({id:'stoker',x:1480,y:1900,name:'風呂焚き',k:'焚',pay:'cash',pop:true,zone:'D',vis:()=>G.workers.filter(w=>w.role==='stoker').length<2,cost:()=>[600,1200][G.workers.filter(w=>w.role==='stoker').length],lvText:()=>`${G.workers.filter(w=>w.role==='stoker').length}人`,buy:(pad)=>hire('stoker',pad)}));
  // zone unlocks
  for(const z of ZONES)P.push(padDef({id:'zone_'+z.id,x:z.pad.x,y:z.pad.y,name:z.name+'を解放',k:'開',pay:'cash',big:true,vis:()=>!G.zones[z.id],lvNeed:z.lv,popNeed:z.pop,req:()=>G.level<z.lv?`かまどLv${z.lv}が必要`:popNow()<z.pop?`町人${z.pop}人が必要（いま${popNow()}人）`:null,cost:()=>z.cost,lvText:()=>'',buy:()=>unlockZone(z)}));
  // monument
  P.push(padDef({id:'monument',x:MON.x,y:MON.y,name:'町のシンボル像',k:'像',pay:'cash',big:true,vis:()=>!G.monument&&G.zones.D&&!(G.story&&G.story.ch===2&&G.story.step<4)&&!(G.story&&G.story.ch===3),lvNeed:5,popNeed:18,req:()=>{const g=goalOf(YR());return G.level<g.lv?`かまどLv${g.lv}が必要`:popNow()<g.pop?`町人${g.pop}人が必要（いま${popNow()}人）`:null},cost:()=>goalOf(YR()).c,lvText:()=>'',buy:()=>{G.monument=true;G.monV.visible=true;G.monV.scale.setScalar(.01);G.monPop=0;SFX.area();banner('完成！',goalOf(YR()).n,'…その夜、オオカミの大群が押し寄せてくる。最後の夜を守りきれ！','area');G.shake=14;G.finalPending=true;const ph=(G.t%G.DAY)/G.DAY;if(ph<.66)G.t+=(.66-ph)*G.DAY;else if(ph>.72){G.t=Math.ceil(G.t/G.DAY)*G.DAY+.66*G.DAY;G.raid.night=0}}}));
  for(const p of P){p.mesh=makePadMesh(p);world.add(p.mesh.g)}
  for(const pd of P){if(pd.personal||pd.pay!=='cash')continue;const c0=pd.cost;pd.cost=()=>{const v=c0();return v!=null&&!isRPG()&&snowy()?Math.round(v*.8):v}}
  G.pads=P;makeBench();if(DES())for(const pd of P){if(/^(cook_|cashier_|price_)/.test(pd.id))pd.vis=()=>false;if(pd.id==='fisher'){pd.zone=null;pd.name='水くみ係'}}
}
function makePadMesh(pad){
  const S=pad.big?128:92,c=document.createElement('canvas');c.width=c.height=256;const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;
  const mesh=M_(new T.PlaneGeometry(S,S),new T.MeshBasicMaterial({map:tex,alphaTest:.35,depthWrite:false,depthTest:false}),false);mesh.rotation.set(-Math.PI/2,0,YAW);mesh.position.set(pad.x,1.2,pad.y);mesh.renderOrder=5;
  const icon=new T.Group();icon.position.set(pad.x,56,pad.y);const money=pad.pay==='cash';
  const coin=M_(geo('coin',()=>new T.CylinderGeometry(16,16,5,28)),std(pad.big?'#f7c948':money?'#8ac66a':'#f0a15a',{m:.2,r:.45,e:pad.big?'#d19a1c':money?'#3f7a2c':'#b8661e',ei:.2}));coin.rotation.x=Math.PI/2;icon.add(coin);
  const face_=makeTextPlate(pad.k,26,26,'none','#ffffff');face_.position.z=2.8;icon.add(face_);
  const g=grp(mesh,icon);g.visible=false;
  const draw=(cost,paid,lvText,on,req,extra)=>{const key=`${cost}|${paid}|${lvText}|${on}|${req}|${extra}`;if(pad._key===key)return;pad._key=key;
    const x=c.getContext('2d');x.clearRect(0,0,256,256);const F='"M PLUS Rounded 1c","Zen Maru Gothic",sans-serif';
    // soft cream tile with a stitched border (cozy-game style)
    x.fillStyle=req?'rgba(236,226,208,.72)':on?'rgba(255,250,240,.97)':'rgba(255,250,240,.86)';rr(x,16,16,224,224,46);x.fill();
    x.lineWidth=6;x.strokeStyle=req?'#cdbd9f':pad.big?'#f7c948':money?'#8ac66a':'#f0a15a';x.setLineDash([16,12]);rr(x,30,30,196,196,36);x.stroke();x.setLineDash([]);
    if(cost!=null&&paid>0){x.lineWidth=14;x.lineCap='round';x.strokeStyle='rgba(91,70,54,.12)';x.beginPath();x.arc(128,128,86,0,TAU);x.stroke();x.strokeStyle=money?'#6ab04c':'#f0a15a';x.beginPath();x.arc(128,128,86,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,paid/cost));x.stroke()}
    x.textAlign='center';x.textBaseline='middle';
    const t=money?`$${(cost-paid).toLocaleString()}`:cost-paid>0?`薪 ${cost-paid}`:'OK';x.font=`900 ${pad.big?50:46}px ${F}`;x.fillStyle=req?'#a8927a':money?'#3f8a3a':'#b8661e';x.fillText(t,128,114,210);
    x.font=`900 23px ${F}`;x.fillStyle='#5b4636';x.fillText(`${pad.name}${lvText?' '+lvText:''}`,128,166,200);
    const chip=(txt,bg,fg)=>{x.font=`900 20px ${F}`;const w=Math.min(206,x.measureText(txt).width+26);x.fillStyle=bg;rr(x,128-w/2,48,w,32,16);x.fill();x.fillStyle=fg;x.fillText(txt,128,65,196)};
    if(req)chip(req,'#f0826a','#fff');else if(extra)chip('+'+extra,'#6fb7e6','#fff');else if(pad.pop)chip('町の人1人','#8ac66a','#fff');
    tex.needsUpdate=true};
  return{g,mesh,icon,draw}
}
function unlockZone(z){G.zones[z.id]=true;z.fogT=0;SFX.area();banner('新エリア解放！',z.name,z.sub,'area');G.shake=12;G.camPan={x:(z.rect[0]+z.rect[2])/2,y:(z.rect[1]+z.rect[3])/2,t:0};
  for(const id in G.stations){const st=G.stations[id];if(st.def.zone===z.id&&!DES()){st.open=true;st.unlockT=0}}
  if(z.id==='C'){G.bossT=40;for(let i=0;i<4;i++)spawnBear('C',true)}
  if(z.id==='D'){G.spa.on=true;G.spa.fuel=40}
  burst(z.pad.x,z.pad.y,20,60,{c:['#ffd23f','#ffffff','#9fe0ff','#ff8ad8'],s0:80,s1:300,u0:200,u1:450,l0:.9,l1:1.5,add:true,r0:6,r1:12})}

// ================================================================ spawning
function spawnBear(zone,initial){
  const rect=zone==='C'?ZONES[1].rect:HUNT_A;let x,y,t=0;
  do{x=rnd(rect[0]+40,rect[2]-40);y=rnd(rect[1]+40,rect[3]-40);t++}while(t<50&&(dist(x,y,CX,CY)<FR+120||(!initial&&G.players.some(p=>dist(p.x,p.y,x,y)<400))));
  const kind=zone==='C'?(Math.random()<.5?'big':'normal'):(Math.random()<.14?'big':'normal');
  const hp=Math.round((kind==='big'?10:5)*DM().hp*(1+(YR()-1)*.25));const b={id:++G.nid,x,y,zone,kind,hp,max:hp,state:'wander',rot:rnd(0,TAU),step:0,hit:0,atkCd:0,dead:false,deadT:0,target:null,roar:0,wdir:rnd(0,TAU),wT:0};
  b.m=makeBear(kind);b.m.g.position.set(x,0,y);world.add(b.m.g);G.bears.push(b);return b}
function spawnBoss(bt,quiet){const b=spawnBear('C',true);world.remove(b.m.g);b.kind='boss';b.hp=b.max=Math.round(70*(1+(YR()-1)*.3));b.m=makeBear('boss');b.m.g.position.set(b.x,0,b.y);world.add(b.m.g);setBt(b,bt||pickBt());if(!quiet){banner(DES()?'岩の渓谷に':'奥地の森に',`${BTN[b.bt]}出現！`,BTH[b.bt],'cold');SFX.wave()}return b}
function spawnSurvivor(atCamp){const a=rnd(-2.9,-.25),r=rnd(70,Math.min(170,heatBase()*.62));const tx=CX+Math.cos(a)*r,ty=CY+Math.sin(a)*r*.9;let x=tx,y=ty;
  if(!atCamp){const r=Math.random();if(r<.4){x=rnd(900,1500);y=560}else if(r<.7){x=rnd(1080,1600);y=1790}else{x=Math.random()<.5?640:1760;y=rnd(1100,1300)}}
  const s={id:++G.nid,x,y,tx,ty,warm:atCamp?100:70,frozen:false,arrived:atCamp,step:0,dir:0,breath:rnd(0,1.5),freezeAnim:0,happy:0,pal:Math.floor(rnd(0,PALS.length))};
  survMesh(s)}
function survMesh(s){
  s.m=makeVillager(PALS[s.pal],{noShadow:true});s.ice=M_(geo('ice',()=>new T.IcosahedronGeometry(22,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.62,roughness:.08,metalness:.1,flatShading:true}),false);s.ice.scale.set(1,1.35,1);s.ice.position.y=24;s.ice.visible=false;s.m.g.add(s.ice);
  s.m.g.position.set(s.x,0,s.y);world.add(s.m.g);G.surv.push(s)}
function spawnCustomer(st){const d=st.def;const c={id:++G.nid,x:d.lane+rnd(-4,4),y:1800,st,state:'queue',step:0,dir:Math.PI,happy:0,wait:0,patience:Math.max(20,rnd(32,40)-G.t/40),fade:0,pal:Math.floor(rnd(0,PALS.length))};
  custMesh(c);st.queue.push(c);G.customers.push(c)}
function custMesh(c){const st=c.st;const o=st.id==='coat'?{hat:'top',scale:.95}:st.id==='fish'?{hat:'bucket',scale:.95}:{scale:.95};o.noShadow=true;c.m=makeVillager(PALS[c.pal],o);c.hold=itemMesh(st.def.out);c.hold.visible=false;c.m.hand.add(c.hold);c.m.g.scale.setScalar(.01);world.add(c.m.g)}
function idleSurvivors(){return G.surv.filter(s=>s.arrived&&!s.frozen)}
function hire(role,pad,stId){const pool=idleSurvivors();if(!pool.length){toast('生存者が足りない！','cold');return false}
  let s=pool[0],bd=1e9;for(const q of pool){const d=dist(q.x,q.y,pad.x,pad.y);if(d<bd){bd=d;s=q}}
  world.remove(s.m.g);G.surv.splice(G.surv.indexOf(s),1);
  const w={id:++G.nid,role,x:s.x,y:s.y,dir:0,step:0,bag:[],t:0,target:null,flash:0,moving:false,st:stId?G.stations[stId]:null};
  workerMesh(w);if(role==='cashier'){w.st.cashier=w;w.x=w.st.def.stand.x;w.y=w.st.def.stand.y}G.workers.push(w);
  burst(w.x,w.y,20,20,{c:['#8ff08f','#ffffff','#ffd23f'],s0:40,s1:140,l0:.4,l1:.9});float(w.x,w.y,70,{hunter:'猟師',lumber:'木こり',fisher:'釣り人',cashier:'レジ係',stoker:'風呂焚き',guard:'見張り番',splitter:'薪割り'}[role]+'に！','gold');
  return true}
function workerMesh(w){const role=w.role,stId=w.st&&w.st.id;
  const looks={hunter:[{coat:'#6b4a2e',hat:'#c23b2f'},{hat:'ushanka',beard:true,tool:'gun'}],lumber:[{coat:'#3f7a45',hat:'#c9392b'},{beard:true,plaid:true,tool:'axe'}],fisher:[{coat:'#e8b02a',hat:'#e8b02a'},{hat:'bucket',tool:'rod'}],
    cashier:[{coat:stId==='fish'?'#2f6a9a':stId==='coat'?'#6a3f8a':'#a8352c',hat:'#2f6a40'},{apron:true,hat:'visor'}],stoker:[{coat:'#6a4a3a',hat:'#3a3f48'},{beard:true,tool:'axe'}],
    guard:[{coat:'#3a4a6a',hat:'#c9a24a'},{hat:'ushanka',tool:'gun'}],splitter:[{coat:'#8a5a30',hat:'#3f7a45'},{beard:true,plaid:true,tool:'axe'}]}[role];
  w.m=makeVillager(looks[0],looks[1]);w.stack=new Stack(w.m.back,'col');w.m.g.position.set(w.x,0,w.y);world.add(w.m.g)}

// ================================================================ missions & achievements
const MISSIONS=[
  {t:'柵の外でオオカミをたおせ',f:()=>[G.stats.bears,1],cash:20,tg:p=>nearestBear(p)},
  {t:'肉をグリルに入れろ',f:()=>[G.stats.grilled,8],cash:25,tg:p=>has(p,'meat')?stT('steak'):nearestMeat(p)},
  {t:'レジに立って肉を売れ',f:()=>[G.stats.sold,5],cash:30,tg:p=>{const st=G.stations.steak;if(st.shelf>0)return{x:st.def.stand.x,y:st.def.stand.y,h:70};return has(p,'meat')?stT('steak'):nearestMeat(p)}},
  {t:'木を切って薪を集めろ',f:()=>[G.stats.chopped,10],cash:30,tg:p=>nearestTree(p)},
  {t:'かまどに薪をくべろ（燃料が熱の範囲）',f:()=>[G.stats.fed,15],cash:30,tg:p=>has(p,'log')?{x:CX,y:CY,h:110}:nearestTree(p)},
  {t:'猟師を雇え（生存者を1人使う）',f:()=>[wc('hunter'),1],cash:40,tg:p=>padT('hunter',p)},
  {t:'家を建てろ（住める人数が増える）',f:()=>[houseLv(0)>0?1:0,1],cash:50,tg:p=>padT('house',p)},
  {t:'SOSの遭難者を助けて町人を増やせ',f:()=>[G.stats.rescued||0,1],cash:60,tg:p=>rescueT()||flow(p)},
  {t:'見張り台を建てろ（夜、オオカミが村を襲う）',f:()=>[TOWERS.filter(t=>G.lv['tw_'+t.id]>0).length,1],cash:50,tg:p=>padT('tw_N',p)},
  {t:'薪でかまどをLv2にしろ',f:()=>[G.level,2],cash:60,tg:p=>logPad('furnace',p)},
  {t:'木こりを雇え',f:()=>[wc('lumber'),1],cash:50,tg:p=>padT('lumber',p)},
  {t:'氷の湖を解放しろ',f:()=>[+!!G.zones.B,1],cash:80,tg:p=>padT('zone_B',p)},
  {t:'湖の穴に立って魚を釣れ',f:()=>[G.stats.fish,5],cash:60,tg:p=>has(p,'fish')?stT('fish'):freeHole(p)},
  {t:'焼き魚を売れ',f:()=>[G.stats.soldFish,8],cash:80,tg:p=>flow(p)},
  {t:'釣り人を雇え',f:()=>[wc('fisher'),1],cash:80,tg:p=>padT('fisher',p)},
  {t:'薪と魚でかまどをLv3にしろ',f:()=>[G.level,3],cash:150,tg:p=>logPad('furnace',p)},
  {t:'奥地の森を解放しろ',f:()=>[+!!G.zones.C,1],cash:150,tg:p=>padT('zone_C',p)},
  {t:'奥地のオオカミから毛皮を集めろ',f:()=>[G.stats.fur,6],cash:120,tg:p=>has(p,'fur')?stT('coat'):nearestBear(p,'C')},
  {t:'ボスオオカミをたおせ',f:()=>[G.stats.boss,1],cash:300,tg:p=>{const b=G.bears.find(b=>b.kind==='boss'&&!b.dead);return b?{x:b.x,y:b.y,h:170}:flow(p)}},
  {t:'コートを売れ',f:()=>[G.stats.soldCoat,6],cash:300,tg:p=>flow(p)},
  {t:'薪・魚・毛皮でかまどをLv4にしろ',f:()=>[G.level,4],cash:300,tg:p=>logPad('furnace',p)},
  {t:'温泉郷を解放しろ',f:()=>[+!!G.zones.D,1],cash:400,tg:p=>padT('zone_D',p)},
  {t:'ボイラーに薪を入れて温泉を沸かせ',f:()=>[G.stats.boiler||0,10],cash:300,tg:p=>has(p,'log')?{x:SPA.boiler.x,y:SPA.boiler.y,h:80}:nearestTree(p,'D')},
  {t:'温泉をLv2にしろ',f:()=>[G.lv.spa+1,2],cash:400,tg:p=>padT('spa',p)},
  {t:'薪・魚・毛皮でかまどをLv5にしろ',f:()=>[G.level,5],cash:500,tg:p=>logPad('furnace',p)},
  {t:'町のシンボル像を建てろ（$9000）',f:()=>[+G.monument,1],cash:300,tg:p=>padT('monument',p)},
  {t:'最終決戦：朝まで町を守りきれ',f:()=>[0,1],final:true,tg:p=>flow(p)}];
const ACH=[
  {id:'a1',k:'狩',t:'初狩り',f:()=>G.stats.bears>=1},{id:'a2',k:'狼',t:'ハンター',f:()=>G.stats.bears>=50},{id:'a3',k:'王',t:'ボス討伐',f:()=>G.stats.boss>=1},
  {id:'a4',k:'札',t:'札束タワー',f:()=>Object.values(G.stations).some(s=>s.pile>=300)},{id:'a5',k:'湖',t:'湖を解放',f:()=>G.zones.B},{id:'a6',k:'森',t:'奥地を解放',f:()=>G.zones.C},
  {id:'a7',k:'湯',t:'温泉郷',f:()=>G.zones.D},{id:'a8',k:'炎',t:'かまどLv6',f:()=>G.level>=6},{id:'a9',k:'星',t:'★5の名店',f:()=>G.rep>=5},{id:'a10',k:'冬',t:'町の完成',f:()=>G.monument},{id:'a11',k:'守',t:'襲撃を撃退',f:()=>G.raidWins>=1},{id:'a12',k:'絆',t:'2人で運搬',f:()=>G.stats.haul>=1}];
const wc=r=>G.workers.filter(w=>w.role===r).length;
const has=(p,k)=>p.bag.includes(k);
const stT=id=>{const s=STN[id].conv;return{x:s.x,y:s.y+30,h:80}};
function nearestBear(p,zone){let b=null,bd=1e9;for(const x of G.bears){if(x.dead||(zone&&x.zone!==zone))continue;const d=dist(p.x,p.y,x.x,x.y);if(d<bd){bd=d;b=x}}return b?{x:b.x,y:b.y,h:b.kind==='boss'?170:90}:null}
function nearestMeat(p){let m=null,md=600;for(const x of G.pickups){const d=dist(p.x,p.y,x.x,x.y);if(d<md){md=d;m=x}}return m?{x:m.x,y:m.y,h:40}:nearestBear(p)}
function nearestTree(p,zone){let b=null,bd=1e9;for(const t of G.trees){if(!t.alive||t.fall>0||(t.zone&&!G.zones[t.zone])||(zone&&t.zone!==zone))continue;const d=dist(p.x,p.y,t.x,t.y);if(d<bd){bd=d;b=t}}return b?{x:b.x,y:b.y,h:110*b.s}:null}
function freeHole(p){let b=null,bd=1e9;for(const h of G.holes){if(h.user&&h.user!==p)continue;const d=dist(p.x,p.y,h.x,h.y);if(d<bd){bd=d;b=h}}return b?{x:b.x,y:b.y,h:50}:null}
function padT(id,p){const pad=G.pads.find(q=>q.id===id);if(!pad||!pad.shown)return flow(p);const c=pad.cost();if(pad.req&&pad.req())return pad.popNeed&&G.level>=pad.lvNeed?(rescueT()||flow(p)):logPad('furnace',p);if(pad.pay==='cash'&&G.cash<Math.min(c-pad.paid,(c-pad.paid)*.5+5))return flow(p);return{x:pad.x,y:pad.y,h:80}}
function logPad(id,p){const pad=G.pads.find(q=>q.id===id);if(pad&&pad.mix){const n=pad.mix(),rf=n.fish-pad.mp.fish,ru=n.fur-pad.mp.fur;
    if((rf>0&&has(p,'fish'))||(ru>0&&has(p,'fur')))return{x:pad.x,y:pad.y,h:80};if(pad.paid>=pad.cost()){if(rf>0)return freeHole(p)||flow(p);if(ru>0)return nearestBear(p,'C')||flow(p)}}if(p.bag.filter(k=>k==='log').length>=Math.min(pad.cost()-pad.paid,cap(p)*.6))return{x:pad.x,y:pad.y,h:80};return nearestTree(p)}
function flow(p){
  if(G.hauls.length&&G.players.length>1){const h=G.hauls[0];return h.carried?stT('steak'):{x:h.x,y:h.y,h:80}}
  if(G.raid.on){let b=null,bd=1e9;for(const x of G.bears){if(x.dead||!x.raid)continue;const d=dist(x.x,x.y,CX,CY);if(d<bd){bd=d;b=x}}if(b&&bd<FR+160)return{x:b.x,y:b.y,h:90}}
  for(const id in G.stations){const st=G.stations[id];if(st.open&&st.pile>=40)return{x:st.def.pile.x,y:st.def.pile.y,h:40+st.pileStack.h}}
  if(G.spa.pile>=60)return{x:SPA.pile.x,y:SPA.pile.y,h:60};
  if(G.fuel<30)return has(p,'log')?{x:CX,y:CY,h:110}:nearestTree(p);
  for(const k of ['meat','fish','fur'])if(has(p,k)){const id=k==='meat'?'steak':k==='fish'?'fish':'coat';if(G.stations[id].open)return stT(id)}
  for(const id in G.stations){const st=G.stations[id];if(st.open&&!st.cashier&&st.shelf>0&&st.queue.length&&!G.players.some(q=>dist(q.x,q.y,st.def.stand.x,st.def.stand.y)<40))return{x:st.def.stand.x,y:st.def.stand.y,h:70}}
  return nearestMeat(p)}
function checkMission(dt){G.missionCd=Math.max(0,G.missionCd-dt);if(G.mission>=MISSIONS.length||G.missionCd>0)return;const m=MISSIONS[G.mission],[c,g]=m.f();
  if(c>=g){G.mission++;G.missionCd=1.2;const el=$('mission');el.classList.remove('done');void el.offsetWidth;el.classList.add('done');if(m.final)return;
    banner('ミッション達成！',`+$${m.cash}`,`次：${(MISSIONS[G.mission]||{}).t||''}`);G.cash+=m.cash;SFX.rare();const p=G.players[0];flyCoins(p.x,40,p.y,10,'cashIco','cash');spawnChest(p.x+rnd(-40,40),p.y+rnd(-40,40))}}
function checkAch(){for(const a of ACH){if(!ach.has(a.id)&&a.f()){ach.add(a.id);G.newAch.push(a.id);toast(`実績解除：${a.t}`,'gold')}}store.set('mw2-ach',[...ach])}
const badgesHtml=fresh=>ACH.map(a=>`<div class="badge ${ach.has(a.id)?'on':''} ${fresh&&fresh.includes(a.id)?'new':''}"><i>${ach.has(a.id)?a.k:'?'}</i>${a.t}</div>`).join('');

// ================================================================ combo, fever, chests, xp, perks, coins
function addCombo(fev){G.combo++;G.comboT=3;SFX.combo(G.combo);const el=$('combo');el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
  if(G.combo%10===0){banner('',`${G.combo} COMBO!!`,`もうけ ×${mult().toFixed(2)}`,'combo');SFX.rare()}}
function startFever(){G.feverT=10;G.fever=100;banner('10秒間 ぜんぶ2倍','FEVER!!','','fever');SFX.fever();G.shake=10;for(const p of G.players)burst(p.x,p.y,30,40,{c:['#ff4df0','#ffd23f','#4dffb0','#4dc3ff'],s0:80,s1:260,u0:150,u1:350,l0:.8,l1:1.3,add:true,r0:6,r1:10})}
function tickCombo(dt){if(G.combo>0){G.comboT-=dt;if(G.comboT<=0)G.combo=0}if(G.feverT>0){G.feverT-=dt;G.fever=Math.max(0,100*G.feverT/10);if(G.feverT<=0){G.feverT=0;G.fever=0}}
  const el=$('combo');if(G.combo>=2&&running){el.hidden=false;const h=`<b>${G.combo}</b><span>COMBO</span>${mult()>1?`<em>×${mult().toFixed(2)}</em>`:''}<span class="ct"><i style="width:${100*G.comboT/3|0}%"></i></span>`;if(el._h!==h){el.innerHTML=h;el._h=h}el.classList.toggle('hot',G.combo>=20)}else el.hidden=true;
  $('feverFx').classList.toggle('on',G.feverT>0&&running);const f=$('fever');f.querySelector('i').style.width=G.fever+'%';f.classList.toggle('on',G.feverT>0);f.querySelector('span').textContent=G.feverT>0?`FEVER ${Math.ceil(G.feverT)}`:'FEVER'}
function flyCoins(x,h,y,n,tid,cls){if(!running)return;const s=toScreen(x,h,y),t=$(tid);if(!t||!s.on)return;const r=t.getBoundingClientRect();
  for(let i=0;i<Math.min(n,14);i++){const e=document.createElement('i');e.className='coin '+(cls||'');e.style.left=s.x+'px';e.style.top=s.y+'px';document.body.appendChild(e);
    const dx=r.left+r.width/2-s.x,dy=r.top+r.height/2-s.y,jx=rnd(-50,50),jy=rnd(-70,-10);
    const a=e.animate([{transform:'translate(-50%,-50%) scale(.5)'},{transform:`translate(calc(-50% + ${jx}px),calc(-50% + ${jy}px)) scale(1.25)`,offset:.3},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6)`}],{duration:600+i*45,easing:'cubic-bezier(.5,0,.75,.55)',fill:'forwards'});
    a.onfinish=()=>{e.remove();t.classList.remove('bump');void t.getBoundingClientRect();t.classList.add('bump');SFX.coin(i)}}}
const RAR=[{k:'SSR',p:.03,c:'#ffc629'},{k:'SR',p:.12,c:'#c35bff'},{k:'R',p:.3,c:'#3f8ff0'},{k:'N',p:1,c:'#dfe8ef'}];
function rollRar(){let r=Math.random()-G.luck;for(const x of RAR){if(r<x.p)return x;r-=x.p}return RAR[3]}
function spawnChest(x,y){return;const c={id:++G.nid,x,y,h:50,vh:160,t:0,open:-1};c.m=makeChest();world.add(c.m);G.chests.push(c);SFX.pop();float(x,y,50,'宝箱！','gold')}
function chestReward(r,c){const base={N:25,R:70,SR:180,SSR:600}[r.k],v=Math.round(base*(1+G.t/300));G.cash+=v;flyCoins(c.x,30,c.y,r.k==='N'?6:14,'cashIco','cash');if(r.k!=='N')G.fuel=Math.min(100,G.fuel+(r.k==='R'?20:60));gainXP({N:8,R:18,SR:40,SSR:90}[r.k],c.x,c.y);if(r.k==='SSR')startFever();return `+$${v}${r.k!=='N'?'・燃料回復':''}`}
function tickChests(dt){for(const c of G.chests){c.t+=dt;if(c.h>0||c.vh>0){c.vh-=700*dt;c.h=Math.max(0,c.h+c.vh*dt);if(c.h===0)c.vh=c.vh<-100?-c.vh*.35:0}
    if(c.open<0){if(c.h<=0&&G.players.some(p=>dist(p.x,p.y,c.x,c.y)<34)){c.open=0;c.rar=rollRar();SFX.chest()}if(Math.random()<dt*6)psA.emit({x:c.x+rnd(-14,14),y:rnd(10,30),z:c.y+rnd(-14,14),vx:0,vz:0,vy:rnd(20,50),g:0,life:.7,max:.7,r:5,c:C('#ffe07a'),air:true,fade:.3})}
    else{c.open+=dt;if(c.open>=.55&&!c.given){c.given=true;const txt=chestReward(c.rar,c);const big=c.rar.k==='SSR'||c.rar.k==='SR';banner(c.rar.k==='N'?'宝箱':`${c.rar.k}!!`,txt,'',`r-${c.rar.k}`);(c.rar.k==='SSR'?SFX.ssr:big?SFX.rare:SFX.chest)();G.shake=big?12:5;
        burst(c.x,c.y,20,big?70:30,{c:[c.rar.c,'#ffffff','#ffe07a'],s0:60,s1:big?340:200,u0:200,u1:big?480:320,l0:.8,l1:1.5,add:true,r0:6,r1:big?14:9})}if(c.open>1.8)c.done=true}}
  for(const c of G.chests)if(c.done)world.remove(c.m);G.chests=G.chests.filter(c=>!c.done)}
function syncChests(){for(const c of G.chests){c.m.position.set(c.x,c.h,c.y);const L=c.m.userData.lid,B=c.m.userData.beam;
  if(c.open<0){c.m.rotation.y=Math.sin(G.t*3+c.x)*.25;c.m.scale.setScalar(1+Math.abs(Math.sin(G.t*6))*.06);L.rotation.x=0;if(c.h<=0)label(c.x,c.y,40,'ひらく！','gold sm')}
  else{const k=Math.min(1,c.open/.5);L.rotation.x=-k*1.9;c.m.scale.setScalar(1+Math.sin(Math.min(1,c.open/.3)*Math.PI)*.35);B.material.color.copy(C(c.rar.c));B.material.opacity=Math.max(0,.75*Math.min(1,c.open*3)*(1-Math.max(0,c.open-1.2)/.6));B.scale.set(1+c.open,1,1+c.open)}}}
const xpNeed=()=>20+G.plv*14;
function gainXP(n,x,y){return;if(wxIs('aurora'))n=Math.ceil(n*1.5);G.xp+=n;if(x!==undefined&&n>=5){float(x,y,70,`+${n} EXP`,'xp');flyCoins(x,40,y,Math.min(6,Math.ceil(n/5)),'lvBox','xp')}
  while(G.xp>=xpNeed()){G.xp-=xpNeed();G.plv++;G.pendingLv++;SFX.level();for(const p of G.players)burst(p.x,p.y,20,30,{c:['#c6f3cc','#8ff08f','#ffffff','#ffe07a'],s0:40,s1:160,u0:150,u1:340,l0:.7,l1:1.2,add:true,r0:5,r1:9});float(G.players[0].x,G.players[0].y,90,'LEVEL UP!','xp',true)}}
const PERKS=[
  {id:'rate',k:'連',t:'連射',vals:[.88,.8,.66],d:v=>`連射速度 +${Math.round((1/v-1)*100)}%`,ap:v=>{G.pm.rate*=v}},
  {id:'dmg',k:'威',t:'ホローポイント',vals:[.5,1,2],d:v=>`弾の威力 +${v}`,ap:v=>{G.pm.dmg+=v}},
  {id:'bag',k:'籠',t:'でっかいかご',vals:[4,8,15],d:v=>`運べる数 +${v}`,ap:v=>{G.pm.cap+=v}},
  {id:'boot',k:'靴',t:'スノーブーツ',vals:[1.08,1.15,1.28],d:v=>`移動速度 +${Math.round((v-1)*100)}%`,ap:v=>{G.pm.speed*=v}},
  {id:'price',k:'値',t:'目利き',vals:[2,4,8],d:v=>`全商品の値段アップ（肉+$${v}）`,ap:v=>{G.pm.price+=v}},
  {id:'cook',k:'焼',t:'職人の手',vals:[.85,.72,.55],d:v=>`調理・縫製 +${Math.round((1/v-1)*100)}%`,ap:v=>{G.pm.cook*=v}},
  {id:'mag',k:'磁',t:'マグネット',vals:[40,80,150],d:v=>`落ちた物を吸い寄せる範囲 +${v}`,ap:v=>{G.pm.magnet+=v}},
  {id:'axe',k:'斧',t:'鋭い斧',vals:[.85,.74,.6],d:v=>`伐採速度 +${Math.round((1/v-1)*100)}%`,ap:v=>{G.pm.chop*=v}},
  {id:'wood',k:'薪',t:'乾いた薪',vals:[2,4,7],d:v=>`薪1本で燃える量 +${v}`,ap:v=>{G.pm.wood+=v}},
  {id:'keep',k:'番',t:'炉の番人',vals:[.92,.85,.74],d:v=>`燃料の減り -${Math.round((1-v)*100)}%`,ap:v=>{G.pm.burn*=v}},
  {id:'coat',k:'毛',t:'毛皮のコート',vals:[.8,.65,.45],d:v=>`寒さに強くなる（-${Math.round((1-v)*100)}%）`,ap:v=>{G.pm.cold*=v}}];
function openPerk(){G.pendingLv=0;return;if(G.pendingLv<=0||G.paused||!running)return;G.paused=true;for(const j of joys)j.on=false;
  const pool=PERKS.slice(),pick=[];while(pick.length<3)pick.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  $('perkLv').textContent=G.plv-G.pendingLv+1;const bx=$('perks');bx.innerHTML='';let sr=false;
  pick.forEach((p,i)=>{const r=Math.random()-G.luck,rk=r<.14?'SR':r<.46?'R':'N',ri={N:0,R:1,SR:2}[rk],v=p.vals[ri];if(rk==='SR')sr=true;
    const b=document.createElement('button');b.className=`perk r-${rk}`;b.id='perk-'+i;const n=G.perkCount[p.id]||0;
    b.innerHTML=`<span class="k">${p.k}</span><span><b><span class="rar">${rk}</span>${p.t}</b><span>${p.d(v)}</span></span><em>${n?'Lv'+(n+1):'NEW'}</em>`;
    b.addEventListener('click',()=>{p.ap(v);G.perkCount[p.id]=n+1;G.pendingLv--;$('perk').hidden=true;G.paused=false;toast(`${rk} ${p.t} を習得！`,'gold');SFX.rare();if(G.pendingLv>0)setTimeout(openPerk,350)});bx.appendChild(b)});
  if(sr)SFX.ssr();$('perk').hidden=false;setTimeout(()=>bx.firstChild&&bx.firstChild.focus(),50)}

// ================================================================ movement helpers
function pushCircle(e,cx,cy,r){const d=dist(e.x,e.y,cx,cy);if(d<r&&d>0){e.x=cx+(e.x-cx)/d*r;e.y=cy+(e.y-cy)/d*r}}
function pushRect(e,x0,y0,x1,y1,r){const nx=clamp(e.x,x0,x1),ny=clamp(e.y,y0,y1),dx=e.x-nx,dy=e.y-ny,d=Math.hypot(dx,dy);
  if(d<r){if(d>0){e.x=nx+dx/d*r;e.y=ny+dy/d*r}else{const l=e.x-x0,r_=x1-e.x,t=e.y-y0,b=y1-e.y,m=Math.min(l,r_,t,b);if(m===l)e.x=x0-r;else if(m===r_)e.x=x1+r;else if(m===t)e.y=y0-r;else e.y=y1+r}}}
const angGap=an=>GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(an-g),Math.cos(an-g)))<.11)||(an>SOUTH[0]&&an<SOUTH[1]);
function fenceCollide(e,px,py){const d=dist(e.x,e.y,CX,CY),dp=dist(px,py,CX,CY);if(Math.abs(d-FR)<14||(dp<FR)!==(d<FR)){const an=Math.atan2(e.y-CY,e.x-CX);if(angGap(an))return;const r=dp<FR?FR-14:FR+14;e.x=CX+Math.cos(an)*r;e.y=CY+Math.sin(an)*r}}
function solids(e,r){pushCircle(e,CX,CY,70);for(const d of G.drifts||[])pushCircle(e,d.x,d.y,20*d.s);if(isRPG())pushCircle(e,WB.x,WB.y,24);caveWalls(e,r);for(const id in G.stations){const st=G.stations[id];if(!st.open)continue;const s=st.def;pushRect(e,s.conv.x-34,s.conv.y-16,s.conv.x+34,s.conv.y+16,r*.6);pushRect(e,s.counter.x-52,s.counter.y-12,s.counter.x+52,s.counter.y+12,r*.6);pushCircle(e,s.pile.x,s.pile.y,14)}
  if(G.zones.D){pushCircle(e,SPA.boiler.x,SPA.boiler.y,28)}
  for(const z of ZONES)if(!G.zones[z.id]){const [x0,y0,x1,y1]=z.rect;pushRect(e,x0,y0,x1,y1,r)}}
function nav(e,tx,ty){const ia=dist(e.x,e.y,CX,CY)<FR,ib=dist(tx,ty,CX,CY)<FR;if(ia===ib)return{x:tx,y:ty};
  let best=null,bd=1e9;for(const a of GATE_ANG.concat([Math.PI/2])){const gi={x:CX+Math.cos(a)*(FR-40),y:CY+Math.sin(a)*(FR-40)},go={x:CX+Math.cos(a)*(FR+45),y:CY+Math.sin(a)*(FR+45)};const f=ia?gi:go,s=ia?go:gi;const d=dist(e.x,e.y,f.x,f.y)+dist(s.x,s.y,tx,ty);if(d<bd){bd=d;best={f,s}}}
  // once past the inner gate point, keep heading out (no flip-flopping at the gate)
  if(dist(e.x,e.y,best.s.x,best.s.y)<=dist(best.f.x,best.f.y,best.s.x,best.s.y)+3)return best.s;
  return dist(e.x,e.y,best.f.x,best.f.y)>6?best.f:best.s}
function moveTo(e,tx,ty,v,dt){const d=dist(e.x,e.y,tx,ty);if(d>2){const s=Math.min(d,v*dt);e.x+=(tx-e.x)/d*s;e.y+=(ty-e.y)/d*s;e.dirT=Math.atan2(tx-e.x,ty-e.y);e.step+=dt*9;e.moving=true}else e.moving=false;return d}
function turnTo(o,target,dt,k=12){let d=target-o.dir;d=Math.atan2(Math.sin(d),Math.cos(d));o.dir+=d*Math.min(1,dt*k)}

// ================================================================ online co-op
// The host's browser runs the whole game. The guest moves its own hero locally,
// reports its position through presence, and mirrors the world from snapshots.
const NET={room:null,mode:'solo',hostPeer:null,guestPeer:null,sendT:0,outF:[],outB:[],outT:[],inbox:{},endInfo:null,hostSeed:null,hostMiss:0};
const KC={meat:'m',steak:'s',fish:'f',grfish:'g',fur:'u',coat:'c',log:'l',coal:'k',cash:'$',water:'q',salt:'a'},KR={};for(const k in KC)KR[KC[k]]=k;
const enc=a=>a.map(k=>KC[k]||'m').join(''),dec=s=>[...(s||'')].map(c=>KR[c]||'meat');
const ROLES=['hunter','lumber','fisher','cashier','stoker','guard','splitter'],STIDS=['steak','fish','coat'],BK=['normal','big','boss'];
const r1=v=>Math.round(v),r2=v=>Math.round(v*100)/100;
function hostPeerNow(){if(!NET.room)return null;return NET.room.peers().find(p=>!p.sameTab&&p.presence&&p.presence.role==='host')||null}
function guestPeerNow(){if(!NET.room)return null;return NET.room.peers().find(p=>!p.sameTab&&p.presence&&p.presence.role==='guest')||null}
// ---- PeerJS room (works on any plain URL; used when not inside claude.ai)
const PJ={on:false,code:null,peer:null,conns:new Map(),pres:{},me:{role:'idle'},subs:{},peerSubs:[],state:''};
const PJ_PRE='mecha-white-v1-',PJ_ICE={config:{iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:global.stun.twilio.com:3478'},{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
function netWire(r){for(const tp of ['s.core','s.a','s.b'])r.on(tp,m=>{if(NET.mode!=='guest'||m.sameTab)return;if(NET.hostPeer&&m.peer!==NET.hostPeer)return;NET.inbox[tp]=m.data},()=>{})}
function pjRoom(){const r=pjRoomRaw();netWire(r);return r}
function pjRoomRaw(){return{peers:()=>[...PJ.conns.keys()].filter(k=>{const c=PJ.conns.get(k);return c.open&&performance.now()-(c._seen||0)<7000}).map(k=>({peer:k,presence:PJ.pres[k]||{},sameTab:false})),
  presence:patch=>{PJ.me=patch;for(const c of PJ.conns.values())if(c.open)try{c.send({p:patch})}catch(e){}return Promise.resolve()},
  onPeers:fn=>{PJ.peerSubs.push(fn)},on:(tp,fn)=>{(PJ.subs[tp]=PJ.subs[tp]||[]).push(fn)},
  emit:(tp,d)=>{for(const c of PJ.conns.values())if(c.open)try{c.send({t:tp,d})}catch(e){}return Promise.resolve()}}}
const pjPeers=()=>{for(const f of PJ.peerSubs)try{f()}catch(e){}netLine()};
function pjWire(c){c._seen=performance.now();c.on('open',()=>{c._seen=performance.now();PJ.conns.set(c.peer,c);c.send({p:PJ.me});PJ.state='ok';pjPeers()});
  c.on('data',m=>{c._seen=performance.now();if(!m||m.k)return;if(m.p){PJ.pres[c.peer]=m.p;pjPeers()}if(m.t)for(const f of PJ.subs[m.t]||[])f({peer:c.peer,data:m.d,sameTab:false})});
  const bye=()=>{PJ.conns.delete(c.peer);delete PJ.pres[c.peer];pjPeers()};c.on('close',bye);c.on('error',bye)}
setInterval(()=>{for(const [k,c] of PJ.conns){if(c.open)try{c.send({k:1})}catch(e){}if(performance.now()-(c._seen||0)>9000){try{c.close()}catch(e){}PJ.conns.delete(k);delete PJ.pres[k];pjPeers()}}},2000);
window.addEventListener('beforeunload',()=>{try{PJ.peer&&PJ.peer.destroy()}catch(e){}});
function netWarn(t){const el=$('netWarn');if(!el)return;if(el._t===t)return;el._t=t;el.hidden=!t;el.textContent=t}
function pjKeep(pe){pe.on('disconnected',()=>{if(pe.destroyed)return;const tryR=()=>{if(pe.destroyed||!pe.disconnected)return;try{pe.reconnect()}catch(e){}setTimeout(tryR,4000)};setTimeout(tryR,1000)})}
// guest: reconnect the data channel to the same room after a drop
function pjRejoin(){if(!PJ.on||PJ.host||!PJ.peer||!PJ.code||PJ.peer.destroyed)return;if(PJ.peer.disconnected){try{PJ.peer.reconnect()}catch(e){}return}for(const [k,c] of PJ.conns)if(!c.open||performance.now()-(c._seen||0)>4000){try{c.close()}catch(e){}PJ.conns.delete(k)}if(PJ.conns.size)return;try{const c=PJ.peer.connect(PJ_PRE+PJ.code,{serialization:'json',reliable:true});pjWire(c)}catch(e){}}
function pjReset(){try{PJ.peer&&PJ.peer.destroy()}catch(e){}PJ.peer=null;PJ.conns.clear();PJ.pres={};PJ.code=null;PJ.subs={};NET.room=null}
function pjCreate(){if(!window.Peer){PJ.state='nolib';netLine();return}pjReset();const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from({length:4},()=>A[Math.random()*A.length|0]).join('');
  PJ.state='making';netLine();const pe=new Peer(PJ_PRE+code,Object.assign({},PJ_ICE,window.MW_PEER));PJ.peer=pe;
  pe.on('open',()=>{PJ.code=code;PJ.host=true;NET.room=pjRoom();PJ.state='wait';netLine()});
  pe.on('connection',c=>{const ex=[...PJ.conns.values()][0];if(ex&&ex.peer!==c.peer&&ex.open&&performance.now()-(ex._seen||0)<7000){c.on('open',()=>c.close());return}if(ex&&ex.peer===c.peer){try{ex.close()}catch(e){}PJ.conns.delete(ex.peer)}pjWire(c)});
  pe.on('error',e=>{if(e&&e.type==='unavailable-id'&&!PJ.code)return pjCreate();if(e&&(e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='socket-closed'))return;PJ.state='err';netLine()});pjKeep(pe)}
function pjJoin(code){code=(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==4){toast('4文字の部屋コードを入れてね','cold');return}if(!window.Peer){PJ.state='nolib';netLine();return}
  pjReset();PJ.state='joining';PJ.host=false;netLine();const pe=new Peer(PJ_PRE+'g'+Math.random().toString(36).slice(2,10),Object.assign({},PJ_ICE,window.MW_PEER));PJ.peer=pe;
  pe.on('open',()=>{NET.room=pjRoom();PJ.code=code;const c=pe.connect(PJ_PRE+code,{serialization:'json',reliable:true});pjWire(c);setTimeout(()=>{if(!PJ.conns.size&&PJ.state==='joining'){PJ.state='nofind';netLine()}},9000)});
  pe.on('error',e=>{if(PJ.rejoin)return;if(e&&(e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='socket-closed'))return;PJ.state=e&&e.type==='peer-unavailable'?'nofind':'err';netLine()});pjKeep(pe)}
function netLine(){const el=$('netLine');if(!el)return;const box=$('netBox'),cb=$('codeBox');box.hidden=cb.hidden=true;if(nPlayers!==2){el.hidden=true;$('start').textContent=startLabel();return}el.hidden=false;
  if(PJ.on){if(PJ.host&&PJ.code){cb.hidden=false;$('roomCode').textContent=PJ.code;const g=PJ.conns.size;el.innerHTML=g?'<b>友達が入ってきた！</b>':'コードか招待URLを友達に送ろう（先に始めてもOK・あとから合流できます）';$('start').textContent=startLabel(true);return}
    const hp=hostPeerNow();if(hp&&hp.presence.seed){el.innerHTML='<b>友達の部屋が見つかった！</b>';$('start').textContent='部屋に参加する';return}
    box.hidden=false;$('start').textContent='1人で始める';
    el.innerHTML={making:'部屋を作っています…',joining:'つないでいます…',nofind:'<b>部屋が見つかりません</b>。コードを確認するか、友達に部屋を作り直してもらってね',err:'<b>つながりませんでした</b>。ネットワークを変えるか、もう一度試してね',nolib:'通信ライブラリを読み込めませんでした（再読み込みしてね）',ok:'つながった！ 友達がゲームを始めるのを待っています…'}[PJ.state]||'友達と遊ぶ：どちらかが<b>部屋を作り</b>、もう1人が<b>コードで参加</b>';return}
  if(!NET.room){el.innerHTML='オンラインは、claude.aiで<b>このページを共有した友達</b>と同時に開いたときだけ使えます';$('start').textContent='1人で始める';return}
  const hp=hostPeerNow();if(hp&&hp.presence.seed){el.innerHTML='<b>友達の部屋が見つかった！</b>';$('start').textContent='部屋に参加する'}
  else{el.innerHTML='友達にこのページを開いてもらおう<br>先に始めた人が部屋を作り、あとの人が参加します';$('start').textContent=startLabel(true)}}
function pjInit(){PJ.on=true;const q=new URLSearchParams(location.search).get('room');
  $('mkRoom').addEventListener('click',()=>{audioOn();pjCreate()});$('joinRoom').addEventListener('click',()=>{audioOn();pjJoin($('roomIn').value)});
  $('roomIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')pjJoin($('roomIn').value)});
  $('copyUrl').addEventListener('click',()=>{const u=location.origin+location.pathname+'?room='+PJ.code;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('招待URLをコピーした！','gold'),()=>prompt('このURLを友達に送ってね',u))});
  if(q){setPlayers(2);$('roomIn').value=q;setTimeout(()=>pjJoin(q),600)}netLine()}
(async()=>{try{const u=window.claude&&window.claude.use;if(!u){pjInit();return}const r=await window.claude.use('room');if(!r)return;NET.room=r;r.presence({role:'idle'}).catch(()=>{});
  r.onPeers(()=>netLine(),()=>{});
  netWire(r);
  netLine()}catch(e){}})();
function followNet(p,dt){const px=p.x,py=p.y;if(p.nx!=null){const k=Math.min(1,dt*12);p.x=lerp(p.x,p.nx,k);p.y=lerp(p.y,p.ny,k)}
  const sp=Math.hypot(p.x-px,p.y-py)/Math.max(dt,.001);p.moving=sp>20;if(p.moving){p.step+=dt*sp*.06;p.dirT=Math.atan2(p.x-px,p.y-py)}else if(p.dirN!=null)p.dirT=p.dirN;
  p.vx=(p.x-px)/Math.max(dt,.001);p.vy=(p.y-py)/Math.max(dt,.001);p.bb=lerp(p.bb,0,dt*8);p.flash=Math.max(0,p.flash-dt);p.hurt=Math.max(0,p.hurt-dt);p.inv=Math.max(0,p.inv-dt)}
function netHost(dt){const gp=guestPeerNow();
  if(gp&&NET.guestPeer!==gp.peer){if(G.players[1])dropRemote();NET.guestPeer=gp.peer;G.charOf[1]=altCh(G.charOf[0],gp.presence&&gp.presence.ch);const p=addPlayer(1);p.remote=true;if(G.savePl&&G.savePl[1]){p.lv=Object.assign({gun:0,bag:0},G.savePl[1].lv);p.life=Object.assign({},G.savePl[1].life||{});rpgRestore(p,G.savePl[1])}p.x=CX+30;p.y=CY+110;hudInit();toast('友達が参加した！','gold');SFX.rare();setTimeout(()=>{if(running)banner('2人専用','協力ワザ','挟み撃ちでダメージ2倍・寄り添うと体温が下がりにくい・巨大肉は2人で運ぶ','area')},2500)}
  if(!gp&&NET.guestPeer){NET.gMiss=(NET.gMiss||0)+dt;const lim=PJ.on?45:3;if(PJ.on)netWarn(`友達の接続が切れた…戻ってくるのを待っています（あと${Math.ceil(lim-NET.gMiss)}秒）`);if(NET.gMiss>lim){netWarn('');dropRemote();NET.guestPeer=null;NET.gMiss=0;toast('友達が抜けた','cold')}}else if(gp&&NET.gMiss){if(NET.gMiss>1)toast('友達が戻ってきた！','gold');NET.gMiss=0;netWarn('')}
  const p=G.players[1];if(p&&gp){const pr=gp.presence;if(typeof pr.fk==='number'){if(p._fk!=null&&pr.fk!==p._fk)p.fPress=true;p._fk=pr.fk}if(pr.act&&pr.act[0]!==p._act){const first=p._act===undefined&&pr.act[0]>1;p._act=pr.act[0];if(!first)doAct(p,pr.act[1],pr.act[2])}if(typeof pr.ek==='number'){if(p._ek!=null&&pr.ek!==p._ek){p.ePress=true;p.eGrade=pr.eg||0}p._ek=pr.ek}if(typeof pr.x==='number'&&typeof pr.y==='number'){p.nx=clamp(pr.x,30,WORLD-30);p.ny=clamp(pr.y,30,WORLD-30);p.dirN=typeof pr.d==='number'?pr.d:null}}
  NET.sendT+=dt;if(NET.guestPeer&&NET.sendT>=.12){NET.sendT=0;sendSnap()}}
function dropRemote(){const p=G.players[1];if(!p)return;for(const k of p.bag)dropItem(p.x,p.y,k,20);world.remove(p.m.g);G.players.length=1;for(const h of G.holes)if(h.user===p)h.user=null;hudInit()}
function safeEmit(tp,d){if(!NET.room)return;let s=JSON.stringify(d);let guard=0;const LIM=PJ.on?200000:3800;while(s.length>LIM&&guard++<8){let big=null,bl=0;for(const k in d)if(Array.isArray(d[k])){const l=JSON.stringify(d[k]).length;if(l>bl){bl=l;big=k}}if(!big)break;d[big]=d[big].slice(0,Math.floor(d[big].length*.7));s=JSON.stringify(d)}
  NET.room.emit(tp,d).catch(e=>{if(e&&e.code==='not_permitted'&&!NET.warned){NET.warned=true;toast('この権限では部屋を作れません（編集できる人が部屋を作ってください）','cold',true)}})}
function sendSnap(){
  safeEmit('s.core',{t:r2(G.t),c:Math.floor(G.cash),e:Math.floor(G.earned),f:r1(G.fuel*10)/10,l:G.level,w:G.woodpile,r:r2(G.rep),fz:G.frozen,pl:G.plv,x:r1(G.xp),mi:G.mission,fv:r1(G.fever),ft:r2(G.feverT),cb:G.combo,ct:r2(G.comboT),
    z:ZONES.map(z=>G.zones[z.id]?1:0).join(''),ra:[G.raid.on?1:0,G.raid.left,G.raid.total,G.raid.final?1:0,G.monHP||0,G.monMax||0],cv:G.car&&DES()?[G.car.state==='here'?1:0,r1(G.car.t),G.car.max||80,Object.entries(G.car.order||{}).map(([k,n])=>KC[k]+n).join(','),Object.entries(G.car.got||{}).map(([k,n])=>KC[k]+n).join(',')]:0,yr:G.year,sc:G.secrets?G.secrets.map(q=>q.found?1:0).join(''):'',df:G.diff,sl:G.sleds.map(q=>[q.id,r1(q.x),r1(q.y),q.rider==null?-1:q.rider,q.pass?1:0,enc(q.cargo||[])]),kt:G.players.map(p=>r1(p.kettle||0)),wx:G.wx.type?[WXS.findIndex(w=>w.id===G.wx.type),r1(G.wx.t*10)/10,G.wx.max]:0,rk:G.rank||0,rs:G.rescue?[G.rescue.id,r1(G.rescue.x),r1(G.rescue.y),G.rescue.n,r1(G.rescue.t*10)/10,G.rescue.max,['wait','done','fail'].indexOf(G.rescue.state),r2(G.rescue.hold),RKIND.indexOf(G.rescue.kind),G.rescue.hotDone?1:0,G.rescue.left,G.rescue.saved,G.rescue.gb,G.rescue.spec||0]:0,sr:G.stats.rescued||0,rw:G.raidWins,sh:G.stats.haul,lv:G.lv,pm:G.pm,sp:[r1(G.spa.fuel),r1(G.spa.pile)],mo:G.monument?1:0,
    st:STIDS.map(id=>{const t=G.stations[id];return[t.q.length,t.shelf,r1(t.pile),r2(t.cookT)]}),pd:G.pads.map(q=>q.personal?{p:G.players.map(pl=>q.pp[pl.id]||0)}:q.mp?[q.paid,q.mp.fish,q.mp.fur]:q.paid),
    tr:G.trees.map(t=>t.alive?(t.fall>0?'f':t.grow<1?'g':'a'):'d').join(''),tf:G.trees.filter(t=>t.fall>0).map(t=>[t.i,r2(t.fall),r2(t.fallDir)]),
    ps:G.players.map(p=>[r1(p.x),r1(p.y),r2(p.dir),enc(p.bag),r1(p.warm),r1(p.hp),p.down>0?r2(p.down):0,p.inHeat?1:0,(p.shooting?1:0)|(p.chopping?2:0)|(p.fishing?4:0)|(p.flash>0?8:0)|(p.buddy?16:0)|(p.ko?32:0),r2(p.actT),p.fishing?G.holes.indexOf(p.fishing):-1,[p.lv.gun,p.lv.bag]]),
    fl:NET.outF.splice(0),sy:(NET.outS||[]).splice(0),lf:G.players.map(p=>LIVES.map(k=>(p.life||{})[k]||0)),rt:(G.rtrees||[]).map(t=>[t.alive?1:0,t.hp]),rq:G.story?Object.entries(G.story.q||{}).map(([k,v])=>[k,v.st,v.p||0,r1(v.x||0),r1(v.y||0),v.f==null?-1:v.f]):0,rp:G.players.map(p=>[p.rl||1,p.rx||0,(p.items||[]).join('.'),(p.eq&&p.eq.w)||'',(p.eq&&p.eq.a)||'',(p.eq&&p.eq.c)||'',Object.entries(p.mats||{}).map(([k,n])=>k+':'+n).join(','),JSON.stringify(p.cnt||{}),(p.chd||[]).join('.')]),so:G.story?[G.story.ch,G.story.step,G.story.raids||0,G.story.minion||0,G.story.fp?1:0,G.story.hs||0,G.story.hc||0,r1(G.story.hx||0),r1(G.story.hy||0),G.story.ruin?1:0,G.story.queen||0]:0,bn:NET.outB.splice(0),tq:NET.outT.splice(0),end:NET.endInfo});
  safeEmit('s.a',{b:G.bears.map(b=>[b.id,r1(b.x),r1(b.y),r2(b.rot),Math.max(0,Math.ceil(b.hp)),b.max,BK.indexOf(b.kind),b.state==='chase'?1:0,b.dead?r2(b.deadT):-1,b.hit>0?1:0,b.roar>0?1:0,b.moving?1:0,b.raid?1:b.flee?2:0,b.king?1:0,BTS.indexOf(b.bt||''),(b.hide?1:0)|(b.ph==='st'?2:0),b.rbi==null?-1:b.rbi,b.m&&b.m.key==='Spider'?1:0]),
    k:G.pickups.map(m=>[m.id,r1(m.x),r1(m.y),r1(m.h),KC[m.k],m.n||1]),h:G.chests.map(c=>[c.id,r1(c.x),r1(c.y),r1(c.h),c.open<0?-1:r2(c.open),c.rar?RAR.indexOf(c.rar):-1]),
    ho:G.holes.map(h=>r2(h.t)+(h.jump>0?.001:0)),hl:G.hauls.map(h=>[h.id,r1(h.x),r1(h.y),h.big,h.carried?1:0]),wn:(G.warns||[]).map(w=>[w.id,WK.indexOf(w.k),r1(w.x),r1(w.y),r2(w.a),r1(w.r),r2(w.t),r2(w.max)])});
  safeEmit('s.b',{c:G.customers.map(c=>[c.id,r1(c.x),r1(c.y),r2(c.dir),STIDS.indexOf(c.st.id),c.state==='leave'?1:0,c.hold.visible?1:0,r2(Math.max(0,c.happy||0)),r2(Math.max(0,c.angry||0)),c.state==='queue'?r2(c.wait/c.patience):0,c.pal,r2(c.fade==null?1:c.fade)]),
    dr:(G.drifts||[]).map(d=>[d.id,r1(d.x),r1(d.y),r2(d.p),r2(d.s)]),s:G.surv.map(v=>[v.id,r1(v.x),r1(v.y),r2(v.dir),r1(v.warm),v.frozen?1:0,v.arrived?1:0,r2(Math.max(0,v.happy||0)),r2(v.freezeAnim),v.pal,v.shotN||0,v.mtg||0]),
    w:G.workers.map(w=>[w.id,ROLES.indexOf(w.role),r1(w.x),r1(w.y),r2(w.dir),enc(w.bag),(w.chop?1:0)|(w.flash>0?2:0),w.st?STIDS.indexOf(w.st.id):-1,w.hole?G.holes.indexOf(w.hole):-1,r2(w.t),r1(w.warm==null?100:w.warm),(w.frozen?1:0)|(w.hurt>0?2:0)|(w.goWarm?4:0)|(w.shelter?8:0)])})}
function recon(list,rows,make,apply,kill){if(!list._map)list._map=new Map();const map=list._map,seen=new Set();
  for(const row of rows||[]){const id=row[0];seen.add(id);let o=map.get(id);if(!o){o=make(row);map.set(id,o);list.push(o)}apply(o,row)}
  for(let i=list.length-1;i>=0;i--){const o=list[i];if(!seen.has(o.id)){kill(o);map.delete(o.id);list.splice(i,1)}}}
function applyInbox(){const I=NET.inbox;
  const c=I['s.core'];if(c){I['s.core']=null;
    if(Math.abs(G.t-c.t)>.5)G.t=c.t;G.day=1+Math.floor(G.t/G.DAY);G.cash=c.c;G.earned=c.e;G.fuel=c.f;G.level=c.l;G.woodpile=c.w;G.rep=c.r;G.frozen=c.fz;G.plv=c.pl;G.xp=c.x;G.mission=c.mi;G.fever=c.fv;G.feverT=c.ft;
    if(c.cb>G.combo){const el=$('combo');el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');SFX.combo(c.cb)}G.combo=c.cb;G.comboT=c.ct;Object.assign(G.lv,c.lv||{});Object.assign(G.pm,c.pm||{});G.spa.fuel=c.sp[0];G.spa.pile=c.sp[1];if(c.ra){G.raid.on=!!c.ra[0];G.raid.left=c.ra[1];G.raid.total=c.ra[2];G.raid.final=!!c.ra[3];G.monHP=c.ra[4];G.monMax=c.ra[5]}G.raidWins=c.rw||0;if(c.cv){const dec2=s=>{const o={};for(const t of (s||'').split(','))if(t)o[KR[t[0]]]=+t.slice(1);return o};G.car={state:c.cv[0]?'here':'away',t:c.cv[1],max:c.cv[2],order:dec2(c.cv[3]),got:dec2(c.cv[4])}}else if(DES())G.car={state:'away',t:0,order:{},got:{}};if(G.diff!==(c.df||0)){G.diff=c.df||0;G._dm=null}if(c.sc&&G.secrets){let st=0;G.secrets.forEach((q,i)=>{const f=c.sc[i]==='1';if(f&&!q.found){q.found=true;if(q.t==='dig'||q.t==='trav')q.g.visible=false}if(q.found&&q.t==='stele')st++});G.stele=st}if(c.yr&&c.yr!==G.year){G.year=c.yr;G.monPop=0;if(NET.yearWait){NET.yearWait=false;running=true;show('end',false);show('hud',true);show('bottom',true);show('side',true);G.mission=MISSIONS.length}}if(c.sl){G.sleds=c.sl.map(v=>({id:v[0],x:v[1],y:v[2],rider:v[3]<0?null:v[3],pass:v[4],cargo:dec(v[5]||'')}));(c.kt||[]).forEach((k,i)=>{if(G.players[i])G.players[i].kettle=k});for(const p of G.players)p.riding=G.sleds.some(q=>q.rider===p.id)}if(c.wx){G.wx={type:WXS[c.wx[0]].id,t:c.wx[1],max:c.wx[2]}}else G.wx={type:null,t:0,max:0};G.rank=c.rk||0;G.stats.rescued=c.sr||0;if(c.rs){const v=c.rs;if(!G.rescue||G.rescue.id!==v[0])G.rescue={id:v[0],x:v[1],y:v[2],n:v[3]};Object.assign(G.rescue,{t:v[4],max:v[5],state:['wait','done','fail'][v[6]],hold:v[7],kind:RKIND[v[8]]||'walk',hotDone:!!v[9],left:v[10],saved:v[11],gb:v[12],spec:v[13]||null})}else G.rescue=null;G.stats.haul=c.sh||0;
    if(c.mo&&!G.monument){G.monument=true;G.monV.visible=true;G.monV.scale.setScalar(.01);G.monPop=0}
    ZONES.forEach((z,i)=>{if(c.z[i]==='1'&&!G.zones[z.id]){G.zones[z.id]=true;z.fogT=0;G.camPan={x:(z.rect[0]+z.rect[2])/2,y:(z.rect[1]+z.rect[3])/2,t:0};SFX.area();for(const id in G.stations){const st=G.stations[id];if(st.def.zone===z.id){st.open=true;st.unlockT=0}}if(z.id==='D')G.spa.on=true}});
    STIDS.forEach((id,i)=>{const st=G.stations[id],v=c.st[i];if(st.q.length!==v[0]){st.q.length=0;for(let k=0;k<v[0];k++)st.q.push(st.def.in)}if(v[2]>st.pile)SFX.cash(G.combo);st.shelf=v[1];st.pile=v[2];st.cookT=v[3]});
    c.pd.forEach((v,i)=>{const pad=G.pads[i];if(!pad)return;if(v&&v.p){G.players.forEach((pl,j)=>{const nv=v.p[j]||0;if(nv<(pad.pp[pl.id]||0)&&pl===meP()){pad.pulse=1;SFX.build()}pad.pp[pl.id]=nv});return}if(Array.isArray(v)){pad.mp={fish:v[1],fur:v[2]};v=v[0]}if(v<pad.paid&&pad.paid>0){pad.pulse=1;SFX.build()}pad.paid=v});
    const falls={};for(const [i,f,d] of c.tf||[])falls[i]=[f,d];
    for(let i=0;i<G.trees.length&&i<c.tr.length;i++){const t=G.trees[i],ch=c.tr[i];let dirty=false;
      if(ch==='d'){if(t.alive){t.alive=false;t.fall=0;dirty=true;burst(t.x,t.y,6,16,{c:['#ffffff','#e3f0f7'],s0:30,s1:120,u0:60,u1:180,g:300,l0:.5,l1:1,r0:6,r1:10})}}
      else{if(!t.alive){t.alive=true;t.grow=0;dirty=true}if(falls[i]){if(t.fall<=0)SFX.chop();t.fall=falls[i][0];t.fallDir=falls[i][1];dirty=true}else if(t.fall>0){t.fall=0;dirty=true}}
      if(dirty)forest.upd(t)}
    c.ps.forEach((v,i)=>{const p=G.players[i];if(!p)return;const was=p.down>0;if(v[11])p.lv={gun:v[11][0],bag:v[11][1]};p.bag=dec(v[3]);p.warm=v[4];p.hp=v[5];p.down=v[6];p.inHeat=!!v[7];p.shooting=v[8]&1?true:null;p.chopping=v[8]&2?true:null;p.fishing=v[8]&4&&v[10]>=0?G.holes[v[10]]:null;if(v[8]&8)p.flash=.07;p.buddy=!!(v[8]&16);p.ko=!!(v[8]&32);p.actT=v[9];
      if(i===G.me){if(was&&!(p.down>0)){p.x=CX+rnd(-40,40);p.y=CY+100}}else{p.nx=v[0];p.ny=v[1];p.dirN=v[2]}});
    for(const f of c.fl||[])float(f[0],f[1],f[2],f[3],f[4],f[5],true);for(const b of c.bn||[])banner(b[0],b[1],b[2],b[3],true);for(const t of c.tq||[])toast(t[0],t[1],true);
    for(const t of c.sy||[])say(t[0],t[1],true);if(c.rt&&G.rtrees)c.rt.forEach((v,i)=>{const t=G.rtrees[i];if(!t)return;if(v[1]<t.hp)t.shake=.3;t.alive=!!v[0];t.hp=v[1]});if(c.rq&&G.story){G.story.q={};for(const r of c.rq)G.story.q[r[0]]={st:r[1],p:r[2],x:r[3],y:r[4],f:r[5]<0?null:r[5]}}if(c.rp)c.rp.forEach((v,i)=>{const q=G.players[i];if(!q)return;q.rl=v[0];q.rx=v[1];const inv=v[2]?v[2].split('.'):[];if(i===G.me&&q.items)for(const id of inv)if(!q.items.includes(id)&&ITEMS[id])banner('装備を手に入れた！',ITEMS[id].n,itemDesc(ITEMS[id]),'r-SSR',true);q.items=inv;q.eq={w:v[3]||null,a:v[4]||null,c:v[5]||null};q.mats={};for(const t of (v[6]||'').split(','))if(t){const [k,n]=t.split(':');q.mats[k]=+n}try{q.cnt=JSON.parse(v[7]||'{}')}catch(_){}q.chd=v[8]?v[8].split('.'):[]});if(c.lf)c.lf.forEach((v,i)=>{const q=G.players[i];if(q){q.life={};LIVES.forEach((k,j)=>q.life[k]=v[j])}});if(c.so){G.story=G.story||{seen:{}};G.story.ch=c.so[0];if(NET.opCh!==c.so[0]){NET.opCh=c.so[0];const C=CH[c.so[0]];if(C&&C.open&&c.so[1]===0&&(c.so[0]>1||G.day<=1))playOpening(C,()=>{})}G.story.step=c.so[1];G.story.raids=c.so[2];G.story.minion=c.so[3];G.story.fp=c.so[4];G.story.hs=c.so[5];G.story.hc=c.so[6];G.story.hx=c.so[7];G.story.hy=c.so[8];G.story.ruin=c.so[9];G.story.queen=c.so[10]}else G.story=null;
    if(c.end){if(running)endGame(!!c.end.c,c.end.w);return}}
  const a=I['s.a'];if(a){I['s.a']=null;
    recon(G.bears,a.b,r=>{const kind=BK[r[6]]||'normal';const b={id:r[0],x:r[1],y:r[2],kind,rot:r[3],step:0,hit:0,roar:0,dead:false,deadT:0};b.m=makeBear(kind);b.m.g.position.set(b.x,0,b.y);world.add(b.m.g);return b},
      (b,r)=>{b.nx=r[1];b.ny=r[2];b.dirT=r[3];b.hp=r[4];b.max=r[5];b.state=r[7]?'chase':'wander';if(r[8]>=0&&!b.dead){b.dead=true;SFX.kill()}if(b.dead)b.deadT=Math.max(b.deadT,r[8]);if(r[9])b.hit=.14;if(r[10])b.roar=.5;b.moving=!!r[11];const rf=r[12]||0;if(rf!==b._rf){b._rf=rf;b.raid=rf===1;b.m.ring.material.color.copy(lin(rf?'#ff8a1a':'#ff3b4a'))}if(r[13]&&!b.king){b.king=true;b.m.g.scale.multiplyScalar(1.5)}if(r[14]>0&&b.bt!==BTS[r[14]])setBtLook(b,BTS[r[14]]);b.hide=!!(r[15]&1);b.stn=!!(r[15]&2);if(r[17]&&b.m&&b.m.key!=='Spider'){const par=b.m.g.parent,sc=b.m.g.scale.x,nm=makeBear(b.kind,'Spider');if(par){par.remove(b.m.g);par.add(nm.g)}nm.g.scale.setScalar(sc);b.m=nm}if(r[16]>=0&&b.rbi==null){b.rbi=r[16];b.rq=rbList()[r[16]]&&rbList()[r[16]].rq}},b=>world.remove(b.m.g));
    recon(G.pickups,a.k,r=>{const m={id:r[0],x:r[1],y:r[2],h:r[3],k:KR[r[4]]||'meat',spin:rnd(0,TAU)};m.mesh=itemMesh(m.k);world.add(m.mesh);return m},(m,r)=>{m.nx=r[1];m.ny=r[2];m.h=r[3];if(m.n!==(r[5]||1)){m.n=r[5]||1;m.mesh.scale.setScalar(1.1*(1+Math.min(m.n-1,6)*.14))}},m=>{world.remove(m.mesh);SFX.coin(3)});
    G.warns=G.warns||[];recon(G.warns,a.wn,r=>({id:r[0],k:WK[r[1]],x:r[2],y:r[3],a:r[4],r:r[5],t:r[6],max:r[7]}),(w,r)=>{w.t=r[6]},w=>{if(w.m)world.remove(w.m)});
    recon(G.chests,a.h,r=>{const c={id:r[0],x:r[1],y:r[2],h:r[3],open:-1,t:0};c.m=makeChest();world.add(c.m);SFX.pop();return c},(c,r)=>{c.x=r[1];c.y=r[2];c.h=r[3];if(r[4]>=0&&c.open<0)SFX.chest();c.open=r[4];if(r[5]>=0)c.rar=RAR[r[5]]},c=>world.remove(c.m));
    recon(G.hauls,a.hl,r=>{const h={id:r[0],x:r[1],y:r[2],big:r[3],carried:false};h.m=makeHaul(h.big);world.add(h.m);return h},(h,r)=>{h.nx=r[1];h.ny=r[2];h.carried=!!r[4]},h=>world.remove(h.m));
    (a.ho||[]).forEach((v,i)=>{const h=G.holes[i];if(!h)return;if(v%1>0&&!(h.jump>0)){h.jump=.6;SFX.splash()}h.t=Math.floor(v*100)/100})}
  const b=I['s.b'];if(b){I['s.b']=null;G.drifts=G.drifts||[];recon(G.drifts,b.dr,r=>({id:r[0],x:r[1],y:r[2],p:r[3],s:r[4]}),(d,r)=>{d.p=r[3]},d=>{if(d.mesh)world.remove(d.mesh)});
    recon(G.customers,b.c,r=>{const st=G.stations[STIDS[r[4]]]||G.stations.steak;const c={id:r[0],x:r[1],y:r[2],st,dir:r[3],pal:r[10]||0,step:0,state:'queue',wait:0,patience:1,fade:0};custMesh(c);return c},
      (c,r)=>{c.nx=r[1];c.ny=r[2];c.dirT=r[3];c.state=r[5]?'leave':'queue';if(r[6]&&!c.hold.visible)c.hold.visible=true;c.happy=r[7];c.angry=r[8];c.wait=r[9];c.patience=1;c.fade=r[11]},c=>world.remove(c.m.g));
    for(const id of STIDS){const st=G.stations[id];st.queue=G.customers.filter(c=>c.st===st&&c.state==='queue')}
    recon(G.surv,b.s,r=>{const s={id:r[0],x:r[1],y:r[2],dir:r[3],pal:r[9]||0,step:0,breath:1,freezeAnim:0,happy:0,warm:100};survMesh(s);G.surv.pop();return s},
      (s,r)=>{s.nx=r[1];s.ny=r[2];s.dirT=r[3];s.warm=r[4];s.frozen=!!r[5];s.arrived=!!r[6];s.happy=r[7];s.freezeAnim=r[8];if((r[10]||0)!==(s.shotN||0)){s.shotN=r[10];const b=G.bears.find(q=>q.id===r[11]);if(b)milShot(s,b)}},s=>world.remove(s.m.g));
    recon(G.workers,b.w,r=>{const w={id:r[0],role:ROLES[r[1]]||'hunter',x:r[2],y:r[3],dir:r[4],step:0,bag:[],t:0,flash:0,st:r[7]>=0?G.stations[STIDS[r[7]]]:null};workerMesh(w);return w},
      (w,r)=>{w.nx=r[2];w.ny=r[3];w.dirT=r[4];w.bag=dec(r[5]);w.chop=!!(r[6]&1);if(r[6]&2)w.flash=.07;w.hole=r[8]>=0?G.holes[r[8]]:null;w.t=r[9];w.warm=r[10];w.frozen=!!(r[11]&1);w.hurt=r[11]&2?1:0;w.goWarm=!!(r[11]&4);w.shelter=!!(r[11]&8)},w=>world.remove(w.m.g));
    for(const id of STIDS){const st=G.stations[id];st.cashier=G.workers.find(w=>w.role==='cashier'&&w.st===st)||null}}}
function glide(o,dt,k){if(o.nx==null)return;const px=o.x,py=o.y;const f=Math.min(1,dt*(k||10));o.x=lerp(o.x,o.nx,f);o.y=lerp(o.y,o.ny,f);const sp=Math.hypot(o.x-px,o.y-py)/Math.max(dt,.001);o.moving=sp>12;if(o.moving)o.step+=dt*Math.min(12,sp*.08)}
function guestTick(dt){
  // leave if the host is gone
  const hp=hostPeerNow();if(hp&&hp.peer===NET.hostPeer&&hp.presence.seed!==NET.hostSeed&&hp.presence.trip&&hp.presence.seed){NET.hostSeed=hp.presence.seed;NET.hostMiss=0;NET.inbox={};newGame(2,{seed:hp.presence.seed,guest:true,chars:[hp.presence.ch||'Rogue_Hooded',altCh(hp.presence.ch||'Rogue_Hooded',meta.pick)],diff:hp.presence.df||0,biome:hp.presence.bi||0});NET.room.presence({role:'guest',x:G.players[1].x|0,y:G.players[1].y|0,d:0,ch:meta.pick||'Knight'}).catch(()=>{});updateCam(0,true);hudInit();banner('砂漠の町に着いた','','ここは雪原より過酷','r-SSR');return}
  if(!hp||hp.peer!==NET.hostPeer||hp.presence.seed!==NET.hostSeed){NET.hostMiss+=dt;const lim=PJ.on?45:3;if(PJ.on&&NET.hostMiss>1.5){PJ.rejoin=true;NET.rjT=(NET.rjT||0)-dt;if(NET.rjT<=0){NET.rjT=3;pjRejoin()}netWarn(`接続が切れた…つなぎ直しています（あと${Math.ceil(lim-NET.hostMiss)}秒）`)}if(NET.hostMiss>lim){PJ.rejoin=false;netWarn('');banner('','ホストとつながらない','タイトルに戻ります','cold',true);toTitle();return}}else{if(NET.hostMiss>1.5){netWarn('');toast('つなぎ直した！','gold')}NET.hostMiss=0;PJ.rejoin=false}
  G.t+=dt;G.day=1+Math.floor(G.t/G.DAY);const night=isNight();G.wave=waveDayN(G.day)&&night;G.wind=Math.sin(G.t*.3)*.5+Math.sin(G.t*.11)*.5+(G.wave?1.2:0);
  applyInbox();if(!running)return;
  const me=G.players[G.me];const px=me.x,py=me.y;
  const iv=me.down>0?{x:0,y:0}:inputVec(0),sp0=195*G.pm.speed*(me.riding?1.8:1)*(1+eqv(me,'spd'));me.vx=lerp(me.vx,iv.x*sp0,Math.min(1,dt*12));me.vy=lerp(me.vy,iv.y*sp0,Math.min(1,dt*12));
  me.x=clamp(me.x+me.vx*dt,30,WORLD-30);me.y=clamp(me.y+me.vy*dt,30,WORLD-30);const sp=Math.hypot(me.vx,me.vy);me.moving=sp>20;if(me.moving){me.step+=dt*sp*.06;me.dirT=Math.atan2(me.vx,me.vy);if(Math.random()<dt*6)puff(me.x-me.vx*.05,me.y-me.vy*.05,2,{r:7,life:.6,a:.7,vy:10,grow:1})}
  fenceCollide(me,px,py);solids(me,12);for(const t of G.trees)if(t.alive&&t.fall<=0&&Math.abs(t.x-me.x)<30&&Math.abs(t.y-me.y)<30)pushCircle(me,t.x,t.y,18*t.s);
  me.bb=lerp(me.bb,0,dt*8);me.flash=Math.max(0,me.flash-dt);me.inv=Math.max(0,me.inv-dt);
  if(me.shooting){const b=nearestBear(me);if(b)me.aimDir=Math.atan2(b.x-me.x,b.y-me.y)}else if(me.chopping){const t=nearestTree(me);if(t)me.aimDir=Math.atan2(t.x-me.x,t.y-me.y)}else me.aimDir=null;
  NET.room.presence({role:'guest',x:me.x|0,y:me.y|0,d:r2(me.dir),ch:meta.pick||'Knight',fk:NET.fCount||0,ek:NET.eCount||0,eg:NET.eGrade||0,act:NET.act||null}).catch(()=>{});
  const host=G.players[0];followNet(host,dt);if(host.shooting){const b=nearestBear(host);if(b)host.aimDir=Math.atan2(b.x-host.x,b.y-host.y)}else if(host.chopping){const t=nearestTree(host);if(t)host.aimDir=Math.atan2(t.x-host.x,t.y-host.y)}else host.aimDir=null;
  for(const b of G.bears){if(b.dead){b.deadT+=dt;continue}glide(b,dt,8);b.hit=Math.max(0,b.hit-dt);b.roar=Math.max(0,b.roar-dt);b.step+=b.moving?dt*6:0}
  for(const m of G.pickups){if(m.nx!=null){m.x=lerp(m.x,m.nx,Math.min(1,dt*12));m.y=lerp(m.y,m.ny,Math.min(1,dt*12))}}
  for(const c of G.customers){glide(c,dt);c.fade=Math.min(1,(c.fade||0)+dt*2);if(c.happy>0)c.happy-=dt;if(c.angry>0)c.angry-=dt}
  for(const s of G.surv){glide(s,dt);if(s.happy>0)s.happy-=dt}
  for(const w of G.workers){if(w.role==='cashier'){w.x=w.st.def.stand.x;w.y=w.st.def.stand.y;w.dirT=Math.PI;continue}glide(w,dt);w.flash=Math.max(0,w.flash-dt);w.aimDir=null}
  for(const t of G.trees){if(t.alive&&t.grow<1){t.grow=Math.min(1,t.grow+dt*1.5);forest.upd(t)}}
  for(const h of G.holes)h.jump=Math.max(0,h.jump-dt);
  for(const h of G.hauls)glide(h,dt,8);tickTowers(dt,false);
  const R=heatR();for(const id in G.stations){const st=G.stations[id];if(st.unlockT!=null&&st.unlockT<1)st.unlockT+=dt;st.frozen=st.open&&dist(st.def.conv.x,st.def.conv.y,CX,CY)>R;st.staffed=!!st.cashier||G.players.some(q=>dist(q.x,q.y,st.def.stand.x,st.def.stand.y)<40)}
  G.onPads=new Set();for(const pad of G.pads)if(pad.shown&&G.players.some(q=>dist(q.x,q.y,pad.x,pad.y)<(pad.big?50:40)))G.onPads.add(pad);for(const pad of G.pads)pad.pulse=Math.max(0,pad.pulse-dt*2);
  for(const c of G.chests)c.t+=dt;tickCombo(dt);
}
// ================================================================ core update
function update(dt){
  G.t+=dt;const nd=1+Math.floor(G.t/G.DAY);if(nd!==G.day){G.day=nd;dailyUpkeep();snapSave()}
  const night=isNight();const waveDay=waveDayN(G.day);
  if(waveDay&&!night&&((G.t%G.DAY)/G.DAY)>.6&&G.waveWarned!==G.day){G.waveWarned=G.day;banner('今夜',DES()?'大熱波が来る！':'大寒波が来る！',DES()?'井戸の水をためておけ（水の減りと渇きが倍）':'燃料をためておけ（燃料の減りと寒さが倍）','cold');SFX.wave()}
  G.wave=waveDay&&night;
  G.wind=Math.sin(G.t*.3)*.5+Math.sin(G.t*.11)*.5+(G.wave?1.2:0);
  const R=heatR();G.onPads=new Set();tickCombo(dt);tickChests(dt);
  for(const p of G.players){const px=p.x,py=p.y;if(p.remote){followNet(p,dt);continue}const iv=p.down>0?{x:0,y:0}:inputVec(p.id),sp0=195*G.pm.speed*(p.riding?1.8:1)*(1+eqv(p,'spd'));p.vx=lerp(p.vx,iv.x*sp0,Math.min(1,dt*12));p.vy=lerp(p.vy,iv.y*sp0,Math.min(1,dt*12));
    p.x=clamp(p.x+p.vx*dt,30,WORLD-30);p.y=clamp(p.y+p.vy*dt,30,WORLD-30);const sp=Math.hypot(p.vx,p.vy);p.moving=sp>20;if(p.moving){p.step+=dt*sp*.06;p.dirT=Math.atan2(p.vx,p.vy);if(Math.random()<dt*6)puff(p.x-p.vx*.05,p.y-p.vy*.05,2,{r:7,life:.6,a:.7,vy:10,grow:1})}
    fenceCollide(p,px,py);solids(p,12);for(const t of G.trees)if(t.alive&&t.fall<=0&&Math.abs(t.x-p.x)<30&&Math.abs(t.y-p.y)<30)pushCircle(p,t.x,t.y,18*t.s);
    p.bb=lerp(p.bb,0,dt*8);p.flash=Math.max(0,p.flash-dt);p.hurt=Math.max(0,p.hurt-dt);p.inv=Math.max(0,p.inv-dt)}
  if(G.players.length>1&&NET.mode==='solo'){const [a,b]=G.players;for(const [p,o] of [[a,b],[b,a]]){p.x=clamp(p.x,o.x-640,o.x+640);p.y=clamp(p.y,o.y-640,o.y+640)}}
  for(const p of G.players)playerActions(p,dt,R);
  for(const pad of G.pads)pad.pulse=Math.max(0,pad.pulse-dt*2);
  // furnace
  const burn=(.6+G.level*.14+G.day*.05)*(night?1.4:1)*(G.wave?1.8:1)*G.pm.burn*(wxIs('snap')?1.3:1)*(DES()&&!isNight()?1.25:1)*DM().burn*(1+(YR()-1)*.12)*(1+.05*((G.drifts||[]).length));G.fuel=Math.max(0,G.fuel-burn*dt);
  if(G.fuel<20&&!G.lowWarned){G.lowWarned=true;toast('かまどの燃料が少ない！ 薪をくべろ','cold');SFX.bad()}if(G.fuel>35)G.lowWarned=false;
  if(G.fuel<=0&&!G.outWarned){G.outWarned=true;banner(DES()?'井戸が干上がった！':'かまどの火が消えた！',DES()?'町の人が倒れていく':'町の人が凍っていく',DES()?'湧き水をくんで井戸を満たせ。倒れた町人が5人でゲームオーバー':'薪をくべて火を戻せ。凍った町人が5人でゲームオーバー','cold');SFX.wave()}if(G.fuel>5)G.outWarned=false;
  // stations frozen state
  for(const id in G.stations){const st=G.stations[id];const d=dist(st.def.conv.x,st.def.conv.y,CX,CY);const fz=st.open&&d>R;if(fz&&!st.frozen){toast(`${st.def.name}が凍った！ かまどを強化・燃料を`,'cold')}st.frozen=fz}
  updateWoodpile(dt);updateTrees(dt);updateBears(dt);updateRaid(dt);tickTowers(dt,true);updateHauls(dt);updatePickups(dt);updateWorkers(dt);updateStations(dt);updateSurvivors(dt,R);updateMilitia(dt);updateSpa(dt);updateHoles(dt);updateRescue(dt);updateTax(dt);updateSecrets(dt);updateRoad(dt);updateCaravan(dt);
  checkMission(dt);updateStory(dt);updateDrifts(dt);updateFireside(dt);updateCraft(dt);updateQuests(dt);updateRankObj(dt);updateCave(dt);updateChallenges();G.achT-=dt;if(G.achT<=0){G.achT=.5;checkAch()}
  if(G.pendingLv>0&&!G.paused)openPerk();
  if(G.frozen>=5&&!G.endless)endGame(false,'freeze');
}
function give(p,k,n){let c=0;for(let i=0;i<n&&p.bag.length<cap(p);i++){p.bag.push(k);c++}p.bb=1;return c}
function take(p,k){const i=p.bag.lastIndexOf(k);if(i<0)return false;p.bag.splice(i,1);return true}
function updateSled(p,dt){dt=dt||.016;const sl=G.sleds.find(q=>q.rider===p.id);const fd=dist(p.x,p.y,CX,CY);
  if(sl){sl.x=p.x;sl.y=p.y;if(fd>FR+20)p.rodeOut=true;if(sl.pass&&fd<FR-30){sl.pass=0;spawnSurvivor(false);const s=G.surv[G.surv.length-1];s.x=p.x;s.y=p.y;s.warm=100;s.m.g.position.set(s.x,0,s.y);const R=G.rescue;if(R&&R.kind==='sled'&&R.state==='wait'){R.saved++;float(p.x,p.y,90,`町へ運んだ！ ${R.saved}/${R.n}`,'gold',true);SFX.rare()}}
  const fp=p.fPress;p.fPress=false;
  if(fp||p.down>0){if(sl.pass&&p.down>0){sl.pass=0;const R=G.rescue;if(R&&R.kind==='sled')R.left++}sl.rider=null;p.riding=false;p.rodeOut=false;p.sledCd=2.5;sl.x=p.x;sl.y=p.y+48;const c0=cap(p);if(p.bag.length>c0){sl.cargo=(sl.cargo||[]).concat(p.bag.splice(c0));toast(`犬ぞりから降りた（入りきらない${sl.cargo.length}個はそりに積んだまま）`,'gold')}else toast('犬ぞりから降りた','gold')}return}
  p.riding=false;const fp2=p.fPress;p.fPress=false;if(!fp2||p.down>0)return;
  for(const q of G.sleds)if(q.rider==null&&dist(p.x,p.y,q.x,q.y)<60){q.rider=p.id;p.riding=true;p.rodeOut=false;if(q.cargo&&q.cargo.length){p.bag.push(...q.cargo);q.cargo=[]}SFX.rare();toast(`犬ぞりに乗った！ 荷物+${SLED_CAP}個・速い・寒さに強い（Fキーで降りる）`,'gold');burst(q.x,q.y,20,16,{c:['#ffffff','#ffd23f'],s0:40,s1:140,l0:.4,l1:.8});break}}
function playerActions(p,dt,R){updateSled(p,dt);if(inBath(p)&&!p.riding){p.warm=Math.min(100,p.warm+40*dt);p.bathT=(p.bathT||0)+dt;if(p.bathT>6){p.bathT=0;float(p.x,p.y,50,['いい湯だな〜','ふぅ〜','極楽…'][Math.floor(Math.random()*3)],'gold')}}else p.bathT=0;updateKettle(p,dt);p.riding=G.sleds.some(q=>q.rider===p.id);
  const fd=dist(p.x,p.y,CX,CY),inHeat=fd<R||spaWarm(p.x,p.y)||caveWarm(p.x,p.y);
  p.inHeat=inHeat;
  if(p.down>0){p.down-=dt*(p.ko&&G.players.some(q=>q!==p&&!(q.down>0)&&dist(q.x,q.y,p.x,p.y)<50)?3:1);if(p.down<=0){if(p.ko){p.ko=false;p.inv=1.5;SFX.pop();float(p.x,p.y,70,'起きあがった！','gold');return}p.x=CX+rnd(-40,40);p.y=CY+100;p.warm=55;p.inv=1.5;SFX.pop();burst(p.x,p.y,20,24,{c:['#ffd166','#ff8a3d','#ffffff'],s0:40,s1:150,u0:120,u1:260,l0:.5,l1:.9,add:true,r0:5,r1:8});toast('かまどで目を覚ました','gold')}return}
  const zoneK=(inZone(p.x,p.y)||{}).id==='C'?1.35:(inZone(p.x,p.y)||{}).id==='B'?1.2:1;
  p.buddy=G.players.length>1&&G.players.some(q=>q!==p&&!(q.down>0)&&dist(q.x,q.y,p.x,p.y)<64);
  const drain=(3.3+G.day*.26)*coolMul()*G.mod.cold*G.pm.cold*zoneK*(p.buddy?.35:1)*(p.riding?.55:1)*(1-Math.min(.6,eqv(p,'cold')));
  p.warm=clamp(p.warm+(inHeat?28+G.level*3:-drain)*dt,0,100);
  if(!inHeat&&p.warm<25){p.beat=(p.beat||0)-dt;if(p.beat<=0){p.beat=.7;tone(90,.12,'sine',.12);tone(70,.14,'sine',.1,0,.16)}}
  if(!inHeat&&p.warm<30&&!p.warnedCold){p.warnedCold=true;toast(DES()?'のどがカラカラ！ 井戸へ戻れ':'体温があぶない！ かまどへ戻れ','cold')}if(p.warm>60)p.warnedCold=false;
  if(p.warm<=0){p.down=2.6;p.inv=3.2;p.shooting=p.chopping=p.fishing=null;const drop=p.bag.splice(0);for(const k of drop)dropItem(p.x,p.y,k,20);SFX.bad();G.shake=10;float(p.x,p.y,80,DES()?'干からびた…':'こごえた…','ice',true);banner('',DES()?'干からびた…':'こごえた…',DES()?'持ち物を落とした。井戸のまわりでしか水分は戻らない':'持ち物を落とした。かまどの熱の中でしか体温は戻らない','cold');return}
  p.breath-=dt;if(p.breath<=0&&!inHeat&&!DES()){p.breath=rnd(.9,1.4);puff(p.x+Math.sin(p.dir)*10,p.y+Math.cos(p.dir)*10,36,{r:6,life:1,a:.8,vy:10,grow:1.4})}
  // shoot > chop > fish
  p.shooting=null;p.chopping=null;
  const cl=clsOf(p),melee=cl.rng<130;let tgt=null,td=cl.rng+p.lv.gun*(melee?4:15);for(const b of G.bears){if(b.dead)continue;const d=dist(p.x,p.y,b.x,b.y);if(d<td){td=d;tgt=b}}
  const gunInt=.5*cl.rate*Math.pow(.86,p.lv.gun)*G.pm.rate*(G.feverT>0?.5:1);
  if(tgt){p.shooting=tgt;p.aimDir=Math.atan2(tgt.x-p.x,tgt.y-p.y);p.actT+=dt;if(p.actT>=gunInt){p.actT=0;p.flash=.07;let dmg=(1+p.lv.gun*.5+G.pm.dmg)*cl.dmg*(G.feverT>0?2:1)*lifeB(p,'hunt',.06)*(1+eqv(p,'atk')+(isRPG()?(rlv(p)-1)*.05:0));
    const o=G.players.length>1&&G.players.find(q=>q!==p&&q.shooting===tgt);if(o){const a1=Math.atan2(p.x-tgt.x,p.y-tgt.y),a2=Math.atan2(o.x-tgt.x,o.y-tgt.y);if(Math.abs(Math.atan2(Math.sin(a1-a2),Math.cos(a1-a2)))>1.6){dmg*=2;if(!(tgt.pinT>0)){tgt.pinT=1.5;float(tgt.x,tgt.y,120,'挟み撃ち！ ダメージ2倍','gold',true);SFX.combo(8)}}}
    if(cl.cleave){for(const b of G.bears){if(b.dead||b===tgt)continue;if(dist(p.x,p.y,b.x,b.y)<cl.rng+12){shoot(p,b,dmg,true,cl.fx);if(cl.stun)b.atkCd=Math.max(b.atkCd,cl.stun)}}}
    if(cl.stun)tgt.atkCd=Math.max(tgt.atkCd||0,cl.stun);if(cl.heal)p.hp=Math.min(100,p.hp+cl.heal);
    if(cl.splash){for(const b of G.bears){if(b.dead||b===tgt)continue;if(dist(tgt.x,tgt.y,b.x,b.y)<cl.splash)shoot(tgt,b,dmg*.6,true,'none')}}
    shoot(p,tgt,dmg,true,cl.fx)}}
  else{let tree=null,tdd=48;if(p.bag.length<cap(p)&&!p.riding)for(const t of G.trees){if(!t.alive||t.fall>0||(t.zone&&!G.zones[t.zone]))continue;const d=dist(p.x,p.y,t.x,t.y);if(d<tdd){tdd=d;tree=t}}
    if(tree){p.chopping=tree;p.aimDir=Math.atan2(tree.x-p.x,tree.y-p.y);p.actT+=dt;if(p.actT>.24*G.pm.chop*G.mod.chop/lifeB(p,'wood',.07)){p.actT=0;hitTree(tree,p.x,p.y,true);const got=give(p,tree.item||'log',G.feverT>0?2:1);G.stats.chopped+=got;lifeXp(p,'wood',1);cnt(p,'chop',got);SFX.chop();addCombo(2);gainXP(1);float(tree.x,tree.y,60,`+${got}`,'gold');G.shake=Math.max(G.shake,2);if(G.stats.chopped%30<got)spawnChest(tree.x+rnd(-25,25),tree.y+rnd(-25,25))}}
    else{p.aimDir=null;p.actT=Math.min(p.actT,.3)}}
  // fishing
  p.fishing=null;if(!tgt&&!p.chopping&&!p.riding&&(G.zones.B||DES())&&p.bag.length<cap(p)){for(const h of G.holes){if(dist(p.x,p.y,h.x,h.y)<24&&(!h.user||h.user===p)){if(h.rq&&isRPG()&&lifeRank(p,'fish')<h.rq){if(!p._fk2||G.t-p._fk2>2){p._fk2=G.t;float(h.x,h.y,70,`釣り人「${LR[h.rq].n}」で大物が釣れる`,'red')}continue}p.fishing=h;h.user=p;break}}}
  for(const h of G.holes)if(h.user===p&&p.fishing!==h)h.user=null;
  // pickups (magnet)
  for(const m of G.pickups){if(m.h>3||p.bag.length>=cap(p))continue;const d=dist(p.x,p.y,m.x,m.y);if(d<90+G.pm.magnet){m.x+=(p.x-m.x)*Math.min(1,dt*9);m.y+=(p.y-m.y)*Math.min(1,dt*9)}if(d<22){const got=give(p,m.k,m.n||1);m.n=(m.n||1)-got;if(m.n<=0)m.taken=true;SFX.coin(p.bag.length%12);if(m.k==='fur')G.stats.fur+=got}}
  // deliveries
  p.depT+=dt;
  if(p.depT>.06){let did=false;
    if(!did&&DES()&&fd<100&&G.fuel<99.5&&take(p,'water')){did=true;G.stats.fed++;flyItem('water',p.x,p.y,24+p.stack.h,CX,CY,50,()=>{G.fuel=Math.min(100,G.fuel+14);burst(CX,CY,50,8,{c:['#8fd0ec','#ffffff'],s0:30,s1:90,u0:100,u1:220,l0:.3,l1:.6,r0:4,r1:7})})}
    if(!did&&fd<100&&(G.fuel>=99||DES())&&take(p,'log')){did=true;flyItem('log',p.x,p.y,24+p.stack.h,WOOD.x,WOOD.y,G.woodStack.h+4,()=>{G.woodpile++})}
    if(!did&&!DES()&&fd<100&&G.fuel<99&&take(p,'log')){did=true;G.stats.fed++;gainXP(1);flyItem('log',p.x,p.y,24+p.stack.h,CX,CY,50,()=>{G.fuel=Math.min(100,G.fuel+logFuel());burst(CX,CY,50,5,{c:['#ffd166','#ff8a3d'],s0:30,s1:90,u0:100,u1:220,l0:.3,l1:.6,add:true,r0:4,r1:7})})}
    if(!did)for(const id in G.stations){const st=G.stations[id];if(!st.open)continue;const c=st.def.conv;if(dist(p.x,p.y,c.x,c.y)<75&&take(p,st.def.in)){did=true;if(id==='steak')G.stats.grilled++;flyItem(st.def.in,p.x,p.y,24+p.stack.h,c.x-56,c.y+10,st.inStack.h+4,()=>{st.q.push(st.def.in)},3.4);break}}
    if(!did&&G.zones.D&&dist(p.x,p.y,SPA.boiler.x,SPA.boiler.y)<70&&G.spa.fuel<95&&take(p,'log')){did=true;G.stats.boiler=(G.stats.boiler||0)+1;flyItem('log',p.x,p.y,30,SPA.boiler.x,SPA.boiler.y,40,()=>{G.spa.fuel=Math.min(100,G.spa.fuel+12)})}
    if(did)p.depT=0}
  // cash piles
  for(const id in G.stations){const st=G.stations[id];if(st.pile>0&&dist(p.x,p.y,st.def.pile.x,st.def.pile.y)<56)collectPile(p,st,'pile',st.def.pile,dt)}
  if(G.spa.pile>0&&dist(p.x,p.y,SPA.pile.x,SPA.pile.y)<56)collectPile(p,G.spa,'pile',SPA.pile,dt);
  // pads
  for(const pad of G.pads){if(!pad.shown||dist(p.x,p.y,pad.x,pad.y)>(pad.big?50:40))continue;G.onPads.add(pad);
    if(pad.personal){const c=pad.costP(p);if(c==null)continue;p.padT+=dt;if(p.padT<.03)continue;p.padT=0;if(G.cash<=0)continue;const cur=pad.pp[p.id]||0;const pay=Math.min(G.cash,c-cur,Math.max(1,Math.ceil(c/35)));G.cash-=pay;pad.pp[p.id]=cur+pay;if(Math.random()<.5)flyItem('cash',p.x,p.y,30,pad.x,pad.y,4,null,4);
      if(pad.pp[p.id]>=c){pad.pp[p.id]=0;pad.buyP(p);pad.pulse=1;SFX.build()}continue}if(pad.req&&pad.req())continue;const c=pad.cost();if(c==null)continue;
    p.padT+=dt;if(p.padT<.03)continue;p.padT=0;
    if(pad.pay==='cash'&&G.cash>0){if(pad.pop&&!idleSurvivors().length){if(!pad._w){pad._w=1;toast('生存者が足りない！ 集まるのを待とう','cold')}continue}pad._w=0;const pay=Math.min(G.cash,c-pad.paid,Math.max(1,Math.ceil(c/35)));G.cash-=pay;pad.paid+=pay;if(Math.random()<.5)flyItem('cash',p.x,p.y,30,pad.x,pad.y,4,null,4)}
    else if(pad.pay==='log'){let did=false;if(pad.paid<c&&take(p,'log')){pad.paid++;did=true;flyItem('log',p.x,p.y,24+p.stack.h,pad.x,pad.y,4,null,3.2)}
      else if(pad.mix){const need=pad.mix();for(const k of ['fish','fur'])if(pad.mp[k]<need[k]&&take(p,k)){pad.mp[k]++;did=true;flyItem(k,p.x,p.y,24+p.stack.h,pad.x,pad.y,4,null,3.2);break}}if(!did)continue}
    else continue;
    if(pad.paid>=c&&mixDone(pad)){if(finishPad(pad)===false)continue}}
  // bear hit → knocked down
  if(p.hp<=0&&!(p.down>0)){p.hp=60;p.inv=6;const drop=p.bag.splice(0);const keep=drop.filter((_,i)=>i%2===0);for(let r=keep.length,i=0;r>0;r-=4,i+=4)dropItem(p.x,p.y,keep[i],20,Math.min(4,r));p.down=6;p.ko=true;p.shooting=p.chopping=p.fishing=null;float(p.x,p.y,70,'ダウン…','red',true);toast(`オオカミにやられた！ 荷物の半分を失った${G.players.length>1?'（仲間がそばに来ると早く起きる）':''}`,'cold');SFX.bad();G.shake=12}
  if(inHeat)p.hp=Math.min(100,p.hp+(p.inHeat?7:0)*dt);
}
const mixDone=pad=>{if(!pad.mix)return true;const n=pad.mix();return pad.mp.fish>=n.fish&&pad.mp.fur>=n.fur};
const mixLeft=pad=>{if(!pad.mix)return '';const n=pad.mix(),a=[];if(n.fish-pad.mp.fish>0)a.push(`魚${n.fish-pad.mp.fish}`);if(n.fur-pad.mp.fur>0)a.push(`毛皮${n.fur-pad.mp.fur}`);return a.join('・')};
function finishPad(pad){const c=pad.cost();const ok=pad.buy(pad);if(ok===false){pad.paid=c-1;return false}pad.paid=0;if(pad.mp)pad.mp={fish:0,fur:0};pad.pulse=1;SFX.build();G.shake=Math.max(G.shake,7);gainXP(10,pad.x,pad.y);burst(pad.x,pad.y,10,40,{c:['#8ff08f','#3fc157','#ffffff','#ffd166'],s0:60,s1:220,u0:150,u1:320,l0:.7,l1:1.2,r0:5,r1:9});return true}
// the woodpile feeds the fire when it runs low, otherwise it pays for the furnace upgrade by itself
function updateWoodpile(dt){G.woodT=(G.woodT||0)+dt;if(G.woodpile<=0||G.woodT<.22)return;G.woodT=0;
  if(G.fuel<45&&!DES()){G.woodpile--;flyItem('log',WOOD.x,WOOD.y,G.woodStack.h,CX,CY,50,()=>{G.fuel=Math.min(100,G.fuel+logFuel())});return}
  const pad=G.pads.find(q=>q.id==='furnace');if(!pad||!pad.shown)return;const c=pad.cost();if(c==null)return;
  if(pad.paid>=c){if(mixDone(pad))finishPad(pad);return}G.woodpile--;pad.paid++;flyItem('log',WOOD.x,WOOD.y,G.woodStack.h,pad.x,pad.y,4,null,2.6);if(pad.paid>=c&&mixDone(pad))finishPad(pad)}
function collectPile(p,obj,key,pos,dt){p.cashT+=dt;let n=0;while(p.cashT>.02&&obj[key]>0){p.cashT-=.02;const t=Math.min(obj[key],Math.max(5,Math.ceil(obj[key]*.05)));obj[key]-=t;G.cash+=t;n++}if(n){G._cf=(G._cf||0)+1;if(G._cf%3===0)flyCoins(p.x,40,p.y,2,'cashIco','cash');if(Math.random()<.4)flyItem('cash',pos.x,pos.y,30,p.x,p.y,30,null,4)}}
function dropItem(x,y,k,h,n){const a=rnd(0,TAU),s=rnd(40,120),m={id:++G.nid,x,y,k,n:n||1,h:h??14,vh:rnd(120,220),vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45,spin:rnd(0,TAU)};m.mesh=itemMesh(k);m.mesh.traverse(o=>{if(o.isMesh)o.renderOrder=6});m.mesh.scale.setScalar(1.1*(1+Math.min(m.n-1,6)*.14));world.add(m.mesh);G.pickups.push(m)}
function updatePickups(dt){for(const m of G.pickups){m.life-=dt;if(m.h>0||m.vh>0){m.vh-=600*dt;m.h=Math.max(0,m.h+m.vh*dt);m.x+=m.vx*dt;m.y+=m.vy*dt;if(m.h===0){m.vh=m.vh<-80?-m.vh*.35:0;m.vx*=.5;m.vy*=.5}}}
  for(const m of G.pickups)if(m.taken||m.life<=0)world.remove(m.mesh);G.pickups=G.pickups.filter(m=>!m.taken&&m.life>0)}
function hitTree(t,fx,fy,big){t.hp--;t.shake=.25;burst(t.x,t.y,18,big?7:3,{c:['#c9955b','#a8743f','#e7c08e'],s0:40,s1:140,u0:80,u1:200,l0:.5,l1:.8,r0:4,r1:6});
  burst(t.x,t.y,70*t.s,big?10:4,{c:['#ffffff','#e6f2f8'],s0:10,s1:50,u0:0,u1:40,g:120,l0:.6,l1:1.1,r0:4,r1:7});if(t.hp<=0){t.fall=.001;t.fallDir=Math.atan2(t.x-fx,t.y-fy)}t.dirty=true}
function updateTrees(dt){for(const t of G.trees){if(t.shake>0){t.shake-=dt;t.dirty=true}
    if(t.fall>0){t.fall+=dt*1.6;t.dirty=true;if(t.fall>=1){t.fall=0;t.alive=false;t.regrow=rnd(25,40);if(G.players.some(p=>dist(t.x,t.y,p.x,p.y)<300))G.shake=Math.max(G.shake,5);
      burst(t.x+Math.sin(t.fallDir)*50*t.s,t.y+Math.cos(t.fallDir)*50*t.s,6,26,{c:['#ffffff','#e3f0f7','#cfe4ef'],s0:30,s1:150,u0:60,u1:200,g:300,l0:.6,l1:1.1,r0:6,r1:12})}}
    if(!t.alive){t.regrow-=dt;if(t.regrow<=0&&G.players.every(p=>dist(t.x,t.y,p.x,p.y)>70)&&G.workers.every(w=>dist(t.x,t.y,w.x,w.y)>50)){t.alive=true;t.hp=4;t.grow=0;t.dirty=true}}
    if(t.alive&&t.grow<1){t.grow=Math.min(1,t.grow+dt*1.5);t.dirty=true}
    if(t.dirty){t.dirty=false;forest.upd(t)}}}
function shoot(sh,b,dmg,isPlayer,fx){const a=Math.atan2(b.x-sh.x,b.y-sh.y);const mx=sh.x+Math.sin(a)*28,my=sh.y+Math.cos(a)*28;fx=fx||'bolt';
  if(fx==='bolt'){for(let i=0;i<7;i++){const k=i/7;psA.emit({x:lerp(mx,b.x,k),y:lerp(24,22,k),z:lerp(my,b.y,k),vx:0,vy:0,vz:0,g:0,life:.07+k*.05,max:.12,r:5,c:C('#fff2b0'),air:true,fade:.1})}}
  else if(fx==='magic'){for(let i=0;i<10;i++){const k=i/10;psA.emit({x:lerp(mx,b.x,k),y:lerp(30,22,k)+Math.sin(k*9)*4,z:lerp(my,b.y,k),vx:0,vy:0,vz:0,g:0,life:.12+k*.08,max:.2,r:7,c:C(i%2?'#c9a2ff':'#7fe8ff'),air:true,fade:.1})}burst(b.x,b.y,22,14,{c:['#c9a2ff','#7fe8ff','#ffffff'],s0:60,s1:180,u0:60,u1:180,l0:.3,l1:.6,r0:4,r1:8,add:true})}
  else if(fx==='slash'||fx==='spin'){const n=fx==='spin'?12:7;for(let i=0;i<n;i++){const aa=a+(fx==='spin'?i/n*TAU:(i/n-.5)*1.6),rr=fx==='spin'?60:34;psA.emit({x:sh.x+Math.sin(aa)*rr,y:22,z:sh.y+Math.cos(aa)*rr,vx:Math.sin(aa)*40,vy:0,vz:Math.cos(aa)*40,g:0,life:.16,max:.16,r:6,c:C('#ffffff'),air:true,fade:.1})}const k2=dist(sh.x,sh.y,b.x,b.y)||1;b.x+=(b.x-sh.x)/k2*10;b.y+=(b.y-sh.y)/k2*10;if(isPlayer)SFX.chop()}
  if(b.hide)return;if(b.rq&&isPlayer&&G.players.includes(sh)&&isRPG()&&lifeRank(sh,'hunt')<b.rq){b.hit=.05;if(!b._lk||G.t-b._lk>1.4){b._lk=G.t;float(b.x,b.y,120,`かたい！ 狩人「${LR[b.rq].n}」が必要`,'red')}return}b.hp-=dmg*(b.ph==='st'?2:1);b.hit=.14;if(isPlayer&&G.players.includes(sh)){b.state='chase';b.target=sh;b.roar=.7;if(fx==='bolt'||fx==='magic')SFX.shot()}
  burst(b.x,b.y,24,4,{c:['#ffffff','#ffd6d6'],s0:20,s1:70,u0:40,u1:120,l0:.2,l1:.4,r0:3,r1:5});if(b.hp<=0){if(isPlayer&&G.players.includes(sh)){lifeXp(sh,'hunt',b.kind==='boss'?10:b.kind==='big'?4:2);cnt(sh,'kill');if(b.kind==='boss')cnt(sh,'boss');if(b.raid)cnt(sh,'raidk');cnt(sh,'bk_'+bkId(b));if(b.cave&&isRPG())addMat(sh,'silk',b.kind==='boss'?4:1)}if(b.rbi!=null)rbKilled(b,sh);gainRX(sh,b.kind==='boss'?25:b.kind==='big'?6:3);if(isRPG()&&b.kind==='boss'&&!b.qid&&Math.random()<.45)giveItem(sh,Math.random()<.5?'w_bear':'a_bear');killBear(b,isPlayer)}}
function killBear(b,byPlayer){if(b.qid&&G.story&&G.story.q&&G.story.q[b.qid]&&G.story.q[b.qid].st===1){G.story.q[b.qid].st=2;const Q=QUESTS[b.qid];setTimeout(()=>{if(running)banner('依頼達成！',Q.t,`${npcName(Q.npc)}に報告しよう`,'area')},900)}b.dead=true;b.deadT=0;G.stats.bears++;SFX.kill();if(b.nushi){G.secretS+=12;const q=G.secrets&&G.secrets.find(o=>o.t==='nushi');if(q)q.found=true;setTimeout(()=>{if(running)banner('ヌシを倒した！','森の主をしずめた','★+12','r-SSR')},600)}
  if(b.raid){G.raid.kills++;G.stats.raidKills++}
  const haul=G.players.length>1&&NET.mode==='host'&&(b.kind==='boss'||b.nushi||(b.kind==='big'&&Math.random()<.08));if(haul)spawnHaul(b.x,b.y,b.kind==='boss'?2:1);
  const meat=((b.kind==='boss'?12:b.kind==='big'?6:3+(Math.random()<.5?1:0))+G.mod.meat)>>(haul?1:0),fur=b.zone==='C'?(b.kind==='boss'?8:b.kind==='big'?2:1):0;
  for(let r=meat;r>0;r-=4)dropItem(b.x,b.y,'meat',undefined,Math.min(4,r));for(let r=fur;r>0;r-=4)dropItem(b.x,b.y,'fur',undefined,Math.min(4,r));
  if(b.kind==='boss'){G.stats.boss++;for(let i=0;i<2;i++)spawnChest(b.x+rnd(-40,40),b.y+rnd(-40,40));banner('BOSS撃破！','ボスオオカミ','大量ドロップ！','r-SSR');SFX.ssr();G.shake=16}
  else if(b.kind==='big'||Math.random()<.14+G.luck)spawnChest(b.x+rnd(-20,20),b.y+rnd(-20,20));
  if(byPlayer){addCombo(9);gainXP(b.kind==='boss'?80:b.kind==='big'?14:6,b.x,b.y)}
  burst(b.x,b.y,20,b.kind==='boss'?50:16,{c:['#ffffff','#e6f2f8','#e5483d'],s0:40,s1:180,l0:.5,l1:.9});float(b.x,b.y,90,b.kind==='big'?'大物！':'ドロップ！','gold',b.kind!=='normal')}
function updateBears(dt){
  G.bearT-=dt;const maxA=Math.round(Math.min(10,5+Math.floor(G.t/80)+wc('hunter'))*G.mod.bears),maxC=G.zones.C?Math.min(8,4+wc('hunter')):0;
  {const aliveA=G.bears.filter(b=>!b.dead&&!b.raid&&!b.flee&&!b.guardOf&&b.zone==='A');if(aliveA.length>maxA+1){const far=aliveA.find(b=>b.state!=='chase'&&G.players.every(p=>dist(p.x,p.y,b.x,b.y)>750));if(far){far.dead=true;far.deadT=9;far.gone=true}}}
  if(G.bearT<=0){G.bearT=rnd(2,4);if(G.bears.filter(b=>!b.dead&&b.zone==='A').length<maxA)spawnBear('A',false);else if(G.bears.filter(b=>!b.dead&&b.zone==='C').length<maxC)spawnBear('C',false)}
  if(G.zones.C){G.bossT-=dt;if(G.bossT<=0&&!G.bears.some(b=>b.kind==='boss'&&!b.dead)){G.bossT=150;spawnBoss()}}
  for(const b of G.bears){if(b.dead){b.deadT+=dt;continue}
    if(b.bt){bossPassive(b,dt);if(b.ph){b.hit=Math.max(0,b.hit-dt);b.roar=Math.max(0,b.roar-dt);bossPhase(b,dt);continue}}
    b.hit=Math.max(0,b.hit-dt);b.atkCd=Math.max(0,b.atkCd-dt);b.roar=Math.max(0,b.roar-dt);b.moving=false;b.swipe=Math.max(0,(b.swipe||0)-dt);b.pinT=Math.max(0,(b.pinT||0)-dt);
    if(b.flee){const dc=dist(b.x,b.y,CX,CY)||1;const n=dc<FR?nav(b,CX+(b.x-CX)/dc*(FR+200),CY+(b.y-CY)/dc*(FR+200)):{x:CX+(b.x-CX)/dc*(dc+50),y:CY+(b.y-CY)/dc*(dc+50)};moveTo(b,n.x,n.y,110,dt);b.fleeT=(b.fleeT||0)+dt;if(dc>FR+260||b.fleeT>14){b.dead=true;b.deadT=9;b.gone=true}continue}
    if(b.raid){raidStep(b,dt);continue}
    if(b.state==='chase'&&b.target){const t=b.target,d=dist(b.x,b.y,t.x,t.y);
      if(d>600||dist(t.x,t.y,CX,CY)<FR+20||(b.home&&dist(b.x,b.y,b.home.x,b.home.y)>340)){b.state='wander';b.target=null}
      else if(b.bt&&bossAct(b,dt,t)){}
      else{const sp=b.kind==='boss'?70:b.kind==='big'?66:80;const r=b.kind==='boss'?48:30;if(d>r){b.x+=(t.x-b.x)/d*sp*dt;b.y+=(t.y-b.y)/d*sp*dt;b.dirT=Math.atan2(t.x-b.x,t.y-b.y);b.step+=dt*9;b.moving=true}
        if(d<r+6&&b.atkCd<=0&&t.inv<=0){b.atkCd=1.2;const dmg=Math.round((b.kind==='boss'?35:b.kind==='big'?25:16)*armorOf(t)*DM().atk*(1+(YR()-1)*.15));t.hp-=dmg;hitLoss(t);t.hurt=.35;t.inv=.5;const k=d||1;t.x+=(t.x-b.x)/k*44;t.y+=(t.y-b.y)/k*44;G.shake=11;float(t.x,t.y,60,`-${dmg}`,'red');b.swipe=.3;burst(t.x,t.y,24,10,{c:['#ff9a9a','#ffffff'],s0:40,s1:130,l0:.3,l1:.6})}}}
    else{const ag=G.players.find(p=>!(p.down>0)&&!p.inHeat&&dist(p.x,p.y,b.x,b.y)<(b.kind==='normal'?110:160));if(ag){b.state='chase';b.target=ag;b.roar=.6}b.wT-=dt;if(b.wT<=0){b.wT=rnd(1.5,4);b.wdir=rnd(0,TAU);b.idle=Math.random()<.35}if(!b.idle){b.x+=Math.sin(b.wdir)*28*dt;b.y+=Math.cos(b.wdir)*28*dt;b.dirT=b.wdir;b.step+=dt*4.5;b.moving=true}}
    if(b.home&&b.state!=='chase'&&dist(b.x,b.y,b.home.x,b.home.y)>120){b.wdir=Math.atan2(b.home.x-b.x,b.home.y-b.y);b.idle=false}
    if(b.guardOf&&b.state!=='chase'){const R=G.rescue;if(R&&R.id===b.guardOf&&dist(b.x,b.y,R.x,R.y)>150){b.wdir=Math.atan2(R.x-b.x,R.y-b.y);b.idle=false}}
    const rect=b.zone==='K'?CAVE_BOX:b.zone==='C'?ZONES[1].rect:HUNT_A;if(b.state!=='chase'&&!b.guardOf){if(b.x<rect[0]||b.x>rect[2]||b.y<rect[1]||b.y>rect[3]){b.wdir=Math.atan2((rect[0]+rect[2])/2-b.x,(rect[1]+rect[3])/2-b.y);b.idle=false}}
    b.x=clamp(b.x,40,WORLD-40);b.y=clamp(b.y,40,WORLD-40);
    const dc=dist(b.x,b.y,CX,CY);if(dc<FR+45){b.x=CX+(b.x-CX)/dc*(FR+45);b.y=CY+(b.y-CY)/dc*(FR+45)}
    for(const z of ZONES)if(!G.zones[z.id]&&z.id!=='C'||(z.id==='C'&&!G.zones.C)){const [x0,y0,x1,y1]=z.rect;pushRect(b,x0,y0,x1,y1,10)}
    if(b.y>1580&&b.zone!=='K')b.y=1580;if(b.zone==='K')caveWalls(b,16);
    if(b.moving&&Math.random()<dt*5)puff(b.x,b.y,2,{r:10,life:.6,a:.7,vy:8,grow:1})}
  for(const b of G.bears)if(b.dead&&b.deadT>=2.4)world.remove(b.m.g);G.bears=G.bears.filter(b=>!b.dead||b.deadT<2.4)}
function hitLoss(t){if(!G.players.includes(t))return;const mel=clsOf(t).rng<130;t.warm=Math.max(0,t.warm-(mel?4:10));if(mel&&Math.random()<.65)return;const n=Math.min(t.bag.length,1+Math.floor(Math.random()*2));if(n){const lost=t.bag.splice(t.bag.length-n,n);for(const k of lost)dropItem(t.x,t.y,k,24);float(t.x,t.y,90,`荷物を${n}個落とした`,'red')}}
function bearSwipe(b,t,d){b.atkCd=1.2;const dmg=Math.round((b.kind==='boss'?35:b.kind==='big'?25:16)*armorOf(t)*DM().atk*(1+(YR()-1)*.15));t.hp-=dmg;hitLoss(t);t.hurt=.35;t.inv=.5;const k=d||1;t.x+=(t.x-b.x)/k*44;t.y+=(t.y-b.y)/k*44;G.shake=11;float(t.x,t.y,60,`-${dmg}`,'red');b.swipe=.3;burst(t.x,t.y,24,10,{c:['#ff9a9a','#ffffff'],s0:40,s1:130,l0:.3,l1:.6})}
// ---- night raid: bears come through the gates and go for the furnace
function houseHp(i){const h=G.houses[i],lv=houseLv(i);if(h._hpLv!==lv){h._hpLv=lv;h.hpMax=h.hp=4+lv*4}return h}
function raidGoal(b,dt,sp){const big=b.kind!=='normal',boss=b.kind==='boss',R=G.raid;
  if(!b.goal&&R.final&&G.monHP>0&&Math.random()<.6)b.goal={t:'m'};
  if(!b.goal){const r=Math.random(),built=G.houses.map((h,i)=>i).filter(i=>houseLv(i)>0),ws=G.workers.filter(w=>w.role!=='guard'&&!(w.hurt>0)&&!w.frozen&&dist(w.x,w.y,CX,CY)<FR+60);
    if(r<.38&&built.length)b.goal={t:'h',i:built[Math.floor(Math.random()*built.length)]};else if(r<.7&&ws.length){let bw=ws[0],bd=1e9;for(const w of ws){const d=dist(w.x,w.y,b.x,b.y);if(d<bd){bd=d;bw=w}}b.goal={t:'w',w:bw}}else b.goal={t:'f'}}
  const g=b.goal;if(g.t==='f')return false;
  if(g.t==='m'){if(!(G.monHP>0)){b.goal=null;return true}const mx=G.monV.position.x,my=G.monV.position.z,d=dist(b.x,b.y,mx,my);if(d>58){const n=nav(b,mx,my);moveTo(b,n.x,n.y,sp,dt);return true}
    b.dirT=Math.atan2(mx-b.x,my-b.y);if(b.atkCd<=0){b.atkCd=1.6;b.swipe=.3;G.monHP-=boss?6:big?3:2;G.shake=Math.max(G.shake,5);burst(mx,my,60,10,{c:['#ffd166','#ffffff','#c9d3dd'],s0:40,s1:160,u0:80,u1:240,l0:.4,l1:.7});SFX.chop();
      if(!(R.mT>G.t-5)){R.mT=G.t;toast('像が攻撃されている！','cold')}
      if(G.monHP<=0){G.monHP=0;banner('','像が壊された…','','cold');SFX.bad();G.shake=20;setTimeout(()=>{if(running)endGame(false,'シンボルの像を壊された')},1800)}}
    return true}
  if(g.t==='h'){if(houseLv(g.i)<=0){b.goal=null;return true}const h=houseHp(g.i),d=dist(b.x,b.y,h.x,h.y);if(d>52){const n=nav(b,h.x,h.y);moveTo(b,n.x,n.y,sp,dt);return true}
    b.dirT=Math.atan2(h.x-b.x,h.y-b.y);if(b.atkCd<=0){b.atkCd=1.8;b.swipe=.3;h.hp-=boss?4:big?2:1;G.shake=Math.max(G.shake,4);burst(h.x,h.y,40,10,{c:['#c9955b','#ffffff'],s0:40,s1:150,u0:80,u1:220,l0:.4,l1:.7});SFX.chop();
      if(!(R.hhT>G.t-6)){R.hhT=G.t;toast('家が襲われてる！','cold')}
      if(h.hp<=0){G.lv['house_'+g.i]=houseLv(g.i)-1;R.dmgH=(R.dmgH||0)+1;float(h.x,h.y,100,'家が壊された！','red',true);toast(`家が壊された！ 住める人数 ${houseCap()}人`,'cold',true);SFX.bad();G.shake=12;b.goal=null}}
    label(h.x,h.y,110,bar(100*Math.max(0,h.hp)/h.hpMax,'red'),'');return true}
  if(g.t==='w'){const w=g.w;if(!G.workers.includes(w)||w.hurt>0||w.frozen){b.goal=null;return true}const d=dist(b.x,b.y,w.x,w.y);if(d>30){moveTo(b,w.x,w.y,sp,dt);return true}
    if(b.atkCd<=0){b.atkCd=1.4;b.swipe=.3;G.shake=Math.max(G.shake,6);burst(w.x,w.y,24,10,{c:['#ff9a9a','#ffffff'],s0:40,s1:130,l0:.3,l1:.6});SFX.bad();
      if(big&&Math.random()<(boss?.6:.3)&&w.role!=='cashier'){world.remove(w.m.g);G.workers.splice(G.workers.indexOf(w),1);if(w.hole&&w.hole.user===w)w.hole.user=null;R.dmgT=(R.dmgT||0)+1;float(w.x,w.y,90,`${SPECN[w.role]||'仲間'}がさらわれた！`,'red',true);toast(`${SPECN[w.role]||'仲間'}がオオカミにさらわれた！`,'cold',true);b.raid=false;b.flee=true;b.state='wander'}
      else{w.hurt=45;R.dmgW=(R.dmgW||0)+1;if(w.hole&&w.hole.user===w)w.hole.user=null;float(w.x,w.y,80,'けが！ しばらく働けない','red',true)}
      b.goal=null}
    return true}
  return false}
function raidStep(b,dt){const px=b.x,py=b.y,big=b.kind!=='normal',boss=b.kind==='boss';
  if(G.lv.trap>0)for(const a of GATE_ANG){if(dist(b.x,b.y,CX+Math.cos(a)*FR,CY+Math.sin(a)*FR)<52){b.trapT=.5;b.hp-=G.lv.trap*1.6*dt;if(Math.random()<dt*4){b.hit=.1;burst(b.x,b.y,10,3,{c:['#ffffff','#ff9a9a'],s0:20,s1:60,l0:.2,l1:.4})}if(b.hp<=0){killBear(b,false);return}}}
  b.trapT=Math.max(0,(b.trapT||0)-dt);const sp=(big?62:76)*(b.trapT>0?.4:1);
  let t=null;if(b.state==='chase'&&b.target&&!(b.target.down>0)&&dist(b.x,b.y,b.target.x,b.target.y)<230)t=b.target;
  if(!t){let td=big?95:80;for(const p of G.players){if(p.down>0)continue;const d=dist(p.x,p.y,b.x,b.y);if(d<td){td=d;t=p}}}
  if(!t)b.state='raid';
  if(t&&b.bt&&bossAct(b,dt,t)){}else if(t){const d=dist(b.x,b.y,t.x,t.y),r=30;if(d>r)moveTo(b,t.x,t.y,sp,dt);if(d<r+6&&b.atkCd<=0&&t.inv<=0)bearSwipe(b,t,d)}
  else if(raidGoal(b,dt,sp)){}
  else{const dc=dist(b.x,b.y,CX,CY);if(dc>104){const n=nav(b,CX,CY);moveTo(b,n.x,n.y,sp,dt)}
    else{b.dirT=Math.atan2(CX-b.x,CY-b.y);if(b.atkCd<=0){b.atkCd=1.8;b.swipe=.3;const dmg=boss?12:big?6:4;G.fuel=Math.max(0,G.fuel-dmg);G.shake=Math.max(G.shake,5);if(Math.random()<.35)float(CX+rnd(-30,30),CY+rnd(-30,30),110,DES()?'井戸の水を荒らされた！':'燃料を荒らされた！','red');burst(CX,CY,50,10,{c:['#ffd166','#ff8a3d','#ffffff'],s0:40,s1:160,u0:100,u1:260,l0:.3,l1:.6,add:true});SFX.bad();if(!(G.raid.hitT>G.t-6)){G.raid.hitT=G.t;toast('かまどが襲われてる！ 撃退しろ','cold')}}}}
  fenceCollide(b,px,py);pushCircle(b,CX,CY,72);b.x=clamp(b.x,40,WORLD-40);b.y=clamp(b.y,40,WORLD-40);
  for(const z of ZONES)if(!G.zones[z.id]){const [x0,y0,x1,y1]=z.rect;pushRect(b,x0,y0,x1,y1,10)}
  if(b.moving&&Math.random()<dt*6)puff(b.x,b.y,2,{r:10,life:.6,a:.7,vy:8,grow:1})}
function spawnRaider(boss){const a=rnd(-2.5,-.65),r=rnd(600,660);const x=CX+Math.cos(a)*r,y=CY+Math.sin(a)*r;const big=!boss&&Math.random()<Math.min(.55,.06+G.day*.035+G.level*.03);const kind=boss?'boss':big?'big':'normal';const hp=Math.round((boss?55:big?10:5)*(1+G.day*.18+(G.level-1)*.12)*DM().hp*(1+(YR()-1)*.3));if(boss){banner('','襲撃ボス出現！','巨大オオカミが門に向かっている','cold');SFX.wave();G.shake=12}
  const b={id:++G.nid,x,y,zone:'A',kind,hp,max:hp,state:'raid',raid:true,rot:Math.atan2(CX-x,CY-y),step:0,hit:0,atkCd:0,dead:false,deadT:0,target:null,roar:.8,wdir:0,wT:0,trapT:0};
  b.m=makeBear(kind);b.m.ring.material.color.copy(lin('#ff8a1a'));b.m.g.position.set(x,0,y);world.add(b.m.g);G.bears.push(b);if(boss){setBt(b,pickBt());setTimeout(()=>{if(running)toast(`${BTN[b.bt]}：${BTH[b.bt]}`,'cold')},1200)}burst(x,y,10,14,{c:['#ffffff','#e3f0f7'],s0:40,s1:140,u0:60,u1:180,l0:.5,l1:.9,r0:5,r1:9})}
// ---- hidden things on the map
const SEC_N={dig:'埋もれた宝',stele:'いにしえの石碑',trav:'凍った旅人',nushi:'森のヌシ'};
const _sandMat=new Map();
function applyBiome(){const dz=DES();window.SNOWU.value=dz?0:1;G._dm=calcDM();
  if(dz){G.carV=makeCaravan();G.car={state:'away',t:14,order:{},got:{}};G.mission=MISSIONS.length;desertDecor()}
  if(KK)for(const k in KK.kit){KK.kit[k].traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m.userData.c0)m.userData.c0=m.color.clone();m.color.copy(m.userData.c0);if(dz)m.color.multiply(new T.Color(1,.86,.66))}})}
  if(!dz)return;world.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!m||Array.isArray(m)||!m.isMeshStandardMaterial||m.map||m.vertexColors||m.transparent)return;const c=m.color;if(c.r>.7&&c.g>.75&&c.b>.8&&c.b>=c.r-.02){let t=_sandMat.get(m);if(!t){t=m.clone();t.color.copy(lin('#e9c690'));_sandMat.set(m,t)}o.material=t}})}
function makeRoad(){G.road=null;if(G.biome!==0)return;const g=new T.Group();g.position.set(ROAD.x,0,ROAD.y);
  const sand=std('#e2b877',{r:1}),wood=std('#8a5a32',{map:TEX.wood}),red=std('#c9553d',{r:.7});
  for(let i=0;i<9;i++){const t=M_(geo('roadT',()=>new T.CircleGeometry(34,12)),sand,false,true);t.rotation.x=-Math.PI/2;t.position.set(-i*26,.6+i*.01,i*34);t.scale.set(1,1.3,1);g.add(t)}
  g.add(at(box(8,78,8,wood),-36,39,0),at(box(8,78,8,wood),36,39,0),at(box(92,12,12,red),0,80,0));
  const sign=at(new T.Group(),-58,0,40);sign.add(at(box(4,40,4,wood),0,20,0),at(box(40,16,3,std('#f4e2bf')),0,40,0),at(rot(box(12,12,3,red),0,0,Math.PI/4),16,40,2));g.add(sign);
  const pile=grp(at(scl(sph(40,std('#f5f9fd',{r:1}),false,12,8),1.4,.7,.8),0,8,0),at(scl(sph(26,std('#eef4fa',{r:1}),false,10,6),1,.8,1),30,6,10));g.add(pile);
  const ring=at(rot(M_(new T.RingGeometry(50,58,40),basic('#ffd166',{transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0),0,1.4,0);g.add(ring);
  world.add(g);G.road={g,pile,ring,t:0}}
function roadOpen(){return G.biome===0&&G.year>=2&&!G.story}
function roadFx(){if(!G.road)return;const R=G.road,op=roadOpen();R.pile.visible=!op;R.ring.visible=op;if(op)R.ring.scale.setScalar(1+Math.sin(G.t*3)*.05);
  const me=G.players[G.me]||G.players[0];if(me&&dist(me.x,me.y,ROAD.x,ROAD.y)<320)label(ROAD.x,ROAD.y,110,op?`<b>砂漠の町へ続く道</b><br>${G.players.length>1?'全員で':''}ここに立つと出発（雪原より過酷）${R.t>0?'<br>'+bar(100*R.t/3,'gold wide'):''}`:'<b>砂漠へ続く道</b><br>雪でふさがっている（2年目から通れる）','')}
function updateRoad(dt){if(!G.road||!roadOpen()||NET.mode==='guest')return;const R=G.road;const all=G.players.every(p=>!(p.down>0)&&dist(p.x,p.y,ROAD.x,ROAD.y)<70);
  if(all){R.t+=dt;if(R.t>=3)startTrip()}else R.t=Math.max(0,R.t-dt*2)}
function startTrip(){const gain=settleShards(true),carry=0,chars=G.charOf.slice(),np=G.players.length,diff=G.diff;const seed=1+((Math.random()*1e9)|0);
  if(NET.mode==='host'){NET.guestPeer=null;NET.endInfo=null;newGame(1,{seed,diff,biome:1,chars});NET.room.presence({role:'host',seed,ch:meta.pick||'Rogue_Hooded',df:diff,bi:1,trip:1}).catch(()=>{})}
  else newGame(1,{seed,diff,biome:1,chars});
  G.cash+=carry;updateCam(0,true);hudInit();banner('砂漠の町に着いた',`一文無しからの再出発 ・ ★+${gain}`,'昼は灼熱で水分が減る。湧き水をくんで井戸へ。稼ぎはキャラバンとの取引だけ','r-SSR');SFX.ssr()}
function makeSecrets(TR,sr){G.secrets=[];G.stele=0;G.secretS=0;const R=(r)=>({x:sr(r[0],r[2]),y:sr(r[1],r[3])});
  const A=[300,140,2100,640],Cz=[90,680,640,1720],Bz=[1760,660,2320,1740];
  const add=(t,r)=>{let q,g=0;do{q=R(r);g++}while(g<40&&(TR.some(tr=>dist(tr.x,tr.y,q.x,q.y)<40)||HOLES.some(h=>dist(h[0],h[1],q.x,q.y)<90)));G.secrets.push({id:G.secrets.length,t,x:q.x,y:q.y,found:false,p:0})};
  for(let i=0;i<4;i++)add('dig',A);add('dig',Cz);add('dig',Cz);add('dig',Bz);
  add('stele',[300,120,700,360]);add('stele',[120,1400,500,1720]);add('stele',[2000,1500,2320,1740]);
  add('trav',[1800,110,2100,300]);G.secrets.push({id:G.secrets.length,t:'nushi',x:sr(130,420),y:sr(760,1000),found:false,p:0,spawned:false});
  const snowM=std('#eef4fa',{r:.95}),stoneM=std('#7d8791',{r:.9,flat:true}),runeM=new T.MeshBasicMaterial({color:lin('#7fe8ff')});
  for(const q of G.secrets){const g=new T.Group();g.position.set(q.x,0,q.y);
    if(q.t==='dig'){const m=scl(sph(18,snowM,false,10,6),1.25,.38,1);g.add(m);const st=scl(sph(3,std('#8a6a4a'),false,6,4),1,1,1);st.position.set(6,5,-3);g.add(st)}
    if(q.t==='stele'){g.add(at(box(18,64,12,stoneM),0,32,0));g.add(at(box(22,6,16,stoneM),0,2,0));const r=M_(geo('rune',()=>new T.BoxGeometry(10,26,1)),runeM.clone(),false);r.position.set(0,40,6.2);g.add(r);q.rune=r;g.rotation.y=sr(0,TAU)}
    if(q.t==='trav'){const v=makeVillager(PALS[3],{noShadow:true,hat:'top'});g.add(v.g);q.v=v;const ice=M_(geo('ice',()=>new T.IcosahedronGeometry(22,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.62,roughness:.08,metalness:.1,flatShading:true}),false);ice.scale.set(1.1,1.4,1.1);ice.position.y=24;g.add(ice)}
    if(q.t==='nushi'){g.add(at(rot(tor(30,2,std('#6b4630'),false,6,20),Math.PI/2,0,0),0,1,0))}
    world.add(g);q.g=g}}
function secretFound(q,p){q.found=true;const n=G.secrets.filter(o=>o.found).length;
  if(q.t==='dig'){q.g.visible=false;const r=Math.random();SFX.chest();burst(q.x,q.y,10,22,{c:['#ffffff','#ffd166'],s0:60,s1:200,u0:120,u1:300,l0:.5,l1:.9});
    if(r<.45){const v=120+G.day*40;G.cash+=v;G.earned+=v;float(q.x,q.y,80,`宝を掘りあてた！ +$${v}`,'gold',true)}
    else if(r<.8){G.secretS+=3;float(q.x,q.y,80,'星のかけら ★+3','gold',true)}
    else{dropItem(q.x,q.y,'fur',20,4);dropItem(q.x,q.y,'coal',20,2);float(q.x,q.y,80,'毛皮と石炭が出てきた！','gold',true)}}
  if(q.t==='stele'){G.stele++;SFX.rare();float(q.x,q.y,100,`いにしえの石碑 ${G.stele}/3`,'gold',true);
    if(G.stele>=3){G.secretS+=10;banner('オーロラの加護','3つの石碑がそろった！','かまどの暖かい範囲が広くなった（★+10）','r-SSR');SFX.ssr()}else toast(`石碑をあと${3-G.stele}つ探そう。全部そろうと何かが起きる…`,'gold')}
  if(q.t==='trav'){q.g.visible=false;const role=Math.random()<.5?'hunter':'lumber';const w=addWorker(role,q.x,q.y);w.warm=100;G.secretS+=4;banner('凍った旅人を助けた',`伝説の${SPECN[role]}が仲間に！`,'★+4','r-SSR');SFX.ssr()}
  toast(`ひみつ発見！（${n}/${G.secrets.length}）`,'gold')}
function updateSecrets(dt){if(!G.secrets)return;
  for(const q of G.secrets){if(q.found)continue;const near=G.players.filter(p=>!(p.down>0)&&dist(p.x,p.y,q.x,q.y)<(q.t==='nushi'?420:q.t==='stele'?46:34));
    if(q.t==='nushi'){if(!q.spawned&&near.length&&G.zones.C){q.spawned=true;const b=spawnBear('C',true);world.remove(b.m.g);b.x=q.x;b.y=q.y;b.kind='boss';b.nushi=true;b.hp=b.max=Math.round(150*DM().hp*(1+(YR()-1)*.3));b.m=makeBear('boss');b.m.g.scale.multiplyScalar(1.35);b.m.g.position.set(b.x,0,b.y);world.add(b.m.g);banner('森のヌシが現れた！','巨大なオオカミ','たおすと★+12','cold');SFX.wave();G.shake=14}continue}
    if(!near.length){q.p=Math.max(0,q.p-dt);continue}
    const need=q.t==='dig'?1.6:q.t==='trav'?4:.4;q.p+=dt;if(q.p>=need)secretFound(q,near[0])}}
function secretFx(dt){if(!G.secrets)return;const me=G.players[G.me]||G.players[0];let found=0;
  for(const q of G.secrets){if(q.found){found++;if(q.rune)q.rune.material.color.copy(lin('#ffd166'));continue}
    const d=me?dist(me.x,me.y,q.x,q.y):1e9;
    if(q.t==='dig'&&d<260&&Math.random()<dt*5)psA.emit({x:q.x+rnd(-12,12),y:rnd(6,20),z:q.y+rnd(-12,12),vx:0,vy:rnd(20,50),vz:0,g:0,life:.7,max:.7,r:rnd(3,6),c:C('#fff3b0'),fade:.3});
    if(q.rune)q.rune.material.color.copy(lin(d<300?(Math.sin(G.t*4)>0?'#aef4ff':'#5fd6f5'):'#3f7f95'));
    if(q.p>0&&q.t!=='nushi'&&q.t!=='stele')label(q.x,q.y,q.t==='trav'?80:50,bar(100*q.p/(q.t==='dig'?1.6:4),'gold'),'')}
  G.secFound=found}
// ---- desert caravan: timed orders replace the shops
const CVAL={meat:16,log:9,water:12,salt:35,fur:70};
function carOrder(){const d=G.day;const pool=['meat','log','water','salt'];if(G.zones.C)pool.push('fur');const n=Math.min(pool.length,2+(d>=3?1:0)+(Math.random()<.3?1:0));const ks=pool.sort(()=>Math.random()-.5).slice(0,n);
  const amt={meat:3+d,log:5+Math.round(d*1.5),water:3+Math.round(d*.6),salt:2+Math.round(d*.45),fur:1+Math.round(d*.3)};const o={};for(const k of ks)o[k]=amt[k];return o}
function carCheck(){const C=G.car;if(!C||C.state!=='here')return;if(Object.keys(C.order).every(k=>(C.got[k]||0)>=C.order[k])){let v=0;for(const k in C.order)v+=C.order[k]*CVAL[k];v=Math.round(v*(1.3+(G.rank||0)*.1)*(1+(YR()-1)*.2)+G.day*20);G.cash+=v;G.earned+=v;G.stats.car=(G.stats.car||0)+1;
  banner('取引成立！',`+$${v.toLocaleString()}`,'キャラバンは次の町へ。また来るよ','r-SSR');SFX.ssr();burst(CAR_STOP.x,CAR_STOP.y,40,40,{c:['#ffd23f','#ffffff','#8ff08f'],s0:80,s1:260,u0:200,u1:400,l0:.8,l1:1.3,add:true});C.state='away';C.t=rnd(18,26);C.order={};C.got={}}}
function updateCaravan(dt){if(!DES())return;const C=G.car||(G.car={state:'away',t:12,order:{},got:{}});C.t-=dt;
  if(C.state==='away'){if(C.t<=0){C.order=carOrder();C.got={};C.state='here';C.t=Math.round(80+G.day*3);C.max=C.t;banner('キャラバンが来た！',Object.entries(C.order).map(([k,n])=>`${DNAME[k]}${n}`).join('・'),`${C.t}秒以内に町の南の広場へ届けよう`,'area');SFX.area()}return}
  for(const p of G.players){if(p.down>0||dist(p.x,p.y,CAR_STOP.x,CAR_STOP.y)>110)continue;p.carT=(p.carT||0)+dt;if(p.carT<.07)continue;p.carT=0;
    for(const k in C.order){if((C.got[k]||0)<C.order[k]&&take(p,k)){C.got[k]=(C.got[k]||0)+1;flyItem(k,p.x,p.y,24+p.stack.h,CAR_STOP.x,CAR_STOP.y,30,null,3.4);SFX.coin(3);carCheck();break}}}
  if(C.state==='here'&&C.t<=0){toast('キャラバンは待ちきれずに去った…（報酬なし）','cold',true);SFX.bad();C.state='away';C.t=rnd(22,30);C.order={};C.got={}}}
function makeCaravan(){const g=new T.Group();g.position.set(CAR_STOP.x,0,CAR_STOP.y);const tan=std('#c79a62',{r:.9}),dk=std('#8a6238',{r:.9}),cloth=std('#c9553d',{r:.8}),cloth2=std('#2f6fb0',{r:.8});
  const camel=(x,z,ry,c)=>{const k=new T.Group();k.position.set(x,0,z);k.rotation.y=ry;k.add(at(scl(sph(14,tan,true,14,10),1.5,.8,.9),0,30,0),at(sph(9,tan,true,10,8),-4,40,0),at(sph(8,tan,true,10,8),10,38,0),at(rot(cyl(3.5,4.5,24,tan,8),0,0,-.7),-26,40,0),at(scl(sph(6,tan,true,10,8),1.5,.9,.9),-36,50,0),at(box(20,4,18,c),3,45,0));
    for(const [lx,lz] of [[-12,-6],[-12,6],[12,-6],[12,6]])k.add(at(cyl(2.5,2,24,dk,6),lx,12,lz));return k};
  g.add(camel(-40,-10,.3,cloth),camel(40,10,-.2,cloth2));g.add(at(cyl(2,2,70,dk,6),0,35,-40),at(rot(M_(new T.ConeGeometry(55,34,4,1,true),std('#f2d9a8',{r:.9}),true),0,Math.PI/4,0),0,70,-40));
  const ring=at(rot(M_(new T.RingGeometry(96,106,48),basic('#ffd166',{transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0),0,1.2,0);g.add(ring);g.visible=false;world.add(g);return g}
function caravanFx(){if(!DES()||!G.carV)return;const C=G.car;const here=C&&C.state==='here';G.carV.visible=!!here;if(!here)return;
  const rows=Object.keys(C.order).map(k=>`${DNAME[k]} <b>${Math.min(C.got[k]||0,C.order[k])}/${C.order[k]}</b>`).join('<br>');
  label(CAR_STOP.x,CAR_STOP.y,120,`<b>キャラバンの注文</b><br>${rows}<br>${bar(100*Math.max(0,C.t)/(C.max||80),'gold wide')}`,'')}
function raidReport(){const R=G.raid;let left=0;while(popNow()>houseCap()){const idle=G.surv.filter(v=>v.arrived&&!v.frozen);if(idle.length){const v=idle[idle.length-1];world.remove(v.m.g);G.surv.splice(G.surv.indexOf(v),1)}else{const w=G.workers.find(q=>q.role!=='cashier')||G.workers[0];if(!w)break;world.remove(w.m.g);G.workers.splice(G.workers.indexOf(w),1);if(w.st&&w.st.cashier===w)w.st.cashier=null}left++}
  const parts=[];if(R.dmgH)parts.push(`家${R.dmgH}軒が壊れた`);if(R.dmgW)parts.push(`${R.dmgW}人がけが`);if(R.dmgT)parts.push(`${R.dmgT}人がさらわれた`);if(left)parts.push(`住む家がなく${left}人が町を去った`);
  if(parts.length)setTimeout(()=>{if(running)toast('昨夜の被害：'+parts.join('・'),'cold',true)},2200)}
function updateRaid(dt){const ph=(G.t%G.DAY)/G.DAY,night=ph>.72,R=G.raid;
  if(G.day>=2&&!night&&ph>.6&&R.warn!==G.day){R.warn=G.day;setTimeout(()=>{if(running)toast(`明日の朝、町の食費 $${upkeepCost()}`,'cash')},2500);const tw=TOWERS.some(t=>G.lv['tw_'+t.id]>0);toast(tw?'今夜も襲撃！ 見張り台を強化しよう':'今夜オオカミが襲ってくる！ 見張り台を','cold')}
  if(night&&G.day>=2&&R.night!==G.day){R.night=G.day;R.on=true;const fin=!!G.finalPending;if(idleSurvivors().length)setTimeout(()=>{if(running)toast('町の人たちも武器を取った！ 総出で迎え撃て','gold')},1800);G.finalPending=false;R.final=fin;
    R.total=fin?Math.round((34+G.day*2)*G.mod.raid*DM().raid*(1+(YR()-1)*.3)):Math.min(40,Math.round((2+Math.floor(G.day*1.8*(waveDayN(G.day)?.8:1))+(G.level-1)*2+popNow()*.25)*G.mod.raid*DM().raid*(1+(YR()-1)*.3)));
    R.bosses=fin?3:G.day>=5?1+Math.floor((G.day-5)/4):0;R.total+=R.bosses;R.spawn=R.total;R.spawnT=1;R.kills=0;R.left=R.total;R.dmgH=R.dmgW=R.dmgT=0;if(fin&&G.monument){G.monHP=G.monMax=Math.round(60+G.day*4);toast('像を壊されたら負け！ 像を守りきれ','cold',true)}else if(fin){G.monHP=G.monMax=0;toast('夜明けまで井戸を守りぬけ！','cold',true)}
    if(fin)banner('最終決戦！',`オオカミ ${R.total}頭・ボス${R.bosses}頭`,'朝まで町と像を守りきれ！','cold');else banner(DES()?'夜の襲撃！ 大サソリの群れ':'夜の襲撃！',`${DES()?'サソリ':'オオカミ'} ${R.total}頭${R.bosses?`・ボス${R.bosses}`:''}`,DES()?'門から入って井戸や家を狙う。見張り台・罠・武器で守れ':'門から入ってかまどを狙う。見張り台・罠・銃で守れ','cold');SFX.wave();G.shake=10}
  if(!R.on)return;
  R.spawnT-=dt;if(R.spawn>0&&R.spawnT<=0){R.spawnT=rnd(.5,1.2)*(R.final?.6:1);if(R.bosses>0&&(R.spawn<=R.bosses||Math.random()<R.bosses/R.spawn*.6)){R.bosses--;spawnRaider(true)}else spawnRaider();R.spawn--}
  R.left=R.spawn+G.bears.filter(b=>b.raid&&!b.dead).length;
  if(R.left===0&&R.final){R.on=false;G.raidWins++;banner('最終決戦 勝利！','町を守りきった！','','r-SSR');SFX.ssr();G.shake=16;setTimeout(()=>{if(running&&!G.endless){checkAch();endGame(true)}},2600);return}
  if(!night&&R.final&&!G.bears.some(b=>b.king&&!b.dead)){R.on=false;for(const b of G.bears)if(b.raid&&!b.dead){b.raid=false;b.flee=true;b.state='wander'}banner('夜が明けた！','町を守りきった！','','r-SSR');SFX.ssr();setTimeout(()=>{if(running&&!G.endless){checkAch();endGame(true)}},2600);return}
  if(R.left===0){R.on=false;storyRaidEnd();G.raidWins++;const bonus=Math.round(R.total*(14+G.day*4));G.cash+=bonus;G.earned+=bonus;spawnChest(CX+rnd(-60,60),CY+120);gainXP(20+R.total*3,CX,CY);addCombo(10);banner('襲撃を撃退！',`+$${bonus}`,'かまどを守りきった！','r-SSR');SFX.ssr();G.shake=10}
  else if(!night&&!R.final){R.on=false;storyRaidEnd();for(const b of G.bears)if(b.raid&&!b.dead){b.raid=false;b.flee=true;b.state='wander'}raidReport();const bonus=Math.round(R.kills*(8+G.day*2));G.cash+=bonus;G.earned+=bonus;banner('夜が明けた',`撃退 ${R.kills}/${R.total}`,bonus?`ごほうび +$${bonus}（全滅させると大ボーナス）`:'見張り台を建てると自動で撃ってくれる','cold')}}
// towers: host applies damage (sim); the guest only plays the shots
function tickTowers(dt,sim){for(const tw of TOWERS){const lv=G.lv['tw_'+tw.id];if(!lv)continue;tw.cd=(tw.cd||0)-dt;const v=G.towerV&&G.towerV[tw.id];
  let tg=null,best_=1e9;const rng=250+lv*25;for(const b of G.bears){if(b.dead||b.rq)continue;if(!b.raid&&b.state!=='chase')continue;const d=dist(tw.mx,tw.my,b.x,b.y);if(d<rng&&d-(b.raid?1000:0)<best_){best_=d-(b.raid?1000:0);tg=b}}
  if(tg&&v)v.gun.rotation.y=Math.atan2(tg.x-tw.mx,tg.y-tw.my);if(!tg||tw.cd>0)continue;const gb=1+.5*guardsAt(tw.id);tw.cd=[0,1.0,.72,.5][lv]/Math.sqrt(gb);
  const sx=tw.mx+Math.sin(v?v.gun.rotation.y:0)*18,sy=tw.my+Math.cos(v?v.gun.rotation.y:0)*18;
  for(let i=0;i<8;i++){const k=i/8;psA.emit({x:lerp(sx,tg.x,k),y:lerp(84,22,k),z:lerp(sy,tg.y,k),vx:0,vy:0,vz:0,g:0,life:.07+k*.05,max:.12,r:6,c:C('#ffe28a'),air:true,fade:.1})}
  puff(sx,sy,86,{r:7,life:.4,a:.6,vy:20,grow:1.6});tone(180,.05,'square',.035,-60);
  if(sim){tg.hp-=[0,1.6,2.6,3.8][lv]*G.pm.tower*Math.sqrt(gb);tg.hit=.14;burst(tg.x,tg.y,24,4,{c:['#ffffff','#ffd6d6'],s0:20,s1:70,u0:40,u1:120,l0:.2,l1:.4,r0:3,r1:5});if(tg.hp<=0)killBear(tg,false)}}}
// ---- co-op: a giant carcass that only two players can carry
function spawnHaul(x,y,big){const h={id:++G.nid,x,y,big,life:100,carried:false,hintT:0};h.m=makeHaul(big);world.add(h.m);G.hauls.push(h);
  if(!G.stats.haul&&!G.haulTold){G.haulTold=true;banner('2人専用','巨大肉が出た！','2人でそばに立つと持ち上がる。肉屋のグリルへ運ぶと大ボーナス','area')}else float(x,y,100,'巨大肉！ 2人で運べ','gold',true)}
function updateHauls(dt){const c=STN.steak.conv;
  for(const h of G.hauls){h.life-=dt;const near=G.players.filter(p=>!(p.down>0)&&dist(p.x,p.y,h.x,h.y)<(h.carried?100:62));
    if(G.players.length>1&&near.length>=2){if(!h.carried){h.carried=true;toast('持ち上げた！ 2人で肉屋のグリルへ','gold');SFX.pop()}const mx=(near[0].x+near[1].x)/2,my=(near[0].y+near[1].y)/2;h.x=lerp(h.x,mx,Math.min(1,dt*5));h.y=lerp(h.y,my,Math.min(1,dt*5));h.life=Math.max(h.life,40);if(Math.random()<dt*1.2)float(h.x,h.y,70,Math.random()<.5?'えっさ！':'ほいさ！','gold')}
    else{if(h.carried){h.carried=false;toast('落としちゃった！ 2人でそばに立とう','cold')}if(near.length===1){h.hintT-=dt;if(h.hintT<=0){h.hintT=3;float(h.x,h.y,90,'もう1人いないと重すぎる！','gold')}}}
    if(dist(h.x,h.y,c.x,c.y)<110){h.done=true;const st=G.stations.steak;for(let i=0;i<(h.big>1?40:20);i++)st.q.push('meat');const bonus=Math.round((200+G.day*40)*h.big);G.cash+=bonus;G.earned+=bonus;G.stats.haul++;G.secretS=(G.secretS||0)+2*h.big;gainXP(30*h.big,h.x,h.y);addCombo(15);
      banner('協力ボーナス！',`+$${bonus}`,`巨大肉をグリルへ！ 肉${h.big>1?40:20}個分`,'r-SSR');SFX.ssr();G.shake=12;burst(h.x,h.y,30,40,{c:['#ffd23f','#ffffff','#ff8ad8','#8ff08f'],s0:80,s1:260,u0:200,u1:400,l0:.8,l1:1.3,add:true,r0:6,r1:10})}
    else if(h.life<=0){h.done=true;float(h.x,h.y,80,'凍りついて消えた…','ice',true)}}
  for(const h of G.hauls)if(h.done)world.remove(h.m);G.hauls=G.hauls.filter(h=>!h.done)}
function updateHoles(dt){for(const h of G.holes){h.jump=Math.max(0,h.jump-dt);const u=h.user;if(!u){h.t=0;continue}if(u.role&&(dist(u.x,u.y,h.x,h.y)>10||u.goWarm||u.frozen||u.hurt>0))continue;
  h.t+=dt*(u.role?1:1.25*lifeB(u,'fish',.08));if(Math.random()<dt*3)psN.emit({x:h.x+rnd(-8,8),y:2,z:h.y+rnd(-8,8),vx:0,vz:0,vy:rnd(20,40),g:80,life:.4,max:.4,r:3,c:C('#bfe9ff'),fade:.2});
  if(h.t>=2.2){h.t=0;h.jump=.6;SFX.splash();burst(h.x,h.y,4,10,{c:['#bfe9ff','#ffffff'],s0:30,s1:90,u0:120,u1:220,l0:.4,l1:.7,r0:4,r1:6});
    const it=DES()?'water':'fish';if(u.role){u.bag.push(it)}else if(h.rq&&isRPG()){give(u,it,3);const v=Math.round(40+G.day*4);G.cash+=v;G.earned+=v;lifeXp(u,'fish',3);cnt(u,'fish',3);cnt(u,'bigfish');float(h.x,h.y,80,`大物！ +$${v}`,'gold',true);SFX.rare()}else{give(u,it,G.feverT>0?2:1);G.stats.fish++;lifeXp(u,'fish',1);cnt(u,'fish');addCombo(5);gainXP(3);float(h.x,h.y,60,DES()?'水をくんだ！':'つれた！','ice')}}}}
function updateStations(dt){
  for(const id in G.stations){const st=G.stations[id],d=st.def;if(!st.open)continue;if(st.unlockT!=null&&st.unlockT<1)st.unlockT+=dt;
    if(!st.frozen&&st.q.length){st.cookT+=dt;const ct=d.time*Math.pow(.74,G.lv['cook_'+id])*G.pm.cook*(G.feverT>0?.5:1);if(st.cookT>=ct){st.cookT=0;st.q.pop();flyItem(d.out,d.conv.x,d.conv.y,34,d.counter.x-50,d.counter.y,28+st.shelfStack.h,()=>{st.shelf++},2.6);
      burst(d.conv.x,d.conv.y,34,5,{c:['#ffd166','#ff8a3d'],s0:20,s1:60,u0:60,u1:140,l0:.3,l1:.5,add:true,r0:4,r1:6})}}
    if(Math.random()<dt*(st.q.length&&!st.frozen?6:1.2))puff(d.conv.x+rnd(-16,16),d.conv.y+rnd(-8,8),48,{c:'#9aa3ad',r:12,life:1.6,a:.4,vy:30,grow:2});
    // customers
    st.custT-=dt;if(st.custT<=0&&st.queue.length<(id==='steak'?6:10)&&custOK(id)){st.custT=Math.max(2.7,(3.8-G.t/800)*(1.5-G.rep*.12))/(1+(G.rank||0)*.1)/(wxIs('clear')?1.5:1)*(id==='coat'?1.6:id==='fish'?1.2:1)/custFame();spawnCustomer(st)}
    const staffed=!!st.cashier||G.players.some(p=>dist(p.x,p.y,d.stand.x,d.stand.y)<40);st.staffed=staffed;
    st.queue.forEach((c,i)=>{c.fade=Math.min(1,c.fade+dt*2);const dd=moveTo(c,d.lane,d.counter.y+44+i*25,72,dt);c.arrived=dd<=3;if(c.arrived)c.dirT=Math.PI;
      if(c.y<1760){c.wait+=dt;if(c.wait>c.patience){c.state='leave';c.angry=1.6;G.rep=Math.max(1,G.rep-.5);SFX.bad();float(c.x,c.y,64,'プンプン！','red',true);toast('お客さんが帰っちゃった…','cold')}}});
    st.queue=st.queue.filter(c=>c.state==='queue');
    const f=st.queue[0];
    if(f&&f.arrived&&staffed&&st.shelf>0&&!st.frozen){st.serveT+=dt;if(st.serveT>=(st.cashier?.5:.42)){st.serveT=0;st.shelf--;const pr=Math.round(price(id)*mult());G.earned+=pr;st.pile+=pr;G.stats.sold++;if(id==='fish')G.stats.soldFish++;if(id==='coat')G.stats.soldCoat++;
      const fast=f.wait<f.patience*.5;G.rep=Math.min(5,+(G.rep+(fast?.2:.08)).toFixed(2));f.state='leave';f.happy=1.4;f.hold.visible=true;addCombo(6);SFX.cash(G.combo);gainXP(id==='coat'?8:3);if(G.stats.sold%15===0)spawnChest(d.stand.x+50,d.stand.y-40);
      flyItem('cash',f.x,f.y,30,d.pile.x,d.pile.y,st.pileStack.h,null,2.4);float(f.x,f.y,62,`+$${pr}`,'cash'+(mult()>1?' big':''));if(fast&&Math.random()<.35)float(f.x,f.y,84,'はやい！','gold')}}else st.serveT=0}
  for(const c of G.customers){if(c.state!=='leave')continue;if(c.happy>0)c.happy-=dt;if(c.angry>0)c.angry-=dt;const lx=c.st.def.lane+36;moveTo(c,lx,Math.abs(c.x-lx)>4?c.y:1830,82,dt);if(c.y>1820){c.gone=true}}
  for(const c of G.customers)if(c.gone)world.remove(c.m.g);G.customers=G.customers.filter(c=>!c.gone)}
function updateSurvivors(dt,R){
  G.survT-=dt;if(G.survT<=0){G.survT=Math.max(22,34-G.day*.6)*G.mod.surv;if(popNow()+G.surv.filter(s=>!s.arrived).length<houseCap())spawnSurvivor(false)}
  let frozen=0;
  for(const s of G.surv){const inR=dist(s.x,s.y,CX,CY)<R||spaWarm(s.x,s.y);
    if(!s.frozen&&!s.arrived){const n=nav(s,s.tx,s.ty);const dd=moveTo(s,n.x,n.y,85,dt);if(dist(s.x,s.y,s.tx,s.ty)<5){s.arrived=true;s.happy=1.4;float(s.x,s.y,60,'到着！','');gainXP(5);addCombo(4);SFX.pop()}}else s.moving=false;
    const byP=G.players.some(p=>!(p.down>0)&&dist(s.x,s.y,p.x,p.y)<70);
    if(s.frozen){s.freezeAnim=Math.min(1,s.freezeAnim+dt*3);if(inR)s.warm+=9*dt;if(byP)s.warm+=16*G.pm.thaw*dt;
      if((inR||byP)&&Math.random()<dt*10)psN.emit({x:s.x+rnd(-14,14),y:rnd(10,44),z:s.y+rnd(-14,14),vx:0,vy:-30,vz:0,g:60,life:.5,max:.5,r:4,c:C('#bfe6f7'),fade:.2});
      if(s.warm>35){s.frozen=false;s.freezeAnim=0;s.happy=1.2;G.stats.thawed++;addCombo(12);SFX.rare();if(Math.random()<.35+G.luck)spawnChest(s.x+20,s.y+20);burst(s.x,s.y,24,26,{c:['#e8f7ff','#bfe6f7','#8fd0ec'],s0:60,s1:200,u0:100,u1:260,l0:.5,l1:.9,r0:5,r1:9});float(s.x,s.y,70,'解凍！','gold');gainXP(12,s.x,s.y)}}
    else{const cool=(.8+G.day*.11)*coolMul()*G.mod.cold*(s.arrived?1:.35);s.warm+=(inR?14:-cool)*dt;
      if(s.warm<=0){s.warm=0;s.frozen=true;s.freezeAnim=0;G.shake=Math.max(G.shake,4);toast(DES()?'町人が暑さで倒れた… そばに立つと助け起こせる':'生存者が凍りついた… そばに立つと解凍','cold');SFX.bad();burst(s.x,s.y,24,14,{c:['#ffffff','#bfe6f7'],s0:30,s1:100,l0:.4,l1:.8})}}
    s.warm=clamp(s.warm,0,100);if(s.happy>0)s.happy-=dt;
    s.breath-=dt;if(s.breath<=0&&!s.frozen&&!inR){s.breath=rnd(1,1.6);puff(s.x+Math.sin(s.dir)*8,s.y+Math.cos(s.dir)*8,32,{r:5,life:1,a:.8,vy:10,grow:1.4})}
    if(s.frozen)frozen++}
  G.frozen=frozen}

// ---- raids: idle townsfolk take up arms around the fire
function milShot(s,b){const a=Math.atan2(b.x-s.x,b.y-s.y);for(let i=0;i<6;i++){const k=i/6;psA.emit({x:lerp(s.x,b.x,k),y:lerp(30,24,k),z:lerp(s.y,b.y,k),vx:0,vy:0,vz:0,g:0,life:.06+k*.05,max:.1,r:4,c:C('#ffe0a0'),air:true,fade:.1})}s.dirT=a;if(s.m&&s.m.hand)s.happy=0}
function updateMilitia(dt){const R=G.raid;const raiders=R.on?G.bears.filter(b=>b.raid&&!b.dead&&!b.hide&&dist(b.x,b.y,CX,CY)<FR+220):[];
  for(const s of G.surv){if(!s.arrived||s.frozen)continue;
    if(raiders.length){let tg=null,bd=1e9;for(const b of raiders){const d=dist(s.x,s.y,b.x,b.y);if(d<bd){bd=d;tg=b}}
      const a=Math.atan2(tg.y-CY,tg.x-CX)+((s.id%5)-2)*.18,r=125+(s.id%3)*14,gx=CX+Math.cos(a)*r,gy=CY+Math.sin(a)*r;s.mil=1;if(dist(s.x,s.y,gx,gy)>8){moveTo(s,gx,gy,110,dt)}else s.moving=false;
      s.mcd=(s.mcd||rnd(0,1))-dt;if(bd<250&&s.mcd<=0){s.mcd=1.3+Math.random()*.4;const dmg=.7*(1+(G.level-1)*.12)*(1+(G.rank||0)*.1);s.shotN=(s.shotN||0)+1;s.mtg=tg.id;milShot(s,tg);shoot(s,tg,dmg,false,'none');SFX.shot&&Math.random()<.3&&SFX.shot()}}
    else if(s.mil){if(dist(s.x,s.y,s.tx,s.ty)>6)moveTo(s,s.tx,s.ty,80,dt);else{s.mil=0;s.moving=false}}}}
// ---- SOS: stranded people outside the fence, reach them before time runs out and they join the town
const RKIND=['walk','hot','sled','bears'],SPECN={hunter:'猟師',lumber:'木こり',fisher:'釣り人'};
function rescueT(p){const R=G.rescue;if(!R||R.state!=='wait')return null;p=p||G.players[G.me]||G.players[0];
  if(R.kind==='hot'&&!R.hotDone&&!(p.kettle>0))return{x:CX,y:CY,h:130};
  if(R.kind==='sled'){const sl=G.sleds.find(q=>q.rider===p.id);if(sl&&sl.pass)return{x:CX,y:CY-FR+40,h:120};if(!sl){const q=G.sleds.find(q=>q.rider==null);if(q&&dist(p.x,p.y,R.x,R.y)>200)return{x:q.x,y:q.y,h:70}}}
  return{x:R.x,y:R.y,h:130}}
function rescueSpot(){const rects=[HUNT_A].concat(ZONES.filter(z=>G.zones[z.id]).map(z=>z.rect));for(let i=0;i<60;i++){const r=rects[Math.floor(Math.random()*rects.length)];const x=rnd(r[0]+60,r[2]-60),y=rnd(r[1]+60,r[3]-60);const d=dist(x,y,CX,CY);
  if(d<FR+120||d>1000)continue;if(ZONES.some(z=>!G.zones[z.id]&&x>z.rect[0]-30&&x<z.rect[2]+30&&y>z.rect[1]-30&&y<z.rect[3]+30))continue;return{x,y}}return{x:CX,y:CY-FR-260}}
function addWorker(role,x,y){const w={id:++G.nid,role,x,y,dir:0,step:0,bag:[],t:0,target:null,flash:0,moving:false,st:null};workerMesh(w);G.workers.push(w);float(x,y,90,`${SPECN[role]}が仲間に！`,'gold',true);return w}
function updateRescue(dt){G.rescueCd=(G.rescueCd??40)-dt;const R=G.rescue;
  if(!R){if(G.rescueCd<=0&&popNow()+2>houseCap()){G.rescueCd=6;if(!G._fullT||G.t-G._fullT>45){G._fullT=G.t;toast('家が満員で救助依頼を受けられない！ 家を建てよう','cold',true)}}
    if(G.rescueCd<=0){const sp=rescueSpot();const big_=popNow()>=RANKS[4].p;
      const kinds=['walk','hot','hot'];if(G.sleds.length)kinds.push('sled','sled');if(G.day>=2)kinds.push('bears','bears');const kind=kinds[Math.floor(Math.random()*kinds.length)];
      let n=big_?2:Math.min(6,2+(Math.random()<.5?1:0)+Math.floor(G.day/4)+G.mod.sos);if(kind==='sled')n=Math.min(n,4);
      const d0=dist(sp.x,sp.y,CX,CY);const tt=Math.round((kind==='sled'?50+n*18:kind==='hot'?55:kind==='bears'?60:40)+d0*.03);
      const roles=['hunter','lumber'].concat(G.zones.B?['fisher']:[]);const spec=Math.random()<.4?roles[Math.floor(Math.random()*roles.length)]:null;
      G.rescue={id:++G.nid,x:sp.x,y:sp.y,n,t:tt,max:tt,hold:0,state:'wait',endT:0,kind,hotDone:false,left:n,saved:0,gb:0,spec};
      if(kind==='bears'){const k=2+Math.floor(G.day/3);for(let i=0;i<k;i++){const a=i/k*TAU;const b_=spawnBear('A',true);b_.x=sp.x+Math.cos(a)*110;b_.y=sp.y+Math.sin(a)*110;b_.guardOf=G.rescue.id;b_.m.g.position.set(b_.x,0,b_.y);if(i===0&&G.day>=4){b_.kind='big';b_.hp=b_.max=12}}G.rescue.gb=k}
      const need={walk:`${tt}秒以内に助けに行け（矢印の先）`,hot:'凍えて動けない！ かまどでお湯をくんで届けろ',sled:'ケガで歩けない！ 犬ぞりで1人ずつ町へ運べ',bears:'オオカミに囲まれている！ 倒してから助けろ'}[kind];
      banner('SOS！',`遭難者 ${n}人${spec?`（${SPECN[spec]}がいる！）`:''}`,need,'cold');SFX.wave()}return}
  if(R.state==='wait'){R.t-=dt;
    if(R.kind==='bears')R.gb=G.bears.filter(b=>b.guardOf===R.id&&!b.dead).length;
    if(R.kind==='hot'&&!R.hotDone){for(const p of G.players)if(p.kettle>0&&dist(p.x,p.y,R.x,R.y)<70){p.kettle=0;R.hotDone=true;SFX.splash();burst(R.x,R.y,20,24,{c:['#ffffff','#bfe9ff','#ffd166'],s0:30,s1:120,u0:80,u1:200,l0:.6,l1:1});float(R.x,R.y,100,'お湯で温まった！','gold',true)}}
    if(R.kind==='sled'){for(const q of G.sleds){if(q.rider==null)continue;const p=G.players[q.rider];if(!p)continue;
        if(!q.pass&&R.left>0&&dist(p.x,p.y,R.x,R.y)<70){q.pass=1;R.left--;SFX.pop();float(R.x,R.y,90,`そりに乗せた！ 残り${R.left}人`,'gold',true)}}
      if(R.saved>=R.n){rescueOk(R);return}}
    else{const ready=(R.kind!=='hot'||R.hotDone)&&(R.kind!=='bears'||R.gb===0);const near=G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,R.x,R.y)<60);R.hold=ready&&near?R.hold+dt:Math.max(0,R.hold-dt*2);
      if(R.hold>=1.2){for(let i=0;i<R.n;i++){spawnSurvivor(false);const s=G.surv[G.surv.length-1];s.x=R.x+rnd(-24,24);s.y=R.y+rnd(-24,24);s.warm=100;s.m.g.position.set(s.x,0,s.y)}rescueOk(R);return}}
    if(R.t<=0){R.state='fail';SFX.bad();const lost=R.kind==='sled'?R.left:R.n;for(const q of G.sleds)if(q.pass){q.pass=0}for(const b of G.bears)if(b.guardOf===R.id)b.guardOf=null;
      banner('','間に合わなかった…',R.kind==='sled'&&R.saved?`${R.saved}人は助けた。残り${lost}人が凍りついた`:`遭難者${lost}人が凍りついた`,'cold')}}
  else{R.endT+=dt;if(R.endT>2.5){G.rescue=null;G.rescueCd=popNow()>=RANKS[4].p?rnd(90,130):rnd(45,70)}}}
function rescueOk(R){R.state='done';for(const b of G.bears)if(b.guardOf===R.id)b.guardOf=null;
  if(R.spec){const pool=G.surv.filter(s=>!s.arrived&&!s.frozen);const s0=pool[pool.length-1];if(s0){world.remove(s0.m.g);G.surv.splice(G.surv.indexOf(s0),1);addWorker(R.spec,s0.x,s0.y)}}
  G.stats.rescued=(G.stats.rescued||0)+R.n;const bonus=Math.round(30+G.day*12+(R.kind!=='walk'?40+G.day*8:0));G.cash+=bonus;G.earned+=bonus;gainXP(15+R.n*5,R.x,R.y);addCombo(10);SFX.rare();
  banner('救出成功！',`町人 +${R.n}人`,`${R.spec?`${SPECN[R.spec]}がそのまま働いてくれる！ `:''}お礼 +$${bonus}`,'area');burst(R.x,R.y,30,40,{c:['#ffd23f','#ffffff','#8ff08f'],s0:60,s1:220,u0:160,u1:360,l0:.6,l1:1.1,add:true,r0:5,r1:9})}
// hot water: pick up at the furnace while a "hot" SOS is open; it cools down over time
function updateKettle(p,dt){const R=G.rescue;if(p.kettle>0){p.kettle-=dt;if(p.kettle<=0){p.kettle=0;float(p.x,p.y,80,'お湯が冷めた…','ice',true);SFX.bad()}}
  else if(R&&R.state==='wait'&&R.kind==='hot'&&!R.hotDone&&!(p.down>0)&&dist(p.x,p.y,CX,CY)<120){p.kettle=30;SFX.pop();float(p.x,p.y,80,'お湯をくんだ！ 30秒で冷める','gold',true)}}
const upkeepCost=()=>Math.round(popNow()*(4+G.day*1.3+Math.max(0,G.day-5)*1.6)*DM().up*(1+(YR()-1)*.3));
function dailyUpkeep(){if(G.day<2){banner(`${tempC()}℃`,`DAY ${G.day}`,'夜が明けた');return}const c=upkeepCost();
  if(G.cash>=c){G.cash-=c;banner(`${tempC()}℃`,`DAY ${G.day}`,`夜が明けた　町の食費 −$${c}`)}
  else{const short=c-G.cash;G.cash=0;const per=4+G.day*1.3+Math.max(0,G.day-5)*1.6;let k=Math.min(Math.ceil(short/per),idleSurvivors().length);const gone=idleSurvivors().slice(0,k);
    for(const s of gone){world.remove(s.m.g);G.surv.splice(G.surv.indexOf(s),1);burst(s.x,s.y,20,10,{c:['#ffffff','#bfe6f7'],s0:30,s1:100,l0:.4,l1:.8})}
    banner(`DAY ${G.day}`,'食費が払えない！',gone.length?`町の人が${gone.length}人出ていった…（食費 $${c}）`:`食費 $${c} が足りない`,'cold');SFX.bad()}}
function updateRank(){const r=Math.max(G.rank||0,rankOf(popNow()));if(r>(G.rank||0)){G.rank=r;const bon=`熱の範囲+${r*4}%・税+${r*25}%・客+${r*10}%`;banner('町ランクUP！',`${RANKS[r].n}になった`,bon,'area');SFX.area();G.shake=10;
    burst(CX,CY,60,70,{c:['#ffd23f','#ffffff','#ff8ad8','#8ff08f','#9fe0ff'],s0:100,s1:360,u0:260,u1:520,l0:.9,l1:1.6,add:true,r0:6,r1:12})}}
function updateWeather(dt){const ph=(G.t%G.DAY)/G.DAY;
  if(G.day>=2&&G.wxDay!==G.day){G.wxDay=G.day;const pick=['blizzard','snap','clear','aurora'][Math.floor(Math.random()*4)];G.wxNext=pick;G.wxAt=(G.day-1)*G.DAY+(pick==='aurora'?.78:rnd(.12,.5))*G.DAY;G.wxDone=false}
  if(!G.wxDone&&G.wxNext&&G.t>=G.wxAt){G.wxDone=true;const w=WXN(WXS.find(q=>q.id===G.wxNext));const dur=w.id==='aurora'?14:rnd(26,34);G.wx={type:w.id,t:dur,max:dur};banner(`${w.ic} 天気が変わった`,w.n,w.d,w.id==='clear'||w.id==='aurora'?'area':'cold');w.id==='clear'||w.id==='aurora'?SFX.area():SFX.wave()}
  if(G.wx.type){G.wx.t-=dt;if(G.wx.t<=0){toast(`${WXN(WXS.find(q=>q.id===G.wx.type)).n}がおさまった`,'gold');G.wx={type:null,t:0,max:0}}}}
function updateTax(dt){updateRank();updateWeather(dt);G.taxT=(G.taxT||0)+dt;if(G.taxT<12)return;G.taxT=0;const ok=idleSurvivors().filter(s=>s.warm>40);if(!ok.length)return;
  const v=Math.round(ok.length*(1+G.level*.3)*G.mod.price*(1+(G.rank||0)*.15)*(wxIs('aurora')?2:1));G.cash+=v;G.earned+=v;float(CX,CY,170,`町の人から +$${v}`,'cash');for(const s of ok)s.happy=Math.max(s.happy||0,.5);SFX.cash(2)}
function updateSpa(dt){const s=G.spa;if(!G.zones.D)return;s.fuel=Math.max(0,s.fuel-1.4*dt);if(s.fuel>0){s.pile+=(3+G.lv.spa*4)*dt*(G.feverT>0?2:1);G.earned+=(3+G.lv.spa*4)*dt*(G.feverT>0?2:1)}
  s.t+=dt;if(s.fuel>0&&Math.random()<dt*(8+G.lv.spa*4))puff(SPA.x+rnd(-100,100),SPA.y+rnd(-70,70),8,{c:'#ffffff',r:18,life:2.4,a:.35,vy:30,grow:2.5})}
const guardsAt=id=>G.workers.filter(w=>w.role==='guard'&&w.tw===id).length;
function jobPos(w){if(w.role==='guard'){const tw=TOWERS.find(t=>t.id===w.tw)||TOWERS[0];return{x:tw.mx+(w.slot?10:-10),y:tw.my+6}}const a=[[-40,-6],[0,-34],[40,-6]][w.slot%3];return{x:WOOD.x+a[0],y:WOOD.y+a[1]}}
function updateWorkers(dt){
  const HR=heatR(),OUT=['hunter','lumber','fisher','stoker'];
  for(const w of G.workers){w.flash=Math.max(0,w.flash-dt);w.aimDir=null;w.chop=false;let goal=null;if(w.warm==null)w.warm=100;
    const inH=dist(w.x,w.y,CX,CY)<HR||spaWarm(w.x,w.y),byP=G.players.some(p=>!(p.down>0)&&dist(w.x,w.y,p.x,p.y)<70);
    if(w.hurt>0){w.hurt-=dt;w.moving=false;if(w.hole&&w.hole.user===w){w.hole.user=null}w.chop=false;if(w.hurt<=0)float(w.x,w.y,70,'治った！','gold');continue}
    if(w.frozen){w.moving=false;if(inH)w.warm+=15*dt;if(byP)w.warm+=22*G.pm.thaw*dt;if(w.warm>40){w.frozen=false;w.goWarm=true;float(w.x,w.y,70,'解凍！','gold');SFX.rare()}continue}
    if(OUT.includes(w.role)){const cool=(1.1+G.day*.06)*coolMul()*G.mod.cold*(wxIs('blizzard')?2.4:wxIs('snap')?1.7:1)*(1-mlv('warm')*.06);
      w.warm=clamp(w.warm+(inH?30:-cool)*dt,0,100);
      if(w.warm<=0){w.frozen=true;w.goWarm=false;if(w.hole&&w.hole.user===w)w.hole.user=null;float(w.x,w.y,80,`${SPECN[w.role]||'仲間'}が凍えた！`,'ice',true);toast(`${SPECN[w.role]||'仲間'}${DES()?'が暑さで倒れた！ そばに立って助け起こそう':'が外で凍りついた！ そばに立って溶かそう'}`,'cold');SFX.bad();continue}
      const night=isNight(),bliz=wxIs('blizzard');w.shelter=bliz;
      if(bliz&&!w.goWarm&&!inH){w.goWarm=true;if(w.hole&&w.hole.user===w)w.hole.user=null;w.hole=null;float(w.x,w.y,70,'吹雪だ、戻ろう','ice')}
      if(w.warm<(night?55:45)&&!w.goWarm){w.goWarm=true;if(w.hole&&w.hole.user===w)w.hole.user=null;w.hole=null;float(w.x,w.y,70,'さむい…','ice')}
      if(w.goWarm){if(inH&&w.warm>=95&&!bliz)w.goWarm=false;else{const n=nav(w,CX,CY+95);if(!inH)moveTo(w,n.x,n.y,120,dt);else w.moving=false;continue}}}
    if(w.role==='guard'){const q=jobPos(w);w.x=q.x;w.y=q.y;const tw=TOWERS.find(t=>t.id===w.tw);w.dirT=tw&&G.towerV[tw.id]?G.towerV[tw.id].gun.rotation.y:0;if(tw&&tw.cd>0&&tw.cd<.1)w.flash=.07;continue}
    if(w.role==='splitter'){const q=jobPos(w);w.x=q.x;w.y=q.y;w.dirT=Math.atan2(WOOD.x-w.x,WOOD.y-w.y);w.t+=dt;w.chop=w.t%1.1<.55;if(w.t>=3.3){w.t=0;G.woodpile++;SFX.chop();burst(WOOD.x,WOOD.y,20,5,{c:['#c9955b','#e7c08e'],s0:30,s1:90,u0:60,u1:160,l0:.3,l1:.6,r0:3,r1:5});if(Math.random()<.3)float(WOOD.x,WOOD.y,50,'+1本','gold')}continue}
    if(w.role==='cashier'){w.x=w.st.def.stand.x;w.y=w.st.def.stand.y;w.dirT=Math.PI;continue}
    if(w.role==='hunter'){const full=w.bag.length>=8;
      if(DES()&&(full||(w.bag.length&&!G.pickups.some(m=>m.h<=3&&dist(m.x,m.y,w.x,w.y)<500)))){goal={x:CAR_STOP.x+60,y:CAR_STOP.y-40};const C=G.car;if(dist(w.x,w.y,goal.x,goal.y)<50){goal=null;w.t+=dt;if(C&&C.state==='here'&&w.t>.15){w.t=0;const i=w.bag.findIndex(k=>C.order[k]&&(C.got[k]||0)<C.order[k]);if(i>=0){const k=w.bag.splice(i,1)[0];C.got[k]=(C.got[k]||0)+1;flyItem(k,w.x,w.y,24,CAR_STOP.x,CAR_STOP.y,30,null,3);carCheck()}}}}
      else if(full||(w.bag.length&&!G.pickups.some(m=>m.h<=3&&dist(m.x,m.y,w.x,w.y)<500))){const k=w.bag[w.bag.length-1];const id=k==='fur'?'coat':'steak';const c=STN[id].conv;if(!G.stations[id].open){w.bag.pop();continue}
        goal={x:c.x,y:c.y+40};if(dist(w.x,w.y,goal.x,goal.y)<50){goal=null;w.t+=dt;if(w.t>.12){w.t=0;const kk=w.bag.pop();if(kk==='meat')G.stats.grilled++;const st=G.stations[id];flyItem(kk,w.x,w.y,24,c.x-56,c.y+10,st.inStack.h+4,()=>{st.q.push(kk)},3.4)}}}
      else{let best=null,bd=420;for(const m of G.pickups){if(m.h>3)continue;const d=dist(w.x,w.y,m.x,m.y);if(d<bd){bd=d;best=m}}
        if(best){goal=best;if(bd<18){best.taken=true;w.bag.push(best.k);if(best.k==='fur')G.stats.fur++}}
        else{let tb=null,tbd=1e9;for(const b of G.bears){if(b.dead||b.kind==='boss')continue;const d=dist(w.x,w.y,b.x,b.y);if(d<tbd){tbd=d;tb=b}}
          if(tb){if(tbd>160)goal=tb;else{w.aimDir=Math.atan2(tb.x-w.x,tb.y-w.y);w.t+=dt;if(w.t>.9){w.t=0;w.flash=.07;shoot(w,tb,1,false)}}}else goal={x:990,y:1150}}}}
    if(w.role==='lumber'||w.role==='stoker'){const dest=w.role==='lumber'?{x:CX,y:CY+70}:{x:SPA.boiler.x,y:SPA.boiler.y+36};
      if(w.bag.length>=5||(w.bag.length&&!w.target)){goal=dest;if(dist(w.x,w.y,dest.x,dest.y)<48){goal=null;w.t+=dt;if(w.t>.14){w.t=0;w.bag.pop();if(w.role==='lumber'){if(G.fuel>=92||DES())flyItem('log',w.x,w.y,24,WOOD.x,WOOD.y,G.woodStack.h+4,()=>{G.woodpile++});else flyItem('log',w.x,w.y,24,CX,CY,50,()=>{G.fuel=Math.min(100,G.fuel+logFuel())})}else flyItem('log',w.x,w.y,24,SPA.boiler.x,SPA.boiler.y,40,()=>{G.spa.fuel=Math.min(100,G.spa.fuel+12)})}}}
      else{if(!w.target||!w.target.alive||w.target.fall>0){let b=null,bd=1e9;for(const t of G.trees){if(!t.alive||t.fall>0||(t.zone&&!G.zones[t.zone])||t.item==='salt')continue;if(w.role==='stoker'&&t.zone!=='D')continue;const d=dist(w.x,w.y,t.x,t.y)+(G.workers.some(o=>o!==w&&o.target===t)?150:0);if(d<bd){bd=d;b=t}}w.target=b}
        const t=w.target;if(t){if(dist(w.x,w.y,t.x,t.y)>30)goal=t;else{w.chop=true;w.aimDir=Math.atan2(t.x-w.x,t.y-w.y);w.t+=dt;if(w.t>.6){w.t=0;hitTree(t,w.x,w.y,false);w.bag.push('log');if(t.hp<=0)w.target=null}}}}
      }
    if(w.role==='fisher'){if(w.bag.length>=5)w.deliv=true;if(!w.bag.length)w.deliv=false;if(w.deliv&&DES()){goal={x:CX,y:CY+70};if(w.hole&&w.hole.user===w){w.hole.user=null}w.hole=null;if(dist(w.x,w.y,goal.x,goal.y)<50){goal=null;w.t+=dt;if(w.t>.14){w.t=0;w.bag.pop();flyItem('water',w.x,w.y,24,CX,CY,50,()=>{G.fuel=Math.min(100,G.fuel+14)})}}}else if(w.deliv&&!G.stations.fish.open){w.bag.length=0;w.deliv=false}if(w.deliv){const c=STN.fish.conv;goal={x:c.x,y:c.y+40};if(w.hole){w.hole.user=null;w.hole=null}if(dist(w.x,w.y,goal.x,goal.y)<50){goal=null;w.t+=dt;if(w.t>.12){w.t=0;w.bag.pop();const st=G.stations.fish;flyItem('fish',w.x,w.y,24,c.x-56,c.y+10,st.inStack.h+4,()=>{st.q.push('fish')},3.4)}}}
      else{if(w.hole&&w.hole.user&&w.hole.user!==w)w.hole=null;
        if(!w.hole){let hb=null,hd=1e9;for(const h of G.holes){if(h.user)continue;if(G.workers.some(o=>o!==w&&o.hole===h))continue;const d=dist(w.x,w.y,h.x,h.y);if(d<hd){hd=d;hb=h}}w.hole=hb}
        if(w.hole){if(dist(w.x,w.y,w.hole.x,w.hole.y)>6){goal=w.hole}else{w.x=w.hole.x;w.y=w.hole.y;w.hole.user=w;w.dirT=Math.atan2(CX-w.x,CY-w.y)}}else goal={x:1880,y:1230}}}
      if(w.role==='fisher'&&w.hole&&w.hole.user===w&&dist(w.x,w.y,w.hole.x,w.hole.y)>10)w.hole.user=null;
    if(goal){const n=nav(w,goal.x,goal.y);moveTo(w,n.x,n.y,110,dt)}else w.moving=false;
    for(const z of ZONES)if(!G.zones[z.id]){const [x0,y0,x1,y1]=z.rect;pushRect(w,x0,y0,x1,y1,10)}}}

// ================================================================ sync visuals
function sync(dt){
  const R=heatR(),f=G.fuel/100,v=G.v,two=G.players.length>1;
  // fire
  const rate=G.fuel>0?60+f*140+(G.level-1)*14:0;let n=rate*dt;
  while(n>0){if(Math.random()<n){const sp=12+f*14+G.level*2;psA.emit({x:CX+rnd(-sp,sp),y:44,z:CY+rnd(-sp,sp),vx:rnd(-8,8)+G.wind*14,vz:rnd(-8,8),vy:rnd(60,120)*(.7+f*.6),g:-20,life:rnd(.4,.9)*(.7+f*.5),max:.9,r:rnd(12,20)*(.7+f*.5+G.level*.05),a:.8,fire:true,air:true,fade:.4})}n-=1}
  if(G.fuel>0&&Math.random()<dt*(4+f*10))psA.emit({x:CX+rnd(-10,10),y:70,z:CY+rnd(-10,10),vx:rnd(-30,30)+G.wind*25,vz:rnd(-30,30),vy:rnd(80,180),g:20,life:rnd(.8,1.6),max:1.6,r:4,c:C(Math.random()<.5?'#ffd166':'#ff9a4d'),air:true});
  if(Math.random()<dt*(G.fuel>0?3:5))puff(CX+rnd(-8,8),CY+rnd(-8,8),120+f*40,{c:'#7a8491',r:18,life:2.4,a:.3,vy:40,vx:G.wind*20,grow:2.4});
  v.f.flames.forEach((fl,i)=>{const h=(G.fuel>0?(.35+f*.75+G.level*.07):0)*(1+Math.sin(G.t*(11+i*5))*.12);fl.scale.set(.6+f*.5,Math.max(.001,h),.6+f*.5);fl.visible=G.fuel>0;fl.rotation.y=G.t*(1+i)});
  v.f.light.intensity=G.fuel>0?(1.4+f*2.2)*(1+Math.sin(G.t*13)*.06)*(nightK>.3?1.6:1):0;v.f.light.distance=R*2.4+200;v.f.coals.material.emissiveIntensity=G.fuel>0?2.2:.1;
  if(v.f.plate._lv!==G.level){v.f.plate._lv=G.level;v.f.plate.userData.draw('Lv'+G.level)}
  syncTown(dt);
  const fl=1+Math.sin(G.t*9)*.01;v.heat.visible=v.ring.visible=R>0;v.heat.scale.setScalar(R*fl*1.12);v.ring.scale.setScalar(R*fl);v.ring.material.color.copy(C(G.fuel<20&&Math.sin(G.t*10)>0?'#ff4d5a':DES()?'#5fc3f0':'#ffa04d'));
  v.embers.forEach((e,i)=>{const a=i/v.embers.length*TAU+G.t*.25;e.position.set(CX+Math.cos(a)*R*fl,3+Math.sin(G.t*4+i)*1.5,CY+Math.sin(a)*R*fl);e.visible=R>0;e.rotation.y=G.t*2+i});
  // players
  for(const p of G.players){const m=p.m;m.g.position.set(p.x,p.riding?6:0,p.y);if(p.aimDir!=null)turnTo(p,p.aimDir,dt,16);else if(p.dirT!=null)turnTo(p,p.dirT,dt);m.g.rotation.y=p.dir;
    m._armR=m._armL=false;animWalk(m,p.step,p.moving);
    const shoot_=!!p.shooting;m.gun.visible=shoot_;if(m.clsW)for(const o of m.clsW)o.visible=shoot_;m.axe.visible=!shoot_&&!p.fishing;m.rod.visible=!!p.fishing;
    if(shoot_){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,.2);m._armR=m._armL=true;m.gun.userData.flash.visible=p.flash>0;if(!m.kk)m.gun.position.z=10-(p.flash>0?3:0)}
    else if(p.chopping){const t=clamp(p.actT/(.24*G.pm.chop),0,1);m.armR.rotation.set(-2.6+Math.sin(t*Math.PI)*2.4,0,0);m._armR=true}
    else if(p.fishing){m.armR.rotation.set(-.9+Math.sin(G.t*3)*.08,0,0);m._armR=true}
    if(m.kk){m.kkRun=true;m.kk.paused=p.down>0;m.kk.want=p.riding?'Idle':shoot_?(m.cls?m.cls.anim:'1H_Ranged_Shooting'):p.chopping?'1H_Melee_Attack_Chop':p.fishing?'Sit_Floor_Idle':null}
    m.ice.visible=!!(p.down>0)&&!p.ko&&!DES();if(m.kk&&p.down>0&&DES())m.kk.want='Sit_Floor_Idle';if(m.kk&&p.ko)m.kk.want='Sit_Floor_Idle';if(p.down>0){m.ice.rotation.y=G.t*.3;m.ice.scale.set(1,1.45,1)}
    const bath=inBath(p)&&!p.riding;if(m.kk){if(!m.bathParts){m.bathParts=[];m.model.traverse(o=>{if(o.isMesh&&/Cape|Hat|Helmet/.test(o.name)&&o.visible)m.bathParts.push(o)});m.towel=at(rbox(13,3.2,11,1.2,std('#ffffff',{r:1})),0,52,-1);m.towel.visible=false;m.g.add(m.towel)}
      if(m._bath!==bath){m._bath=bath;m.towel.visible=bath;for(const o of m.bathParts)o.visible=!bath}
      if(bath){m.g.position.y=-35;m.gun.visible=false;m.axe.visible=false;m.rod.visible=false;if(m.clsW)for(const o of m.clsW)o.visible=false}}
    p.stack.set(p.bag,-clamp(Math.hypot(p.vx,p.vy)/195,0,1)*.4);p.stack.g.position.y=10-p.bb*3;p.stack.g.visible=!bath;
    m.g.visible=p.down>0||!(p.inv>0&&Math.floor(G.t*20)%2);
    const top=58+p.stack.h*0;
    if(two)label(p.x,p.y,78,`<span class="tag" style="background:${HERO[p.id].tag}">${HERO[p.id].tagText}</span>`,'');
    {const showW=!p.down&&(!p.inHeat||p.warm<99),cold=p.warm<25;let h='';
      if(showW)h+=`<span class="wg${cold?' cold':''}${p.inHeat?' warmup':''}"><em>${cold?(DES()?'のどカラカラ':'さむい！'):p.inHeat?(DES()?'うるおい':'ぽかぽか'):TW()}</em><i class="bar wide ${cold?'':p.inHeat?'gold':'ice'}"><b style="width:${Math.max(4,Math.min(100,p.warm))}%"></b></i><strong>${Math.round(p.warm)}</strong></span>`;
      if(p.hp<100)h+=`<span class="wg hpg"><em>体力</em><i class="bar wide hp"><b style="width:${Math.max(4,Math.min(100,p.hp))}%"></b></i><strong>${Math.round(p.hp)}</strong></span>`;
      if(h)label(p.x,p.y,0,`<div style="transform:translateY(${h.includes('hpg')&&showW?40:30}px)">${h}</div>`,'')}
    if(p.bag.length>=cap(p))label(p.x,p.y,34+p.stack.h,'MAX','gold sm');
    if(p.fishing){label(p.fishing.x,p.fishing.y,70,bar(100*p.fishing.t/2.2,'blue wide'),'')}}
  // bears
  for(const b of G.bears){const m=b.m;m.g.position.set(b.x,0,b.y);const S=b.kind==='boss'?2.1:b.kind==='big'?1.35:1;
    if(b.dead){if(m.mx){beastAnim(m,b);m.g.position.y=-Math.max(0,b.deadT-1.4)*20;m.ring.visible=false;continue}const k=Math.min(1,b.deadT/.35);m.g.rotation.z=k*1.4;m.g.position.y=-k*4*S-Math.max(0,b.deadT-1.4)*20;m.ring.visible=false;continue}
    m.g.visible=!b.hide;if(b.hide){if(Math.random()<.2)puff(b.x,b.y,3,{c:DES()?'#e2b877':'#e8f2fa',r:14,life:.7,a:.7,vy:14,grow:1.6});continue}
    if(b.dirT!=null){let d=b.dirT-b.rot;d=Math.atan2(Math.sin(d),Math.cos(d));b.rot+=d*Math.min(1,dt*6)}m.g.rotation.y=b.rot;
    if(m.mx)beastAnim(m,b);const s=b.moving?Math.sin(b.step):0;m.legs.forEach((l,i)=>l.rotation.x=s*(i%2?-1:1)*(i<2?1:-1)*.6);m.head.rotation.x=b.swipe>0?-.4:Math.sin(G.t*2+b.x)*.05;
    m.fur.emissive.copy(C(b.hit>0?'#ff2020':'#000000'));m.fur.emissiveIntensity=b.hit>0?.5:0;m.brow.visible=b.state==='chase';m.ring.material.opacity=b.state==='chase'?.6+Math.sin(G.t*14)*.35:.7;
    if(b.hp<b.max||b.kind==='boss')label(b.x,b.y,68*S,bar(100*b.hp/b.max,b.kind==='boss'?'wide':''),'');
    if(b.kind==='boss')if(b.rbi!=null&&rbList()[b.rbi]){const R=rbList()[b.rbi],me=G.players[G.me]||G.players[0],ok=lifeRank(me,'hunt')>=R.rq;label(b.x,b.y,86*S,`${R.n}${ok?'':`<br><small>🔒 狩人「${LR[R.rq].n}」で攻撃が通る</small>`}`,ok?'red':'note')}else label(b.x,b.y,86*S,b.bt?BTN[b.bt]:'BOSS','red');if(b.ph==='st'||b.stn)label(b.x,b.y,104*S,'★ ピヨピヨ ★ 大ダメージ','gold');
    if(b.roar>0)label(b.x,b.y,86*S+(b.kind==='boss'?20:0),DES()?'シャーッ！':'ガオッ！','red',1,1+b.roar*.4)}
  for(const m of G.pickups){m.mesh.position.set(m.x,m.h+2+(m.h<=0?Math.sin(G.t*4+m.x)*1.5:0),m.y);m.mesh.rotation.y=m.spin+G.t*(m.h>0?6:1)}
  // workers
  for(const w of G.workers){const m=w.m;m.g.position.set(w.x,w.role==='guard'?73:0,w.y);if(w.aimDir!=null)turnTo(w,w.aimDir,dt,14);else if(w.dirT!=null)turnTo(w,w.dirT,dt);m.g.rotation.y=w.dir;m._armR=m._armL=false;animWalk(m,w.step,w.moving);w.stack.set(w.bag);
    if(w.role==='hunter'){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,0);m._armR=m._armL=true;m.tool.userData.flash.visible=w.flash>0}
    if(w.chop){m.armR.rotation.set(-2.6+Math.sin(clamp(w.t/.6,0,1)*Math.PI)*2.4,0,0);m._armR=true}
    if(w.role==='cashier'){m.armR.rotation.set(-.7+Math.sin(G.t*6)*.3,0,0);m._armR=true}
    if(m.kk)m.kk.want=(w.role==='hunter'&&w.aimDir!=null)||w.role==='guard'?'1H_Ranged_Shooting':w.chop?'1H_Melee_Attack_Chop':w.role==='cashier'?'Interact':(w.role==='fisher'&&w.hole&&!w.moving)?'Sit_Floor_Idle':null;
    if(w.role==='guard'){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,0);m._armR=m._armL=true;if(m.tool&&m.tool.userData.flash)m.tool.userData.flash.visible=w.flash>0}
    if(w.role==='fisher'&&w.hole&&!w.moving&&w.hole.user===w){m.armR.rotation.set(-.9,0,0);m._armR=true;label(w.hole.x,w.hole.y,64,bar(100*w.hole.t/2.2,'blue'),'')}
    if(w.frozen&&!w.ice){w.ice=M_(geo('ice',()=>new T.IcosahedronGeometry(22,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.62,roughness:.08,metalness:.1,flatShading:true}),false);w.ice.scale.set(1,1.35,1);w.ice.position.y=24;m.g.add(w.ice)}
    if(w.ice)w.ice.visible=!!w.frozen&&!DES();if(m.kk){if(w.frozen&&!DES())m.kk.paused=true;else m.kk.paused=false;if(w.frozen&&DES())m.kk.want='Sit_Floor_Idle';if(w.hurt>0)m.kk.want='Sit_Floor_Idle'}
    if(w.frozen)label(w.x,w.y,82,`<b>${DES()?'倒れた！':'凍えた！'}</b><br><small>${DES()?'そばに立つと助け起こせる':'そばに立つと溶ける'}</small><br>${bar(100*Math.min(1,w.warm/40),'gold wide')}`,'ice');else if(w.hurt>0)label(w.x,w.y,70,'<b>けが</b>','red');else if(w.shelter&&w.goWarm)label(w.x,w.y,70,'<small>吹雪で休憩中</small>','ice');else if(w.warm!=null&&w.warm<99&&['hunter','lumber','fisher','stoker'].includes(w.role))label(w.x,w.y,70,bar(w.warm,w.warm<50?'':'ice'),'')}
  // survivors
  for(const s of G.surv){const m=s.m;const warmPose=s.arrived&&!s.frozen&&s.warm>55;if(warmPose)s.dirT=Math.atan2(CX-s.x,CY-s.y);if(s.dirT!=null&&!s.frozen)turnTo(s,s.dirT,dt,6);m.g.rotation.y=s.dir;
    tintCold(m,s.frozen?1:1-Math.min(1,s.warm/100*1.5));const shiv=!s.frozen&&s.warm<40?Math.sin(G.t*55+s.x)*1.4*(1-s.warm/40):0;m.g.position.set(s.x+shiv,s.happy>0?Math.abs(Math.sin(s.happy*9))*7:0,s.y);
    m._armL=m._armR=false;if(!s.frozen)animWalk(m,s.step,s.moving);
    if(warmPose){m.armL.rotation.set(-1.4+Math.sin(G.t*2+s.x)*.15,0,0);m.armR.rotation.set(-1.4+Math.sin(G.t*2+s.x+1)*.15,0,0);m._armL=m._armR=true}
    if(m.kk){m.kk.paused=s.frozen;m.kk.want=s.happy>0?'Cheer':null}
    else if(!s.moving&&!s.frozen){m.armL.rotation.set(-.5,0,.9);m.armR.rotation.set(-.5,0,-.9);m._armL=m._armR=true}
    s.ice.visible=s.frozen&&!DES();if(s.frozen&&DES()&&s.m.kk){s.m.kk.paused=false;s.m.kk.want='Sit_Floor_Idle'}if(s.frozen){const k=easeOutBack(s.freezeAnim);s.ice.scale.set(k,1.35*k,k);s.ice.rotation.y=G.t*.2;label(s.x,s.y,72,bar(100*Math.min(1,s.warm/35),'gold'),'')}
    else if(s.warm<60)label(s.x,s.y,58,(s.warm<25?`<span class="alert">!</span>`:bar(s.warm,'ice'))+`<span class="lb ice sm" style="position:static;display:block;margin-top:2px">${s.arrived?'火がない…':'寒い…'}</span>`,'');
    if(s.happy>0&&!s.frozen)label(s.x,s.y,68,'♥','red',Math.min(1,s.happy))}
  // customers
  for(const c of G.customers){const m=c.m;m.g.scale.setScalar(.95*easeOutBack(Math.min(1,c.fade||1)));m.g.position.set(c.x+(c.angry>0?Math.sin(G.t*50)*1.2:0),c.happy>0?Math.abs(Math.sin(c.happy*9))*6:0,c.y);if(c.dirT!=null)turnTo(c,c.dirT,dt);m.g.rotation.y=c.dir;m._armR=false;
    if(c.hold.visible){m.armR.rotation.set(-1.2,0,0);m._armR=true}animWalk(m,c.step,c.moving);if(m.kk&&c.happy>0)m.kk.want='Cheer';
    if(c.happy>0)label(c.x,c.y,66,'♥','red',Math.min(1,c.happy));if(c.angry>0)label(c.x,c.y,68,'ムカッ','red sm');
    if(c.state==='queue'&&c.wait>c.patience*.4){const k=1-c.wait/c.patience;label(c.x,c.y,60,k<.25?'<span class="alert">!</span>':`<span class="clock" style="--p:${100*k|0};--c:${k<.5?'#ff8a5a':'#ffd166'}"></span>`,'')}}
  // stations
  for(const id in G.stations){const st=G.stations[id],d=st.def;
    if(!st.open)continue;if(st.unlockT!=null&&st.unlockT<=1){const k=easeOutBack(Math.min(1,st.unlockT));st.parts.forEach(o=>{o.visible=true;o.scale.setScalar(Math.max(.01,k))});if(st.sign)st.sign.visible=false}
    st.inStack.set(st.q);st.shelfStack.fill(d.out,Math.min(st.shelf,40));st.pileStack.fill('cash',Math.min(220,Math.ceil(st.pile/5)));
    const cooking=st.q.length>0&&!st.frozen;st.conv.on.visible=cooking&&st.cookT<.5*d.time;st.conv.done.visible=cooking&&!st.conv.on.visible;st.conv.coal.material.emissiveIntensity=st.frozen?0:cooking?2.2:.8;
    st.ice.visible=st.frozen&&!DES();if(st.frozen&&!DES()){st.ice.material.opacity=.45+Math.sin(G.t*3)*.08;label(d.conv.x,d.conv.y,90,'凍結中！ 熱が届いてない','warnbox')}
    st.ct.lamp.material.emissive.copy(C(st.staffed?'#6be07a':'#ff6b6b'));if(st.ct.price._p!==price(id)){st.ct.price._p=price(id);st.ct.price.userData.draw(`$${price(id)}`)}
    if(st.pile>0)label(d.pile.x,d.pile.y,30+st.pileStack.h,`$${st.pile|0}`,'cash');
    if(st.shelf===0&&!st.frozen)label(d.counter.x-50,d.counter.y,50,'在庫なし','red sm');
    if(!st.cashier&&!st.staffed&&st.queue.length&&st.shelf>0)label(d.stand.x,d.stand.y,60,'ここに立って販売','note');
    if(cooking)label(d.conv.x,d.conv.y,70,bar(100*st.cookT/(d.time*Math.pow(.74,G.lv['cook_'+id])*G.pm.cook),'gold'),'')}
  // pads
  for(const pad of G.pads){const vis=(!pad.zone||G.zones[pad.zone])&&pad.vis();if(vis&&!pad.shown){pad.shown=true;pad.rise=0;pad.mesh.g.visible=true}if(!vis&&pad.shown){pad.shown=false;pad.mesh.g.visible=false}
    if(!pad.shown)continue;if(pad.personal){const q=meP(),mine=q&&pad.costP(q)!=null;if(pad.mesh.g.visible!==mine)pad.mesh.g.visible=mine;if(!mine)continue}pad.rise=Math.min(1,pad.rise+dt*2);const on=G.onPads&&G.onPads.has(pad);const req=pad.req?pad.req():(pad.pop&&!idleSurvivors().length?'生存者を待っています':null);
    if(pad.personal){const q=meP();pad.paid=q?(pad.pp[q.id]||0):0}pad.mesh.draw(pad.cost(),pad.paid,pad.lvText(),on,req,mixLeft(pad));pad.mesh.mesh.scale.setScalar(easeOutBack(pad.rise)*(1+pad.pulse*.3+(on?.06:0)));pad.mesh.icon.position.y=56+Math.sin(G.t*2.4+pad.x)*4;pad.mesh.icon.rotation.y=G.t*1.2+pad.y;pad.mesh.icon.scale.setScalar(easeOutBack(pad.rise))}
  // zones
  for(const z of ZONES){if(z.fogT>=0&&z.fogT<1){z.fogT=Math.min(1,z.fogT+dt*.7);z.fog.material.opacity=.93*(1-z.fogT);z.fog.scale.y=Math.max(.01,1-z.fogT);z.sign.material.opacity=1-z.fogT;if(z.fogT>=1){z.fog.visible=false;z.sign.visible=false}}
    if(!G.zones[z.id]){z.sign.quaternion.copy(camera.quaternion);z.sign.position.y=130+Math.sin(G.t*1.5)*4}}
  // holes
  for(const h of G.holes){h.fish.visible=h.jump>0;if(h.jump>0){const k=1-h.jump/.6;h.fish.position.set(h.x+k*20,4+Math.sin(k*Math.PI)*55,h.y-k*10);h.fish.rotation.set(0,0,Math.sin(k*20)*.6)}}
  // spa
  if(G.zones.D){const s=G.spaV,on=G.spa.fuel>0;s.water.material.emissiveIntensity=on?.45+Math.sin(G.t*2)*.08:.05;s.bFire.material.emissiveIntensity=on?2.4:0;const n=on?Math.min(9,3+G.lv.spa*2):1;s.guests.forEach((g,i)=>{g.visible=i<n;g.position.y=5+Math.sin(G.t*1.4+i)*.8});
    G.spaStack.fill('cash',Math.min(220,Math.ceil(G.spa.pile/5)));if(G.spa.pile>1)label(SPA.pile.x,SPA.pile.y,30+G.spaStack.h,`$${G.spa.pile|0}`,'cash');
    label(SPA.boiler.x,SPA.boiler.y,90,on?bar(G.spa.fuel,'gold'):'<span class="lb warnbox" style="position:static">'+(DES()?'薪でポンプを動かす（動くとまわりが涼しい）':'薪を入れて沸かす（沸くとまわりが暖かい）')+'</span>','');if(on)label(SPA.x,SPA.y,150,'♨ ここも暖かい','gold sm')}
  {const mp=G.pads.find(q=>q.id==='monument');if(mp){mp.name=goalOf(YR()).n;const ox=YR()>1?150:0;if(mp.x!==MON.x+ox){mp.x=MON.x+ox;mp.mesh.mesh.position.x=mp.x;mp.mesh.icon.position.x=mp.x;mp._key=null}}}
  if(G.monument||YR()>1){G.monPop=Math.min(1,(G.monPop||0)+dt*.8);G.monV.visible=true;G.monV.scale.setScalar(easeOutBack(G.monPop)*(1+(YR()-(G.monument?1:2))*.3));G.monV.userData.flame.scale.set(1,1+Math.sin(G.t*9)*.15,1)}
  for(const h of G.hauls){h.m.position.set(h.x,h.carried?10+Math.abs(Math.sin(G.t*9))*4:0,h.y);h.m.rotation.y=h.carried?Math.sin(G.t*4)*.15:0;if(!h.carried)label(h.x,h.y,64,G.players.length>1?'巨大肉：2人で運ぶ':'巨大肉','gold sm')}
  for(const p of G.players)if(p.buddy&&!p.inHeat&&p.id===0){const o=G.players[1];if(o)label((p.x+o.x)/2,(p.y+o.y)/2,70,'♥ 寄り添い中（体温が下がりにくい）','red sm')}
  G.woodStack.fill('log',Math.min(40,G.woodpile));label(WOOD.x,WOOD.y,30+G.woodStack.h,G.woodpile>0?`薪置き場 ${G.woodpile}本（自動でかまど強化へ）`:'薪置き場：火が満タンの時の薪がたまる','note');
  syncChests();
  for(const f of G.floats){const age=f.max-f.life,sc=age<.25?easeOutBack(age/.25):1;label(f.x,f.y,f.h+age*30,f.txt,f.cls,Math.min(1,f.life*2),sc)}
}

// ---- the town grows: furnace, shops, towers, traps and houses change with progress
function tierPop(o,lv,list,dt){if(o._lv!==lv){if(o._lv!=null&&lv>o._lv){o._pop=0;const p=o._pos;if(p){burst(p.x,p.y,40,24,{c:['#ffd23f','#ffffff','#9fe0ff'],s0:60,s1:200,u0:150,u1:320,l0:.6,l1:1,add:true,r0:5,r1:9});SFX.build()}}o._lv=lv;list.forEach((t,i)=>t.visible=i<lv)}
  if(o._pop!=null&&o._pop<1){o._pop=Math.min(1,o._pop+dt*1.6);const t=list[Math.max(0,lv-1)];if(t)t.scale.setScalar(Math.max(.01,easeOutBack(o._pop)))}}
function shopTier(id){const n=G.lv['cook_'+id]+G.lv['price_'+id];return n>=(id==='steak'?5:4)?2:n>=2?1:0}
function syncRescue(dt){const R=G.rescue;let V=G.rescueV;
  if(V&&(!R||V.id!==R.id)){world.remove(V.g);G.rescueV=V=null}
  if(!R)return;
  if(!V){const g=new T.Group();g.position.set(R.x,0,R.y);const beam=M_(new T.CylinderGeometry(7,7,520,10,1,true),new T.MeshBasicMaterial({color:lin('#ff5a3a'),transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=260;g.add(beam);
    const ring=M_(new T.RingGeometry(52,60,40),new T.MeshBasicMaterial({color:lin('#ffd23f'),transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1;g.add(ring);
    g.add(at(rot(box(40,6,14,std('#8a5a30',{map:TEX.wood})),0,.4,.3),30,8,-18));const people=[];for(let i=0;i<R.n;i++){const a=i/R.n*TAU;const v=makeVillager(PALS[(R.id+i)%PALS.length],{noShadow:true});v.g.position.set(Math.cos(a)*20,0,Math.sin(a)*20);v.g.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a));g.add(v.g);people.push(v)}
    world.add(g);G.rescueV=V={id:R.id,g,beam,ring,people}}
  V.beam.material.opacity=R.state==='wait'?.35+Math.sin(G.t*6)*.2:.1;V.ring.scale.setScalar(1+Math.sin(G.t*5)*.06);V.ring.visible=R.state==='wait';
  const k=R.state==='fail'?1:R.state==='done'?0:(R.kind==='hot'&&R.hotDone?.2:1-R.t/R.max);const vis=R.kind==='sled'?R.left:R.n;V.people.forEach((v,i)=>{tintCold(v,Math.min(1,k*1.1));v.g.visible=R.state!=='done'&&i<vis;v.g.position.x+=R.state==='wait'?Math.sin(G.t*50+i)*.25*k:0});
  if(R.state==='wait'){const need=R.kind==='hot'?(R.hotDone?'温まった！そばに立て':'お湯が必要（かまどでくむ）'):R.kind==='sled'?`犬ぞりで運べ ${R.saved}/${R.n}`:R.kind==='bears'?(R.gb>0?`オオカミを倒せ 残り${R.gb}`:'そばに立て'):'そばに立て';
    label(R.x,R.y,120,`<span style="display:block;font-size:13px">SOS 遭難者${R.n}人${R.spec?`・${SPECN[R.spec]}`:''}</span><span style="display:block;font-size:12px;color:#ffe07a">${need}</span>${Math.ceil(R.t)}秒`+(R.hold>0?bar(100*R.hold/1.2,'gold'):''),'red big',1,1+(R.t<10?Math.abs(Math.sin(G.t*6))*.15:0))}
  for(const p of G.players)if(p.kettle>0){label(p.x,p.y,100,`♨ お湯 ${Math.ceil(p.kettle)}秒`,'gold sm');if(Math.random()<dt*8)puff(p.x,p.y,40,{r:4,life:.8,a:.6,vy:30,grow:2})}}
function syncSleds(dt){while(G.sledV.length<G.sleds.length){const v=makeSledMesh();world.add(v.g);G.sledV.push(v);burst(G.sleds[G.sledV.length-1].x,G.sleds[G.sledV.length-1].y,30,30,{c:['#ffd23f','#ffffff'],s0:60,s1:200,u0:120,u1:300,l0:.6,l1:1,add:true})}
  G.sleds.forEach((q,i)=>{const v=G.sledV[i],p=q.rider!=null?G.players[q.rider]:null;if(!v.st){v.st=new Stack(v.g,'pile');v.st.g.position.set(0,10,-26);v.st.g.scale.setScalar(.8)}v.st.set(p?[]:(q.cargo||[]));v.pas.g.visible=!!q.pass;if(p){v.g.position.set(p.x,0,p.y);v.g.rotation.y=p.dir;const run=Math.hypot(p.vx||0,p.vy||0)>30;v.dogs.forEach((d,j)=>{d.legs.forEach((l,k)=>l.rotation.x=run?Math.sin(G.t*18+j+k*1.6)*.8:0);d.tail.rotation.z=Math.sin(G.t*10+j)*.4;d.g.position.y=run?Math.abs(Math.sin(G.t*18+j))*2:0});
      if(run&&Math.random()<dt*14)puff(p.x-Math.sin(p.dir)*20,p.y-Math.cos(p.dir)*20,3,{r:8,life:.6,a:.8,vy:14,grow:1.2})}
    else{v.g.position.set(q.x,0,q.y);v.dogs.forEach((d,j)=>{d.legs.forEach(l=>l.rotation.x=0);d.tail.rotation.z=Math.sin(G.t*6+j)*.5;d.head.rotation.y=Math.sin(G.t*.7+j)*.4});const me=G.players[G.me]||G.players[0];if(me&&dist(me.x,me.y,q.x,q.y)<220)label(q.x,q.y,60,'乗る：犬ぞり','gold sm')}});}
function syncTown(dt){syncRescue(dt);syncSleds(dt);const v=G.v;v.f._pos={x:CX,y:CY};const ft=G.level>=7?3:G.level>=5?2:G.level>=3?1:0;tierPop(v.f,ft,v.f.tiers,dt);if(ft>=3)v.f.tiers[2].rotation.y=G.t*.5;
  for(const id in G.stations){const st=G.stations[id];if(!st.open)continue;st.ct._pos={x:st.def.counter.x,y:st.def.counter.y};tierPop(st.ct,shopTier(id),st.ct.tiers,dt)}
  for(const tw of TOWERS){const m=G.towerV[tw.id],lv=G.lv['tw_'+tw.id];m.g.visible=lv>0;m._pos={x:tw.mx,y:tw.my};tierPop(m,lv,m.tiers,dt)}
  G.trapV.forEach(m=>{m.visible=G.lv.trap>0;m.scale.setScalar(.75+G.lv.trap*.15)});
  const pop=G.surv.filter(s=>!s.frozen).length+G.workers.length;
  const rk=G.rank||0;syncStages(dt);
  if((G.level||1)>=8&&isNight()&&Math.random()<dt*1.2){const x=rnd(900,1500),y=rnd(900,1500),c=['#ffd23f','#ff8ad8','#7fe3ff','#8ff08f'][Math.floor(rnd(0,4))];burst(x,y,rnd(260,380),40,{c:[c,'#ffffff'],s0:80,s1:200,u0:-40,u1:60,g:60,l0:.8,l1:1.4,add:true,r0:5,r1:9});if(Math.random()<.5)tone(rnd(300,500),.15,'triangle',.02,-.5)}
  for(const [hi,h] of G.houses.entries()){const lv=houseLv(hi);h._pos={x:h.x,y:h.y};tierPop(h,lv,[h.tent,h.cab,h.man],dt);if(lv===3){h.tent.visible=h.cab.visible=false}if(lv===2){h.tent.visible=false;if(Math.random()<dt*1.5){const a=h.g.rotation.y;puff(h.x+Math.cos(a)*17-Math.sin(a)*8*0,h.y-Math.sin(a)*17,72,{c:'#c9d3dd',r:6,life:1.8,a:.5,vy:26,vx:G.wind*14,grow:2.2})}}}}
// ================================================================ guide arrow
const guide=(()=>{const g=new T.Group();const gm=glow('#ffd23f',1.2);const arrow=grp(at(rot(cone(10,18,gm,4,false),Math.PI,0,0),0,0,0),at(box(8,14,8,gm,false),0,15,0));
  const ring=rot(M_(new T.RingGeometry(22,28,32),basic('#ffd23f',{transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0);g.add(arrow,ring);scene.add(g);
  const chev=[0,1,2].map(()=>{const m=M_(new T.ShapeGeometry(new T.Shape([new T.Vector2(-9,-4),new T.Vector2(0,7),new T.Vector2(9,-4),new T.Vector2(0,0)])),basic('#ffd23f',{transparent:true,side:T.DoubleSide,depthWrite:false}),false);m.rotation.x=-Math.PI/2;scene.add(m);return m});
  return{set(tg,p,t){const show=!!tg&&running;g.visible=show;chev.forEach(c=>c.visible=false);if(!show)return;g.position.set(tg.x,0,tg.y);arrow.position.y=(tg.h||60)+Math.abs(Math.sin(t*4))*12;arrow.rotation.y=t*2;ring.scale.setScalar(1+Math.sin(t*5)*.1);
    const d=dist(p.x,p.y,tg.x,tg.y);if(d>110){const a=Math.atan2(tg.x-p.x,tg.y-p.y);chev.forEach((c,i)=>{c.visible=true;const k=30+i*15+((t*40)%15);c.position.set(p.x+Math.sin(a)*k,1.5,p.y+Math.cos(a)*k);c.rotation.set(-Math.PI/2,0,-a+Math.PI);c.material.opacity=.9-i*.25})}}}})();

// ================================================================ camera & frame
const cam={x:CX,y:CY+80,z:1};let nightK=0;
function updateCam(dt,snap){const ps=NET.mode==='solo'?G.players:[G.players[G.me]||G.players[0]];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,cx=0,cy=0;
  for(const p of ps){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);cx+=p.x/ps.length;cy+=p.y/ps.length}
  let z=1;if(ps.length>1)z=clamp(Math.min(1,700/(Math.hypot(x1-x0,y1-y0)+300)),.5,1);
  if(G.camPan&&G.camPan.t<(G.camPan.d||2.2)){const D=G.camPan.d||2.2;G.camPan.t+=dt;const k=G.camPan.t<.5?G.camPan.t/.5:G.camPan.t>D-.5?Math.max(0,1-(G.camPan.t-(D-.5))/.5):1;cx=lerp(cx,G.camPan.x,k*.85);cy=lerp(cy,G.camPan.y,k*.85);z=lerp(z,G.camPan.z||.62,k)}
  cam.z=snap?z:lerp(cam.z,z,Math.min(1,dt*3));if(snap){cam.x=cx;cam.y=cy}else{cam.x=lerp(cam.x,cx,Math.min(1,dt*6));cam.y=lerp(cam.y,cy,Math.min(1,dt*6))}}
function hideIdleFx(dt){secretFx(dt||.016);roadFx();caravanFx();const me=G.players[G.me]||G.players[0];if(me&&G.sleds){if(me.riding)label(me.x,me.y,120,'<small>Fキーで降りる</small>','');else{const q=G.sleds.find(q=>q.rider==null&&dist(me.x,me.y,q.x,q.y)<90);if(q)label(q.x,q.y,50,'<b>Fキーで乗る</b>','gold')}}}
function monBar(){if(G.raid&&G.raid.on&&G.raid.final&&G.monMax&&G.monV&&G.monV.visible)label(G.monV.position.x,G.monV.position.z,170,bar(100*Math.max(0,G.monHP)/G.monMax,'red'),'')}
function frozenFx(){for(const v of G.surv)if(v.frozen&&v.m&&v.m.g.visible)label(v.x,v.y,82,`<b>${DES()?'倒れた町人':'凍えた町人'}</b><br><small>${DES()?'そばに立つと助け起こせる':'そばに立つと溶ける'}</small><br>${bar(100*Math.min(1,v.warm/35),'gold wide')}`,'ice')}
function hideIdle(){let shown=0;for(const v of G.surv){const idle=v.arrived&&!v.frozen;const vis=!idle||shown++<5;if(v.m&&v.m.g.visible!==vis)v.m.g.visible=vis}}
function frame(dt){hideIdle();monBar();frozenFx();vigFx();hideIdleFx(dt);
  const phase=(G.t%G.DAY)/G.DAY,nk=phase>.72?Math.min(1,(phase-.72)/.06):phase<.04?1-phase/.04:0;nightK=lerp(nightK,nk*(running?1:0)+(G.wave?.2:0),Math.min(1,dt*2));
  const K=Math.min(1,nightK);const dz=DES();scene.fog.color.copy(dz?FOG_DES:FOG_DAY).lerp(FOG_NIGHT,K);sky.material.uniforms.top.value.copy(lin(dz?'#5aa3e6':'#6fa9d8')).lerp(lin('#0b1530'),K);sky.material.uniforms.mid.value.copy(lin(dz?'#f2d6a4':'#bcd0e2')).lerp(lin('#1b2a44'),K);sky.material.uniforms.bot.value.copy(lin(dz?'#f5ddb0':'#c9d7e4')).lerp(lin('#24344f'),K);
  {const wt=G.wx&&G.wx.type,k=wt?Math.min(1,G.wx.t/2,(G.wx.max-G.wx.t)/2+.001):0;$('wxFx').style.opacity=running&&wt==='blizzard'?.85*k:0;
    if(wt==='aurora'){const a=Math.sin(G.t*.8)*.5+.5;sky.material.uniforms.top.value.lerp(lin(a>.5?'#2fd49a':'#7a5cff'),.55*k);sky.material.uniforms.mid.value.lerp(lin('#1d5a6a'),.35*k)}
    if(wt==='clear'){sky.material.uniforms.top.value.lerp(lin('#3f95e8'),.6*k)}}
  hemi.intensity=(.55-K*.37)*(G.wx&&G.wx.type==='clear'?1.25:1);sun.intensity=(1.0-K*.72)*(G.wx&&G.wx.type==='clear'?1.3:1);sun.color.copy(K>.4?lin('#9fb8ff'):lin('#fff0dc'));
  {const mp=G.players[G.me]||G.players[0];$('coldFx').style.opacity=running?Math.max(G.wave?.45:0,(mp.down>0?1:(mp.warm<50?(1-mp.warm/50):0))*.95):0}
  const hurt=Math.max(...G.players.map(p=>p.hurt));cv.style.filter=hurt>0?`sepia(${hurt}) saturate(${1+hurt*4}) hue-rotate(-30deg)`:'';
  const D=Math.max(390/(2*TANH*camera.aspect),560/(2*TANH))/cam.z;
  const shx=(Math.random()-.5)*G.shake,shy=(Math.random()-.5)*G.shake,tx=cam.x+shx,tz=cam.y+shy;
  camera.position.set(tx+camDir.x*D,camDir.y*D,tz+camDir.z*D);camera.lookAt(tx,0,tz);camera.updateMatrixWorld();{const bz=G.wx&&G.wx.type==='blizzard';scene.fog.near=D*(bz?.55:1.5);scene.fog.far=D*(bz?1.6:4.2)}
  sun.position.set(tx-380,760,tz+240);sun.target.position.set(tx,0,tz);
  const scale=PR*H/(2*TANH);psN.update(dt,scale);psA.update(dt,scale);snow.update(dt,cam.x,cam.y,G.wind+(wxIs('blizzard')?2.2:0),wxIs('blizzard')?1:wxIs('clear')?.08:Math.min(1,.35+G.day*.08+(G.wave?.5:0)),scale);sparkle.uniforms.uT.value=G.t;sparkle.uniforms.uS.value=scale;
  sync(dt);
  const gp=G.players[G.me]||G.players[0];const coldT=gp&&!gp.inHeat&&!gp.down&&gp.warm<35?{x:CX,y:CY,h:130}:null;
  {const el=$('sosArrow'),R=G.rescue;if(running&&R&&R.state==='wait'){pv.set(R.x,60,R.y).project(camera);let sx=(pv.x+1)/2*W,sy=(1-pv.y)/2*H;const behind=pv.z>1;if(behind){sx=W-sx;sy=H-sy}
    const top=150,m=44,mx=86,on=!behind&&sx>m&&sx<W-m&&sy>top&&sy<H-90;if(on)el.hidden=true;else{el.hidden=false;const cx=W/2,cy=(top+H-90)/2;let dx=sx-cx,dy=sy-cy;const k=Math.min((W/2-mx)/Math.abs(dx||1e-3),((H-90-top)/2)/Math.abs(dy||1e-3));const ex=cx+dx*Math.min(1,k),ey=cy+dy*Math.min(1,k);
      const d=Math.round(dist(gp.x,gp.y,R.x,R.y)/10);el.style.transform=`translate(${ex|0}px,${ey|0}px) translate(-50%,-50%)`;el.firstChild.style.transform=`rotate(${Math.atan2(dy,dx)+Math.PI/2}rad)`;$('sosTxt').textContent=`SOS ${Math.ceil(R.t)}秒・${d}m`}}else el.hidden=true}
  guide.set(running?(coldT||(G.fuel<25&&!G.raid.on?(has(gp,DES()?'water':'log')?{x:CX,y:CY,h:110}:(DES()?freeHole(gp):nearestTree(gp))):null)||rescueT(gp)||storyT(gp)||(MISSIONS[G.mission]?MISSIONS[G.mission].tg(gp):flow(gp))):null,gp,G.t);
  storyVis();warnFx();driftFx();fireFx();npcFx();rankFx();caveFx();cullWorld();if(composer)composer.render();else renderer.render(scene,camera);endLabels();
  joys.forEach((j,i)=>{const el=$('joy'+i);if(!j.on){el.hidden=true;return}el.hidden=false;el.style.left=j.ox+'px';el.style.top=j.oy+'px';const dx=j.x-j.ox,dy=j.y-j.oy,m=Math.hypot(dx,dy),k=m>50?50/m:1;el.firstChild.style.transform=`translate(${dx*k}px,${dy*k}px)`;el.firstChild.style.background=nPlayers===2?HERO[i].tag:'#fff'});
}
// ================================================================ HUD
function vigFx(){const el=$('vig');if(!el)return;const me=G.players[G.me]||G.players[0];let c='';if(running&&me){if(!me.inHeat&&me.warm<30&&!me.down)c=DES()?'heat':'frost';else if(G.raid&&G.raid.on)c='raid';else if(G.fuel<15)c='dim'}if(el._c!==c){el._c=c;el.className=c}}
function hudInit(){const fn=$('hFurnN');if(fn)fn.textContent=DES()?'井戸':'かまど';const ft=$('hFuelTxt');if(ft)ft.textContent=DES()?'水位':'燃料';const fz=$('hFrzN');if(fz)fz.textContent=DES()?'倒れた町人':'凍った町人';$('hBody').innerHTML=[G.players[G.me]||G.players[0]].map(p=>`<div class="bodyt" id="bt${p.id}"><i id="bti${p.id}"></i><span><span id="btt${p.id}">体温</span></span></div>`).join('');$('bottom').innerHTML=`<div class="pill" id="lvBox"><span class="lvb">Lv <span id="hPlv">1</span></span><span class="xpb"><i id="hXp"></i></span></div>`+G.players.map(p=>`<div class="pill pc" id="pc${p.id}">${G.players.length>1?`<span class="tg" style="background:${HERO[p.id].tag}">${HERO[p.id].tagText}</span>`:''}<svg class="icon" viewBox="0 0 26 22"><path d="M4 8h18l-2 12H6z" fill="#c98a4b"/><path d="M4 8h18" stroke="#8a5a30" stroke-width="2.4" stroke-linecap="round"/><path d="M8 8c0-5 10-5 10 0" fill="none" stroke="#8a5a30" stroke-width="2"/><path d="M7 12h12M7.5 16h11" stroke="#a8743f" stroke-width="1.4"/></svg><span class="num sm" id="pcv${p.id}"></span><span class="hpb"><i id="hp${p.id}"></i></span></div>`).join('')}
function hud(){lifeHud();qlogHud();trackerHud();G.cashShow+=(G.cash-G.cashShow)*.2;if(Math.abs(G.cash-G.cashShow)<1)G.cashShow=G.cash;$('hCash').textContent=Math.round(G.cashShow).toLocaleString();
  $('hDay').textContent=G.day;$('hTemp').textContent=tempC()+'℃';$('hDayIco').textContent=isNight()?'☾':'☀';$('hDayBox').classList.toggle('night',isNight());
  $('hLv').textContent=G.level;$('hFuel').style.width=G.fuel+'%';$('hFuelBar').classList.toggle('low',G.fuel<20);$('hFuelTxt').textContent=DES()?(G.fuel<20?'水がない！':'水位'):G.wave?'大寒波！':G.fuel<20?'燃料がない！':'燃料';
  const idle=idleSurvivors().length;$('hIdle').textContent=popNow();$('hPop').textContent=houseCap();$('hPopBox').classList.toggle('warn',popNow()>=houseCap());$('hFrz').textContent=G.frozen;$('hFrzBox').classList.toggle('warn',G.frozen>=3);
  const r=Math.round(G.rep);$('hRep').textContent='★'.repeat(r)+'☆'.repeat(5-r);$('hRepBox').classList.toggle('warn',G.rep<=1.5);
  {const R=G.rescue,on=!!R&&R.state==='wait';$('hSos').hidden=!on;if(on)$('hSosN').textContent=Math.ceil(R.t)}
  {const key=G.mods?G.mods[0].id+G.mods[1].id+'|'+(G.secFound||0)+'|'+DM().n:'';if(G.mods&&$('hModTxt')._m!==key){$('hModTxt')._m=key;$('hModTxt').innerHTML=`${DM().n}<br>◎${G.mods[0].t}<br>✕${G.mods[1].t}<br>ひみつ ${G.secFound||0}/${G.secrets?G.secrets.length:0}`}}
  {const rk=G.rank||0,nx=RANKS[rk+1];$('hRank').textContent=nx?`${RANKS[rk].n}・次${nx.p}人`:RANKS[rk].n}
  {const w=G.wx&&G.wx.type?WXS.find(q=>q.id===G.wx.type):null;$('hWx').hidden=!w;if(w){$('hWxN').textContent=w.ic+' '+w.n;$('hWxT').textContent=Math.ceil(G.wx.t)}}
  $('hRaid').hidden=!G.raid.on;if(G.raid.on)$('hRaidN').textContent=G.raid.left;
  $('hPlv').textContent=G.plv;$('hXp').style.width=(100*G.xp/xpNeed())+'%';
  for(const p of G.players){$('pcv'+p.id).textContent=`${p.bag.length}/${cap(p)}`;$('pc'+p.id).classList.toggle('full',p.bag.length>=cap(p));$('hp'+p.id).style.width=p.hp+'%';if(!$('bti'+p.id))continue;$('bti'+p.id).style.width=p.warm+'%';$('bt'+p.id).classList.toggle('cold',p.warm<30&&!p.down);$('bt'+p.id).classList.toggle('warm',!!p.inHeat&&p.warm<99);const tw=TW();$('btt'+p.id).textContent=(p.down?(DES()?'干からびた…':'こごえた…'):p.buddy&&!p.inHeat?`${tw} ${p.warm|0}% ♥寄り添い`:p.warm<30?`${tw} ${p.warm|0}% あぶない！`:p.inHeat?(p.warm<99?`${tw} ${p.warm|0}% 回復中`:(DES()?'水分 100% うるおい':'体温 100% ぽかぽか')):`${tw} ${p.warm|0}% 下がり中`)}
  if(storyHud()){}else if(G.mission<MISSIONS.length){const m=MISSIONS[G.mission],[c,g]=m.f();$('mN').textContent=`${G.mission+1}/${MISSIONS.length}`;$('mT').textContent=m.t;$('mP').textContent=`${Math.min(c,g)}/${g}`}
  else{const g=goalOf(YR());$('mN').textContent=G.story&&CH[G.story.ch]?CH[G.story.ch].n:`${YR()}年目`;$('mT').textContent=`${g.n}を建てろ（かまどLv${g.lv}・町人${g.pop}人）`;$('mP').textContent=`$${g.c.toLocaleString()}`}}

// ================================================================ flow
function show(el,on){$(el).hidden=!on}







// ================================================================ exploration (story mode): mining, life challenges, the ice cave, the bestiary
const cnt=(p,k,n=1)=>{if(!p||!isRPG())return;p.cnt=p.cnt||{};p.cnt[k]=(p.cnt[k]||0)+n};
const bkId=b=>b.rbi!=null?'rb'+b.rbi:(b.m&&b.m.key==='Spider')?(b.kind==='boss'?'spq':'sp'):b.bt?b.bt:b.kind;
const BOOK=[['normal','雪オオカミ'],['big','黒オオカミ'],['boss','森の大オオカミ'],['charge','突進ヘラジカ'],['frost','氷息のオオカミ'],['alpha','群れの長'],['king','白き王'],['rb0','鋼角のヘラジカ'],['rb2','氷の魔獣'],['rb3','雪原の覇者'],['sp','洞窟グモ'],['spq','洞窟の女王グモ']];
const RTK_MINE={iron:{life:'mine',mat:'iron',n:'鉄鉱石の岩',rq:0,hp:5,prop:'Mineral',tint:'#8a8f99',h:44,cash:20},icec:{life:'mine',mat:'icec',n:'氷晶の結晶',rq:2,hp:6,prop:'Crystal1',tint:'#bfe9ff',em:'#4fb8ff',h:64,cash:70},star:{life:'mine',mat:'star',n:'星の結晶',rq:4,hp:8,prop:'Crystal3',tint:'#ffe38a',em:'#ffc629',h:74,cash:220}};
const NODES_SNOW=[['iron',1500,640],['iron',900,650],['iron',2120,300],['iron',1870,2200],['iron',1960,2310],['iron',2030,2170],['icec',2160,2300],['icec',2310,2190],['icec',160,900],['star',2310,1890]];
function mkNode(k){const K=RTK[k],g=new T.Group();let tr;const P=KK&&KK.prop&&KK.prop[K.prop];
  if(P){tr=P.scene.clone(true);tr.scale.setScalar(K.h/Math.max(.01,P.h));tr.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.lerp(lin(K.tint),.6);if(K.em){o.material.emissive=lin(K.em);o.material.emissiveIntensity=.5}o.castShadow=true}})}
  else{tr=at(M_(new T.OctahedronGeometry(K.h*.4,0),std(K.tint,{e:K.em||'#000000',ei:K.em?.5:0}),true),0,K.h*.4,0)}
  const grp2=new T.Group();grp2.add(tr);for(const [dx,dz,s2] of [[26,10,.55],[-22,14,.45]]){const c=tr.clone(true);c.scale.multiplyScalar(s2);c.position.set(dx,0,dz);c.rotation.y=dx;grp2.add(c)}
  g.add(grp2);g.userData.tr=grp2;const ring=M_(new T.RingGeometry(40,46,32),new T.MeshBasicMaterial({color:lin(K.em||'#9aa3ad'),transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1.4;g.add(ring);
  const stump=at(scl(sph(18,std('#5c6470',{r:.9}),false,8,6),1.4,.35,1.2),0,2,0);stump.visible=false;g.add(stump);g.userData.stump=stump;return g}
// ---- life challenges ("お題")
const CHAL={wood:[['木を30本切る','chop',30],['大きな古木を切りたおす','rt_old',1],['木を150本切る','chop',150],['氷結樹を切りたおす','rt_ice',1],['精霊の大樹を切りたおす','rt_spirit',1]],
  hunt:[['オオカミを10頭たおす','kill',10],['ボスを1体たおす','boss',1],['襲撃でオオカミを20頭たおす','raidk',20],['鋼角のヘラジカをたおす','bk_rb0',1],['洞窟の女王グモをたおす','bk_spq',1]],
  fish:[['魚を10匹釣る','fish',10],['魚を40匹釣る','fish',40],['ぬしの穴で大物を釣る','bigfish',1],['大物を5回釣る','bigfish',5]],
  mine:[['鉄鉱石を10個掘る','iron',10],['鉄鉱石を40個掘る','iron',40],['氷晶を5個掘る','icec',5],['星の結晶を掘る','star',1]],
  craft:[['吹雪の工房で木工品を5個作る','carve',5],['工房で装備を1つ作る','cr_eq',1],['会心の出来を5回出す','great',5],['工房で装備を3つ作る','cr_eq',3]],
  smith:[['鉄の剣を鍛える','mk_w_ironsword',1],['武器や防具を3つ鍛える','sm',3],['氷晶の剣を鍛える','mk_w_icesword',1],['星の大剣を鍛える','mk_w_starsword',1]]};
function updateChallenges(){if(!isRPG())return;for(const p of G.players){p.chd=p.chd||[];const c=p.cnt||{};for(const k of LIVES)(CHAL[k]||[]).forEach((ch,i)=>{const id=k+i;if(p.chd.includes(id))return;if((c[ch[1]]||0)>=ch[2]){p.chd.push(id);lifeXp(p,k,25);const v=100+i*80;G.cash+=v;G.earned+=v;float(p.x,p.y,140,`お題達成！ ${ch[0]}（${LIFE[k].n}）+$${v}`,'gold',true);SFX.rare()}})}}
// ---- the ice cave (south-east corner, entered from the frozen lake)
const CAVE_BOX=[1790,1830,2370,2370],CAVE_IN={x:1800,y:1560},CAVE_START={x:1880,y:2300},CAVE_OUT={x:1850,y:2210};
const CWALLS=[[1790,1830,2370,1860],[1790,2340,2370,2370],[1790,1830,1820,2370],[2340,1830,2370,2370],[1790,2090,2240,2110],[2330,2090,2370,2110],[2070,2110,2090,2190],[2070,2270,2090,2370]];
const CHEATS=[{x:1900,y:2250,r:120}];
const caveOn=()=>isRPG()&&!DES();
function caveWarm(x,y){return caveOn()&&CHEATS.some(h=>dist(x,y,h.x,h.y)<h.r)}
function caveWalls(e,r){if(!caveOn()||e.x<CAVE_BOX[0]-40||e.y<CAVE_BOX[1]-40)return;for(const w of CWALLS)pushRect(e,w[0],w[1],w[2],w[3],r||12)}
const CSPAWN=[{x:1980,y:2250,k:'normal'},{x:2030,y:2320,k:'normal'},{x:1900,y:2160,k:'normal'},{x:2200,y:2200,k:'big'},{x:2280,y:2280,k:'big'},{x:2180,y:2320,k:'big'},{x:2100,y:1960,k:'boss'}];
const CCHEST=[{x:2030,y:2140,tier:1},{x:2300,y:2310,tier:2},{x:2090,y:1890,tier:3}];
const CLOOT={1:['w_icicle','c_lantern'],2:['a_silk','w_bluehammer'],3:['w_queenfang','c_starring']};
function updateCave(dt){if(!caveOn())return;G.cave=G.cave||{sp:CSPAWN.map(()=>3),ch:CCHEST.map(()=>({open:0,rt:0}))};const C=G.cave;
  CSPAWN.forEach((S,i)=>{if(G.bears.some(b=>b.cidx===i&&!b.dead))return;C.sp[i]-=dt;if(C.sp[i]>0)return;C.sp[i]=S.k==='boss'?240:120;let b;
    if(S.k==='boss'){b=spawnBoss('queen',true);b.hp=b.max=Math.round(b.max*4)}else{b=spawnBear('A',true);b.kind=S.k;b.hp=b.max=Math.round((S.k==='big'?16:8)*DM().hp*(1+(YR()-1)*.25))}
    world.remove(b.m.g);const sc=b.m.g.scale.x;const bt=b.bt;b.m=makeBear(b.kind,'Spider');if(bt)setBtLook(b,bt);b.m.g.scale.setScalar(S.k==='boss'?2.4:S.k==='big'?1.4:1);world.add(b.m.g);b.zone='K';b.cave=1;b.cidx=i;b.home={x:S.x,y:S.y};b.x=S.x;b.y=S.y;b.m.g.position.set(b.x,0,b.y)});
  CCHEST.forEach((c,i)=>{const st=C.ch[i];if(st.open){st.rt-=dt;if(st.rt<=0)st.open=0;return}const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,c.x,c.y)<55);if(!p){st.t=0;return}st.t=(st.t||0)+dt;if(st.t<1)return;st.open=1;st.rt=G.DAY*1.5;
    const pool=CLOOT[c.tier].filter(id=>!(p.items||[]).includes(id));if(pool.length)giveItem(p,pool[Math.floor(Math.random()*pool.length)]);addMat(p,c.tier>=3?'star':c.tier===2?'icec':'iron',c.tier===3?1:3);const v=60*c.tier*(1+G.day*.05)|0;G.cash+=v;G.earned+=v;cnt(p,'chest');
    banner('宝箱を開けた！',`+$${v}`,c.tier===3?'洞窟の奥の宝だ！':'','r-SSR');SFX.chest&&SFX.chest();burst(c.x,c.y,30,30,{c:['#ffd23f','#ffffff'],s0:60,s1:200,u0:150,u1:300,l0:.6,l1:1,add:true})})}
let _cvT=0;
function caveFx(){if(!G||!running)return;const on=caveOn();const me=G.players[G.me]||G.players[0];
  if(!G.caveV){const g=new T.Group();const stone=std('#5c6b7a',{map:TEX.stone,r:.95}),dark=std('#2a323c',{r:1});
    const fl=M_(new T.PlaneGeometry(CAVE_BOX[2]-CAVE_BOX[0],CAVE_BOX[3]-CAVE_BOX[1]),std('#3c4652',{map:TEX.stone,r:1}),false,true);fl.rotation.x=-Math.PI/2;fl.position.set((CAVE_BOX[0]+CAVE_BOX[2])/2,.25,(CAVE_BOX[1]+CAVE_BOX[3])/2);g.add(fl);
    for(const w of CWALLS){const m=M_(new T.BoxGeometry(w[2]-w[0],150,w[3]-w[1]),stone,true,true);m.position.set((w[0]+w[2])/2,75,(w[1]+w[3])/2);g.add(m);const cap=M_(new T.BoxGeometry(w[2]-w[0]+4,8,w[3]-w[1]+4),std('#eef4fa',{r:.9}),false);cap.position.set((w[0]+w[2])/2,154,(w[1]+w[3])/2);g.add(cap)}
    for(let i=0;i<22;i++){const x=rnd(CAVE_BOX[0]+50,CAVE_BOX[2]-50),y=rnd(CAVE_BOX[1]+50,CAVE_BOX[3]-50);if(CWALLS.some(w=>x>w[0]-20&&x<w[2]+20&&y>w[1]-20&&y<w[3]+20))continue;g.add(at(rot(cone(rnd(4,8),rnd(14,30),glow(i%3?'#7fd4ff':'#c9a2ff',1.4),5,false),0,0,rnd(-.3,.3)),x,6,y))}
    for(const h of CHEATS){g.add(at(cyl(16,20,10,dark,10),h.x,5,h.y));g.add(at(cone(12,26,glow('#ffa23d',2.4),8,false),h.x,24,h.y));const l=new T.PointLight(lin('#ffa050'),1.6,300,1.5);l.position.set(h.x,60,h.y);g.add(l)}
    const mouth=new T.Group();mouth.position.set(CAVE_IN.x,0,CAVE_IN.y);mouth.add(at(scl(sph(70,stone,true,12,8),1.4,1,1),0,20,-30),at(box(90,70,6,dark),0,35,8));const ms=makeTextPlate('氷の洞窟',90,24,'rgba(255,250,240,.92)','#3a4a5a',.5);ms.position.set(0,110,0);ms.userData.bb=true;mouth.add(ms);g.userData.ms=ms;
    const pin=M_(new T.RingGeometry(34,42,32),new T.MeshBasicMaterial({color:lin('#7fd4ff'),transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}),false);pin.rotation.x=-Math.PI/2;pin.position.set(0,1.5,30);mouth.add(pin);g.add(mouth);g.userData.mouth=mouth;
    const out=M_(new T.RingGeometry(30,38,32),new T.MeshBasicMaterial({color:lin('#ffd166'),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false);out.rotation.x=-Math.PI/2;out.position.set(CAVE_OUT.x,1.5,CAVE_OUT.y);g.add(out);
    g.userData.chests=CCHEST.map(c=>{const cg=new T.Group();cg.position.set(c.x,0,c.y);const mk=nm=>{const P=KK&&KK.prop&&KK.prop[nm];if(!P)return at(box(30,22,20,std(c.tier===3?'#ffcf4a':'#8a5a30')),0,11,0);const o=P.scene.clone(true);o.scale.setScalar(34/Math.max(.01,P.w));if(c.tier===3)o.traverse(q=>{if(q.isMesh){q.material=q.material.clone();q.material.emissive=lin('#a86a00');q.material.emissiveIntensity=.4}});return o};const cl=mk('Chest_Closed'),op=mk('Chest_Open');op.visible=false;cg.add(cl,op);g.add(cg);return{cg,cl,op}});
    world.add(g);G.caveV=g}
  const V=G.caveV;V.visible=on;if(!on||!me)return;V.userData.ms.quaternion.copy(camera.quaternion);
  const C=G.cave;V.userData.chests.forEach((o,i)=>{const op=!!(C&&C.ch[i]&&C.ch[i].open);o.cl.visible=!op;o.op.visible=op;const c=CCHEST[i];if(!op&&dist(me.x,me.y,c.x,c.y)<220)label(c.x,c.y,50,`<b>${c.tier===3?'黄金の宝箱':'宝箱'}</b><br><small>そばに立つと開く</small>`,'')});
  // portals (each player moves themself)
  const now=performance.now(),dt=Math.min(.3,(now-_cvT)/1000);_cvT=now;const inCave=me.x>CAVE_BOX[0]&&me.y>CAVE_BOX[1];
  if(!G.zones.B&&!inCave){if(dist(me.x,me.y,CAVE_IN.x,CAVE_IN.y)<300)label(CAVE_IN.x,CAVE_IN.y,90,'<b>氷の洞窟</b><br><small>🔒 氷の湖を解放すると入れる</small>','note');return}
  const P=inCave?CAVE_OUT:{x:CAVE_IN.x,y:CAVE_IN.y+30},d=dist(me.x,me.y,P.x,P.y);if(d<320)label(P.x,P.y,inCave?60:90,inCave?`<b>出口</b><br><small>立つと外へ出る</small>`:`<b>氷の洞窟</b><br><small>立つと中へ入る（宝箱・鉱石・強い魔物）</small>`,'');
  if(d<40&&!(me.down>0)&&!me.riding){me.ptT=(me.ptT||0)+dt;if(me.ptT>1.1){me.ptT=0;const T2=inCave?{x:CAVE_IN.x,y:CAVE_IN.y+90}:CAVE_START;me.x=T2.x;me.y=T2.y;me.vx=me.vy=0;updateCam(0,true);SFX.area();if(!inCave)banner('氷の洞窟','ひんやりと冷たい…','焚き火のまわりだけは暖かい。奥に宝が眠っている','cold',true)}}else me.ptT=0}
function statusTab(me){const tab=G._stab||'eq',rows=$('lifeRows'),lct=document.querySelector('#lifeCard .lct');const tabs=`<div style="display:flex;gap:4px;margin-bottom:6px">${[['eq','装備'],['life','くらし'],['chal','お題'],['book','図鑑']].map(([k,n])=>`<button data-tab="${k}" style="flex:1;font:inherit;font-size:11px;font-weight:800;border:2px solid #16283a;border-radius:8px;padding:3px;background:${tab===k?'#ffd23f':'#fff'};cursor:pointer">${n}</button>`).join('')}</div>`;
  if(tab==='eq'){$('rpgBox').innerHTML=tabs+rpgBoxHtml(me);rows.innerHTML='';lct.style.display='none';return true}
  if(tab==='life'){$('rpgBox').innerHTML=tabs;lct.style.display='';return false}
  lct.style.display='none';rows.innerHTML='';const c=me.cnt||{},chd=me.chd||[];
  if(tab==='chal'){$('rpgBox').innerHTML=tabs+LIVES.map(k=>`<div style="margin:4px 0"><b style="color:${LIFE[k].c}">${LIFE[k].n}</b>${(CHAL[k]||[]).map((ch,i)=>{const done=chd.includes(k+i);return `<div style="font-size:11.5px;${done?'color:#2f8a3a':''}">${done?'✓':'・'} ${ch[0]} <small>${done?'':`${Math.min(c[ch[1]]||0,ch[2])}/${ch[2]}`}</small></div>`}).join('')}</div>`).join('')+'<small>お題を達成すると、くらしの経験とお金がもらえる</small>';return true}
  const own=me.items||[],all=Object.keys(ITEMS);$('rpgBox').innerHTML=tabs+`<b>装備 ${own.length}/${all.length}</b><div style="font-size:11px;line-height:1.6">${all.map(id=>own.includes(id)?ITEMS[id].n:'？？？').join('・')}</div>
    <b style="display:block;margin-top:6px">魔物 ${BOOK.filter(([id])=>c['bk_'+id]).length}/${BOOK.length}</b><div style="font-size:11px;line-height:1.6">${BOOK.map(([id,n])=>c['bk_'+id]?`${n}（${c['bk_'+id]}）`:'？？？').join('・')}</div>`;return true}
$('lifeCard').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b)return;G._stab=b.dataset.tab;lifeHud(true)});

// ---- workshop recipes: special wood and beast materials become gear
const MATS={iron:'鉄鉱石',icec:'氷晶',star:'星の結晶',silk:'クモの糸',core:'古木の芯材',icew:'氷結木材',spirit:'精霊の枝',steel:'鋼の角',fang:'氷牙',horn:'覇者の角'};
function addMat(p,k,n){if(!p||!k)return;p.mats=p.mats||{};p.mats[k]=(p.mats[k]||0)+n;float(p.x,p.y,100,`${MATS[k]} +${n}`,'gold',true)}
const RECIPES={
  bow_old:{id:'w_oldbow',m:{core:3},log:10,cash:100,rk:1},shield_old:{id:'a_oldshield',m:{core:2,steel:1},log:6,cash:150,rk:1},
  staff_ice:{id:'w_icestaff',m:{icew:3,fang:1},log:8,cash:300,rk:2},armor_ice:{id:'a_icearmor',m:{icew:2,steel:2},log:8,cash:400,rk:3},
  sw_iron:{life:'smith',id:'w_ironsword',m:{iron:4},cash:80,rk:0},ax_iron:{life:'smith',id:'w_ironaxe',m:{iron:5,core:1},cash:120,rk:1},ar_iron:{life:'smith',id:'a_iron',m:{iron:8,steel:1},cash:200,rk:1},
  sw_ice:{life:'smith',id:'w_icesword',m:{icec:3,iron:3,fang:1},cash:400,rk:2},ch_star:{life:'smith',id:'c_star',m:{star:1,icec:2},cash:500,rk:3},sw_star:{life:'smith',id:'w_starsword',m:{star:2,icec:3,horn:1},cash:900,rk:4},silk_cloak:{id:'a_silk',m:{silk:6,core:1},log:4,cash:200,rk:1},
  charm_spirit:{id:'c_spiritcharm',m:{spirit:1,core:3},log:5,cash:400,rk:3},bow_spirit:{id:'w_spiritbow',m:{spirit:2,horn:1,icew:2},log:12,cash:800,rk:4}};
function craftWhy(p,R){const lf=R.life||'craft';if(lifeRank(p,lf)<R.rk)return `${LIFE[lf].n}「${LR[R.rk].n}」が必要`;for(const k in R.m)if(((p.mats||{})[k]||0)<R.m[k])return `${MATS[k]}が足りない`;if(p.bag.filter(x=>x==='log').length<(R.log||0))return `薪が${R.log}本必要`;if(G.cash<(R.cash||0))return `お金が$${R.cash}必要`;if((p.items||[]).includes(R.id))return 'もう持っている';return null}
function openCraft(){const me=G.players[G.me]||G.players[0];const mt=Object.entries(me.mats||{}).filter(([k,n])=>n>0&&MATS[k]).map(([k,n])=>`${MATS[k]}×${n}`).join('・')||'なし';
  const ch=Object.keys(RECIPES).sort((a,b)=>(RECIPES[a].life==='smith')-(RECIPES[b].life==='smith')).map(k=>{const R=RECIPES[k],it=ITEMS[R.id],why=craftWhy(me,R);const need=Object.entries(R.m).map(([m,n])=>`${MATS[m]}${n}`).join('+')+(R.log?`+薪${R.log}`:'')+(R.cash?`+$${R.cash}`:'');
    return [`${why?'🔒':R.life==='smith'?'🔨':'🪚'} ${it.n}（${itemDesc(it)}）… ${need}`,()=>{const w=craftWhy(G.players[G.me]||G.players[0],R);if(w){toast(w,'cold',true);return}sendAct('craft',k)}]});
  ch.push(['やめる',null]);Object.assign(DLG,{open:true,npc:{n:{n:'工房'},x:WB.x,y:WB.y},pages:[`何を作る？（持っている素材：${mt}）`],i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
// ---- chapter openings (letterboxed text over the town) and the objective tracker
let OPN=null;
function playOpening(C,done){const el=$('opening'),tx=$('opTxt');const slides=C.open.map(t=>({t})).concat([{card:1}]);let i=0,tm=null;OPN={done};
  if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;el.hidden=false;G.camPan={x:CX,y:CY-80,t:0,z:.42,d:slides.length*3.6+1};
  const show=()=>{clearTimeout(tm);tx.classList.remove('on');setTimeout(()=>{if(!OPN)return;const sl=slides[i];tx.innerHTML=sl.card?`<span class="chn">${C.n}</span><span class="cht">${C.t}</span>`:sl.t.replace(/</g,'&lt;');void tx.offsetWidth;tx.classList.add('on');if(sl.card)SFX.area();tm=setTimeout(next,sl.card?2600:3400)},i?450:150)};
  const next=()=>{i++;if(i>=slides.length){end();return}show()};
  const end=()=>{clearTimeout(tm);if(!OPN)return;const d=OPN.done;OPN=null;el.hidden=true;tx.classList.remove('on');if(NET.mode==='solo'&&G)G.paused=false;if(G.camPan)G.camPan.t=Math.max(G.camPan.t,(G.camPan.d||2)-.5);d&&d()};
  OPN.next=next;OPN.end=end;show()}
$('opening').addEventListener('click',e=>{if(!OPN)return;if(e.target.id==='opSkip'){OPN.end();return}OPN.next()});
addEventListener('keydown',e=>{if(!OPN)return;if(e.code==='Escape'){OPN.end();e.preventDefault()}else if(e.code==='Space'||e.code==='Enter'||e.code==='KeyE'){OPN.next();e.preventDefault()}},true);
function trackerFlash(){const el=$('tracker');el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
let _tkT=0;function trackerHud(){const el=$('tracker');if(!isRPG()||!running){el.hidden=true;return}const now=performance.now();if(now-_tkT<250)return;_tkT=now;const S=G.story,C=CH[S.ch]||CH[4],L=SOBJ[S.ch];
  const pg=(c,g)=>`<div class="pg"><span><u style="width:${Math.round(100*Math.min(1,c/Math.max(1,g)))}%"></u></span><small>${Math.min(c,g)}/${g}</small></div>`;
  let h=`<div class="tk-h">${C.n}<em>「${C.t}」</em></div>`;
  if(L){const i=Math.min(S.step||0,L.length-1),o=L[i],[c,g]=o.f();h+=`<div class="sec now"><i>▶ いまやること（${i+1}/${L.length}）</i><b>${stx(o)}</b>${o.p?`<small>${o.p()}</small>`:pg(c,g)}</div>`}
  else{const g=goalOf(YR());const rows=[[`かまど Lv${G.level} / ${g.lv}`,G.level>=g.lv],[`町人 ${popNow()} / ${g.pop}人`,popNow()>=g.pop],[`お金 $${Math.floor(G.cash).toLocaleString()} / $${g.c.toLocaleString()}`,G.cash>=g.c]];
    if(G.mission<MISSIONS.length){const m=MISSIONS[G.mission],[c,gg]=m.f();h+=`<div class="sec now"><i>▶ いまやること</i><b>${m.t}</b>${pg(c,gg)}</div>`}
    const fm=Math.round(custFame()*5);h+=`<div class="sec"><i>★ 町の知名度（お客さんの多さ）</i><b style="color:#e8a020">${G.story.shopOpen?'★'.repeat(fm)+'☆'.repeat(5-fm):'<small>まだ誰にも知られていない</small>'}</b></div>`;h+=`<div class="sec"><i>◆ 章の目標</i><b>${G.monument?'今夜、像を守りぬけ！':g.n+'を建てて、最後の夜を守れ'}</b>${G.monument?'':rows.map(([t,ok])=>`<div class="ck ${ok?'ok':'ng'}">${t}</div>`).join('')}</div>`}
  const qs=[];for(const k in (S.q||{})){const Q=QUESTS[k],q=S.q[k];if(!Q||Q.bio!==bioKey()||q.st===3)continue;const pr=q.st===2?`→ ${npcName(Q.npc)}に報告`:Q.type==='bring'?`${{log:'薪',fish:'魚',meat:'肉'}[Q.k]||Q.k} ${q.p||0}/${Q.n}`:Q.type==='build'?`${Math.min(Q.chk(),Q.n)}/${Q.n}`:Q.type==='count'?`${Math.min(Q.chk(q),Q.n)}/${Q.n}`:Q.where?`（${Q.where}）`:'';qs.push(`<div class="q ${q.st===2?'ok':''}">・${Q.t} ${pr}</div>`)}
  const avail=G.npcV?G.npcV.filter(v=>npcMark(v.n.id)==='！').length:0;
  h+=`<div class="sec"><i>✉ 住人の依頼</i>${qs.join('')||'<div class="q">受けている依頼はない</div>'}${avail?`<div class="q" style="color:#e8703a">“！”の住人が${avail}人いる（Eキーで話す）</div>`:''}</div>`;
  if(el._h!==h){el.innerHTML=h;el._h=h}el.hidden=false}


// ================================================================ rank-gated world (story mode): big trees, armored beasts, the big fish hole
const BIGHOLE={x:2240,y:1660};
const UNL={wood:[[2,'大きな古木（古木の芯材）を切れる'],[3,'氷結樹（氷結木材）を切れる'],[5,'精霊の大樹（精霊の枝）を切れる']],hunt:[[2,'鋼角のヘラジカに攻撃が通る'],[3,'氷の魔獣に攻撃が通る'],[4,'雪原の覇者に攻撃が通る']],fish:[[2,'氷の湖の“ぬしの穴”で大物が釣れる']],mine:[[2,'氷晶の結晶を掘れる'],[4,'星の結晶を掘れる']],smith:[[1,'鉄の斧・鉄の鎧を鍛えられる'],[2,'氷晶の剣を鍛えられる'],[3,'星のお守りを鍛えられる'],[4,'星の大剣を鍛えられる']],craft:[[1,'古木の大弓・古木の盾を作れる'],[2,'氷結樹の杖を作れる'],[3,'氷結の鎧・精霊のお守りを作れる'],[4,'精霊の弓を作れる']]};
const RTK={old:{mat:'core',n:'大きな古木',rq:2,hp:8,h:240,col:null,em:null,cash:40,item:null},ice:{mat:'icew',n:'氷結樹',rq:3,hp:12,h:250,col:'#bfe9ff',em:'#4fb8ff',cash:150,item:'c_icegem'},spirit:{mat:'spirit',n:'精霊の大樹',rq:5,hp:20,h:340,col:'#ffe9a8',em:'#ffc629',cash:500,item:'c_spirit'}};
const RTREES_SNOW=[['old',700,480],['old',1660,470],['old',1000,260],['old',560,1480],['old',1850,230],['ice',400,300],['ice',2050,520],['ice',300,1080],['spirit',180,1650]];
const RB_SNOW=[{mat:'steel',n:'鋼角のヘラジカ',rq:2,bt:'charge',hpm:2.5,x:820,y:250,rw:{cash:150,xp:30,item:'a_steel',ic:.5}},{mat:'steel',n:'鋼角のヘラジカ',rq:2,bt:'charge',hpm:2.5,x:1880,y:330,rw:{cash:150,xp:30,item:'a_steel',ic:.5}},
  {mat:'fang',n:'氷の魔獣',rq:3,bt:'frost',hpm:3.5,x:250,y:1260,rw:{cash:300,xp:60,item:'w_frost',ic:.6}},{mat:'horn',n:'雪原の覇者',rq:4,bt:'king',hpm:5,x:1260,y:210,rw:{cash:600,xp:120,item:'w_king',ic:1}}];
const RB_DES=[{mat:'steel',n:'鋼殻の大サソリ',rq:2,bt:'charge',hpm:2.5,x:620,y:240,rw:{cash:200,xp:40,item:'a_scorp',ic:.6}},{mat:'fang',n:'砂嵐の化身',rq:3,bt:'queen',hpm:3.5,x:1900,y:330,rw:{cash:400,xp:80,item:'w_frost',ic:.5}}];
const rbList=()=>DES()?RB_DES:RB_SNOW;
function rtInit(){Object.assign(RTK,RTK_MINE);if(G.rtrees)return;G.rtrees=DES()?[]:RTREES_SNOW.concat(NODES_SNOW).map(([k,x,y])=>({k,x,y,alive:true,hp:RTK[k].hp,rt:0,zone:(inZone(x,y)||{}).id||null}))}
function updateRankObj(dt){rtInit();if(!isRPG())return;
  for(const t of G.rtrees){const K=RTK[t.k];if(!t.alive){t.rt-=dt;if(t.rt<=0){t.alive=true;t.hp=K.hp}continue}if(t.zone&&!G.zones[t.zone])continue;
    for(const p of G.players){if(p.down>0||p.riding||dist(p.x,p.y,t.x,t.y)>72)continue;
      const lf=K.life||'wood';if(lifeRank(p,lf)<K.rq){if(!p._tk||G.t-p._tk>2){p._tk=G.t;float(t.x,t.y,120,`${LIFE[lf].n}「${LR[K.rq].n}」で${lf==='mine'?'掘れる':'切れる'}`,'red')}continue}
      if(lf==='wood'&&p.bag.length>=cap(p))continue;p.rtT=(p.rtT||0)+dt;if(p.rtT<.4/lifeB(p,lf,lf==='mine'?.08:.07))continue;p.rtT=0;t.hp--;t.shake=.3;if(lf==='mine'){addMat(p,K.mat,1);cnt(p,K.mat);lifeXp(p,'mine',2)}else{give(p,'log',1);lifeXp(p,'wood',1)}SFX.chop();burst(t.x,t.y,30,5,{c:['#c9955b','#e7c08e','#ffffff'],s0:40,s1:120,u0:60,u1:180,l0:.3,l1:.6,r0:3,r1:6});
      if(t.hp<=0){t.alive=false;t.rt=lf==='mine'?100:150;if(lf==='mine'){addMat(p,K.mat,1);cnt(p,K.mat);lifeXp(p,'mine',5)}else{give(p,'log',4);addMat(p,K.mat,t.k==='spirit'?1:2);lifeXp(p,'wood',6);cnt(p,'rt_'+t.k)}const v=Math.round(K.cash*(1+G.day*.05));G.cash+=v;G.earned+=v;gainRX(p,K.rq*10);if(K.item&&Math.random()<.5)giveItem(p,K.item);
        banner(lf==='mine'?`${K.n}を掘りつくした！`:`${K.n}を切りたおした！`,`+$${v}${lf==='mine'?'':'・薪たくさん'}`,'','r-SSR');SFX.ssr();G.shake=12;burst(t.x,t.y,60,40,{c:[K.em||'#c9955b','#ffffff','#ffe07a'],s0:80,s1:260,u0:150,u1:360,l0:.7,l1:1.3,add:!!K.em,r0:5,r1:10})}}}
  const L=rbList();G.rbT=G.rbT||L.map(()=>8);L.forEach((R,i)=>{if(G.bears.some(b=>b.rbi===i&&!b.dead))return;G.rbT[i]-=dt;if(G.rbT[i]>0)return;const z=R.y<690?null:DES()?null:'C';if(z&&!G.zones[z])return;
    const b=spawnBoss(R.bt,true);b.rbi=i;b.rq=R.rq;b.home={x:R.x,y:R.y};b.zone=R.y<690?'A':'C';b.x=R.x;b.y=R.y;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*R.hpm);G.rbT[i]=180})}
function rbKilled(b,p){const R=rbList()[b.rbi];if(!R)return;if(R.mat)addMat(p,R.mat,R.rq>=4?1:2);const v=Math.round(R.rw.cash*(1+G.day*.05));G.cash+=v;G.earned+=v;gainRX(p,R.rw.xp);lifeXp(p,'hunt',12);if(R.rw.item&&Math.random()<R.rw.ic)giveItem(p,R.rw.item);
  setTimeout(()=>{if(running)banner(`${R.n}をたおした！`,`+$${v}・EXP+${R.rw.xp}`,'しばらくすると、また現れる','r-SSR')},700)}
function mkRankTree(k){const K=RTK[k],g=new T.Group();let tr;if(K.life==='mine')return mkNode(k);
  if(KK&&KK.nat&&KK.nat.pine5){tr=KK.nat.pine5.clone(true);tr.scale.setScalar(K.h/(KK.natH.pine5||1));tr.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(K.col)o.material.color.lerp(lin(K.col),.55);if(K.em){o.material.emissive=lin(K.em);o.material.emissiveIntensity=.35}o.castShadow=true}})}
  else{tr=new T.Group();tr.add(at(cyl(10,14,K.h*.3,std('#6e4524'),8),0,K.h*.15,0),at(cone(K.h*.3,K.h*.8,std(K.col),8),0,K.h*.6,0))}
  g.add(tr);g.userData.tr=tr;const ring=M_(new T.RingGeometry(58,66,40),new T.MeshBasicMaterial({color:lin(K.em||'#8a5a30'),transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1.4;g.add(ring);
  if(k==='spirit')for(let i=0;i<6;i++){const o=M_(new T.SphereGeometry(5,8,6),glow('#ffe38a',2.4),false);o.userData.a=i/6*TAU;g.add(o);(g.userData.orbs=g.userData.orbs||[]).push(o)}
  if(k==='ice')for(let i=0;i<5;i++)g.add(at(rot(cone(5,22,glow('#bfe9ff',1.8),5,false),0,0,rnd(-.4,.4)),rnd(-40,40),rnd(4,10),rnd(-40,40)));
  const stump=at(cyl(18,22,16,std('#6e4524',{map:TEX.bark}),10),0,8,0);stump.visible=false;g.add(stump);g.userData.stump=stump;return g}
let _rfT=performance.now();
function rankFx(){if(!G||!running)return;rtInit();const now=performance.now(),dt=Math.min(.1,(now-_rfT)/1000);_rfT=now;const on=isRPG();
  if(!G.rtV){G.rtV=G.rtrees.map(t=>{const g=mkRankTree(t.k);g.position.set(t.x,0,t.y);g.visible=false;world.add(g);return g})}
  const me=G.players[G.me]||G.players[0];
  G.rtrees.forEach((t,i)=>{const g=G.rtV[i];g.visible=on;if(!on)return;g.userData.tr.visible=t.alive;g.userData.stump.visible=!t.alive;t.shake=Math.max(0,(t.shake||0)-dt);g.userData.tr.rotation.z=Math.sin(now/40)*t.shake*.15;
    if(g.userData.orbs)g.userData.orbs.forEach((o,j)=>{const a=o.userData.a+now/1400;o.position.set(Math.cos(a)*60,90+Math.sin(now/500+j)*20,Math.sin(a)*60);o.visible=t.alive});
    if(me&&t.alive&&dist(me.x,me.y,t.x,t.y)<320){const K=RTK[t.k],lf=K.life||'wood',ok=lifeRank(me,lf)>=K.rq;label(t.x,t.y,lf==='mine'?(ok?45:55):(ok?60:70),`<b>${K.n}</b><br><small>${ok?`近づくと${lf==='mine'?'掘れる':'切れる'}（${t.hp}/${K.hp}）`:`🔒 ${LIFE[lf].n}「${LR[K.rq].n}」が必要`}</small>`,ok?'':'note')}});
  const h=G.holes.find(q=>q.rq);if(h&&me&&on&&dist(me.x,me.y,h.x,h.y)<260){const ok=lifeRank(me,'fish')>=h.rq;label(h.x,h.y,50,`<b>ぬしの穴</b><br><small>${ok?'大物が釣れる！':`🔒 釣り人「${LR[h.rq].n}」で釣れる`}</small>`,ok?'':'note')}}

// ================================================================ RPG (story mode): townsfolk troubles, equipment, personal level
const ITEMS={w_bear:{n:'狼牙のナックル',s:'w',atk:.15},w_gordon:{n:'片角殺しの刃',s:'w',atk:.3},w_elza:{n:'エルザの銀の槍',s:'w',atk:.4},w_said:{n:'サイードの曲刀',s:'w',atk:.45},w_gordon2:{n:'群れ断ちの大斧',s:'w',atk:.6},
  a_bear:{n:'白狼の毛皮',s:'a',def:.12,cold:.08},a_borg:{n:'年代物の毛皮コート',s:'a',def:.2,cold:.12},a_said:{n:'砂漠の外套',s:'a',def:.15,cold:.25},
  c_mina:{n:'ぽかぽかミトン',s:'c',cold:.15},c_pip:{n:'ルゥの手編みマフラー',s:'c',cold:.25},c_teo:{n:'テオ特製の背負い袋',s:'c',cap:8},c_mina2:{n:'ミーナのお守りパン',s:'c',spd:.1},c_lana:{n:'砂漠の鈴',s:'c',spd:.12,cold:.05},a_steel:{n:'鋼角の鎧',s:'a',def:.3,cold:.1},w_frost:{n:'氷牙の槍',s:'w',atk:.55},w_king:{n:'覇者の大剣',s:'w',atk:.8},c_icegem:{n:'樹氷のペンダント',s:'c',cold:.3},c_spirit:{n:'精霊の葉',s:'c',cold:.2,spd:.12,cap:5},a_scorp:{n:'鋼殻の胸当て',s:'a',def:.32,cold:.15},w_fang:{n:'牙折りの弓',s:'w',atk:.5},c_soup:{n:'ミーナの特製スープ瓶',s:'c',cold:.3},c_rabbit:{n:'雪うさぎのお守り',s:'c',spd:.15},a_hero:{n:'古の勇者の鎧',s:'a',def:.35,cold:.15},c_tool:{n:'大工の腰袋',s:'c',cap:12},w_elza2:{n:'銀狼の大弓',s:'w',atk:.7},w_oldbow:{n:'古木の大弓',s:'w',atk:.45},a_oldshield:{n:'古木の盾',s:'a',def:.25,cold:.05},w_icestaff:{n:'氷結樹の杖',s:'w',atk:.65,cold:.1},a_icearmor:{n:'氷結の鎧',s:'a',def:.38,cold:.25},c_spiritcharm:{n:'精霊のお守り',s:'c',cold:.35,spd:.15,cap:8},w_spiritbow:{n:'精霊の弓',s:'w',atk:1,spd:.1},w_ironsword:{n:'鉄の剣',s:'w',atk:.35},w_ironaxe:{n:'鉄の斧',s:'w',atk:.45},a_iron:{n:'鉄の鎧',s:'a',def:.3,cold:.05},w_icesword:{n:'氷晶の剣',s:'w',atk:.75,cold:.1},c_star:{n:'星のお守り',s:'c',cold:.3,spd:.15,cap:10},w_starsword:{n:'星の大剣',s:'w',atk:1.2},a_silk:{n:'クモ糸の外套',s:'a',def:.22,cold:.2},w_icicle:{n:'氷柱の短剣',s:'w',atk:.3,spd:.08},c_lantern:{n:'洞窟のランタン',s:'c',cold:.2},w_bluehammer:{n:'青氷のハンマー',s:'w',atk:.6},c_starring:{n:'星明かりの指輪',s:'c',spd:.2,cold:.2},w_queenfang:{n:'女王グモの毒牙',s:'w',atk:.9}};
const SLOTN={w:'武器',a:'防具',c:'お守り'};
const itemDesc=it=>[it.atk?`攻撃+${Math.round(it.atk*100)}%`:'',it.def?`防御+${Math.round(it.def*100)}%`:'',it.cold?`${DES()?'暑さ':'寒さ'}に強い+${Math.round(it.cold*100)}%`:'',it.cap?`運べる数+${it.cap}`:'',it.spd?`足の速さ+${Math.round(it.spd*100)}%`:''].filter(Boolean).join('・');
function eqv(p,k){if(!p||!p.eq||!isRPG())return 0;let v=0;for(const sl of ['w','a','c']){const it=ITEMS[p.eq[sl]];if(it&&it[k])v+=it[k]}return v}
const rlv=p=>(p&&p.rl)||1,rxNeed=l=>20+l*18;
function rpgRestore(p,d){if(!d)return;p.mats=Object.assign({},d.mats||{});p.cnt=Object.assign({},d.cnt||{});p.chd=(d.chd||[]).slice();p.rl=d.rl||1;p.rx=d.rx||0;p.items=(d.items||[]).slice();p.eq=Object.assign({},d.eq||{})}
function gainRX(p,n){if(!p||!isRPG())return;p.rl=p.rl||1;p.rx=(p.rx||0)+n;while(p.rx>=rxNeed(p.rl)){p.rx-=rxNeed(p.rl);p.rl++;float(p.x,p.y,120,`レベルアップ！ Lv${p.rl}`,'gold',true);burst(p.x,p.y,30,30,{c:['#ffe07a','#ffffff','#8ff08f'],s0:60,s1:200,u0:150,u1:320,l0:.6,l1:1.1,add:true,r0:5,r1:9});SFX.rare()}}
function giveItem(p,id){const it=ITEMS[id];if(!p||!it)return;p.items=p.items||[];if(!p.items.includes(id))p.items.push(id);p.eq=p.eq||{};if(!p.eq[it.s])p.eq[it.s]=id;
  float(p.x,p.y,130,`${it.n} を手に入れた！`,'gold',true);if(p===(G.players[G.me]||G.players[0])&&NET.mode!=='guest')banner('装備を手に入れた！',it.n,itemDesc(it)+'（Lキーで付け替え）','r-SSR',true)}
const NPCS={snow:[{id:'gordon',n:'猟師のゴードン',pal:1,x:1330,y:1280,o:{hat:'ushanka',beard:true,tool:'gun'}},{id:'mina',n:'パン屋のミーナ',pal:4,x:905,y:1160,o:{apron:true}},{id:'pip',n:'少年ピップ',pal:6,x:1290,y:1100,o:{scale:.75}},{id:'borg',n:'老人ボルグ',pal:2,x:1560,y:1040,o:{beard:true}},{id:'teo',n:'大工のテオ',pal:5,x:1350,y:925,o:{tool:'axe',plaid:true}},{id:'elza',n:'見張りのエルザ',pal:3,x:1470,y:1030,o:{hat:'ushanka',tool:'gun'}}],
  desert:[{id:'said',n:'水売りのサイード',pal:1,x:1330,y:1280,o:{}},{id:'lana',n:'踊り子のラナ',pal:4,x:905,y:1160,o:{apron:true}}]};
const npcName=id=>{for(const k in NPCS)for(const n of NPCS[k])if(n.id===id)return n.n;return ''};
const npcPos=n=>n.a!=null?{x:CX+Math.cos(n.a)*150,y:CY+Math.sin(n.a)*150}:{x:n.x,y:n.y};
const QUESTS={
  gordon1:{ch:[1],npc:'gordon',bio:'snow',t:'仇の“片角”',type:'hunt',bt:'charge',x:1500,y:380,hpm:1.6,where:'北の森',intro:['……北の森に“片角”って呼ばれてる暴れヘラジカがいる。','仲間があいつにやられた。俺ひとりじゃ敵わねえ…','仇をとってくれないか？'],act:'片角は北の森だ。赤い線が見えたら横に飛べ！',done:['……やったのか。本当に、ありがとう。','こいつを受け取ってくれ。片角を仕留めるために研いだ刃だ'],rw:{cash:120,item:'w_gordon',xp:40}},
  mina1:{ch:[1],npc:'mina',bio:'snow',t:'パンを焼く薪',type:'bring',k:'log',n:10,intro:['かまどの火が弱くて、パンがうまく焼けないの…','薪を10本持ってきてくれないかしら？'],act:'薪を10本お願いね',done:['わあ、ありがとう！ これで焼きたてのパンを配れるわ','お礼にこれ。わたしの手作りミトンよ'],rw:{cash:80,item:'c_mina',xp:25}},
  pip1:{ch:[1],npc:'pip',bio:'snow',t:'迷子のルゥ',type:'escort',x:560,y:470,nm:'ルゥ',where:'西の森',intro:['妹のルゥが…雪遊びに行ったまま帰ってこないんだ！','西の森のほうに行ったと思う。','お願い、ルゥを連れて帰って！'],act:'ルゥは西の森のほう！ 見つけたら町まで連れてきて',done:['ルゥ！ よかった…ほんとにありがとう！','ルゥが編んだマフラー、おにいちゃんにあげるって'],rw:{cash:60,item:'c_pip',xp:40}},
  borg1:{ch:[1],npc:'borg',bio:'snow',t:'妻の形見',type:'find',x:1640,y:650,nm:'形見の指輪',where:'東の雪原',intro:['死んだ妻の形見の指輪を、東の雪原で落としてしまってな…','年寄りの足じゃ、もう探しに行けんのじゃ'],act:'東の雪原あたりじゃ。キラッと光るはずじゃよ',done:['おお…まさしく妻の指輪じゃ。ありがとう…','わしが若いころ着ておったコートじゃ。まだまだ暖かいぞ'],rw:{cash:100,item:'a_borg',xp:40}},
  teo1:{ch:[1],npc:'teo',bio:'snow',t:'テント暮らし',type:'build',chk:()=>G.houses.filter((h,i)=>houseLv(i)>=2).length,n:2,intro:['家が足りなくて、みんなテント暮らしなんだ','「家を建てる」で小屋を2軒建ててくれれば、あとは俺が仕上げる'],act:'小屋を2軒（テント→小屋）',done:['いい家だ！ みんなよく眠れるようになった','俺特製の背負い袋だ。たくさん運べるぞ'],rw:{cash:150,item:'c_teo',xp:40}},
  elza1:{ch:[1],npc:'elza',bio:'snow',t:'眠れない夜',type:'build',chk:()=>TOWERS.filter(t=>G.lv['tw_'+t.id]>=2).length,n:2,intro:['夜の襲撃が怖くて、見張りの交代でちっとも眠れないの','見張り台を2つ、Lv2まで強くしてくれない？'],act:'見張り台を2つLv2に',done:['これで交代で休めるわ。ありがとう','わたしの銀の槍よ。あなたのほうが上手く使えそう'],rw:{cash:200,item:'w_elza',xp:50}},
  mina2:{ch:[1,2],npc:'mina',bio:'snow',req:()=>qDone('mina1')&&G.zones.B,t:'魚のパイ',type:'bring',k:'fish',n:8,intro:['氷の湖のお魚でパイを作りたいの','8匹あれば、町のみんなに配れるわ'],act:'お魚8匹、待ってるね',done:['いい匂い…みんな喜ぶわ！','旅のお守りに、特製のパンをどうぞ'],rw:{cash:150,item:'c_mina2',xp:35}},
  gordon2:{ch:[1,2],npc:'gordon',bio:'snow',req:()=>qDone('gordon1')&&G.zones.C,t:'群れの長“黒たてがみ”',type:'hunt',bt:'alpha',x:360,y:900,hpm:2,where:'奥地の森',intro:['奥地の森に、群れを率いる“黒たてがみ”がいる。','あいつを倒せば、町を襲う狼もきっと減る'],act:'黒たてがみは奥地の森。仲間を呼ばれる前に叩け',done:['見事だ…お前はもう一人前の狩人だよ','俺の自慢の大斧だ。持っていけ'],rw:{cash:300,item:'w_gordon2',xp:80}},
  gordon3:{ch:[2],npc:'gordon',bio:'snow',t:'王の手下“牙折れ”',type:'hunt',bt:'frost',x:1750,y:300,hpm:2.4,where:'北東の雪原',intro:['白き王の手下が、猟場を荒らしてやがる。','“牙折れ”って呼ばれてる、氷の息を吐く大狼だ。','こいつを放っておいたら、町の食い扶持がなくなる'],act:'牙折れは北東の雪原だ。青い扇からは離れろよ',done:['やってくれたか…これで猟場が戻る','王とやり合うなら、こいつが要るだろう'],rw:{cash:300,item:'w_fang',xp:70}},
  mina3:{ch:[2],npc:'mina',bio:'snow',t:'避難した人のシチュー',type:'bring',k:'meat',n:12,intro:['襲撃のたびに、みんな怖がって眠れないの','温かいシチューを作ってあげたい…','お肉を12個、集めてくれる？'],act:'お肉12個でシチューが作れるわ',done:['ありがとう！ みんな、少し笑顔になったわ','残ったスープを瓶に詰めたの。体が芯から温まるわよ'],rw:{cash:220,item:'c_soup',xp:50}},
  pip2:{ch:[2],npc:'pip',bio:'snow',t:'雪うさぎのお守り',type:'find',x:420,y:520,nm:'雪うさぎのお守り',where:'北西の雪原',intro:['ルゥがね、お守りをなくして泣いてるんだ','雪うさぎの形の、白いお守り…','北西の雪原で遊んでたときに落としたんだって'],act:'北西の雪原のどこか！ キラキラしてるはず',done:['それだ！ ルゥ、すっごく喜ぶよ！','ルゥが「おにいちゃんにも」って。もう一つあったんだって'],rw:{cash:120,item:'c_rabbit',xp:45}},
  borg2:{ch:[2],npc:'borg',bio:'snow',t:'勇者の日誌',type:'find',x:1500,y:230,nm:'古い日誌',where:'北の雪原の奥',intro:['わしの祖父は、昔“白き王”と戦った勇者の一人でな','その日誌が、北の雪原の奥に埋まっておるはずじゃ','王の弱点が書いてあるかもしれん'],act:'北の雪原の奥じゃ。雪を掘ってみておくれ',done:['…“王は光を嫌う。突進のあとに隙が生まれる”…','これは祖父の鎧じゃ。今度はお前さんが着るといい'],rw:{cash:200,item:'a_hero',xp:60}},
  teo2:{ch:[2],npc:'teo',bio:'snow',t:'門を固めろ',type:'build',chk:()=>G.lv.trap,n:2,intro:['襲撃のたびに門が破られて、家が壊される','門のトゲ罠をLv2にしてくれないか？','そうすりゃ、俺が家の修理に回れる'],act:'「門のトゲ罠」をLv2に',done:['これで門は安心だ！','俺の腰袋をやる。道具も荷物もたっぷり入るぞ'],rw:{cash:250,item:'c_tool',xp:50}},
  elza2:{ch:[2],npc:'elza',bio:'snow',t:'夜の偵察隊',type:'count',chk:q=>(G.stats.raidKills||0)-(q.base||0),n:15,intro:['王の手下が、夜のうちに町を偵察してるみたい','襲撃のとき、狼を15頭倒して追い払って！','わたしも見張り台から援護するから'],act:'襲撃で狼を15頭たおす',done:['すごい…これで王も簡単には近づけないわ','銀狼の大弓。わたしの一族の宝よ'],rw:{cash:350,item:'w_elza2',xp:80}},
  said1:{ch:[3],npc:'said',bio:'desert',t:'水泥棒',type:'hunt',bt:'charge',x:1700,y:420,hpm:1.8,where:'北東の砂丘',intro:['井戸の水を夜な夜な荒らす、あばれサソリがいるんだ','北東の砂丘がねぐらだ。退治してくれたら礼ははずむよ'],act:'北東の砂丘だ。突進に気をつけな',done:['助かった！ これで水を売れる','おれの曲刀と…ついでに外套もやるよ'],rw:{cash:250,item:'w_said',item2:'a_said',xp:60}},
  lana1:{ch:[3],npc:'lana',bio:'desert',t:'なくした鈴',type:'find',x:1000,y:560,nm:'踊り子の鈴',where:'北の砂丘',intro:['踊りで使う鈴を、北の砂丘で落としちゃったの','あれがないと踊れないのよ…'],act:'北の砂丘のどこか。チリンと光ってるはず',done:['その音色！ ありがとう、今夜は踊るわ','片方あげる。持ってると足が軽くなるのよ'],rw:{cash:120,item:'c_lana',xp:35}}};
const qS=id=>(G.story&&G.story.q&&G.story.q[id])||null,qDone=id=>{const q=qS(id);return !!(q&&q.st===3)};
const bioKey=()=>DES()?'desert':'snow';
function solvedN(bio){let n=0;const ch=(G.story&&G.story.ch)||1;for(const k in QUESTS){const Q=QUESTS[k];if(Q.bio===bio&&qDone(k)&&(!Q.ch||Q.ch.includes(ch)))n++}return n}
function npcQuest(nid){let avail=null;const ch=(G.story&&G.story.ch)||1;for(const k in QUESTS){const Q=QUESTS[k];if(Q.npc!==nid||Q.bio!==bioKey())continue;const q=qS(k);if(q&&(q.st===1||q.st===2))return k;if(!q&&!avail&&(!Q.ch||Q.ch.includes(ch))&&(!Q.req||Q.req()))avail=k}return avail}
function npcMark(nid){const k=npcQuest(nid);if(!k)return '';const q=qS(k);return !q?'！':q.st===2?'？':'…'}
// ---- NPC meshes and markers (both host and guest)
function npcFx(){if(!G||!running)return;const on=isRPG();const L=NPCS[bioKey()];
  if(!on){if(G.npcV)for(const v of G.npcV)v.m.g.visible=false;if(G.escV)G.escV.m.g.visible=false;if(G.findV)G.findV.visible=false;$('dlg').hidden=true;return}
  if(!G.npcV||G.npcBio!==bioKey()||(G.npcV[0]&&!G.npcV[0].m.g.parent)){if(G.npcV)for(const v of G.npcV)world.remove(v.m.g);G.npcBio=bioKey();G.npcV=L.map(n=>{const m=makeVillager(PALS[n.pal%PALS.length],Object.assign({noShadow:false},n.o));const q=npcPos(n);m.g.position.set(q.x,0,q.y);m.g.rotation.y=Math.atan2(CX-q.x,CY-q.y)+Math.PI;world.add(m.g);return{n,m,x:q.x,y:q.y}})}
  const me=G.players[G.me]||G.players[0];
  for(const v of G.npcV){v.m.g.visible=true;animWalk(v.m,0,false);const mk=npcMark(v.n.id),d=me?dist(me.x,me.y,v.x,v.y):1e9;v.m.g.rotation.y=d<200&&me?Math.atan2(me.x-v.x,me.y-v.y):Math.atan2(CX-v.x,CY-v.y)+Math.PI;
    if(mk)label(v.x,v.y,74,`<b style="font-size:${mk==='…'?16:26}px;color:${mk==='？'?'#3fc157':mk==='！'?'#ffb020':'#9aa3ad'};-webkit-text-stroke:3px #16283a;paint-order:stroke fill">${mk}</b>`,'');
    if(d<220)label(v.x,v.y,d<75?108:96,`<small>${v.n.n}</small>${d<75&&!DLG.open?'<br><b>Eキーで話す</b>':''}`,'')}
  // escort follower, find spot
  let esc=null,fnd=null;for(const k in QUESTS){const Q=QUESTS[k],q=qS(k);if(!q||q.st!==1||Q.bio!==bioKey())continue;if(Q.type==='escort')esc=[k,Q,q];if(Q.type==='find')fnd=[k,Q,q]}
  if(esc){if(!G.escV||!G.escV.m.g.parent){const m=makeVillager(PALS[5],{scale:.6,noShadow:true});world.add(m.g);G.escV={m,x:esc[2].x,y:esc[2].y,step:0}}const E=G.escV,q=esc[2];const mv=dist(E.x,E.y,q.x,q.y)>2;E.x=lerp(E.x,q.x,.2);E.y=lerp(E.y,q.y,.2);E.step+=.2;E.m.g.position.set(E.x,0,E.y);E.m.g.visible=true;if(mv)E.m.g.rotation.y=Math.atan2(q.x-E.x,q.y-E.y);animWalk(E.m,E.step,mv);
    if(q.f==null){label(q.x,q.y,70,`<b>${esc[1].nm}</b><br><small>${me&&dist(me.x,me.y,q.x,q.y)<260?'近づくとついてくる':''}</small>`,'');if(me&&dist(me.x,me.y,q.x,q.y)>300)label(q.x,q.y,40,'<b style="color:#ffb020;font-size:22px">！</b>','')}}
  else if(G.escV)G.escV.m.g.visible=false;
  if(fnd){if(!G.findV||!G.findV.parent){const g=new T.Group();const beam=M_(new T.CylinderGeometry(26,26,500,14,1,true),new T.MeshBasicMaterial({color:lin('#ffe38a'),transparent:true,opacity:.2,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=250;g.add(beam);const gem=M_(new T.OctahedronGeometry(5,0),glow('#ffe38a',2.6),false);gem.position.y=8;g.add(gem);g.userData.gem=gem;world.add(g);G.findV=g}
    const F=G.findV;F.visible=true;F.position.set(fnd[1].x,0,fnd[1].y);F.userData.gem.rotation.y+=.05;if(me&&dist(me.x,me.y,fnd[1].x,fnd[1].y)<240)label(fnd[1].x,fnd[1].y,40,fnd[2].p>0?bar(100*fnd[2].p/1.5,'gold'):`<small>${fnd[1].nm}？ そばに立って探す</small>`,'')}
  else if(G.findV)G.findV.visible=false;
  const me2=me;if(DLG.open&&DLG.npc&&me2&&dist(me2.x,me2.y,DLG.npc.x,DLG.npc.y)>140)closeTalk()}
function npcNear(p){if(!isRPG()||!G.npcV)return null;let b=null,bd=75;for(const v of G.npcV){const d=dist(p.x,p.y,v.x,v.y);if(d<bd){bd=d;b=v}}return b}
// ---- quest progress (host)
function updateQuests(dt){if(!isRPG())return;const S=G.story;S.q=S.q||{};
  for(const k in S.q){const Q=QUESTS[k],q=S.q[k];if(!Q||q.st!==1||Q.bio!==bioKey())continue;
    if(Q.type==='hunt'){if(!G.bears.some(b=>b.qid===k)){q.cd=(q.cd||0)-dt;if(q.cd<=0){q.cd=5;const b=spawnBoss(Q.bt);b.qid=k;b.zone=Q.y<690?'A':'C';b.x=Q.x;b.y=Q.y;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*(Q.hpm||1.5))}}}
    else if(Q.type==='find'){const near=G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,Q.x,Q.y)<55);if(near){q.p=(q.p||0)+dt;if(q.p>=1.5){q.st=2;burst(Q.x,Q.y,20,30,{c:['#ffe38a','#ffffff'],s0:60,s1:200,u0:150,u1:300,l0:.6,l1:1,add:true});SFX.rare();banner('見つけた！',Q.nm,`${npcName(Q.npc)}に届けよう`,'area')}}else q.p=Math.max(0,(q.p||0)-dt*.5)}
    else if(Q.type==='escort'){if(q.x==null){q.x=Q.x;q.y=Q.y}if(q.f==null){const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,q.x,q.y)<60);if(p){q.f=p.id;say(Q.nm,'…ぐすっ。おうちに帰りたい…ついていっていい？')}}
      else{const p=G.players[q.f];if(!p||p.down>0){q.f=null}else{const d=dist(p.x,p.y,q.x,q.y);if(d>45){const k2=Math.min(d-40,230*dt);q.x+=(p.x-q.x)/d*k2;q.y+=(p.y-q.y)/d*k2}if(dist(q.x,q.y,CX,CY)<FR-30){q.st=2;const n=NPCS.snow.find(n=>n.id===Q.npc);const np=npcPos(n);q.x=np.x+30;q.y=np.y+20;banner('町に着いた！',Q.nm,`${npcName(Q.npc)}に知らせよう`,'area');SFX.rare()}}}}
    else if(Q.type==='count'){if(Q.chk(q)>=Q.n){q.st=2;banner('依頼達成！',Q.t,`${npcName(Q.npc)}に報告しよう`,'area');SFX.rare()}}
    else if(Q.type==='build'){if(Q.chk()>=Q.n){q.st=2;banner('依頼達成！',Q.t,`${npcName(Q.npc)}に報告しよう`,'area');SFX.rare()}}}}
function doAct(p,type,id){if(!isRPG()||!p)return;const S=G.story;S.q=S.q||{};
  if(type==='craft'){const R=RECIPES[id];if(!R)return;const why=craftWhy(p,R);if(why){float(p.x,p.y,90,why,'red',true);return}for(const k in R.m)p.mats[k]-=R.m[k];for(let i=0;i<(R.log||0);i++)take(p,'log');G.cash-=R.cash||0;giveItem(p,R.id);lifeXp(p,R.life||'craft',15);cnt(p,R.life==='smith'?'sm':'cr_eq');cnt(p,'mk_'+R.id);gainRX(p,20);banner('装備を作った！',ITEMS[R.id].n,itemDesc(ITEMS[R.id]),'r-SSR');SFX.ssr();burst(WB.x,WB.y,40,30,{c:['#ffd23f','#ffffff'],s0:60,s1:220,u0:150,u1:320,l0:.6,l1:1.1,add:true});return}
  if(type==='eq'){const it=ITEMS[id];if(!it||!(p.items||[]).includes(id))return;p.eq=p.eq||{};p.eq[it.s]=p.eq[it.s]===id?null:id;return}
  const Q=QUESTS[id];if(!Q)return;let q=S.q[id];
  if(type==='accept'&&!q){S.q[id]={st:1,p:0};if(Q.type==='count')S.q[id].base=G.stats.raidKills||0;if(Q.type==='escort'){S.q[id].x=Q.x;S.q[id].y=Q.y}toast(`依頼「${Q.t}」を受けた${Q.where?'（'+Q.where+'）':''}`,'gold');SFX.pop&&SFX.pop();return}
  if(type==='give'&&q&&q.st===1&&Q.type==='bring'){let n=0;while(q.p<Q.n&&take(p,Q.k)){q.p++;n++}if(n){flyItem(Q.k,p.x,p.y,30,p.x,p.y,60,null,3);SFX.coin(3)}if(q.p>=Q.n)q.st=2;else toast(`${Q.t}：あと${Q.n-q.p}個`,'cash');if(q.st!==2)return;type='claim'}
  if(type==='claim'&&q&&q.st===2){q.st=3;const R=Q.rw;G.cash+=R.cash;G.earned+=R.cash;gainRX(p,R.xp);if(R.item)giveItem(p,R.item);if(R.item2)giveItem(p,R.item2);
    banner('町の悩みを解決！',Q.t,`+$${R.cash}・EXP+${R.xp}${R.item?'・'+ITEMS[R.item].n:''}`,'r-SSR');SFX.ssr();burst(p.x,p.y,40,40,{c:['#ffd23f','#ffffff','#8ff08f'],s0:80,s1:260,u0:200,u1:400,l0:.8,l1:1.3,add:true})}}
function sendAct(type,id){const me=G.players[G.me]||G.players[0];if(NET.mode==='guest'){NET.actN=(NET.actN||0)+1;NET.act=[NET.actN,type,id]}else doAct(me,type,id)}
// ---- dialog UI (local to each player)
const DLG={open:false};
function openTalk(v){const k=npcQuest(v.n.id),q=k?qS(k):null,Q=k?QUESTS[k]:null,me=G.players[G.me]||G.players[0];let pages,ch=null;
  if(!k)pages=[['いつもありがとう。この町は、あんたたちのおかげで持ってるよ','困ったことがあったら、また頼むね','外は冷える。気をつけてな'][Math.floor(Math.random()*3)]];
  else if(!q){pages=Q.intro.slice();ch=[['引き受ける',()=>sendAct('accept',k)],['やめておく',null]]}
  else if(q.st===2){pages=Q.done.slice();ch=[['受け取る',()=>sendAct('claim',k)]]}
  else{pages=[Q.act+(Q.type==='bring'?`（${q.p||0}/${Q.n}）`:Q.type==='build'?`（${Math.min(Q.chk(),Q.n)}/${Q.n}）`:Q.type==='count'?`（${Math.min(Q.chk(q),Q.n)}/${Q.n}）`:'')];if(Q.type==='bring'&&has(me,Q.k))ch=[[`渡す（持っている${me.bag.filter(x=>x===Q.k).length}個）`,()=>sendAct('give',k)],['あとで',null]]}
  Object.assign(DLG,{open:true,npc:v,pages,i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg();SFX.pop&&SFX.pop()}
function drawDlg(){$('dlg').hidden=!DLG.open;if(!DLG.open)return;$('dlgWho').textContent=DLG.npc.n.n;$('dlgTxt').textContent=DLG.pages[DLG.i];const last=DLG.i>=DLG.pages.length-1,box=$('dlgCh');box.innerHTML='';
  if(last&&DLG.ch){DLG.ch.forEach(([t,fn],i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${t}`;if(!fn)b.className='no';b.addEventListener('click',e=>{e.stopPropagation();closeTalk();if(fn)fn()});box.appendChild(b)});$('dlgHint').textContent='数字キーかクリックで選ぶ'}else $('dlgHint').textContent=last?'Eキー / クリックで閉じる':'Eキー / クリックで次へ'}
function dlgKey(code){const last=DLG.i>=DLG.pages.length-1;if(last&&DLG.ch){const i=/^Digit/.test(code)?(+code.slice(5)-1):(code==='KeyE'||code==='Enter'||code==='Space')&&DLG.ch.length<3?0:-1;if(i<0||!DLG.ch[i])return;const fn=DLG.ch[i][1];closeTalk();if(fn)fn();return}if(last){closeTalk();return}DLG.i++;drawDlg()}
function closeTalk(){DLG.open=false;$('dlg').hidden=true;if(NET.mode==='solo'&&G)G.paused=false}
$('dlg').addEventListener('click',()=>{if(!DLG.open)return;const last=DLG.i>=DLG.pages.length-1;if(last&&DLG.ch)return;dlgKey('KeyE')});
// ---- quest log + status panel
let _qlT=0;function qlogHud(){const el=$('qlog');el.hidden=true;return;const now=performance.now();if(now-_qlT<250)return;_qlT=now;const rows=[];
  for(const k in (G.story.q||{})){const Q=QUESTS[k],q=G.story.q[k];if(!Q||Q.bio!==bioKey()||q.st===3)continue;
    const pr=q.st===2?`${npcName(Q.npc)}に報告`:Q.type==='bring'?`${{log:'薪',fish:'魚',meat:'肉'}[Q.k]||Q.k} ${q.p||0}/${Q.n}`:Q.type==='build'?`${Math.min(Q.chk(),Q.n)}/${Q.n}`:Q.where||'';
    rows.push(`<div class="${q.st===2?'ok':''}"><i>依頼</i>${Q.t}：${pr}</div>`)}
  el.innerHTML=rows.slice(0,3).join('');el.hidden=!rows.length}
function rpgBoxHtml(me){if(!isRPG())return '';const l=rlv(me),x=me.rx||0,need=rxNeed(l);const eq=me.eq||{},inv=me.items||[];
  const mt=Object.entries(me.mats||{}).filter(([k,n])=>n>0&&MATS[k]).map(([k,n])=>`${MATS[k]}×${n}`).join('・');return `<div class="lvl"><b>Lv ${l}</b><span class="xp"><i style="width:${Math.round(100*x/need)}%"></i></span><small>${x}/${need}</small></div>
  <div class="eq">${['w','a','c'].map(sl=>`<span>${SLOTN[sl]}</span><span>${eq[sl]&&ITEMS[eq[sl]]?ITEMS[eq[sl]].n+'<br><small>'+itemDesc(ITEMS[eq[sl]])+'</small>':'<small>なし</small>'}</span>`).join('')}</div>
  <div style="font-size:11px;margin:-2px 0 6px"><b>素材</b> ${mt||'<small>なし（特別な木や強い敵から手に入る）</small>'}</div>
  ${inv.length?`<div class="inv">${inv.map(id=>ITEMS[id]?`<button data-eq="${id}" class="${eq[ITEMS[id].s]===id?'on':''}">${eq[ITEMS[id].s]===id?'✓ ':''}${ITEMS[id].n}　<small>${itemDesc(ITEMS[id])}</small></button>`:'').join('')}</div>`:'<small>依頼を解決すると装備がもらえる</small>'}`}
$('lifeCard').addEventListener('click',e=>{const b=e.target.closest('button[data-eq]');if(!b)return;sendAct('eq',b.dataset.eq);setTimeout(()=>lifeHud(true),120)});

// ================================================================ くらし (life ranks), workshop crafting, blizzard chores
const LIVES=['wood','hunt','fish','mine','craft','smith'];
const LIFE={wood:{n:'木こり',k:'斧',c:'#3f7a45',b:r=>`伐採の速さ +${r*7}%`},hunt:{n:'狩人',k:'弓',c:'#c0392b',b:r=>`攻撃力 +${r*6}%`},fish:{n:'釣り人',k:'釣',c:'#2f7de0',b:r=>DES()?`水くみの速さ +${r*8}%`:`釣りの速さ +${r*8}%`},craft:{n:'木工職人',k:'工',c:'#a8743f',b:r=>`作品の値段 +${r*15}%`},mine:{n:'採掘師',k:'掘',c:'#7a6a9a',b:r=>`採掘の速さ +${r*8}%`},smith:{n:'鍛冶屋',k:'鍛',c:'#5a6470',b:r=>`作れる武器が増える`}};
const LR=[{n:'見習い',x:0},{n:'かけだし',x:15},{n:'一人前',x:45},{n:'ベテラン',x:100},{n:'達人',x:180},{n:'マスター',x:300},{n:'伝説',x:480}];
const CRAFTN=['木のスプーン','木のおもちゃ','木彫りのクマ','ゆり椅子','からくり箱','精霊の木像','伝説の大彫刻'];
const lifeRank=(p,k)=>{const x=((p&&p.life)||{})[k]||0;let r=0;for(let i=0;i<LR.length;i++)if(x>=LR[i].x)r=i;return r};
const isRPG=()=>!!(G&&G.story);
const lifeB=(p,k,st)=>isRPG()?1+lifeRank(p,k)*st:1;
function lifeXp(p,k,n){if(!p||!isRPG())return;p.life=p.life||{};p.life[k]=(p.life[k]||0)+n}
function toggleLife(){const el=$('lifeCard');if(!isRPG()){el.hidden=true;return}el.hidden=!el.hidden;lifeHud(true)}
$('lifeBtn').addEventListener('click',toggleLife);
let _lhT=0;function lifeHud(force){const me=G&&(G.players[G.me]||G.players[0]);if(!me)return;const rpg=isRPG(),lb=$('lifeBtn');if(lb&&lb.hidden===rpg)lb.hidden=!rpg;if(!rpg){$('lifeCard').hidden=true;return}
  if(!me._lr){me._lr={};for(const k of LIVES)me._lr[k]=lifeRank(me,k)}
  for(const k of LIVES){const r=lifeRank(me,k);if(r>me._lr[k]){me._lr[k]=r;banner(`${LIFE[k].n} ランクUP！`,`「${LR[r].n}」になった`,LIFE[k].b(r),'r-SSR',true);SFX.ssr();burst(me.x,me.y,40,30,{c:['#ffd23f','#ffffff','#8ff08f'],s0:60,s1:220,u0:150,u1:320,l0:.6,l1:1.1,add:true,r0:5,r1:9})}else if(r<me._lr[k])me._lr[k]=r}
  const el=$('lifeCard');if(el.hidden)return;const now=performance.now();if(!force&&now-_lhT<300)return;_lhT=now;
  if(statusTab(me))return;$('rpgBox').innerHTML=rpgBoxHtml(me);$('lifeRows').innerHTML=LIVES.map(k=>{const r=lifeRank(me,k),x=(me.life||{})[k]||0,nx=LR[r+1],pr=nx?Math.round(100*(x-LR[r].x)/(nx.x-LR[r].x)):100;const L=LIFE[k];
    const un=(UNL[k]||[]).find(u=>u[0]>r);return `<div class="lr"><span class="ic" style="background:${L.c}">${L.k}</span><span><b>${L.n}</b> <span class="rk">${LR[r].n}</span></span><span style="opacity:.7">${L.b(r)}</span><span class="pb"><i style="width:${pr}%"></i></span>${un?`<small style="grid-column:2/4;color:#8a5a30">次：「${LR[un[0]].n}」で${un[1]}</small>`:''}</div>`}).join('')}
const snowy=()=>!!(G&&(wxIs('blizzard')||G.wave));
// ---- workshop bench by the fire: timing craft during storms
const WB={x:1330,y:1145};
function makeBench(){const g=new T.Group(),wood=std('#a8743f',{map:TEX.wood}),dk=std('#6e4524',{map:TEX.wood});g.add(at(rbox(64,6,34,2,wood),0,24,0));for(const [x,z] of [[-26,-12],[26,-12],[-26,12],[26,12]])g.add(at(box(5,24,5,dk),x,12,z));
  g.add(at(rot(cyl(5,5,26,std('#8a5a30',{map:TEX.bark}),8),0,0,Math.PI/2),-10,31,0),at(box(12,14,10,std('#c9a24a',{m:.5,r:.5})),16,33,2),at(rot(box(3,3,22,std('#3a3f48',{m:.6,r:.4})),0,.6,0),12,28,-8));
  g.add(at(box(22,14,14,std('#3a3f48',{m:.6,r:.4})),-44,7,6),at(box(30,6,14,std('#4a5058',{m:.6,r:.4})),-44,17,6));if(KK&&KK.prop&&KK.prop.Hammer_Small){const hm=KK.prop.Hammer_Small.scene.clone(true);hm.scale.setScalar(18/Math.max(1,KK.prop.Hammer_Small.h));hm.position.set(-44,21,6);hm.rotation.z=Math.PI/2;g.add(hm)}const sign=makeTextPlate('工房・鍛冶台',84,20,'#fff7ea','#8a5a30',.45);sign.position.set(0,58,-6);g.add(sign);g.position.set(WB.x,0,WB.y);g.rotation.y=-.6;world.add(g);G.benchV=g}
const craftV=()=>{const u=(G.t*1.25)%2;return u<1?u:2-u};
function craftGrade(){const v=craftV(),dv=Math.abs(v-.5);return dv<.07?2:dv<.17?1:0}
function updateCraft(dt){if(!isRPG()){for(const p of G.players)p.ePress=false;return}const on=snowy();for(const p of G.players){if(!p.ePress)continue;p.ePress=false;if(!on||p.down>0||dist(p.x,p.y,WB.x,WB.y)>80||!take(p,'log'))continue;
  const gr=p.eGrade||0,rk=lifeRank(p,'craft');p.cc=gr===2?(p.cc||0)+1:0;const base=(6+G.level*1.6)*(G.mod?G.mod.price:1)*(1+.15*rk);const val=Math.round(base*[.4,1.2,2.2][gr]*(1+Math.min(5,p.cc)*.1));
  G.cash+=val;G.earned+=val;lifeXp(p,'craft',[1,2,3][gr]);G.stats.craft=(G.stats.craft||0)+1;cnt(p,'carve');if(gr===2)cnt(p,'great');
  float(WB.x,WB.y,80,`${['しっぱい…','いい出来！','会心の出来！'][gr]} ${CRAFTN[Math.min(CRAFTN.length-1,rk)]} +$${val}${p.cc>1?`（${p.cc}連続）`:''}`,gr===2?'gold':gr?'cash':'red',gr===2);
  if(gr===2){SFX.rare();burst(WB.x,WB.y,40,16,{c:['#ffd23f','#ffffff'],s0:40,s1:160,u0:100,u1:240,l0:.4,l1:.8,add:true})}else if(gr)SFX.coin(2);else SFX.bad()}}
// ---- snow drifts pile up inside the town during storms
function driftMesh(d){const g=new T.Group(),m=std(DES()?'#e2c08a':'#f4f8fc',{r:.95});g.add(at(scl(sph(24,m,false,12,8),1.3,.55,1),0,0,0),at(scl(sph(16,m,false,10,6),1,.7,1),14,4,8),at(scl(sph(14,m,false,10,6),1,.6,1),-14,2,-6));
  g.add(at(rot(cyl(1.4,1.4,34,std('#8a5a30',{map:TEX.wood}),6),.5,0,.3),10,20,0),at(rot(box(10,1.5,12,std('#9aa3ad',{m:.6,r:.4})),.5,0,.3),16,6,2));g.position.set(d.x,0,d.y);g.scale.setScalar(.01);world.add(g);d.mesh=g}
function updateDrifts(dt){G.drifts=G.drifts||[];const on=snowy();G.driftT=(G.driftT||2)-dt;
  if(on&&G.driftT<=0&&G.drifts.length<9){G.driftT=rnd(2.5,4.5);let x=0,y=0,ok=false;for(let t=0;t<25&&!ok;t++){const a=rnd(0,TAU),r=rnd(130,FR-50);x=CX+Math.cos(a)*r;y=CY+Math.sin(a)*r;ok=!(G.pads.some(p=>Math.abs(p.x-x)<58&&Math.abs(p.y-y)<58)||G.drifts.some(q=>dist(q.x,q.y,x,y)<80)||dist(x,y,WB.x,WB.y)<80||Object.values(STN).some(q=>dist(q.conv.x,q.conv.y,x,y)<80||dist(q.counter.x,q.counter.y,x,y)<95)||G.players.some(p=>dist(p.x,p.y,x,y)<60))}
    if(ok){const d={id:++G.nid,x,y,p:0,s:rnd(.9,1.3)};G.drifts.push(d);if(!G.driftTold){G.driftTold=1;toast(DES()?'町に砂がたまってきた！ そばに立つと砂かき（燃えにくくなる）':'町に雪がふきだまってきた！ そばに立つと雪かきできる（放っておくと火が弱る）','cold')}}}
  for(const d of G.drifts){const near=G.players.filter(p=>!(p.down>0)&&!p.riding&&dist(p.x,p.y,d.x,d.y)<46+18*d.s).length;
    if(near){d.p+=dt*near;if(d.p>=1.3){d.dead=1;const v=Math.round((4+G.day*1.2)*(G.mod?G.mod.price:1));G.cash+=v;G.earned+=v;float(d.x,d.y,50,`${DES()?'砂':'雪'}かき +$${v}`,'cash');const r=Math.random();if(r<.25)dropItem(d.x,d.y,'log');else if(r<.33)dropItem(d.x,d.y,'meat');
      burst(d.x,d.y,10,22,{c:DES()?['#e2c08a','#fff1c9']:['#ffffff','#dff3ff'],s0:60,s1:200,u0:120,u1:280,l0:.5,l1:.9,r0:5,r1:10});SFX.chop();G.stats.shovel=(G.stats.shovel||0)+1}}
    else d.p=Math.max(0,d.p-dt*.3);if(!on){d.melt=(d.melt||0)+dt;if(d.melt>25)d.dead=1}}
  for(const d of G.drifts)if(d.dead&&d.mesh)world.remove(d.mesh);G.drifts=G.drifts.filter(d=>!d.dead)}
function driftFx(){if(!G||!G.drifts)return;const me=G.players[G.me]||G.players[0];for(const d of G.drifts){if(!d.mesh)driftMesh(d);const g=d.mesh;g.userData.g=Math.min(1,(g.userData.g||0)+.03);g.scale.setScalar(d.s*g.userData.g*(1-.55*clamp(d.p/1.3,0,1)));
    if(me&&dist(me.x,me.y,d.x,d.y)<170)label(d.x,d.y,48,d.p>0?bar(100*d.p/1.3,'blue'):`<small>${DES()?'砂':'雪'}かき</small>`,'')}}
// ---- stories by the fire during storms
const TALES=['昔、この谷は一年中あたたかい緑の土地だった。雪なんて、年に一度降るかどうかだったのさ','冬が明けなくなったのは、南の砂漠で“何か”が掘り出された年からだと言われている','白い狼たちは、もともと北の果ての山にしか住んでいなかった。冬と一緒に降りてきたんだ','火を絶やすな。火は人を集め、人は町をつくる。それがこの土地の教えだよ','オーロラの夜には、昔の人の声が聞こえるそうだ。“心臓を眠らせよ”ってね','砂漠の民は、冬の心臓を“青い太陽”と呼んで恐れていたらしい'];
function updateFireside(dt){if(!isRPG())return;const on=snowy();const key=G.day+(G.wave?'w':'b');for(const p of G.players){if(p.down>0||!on||dist(p.x,p.y,CX,CY)>175){p.taleT=0;continue}p.taleT=(p.taleT||0)+dt;
    if(p.taleT>4&&G.taleKey!==key){G.taleKey=key;const i=(G.stats.tales||0)%TALES.length;G.stats.tales=(G.stats.tales||0)+1;say(DES()?'隊長ザラ':'村長オルガ',TALES[i]);if(!G.taleEnd)G.pm.dmg+=.25;G.taleEnd=G.t+G.DAY;banner('焚き火の昔話','みんなの攻撃力 +25%','明日のこの時間まで','area');SFX.rare()}}
  if(G.taleEnd&&G.t>G.taleEnd){G.taleEnd=0;G.pm.dmg=Math.max(0,G.pm.dmg-.25);toast('昔話の元気が切れた','cold')}}
function fireFx(){if(!G||!running)return;if(G.benchV)G.benchV.visible=isRPG();if(!isRPG()){if(snowy()&&!G.wxDisc){G.wxDisc=1;toast('吹雪の間は大工仕事がはかどる：建設費20%オフ','gold')}if(!snowy())G.wxDisc=0;return}const me=G.players[G.me]||G.players[0];if(!me)return;const on=snowy();
  const dw=dist(me.x,me.y,WB.x,WB.y);if(dw<170){if(!on)label(WB.x,WB.y,70,'<b>工房</b><br><small>Eキーで装備を作る（特別な木材や素材を使う）</small>','');
    else if(!has(me,'log'))label(WB.x,WB.y,70,'<b>工房</b><br><small>Eキーで装備を作る・薪があれば吹雪の内職</small>','');
    else label(WB.x,WB.y,76,`<b>工房</b> 緑でEキー！（Qで装備づくり）<div class="cbar"><i style="left:${(craftV()*100).toFixed(1)}%"></i></div>`,'')}
  if(on&&dist(me.x,me.y,CX,CY)<175&&dw>=170&&G.taleKey!==G.day+(G.wave?'w':'b'))label(CX,CY,150,`<small>焚き火のそばにいると、${DES()?'ザラ':'オルガ'}が昔話をしてくれる…</small>`,'')}

// ================================================================ boss types (each with its own tell and counterplay)
const BTS=['','charge','frost','alpha','king','queen'],WK=['line','cone','ring','circle'];
const BTN={charge:'突進ヘラジカ',frost:'氷息のオオカミ',alpha:'群れの長',king:'白き王',queen:'砂の女王'};
const BTH={charge:'赤い線が出たら横へよけろ！ 突進のあとは目を回す（ダメージ2倍）',frost:'青い扇から離れろ！ 吐息で体温をうばわれる',alpha:'遠吠えで仲間を呼ぶ。早めにたおせ',king:'突進・吐息・地ならしを使い分ける。赤い円から逃げろ',queen:'砂にもぐって足元から飛び出す。黄色い円から逃げろ'};
const BTC={charge:'#d9a070',frost:'#a8dcff',alpha:'#8a909a',king:'#ffffff',queen:'#6a2a5a'};
function pickBt(){const L=DES()?['charge','alpha','queen']:['charge','frost','alpha'];return L[Math.floor(Math.random()*L.length)]}
function setBtLook(b,bt){b.bt=bt;if(bt==='charge'&&!DES()&&b.m&&b.m.mx&&b.m.key!=='Stag'){const par=b.m.g.parent,sc=b.m.g.scale.x;const nm=makeBear(b.kind,'Stag');if(par){par.remove(b.m.g);par.add(nm.g)}nm.g.scale.setScalar(sc);nm.g.position.set(b.x,0,b.y);b.m=nm}const m=b.m;if(!m)return;if(m.fur&&BTC[bt]&&!DES()||(m.fur&&bt==='queen')){if(!(m.key==='Stag'))m.fur.color.copy(lin(BTC[bt]))}if(m.btx)m.g.remove(m.btx);const x=new T.Group();m.btx=x;
  const col={charge:'#ff5a3a',frost:'#7fd4ff',alpha:'#c9a2ff',king:'#ffd23f',queen:'#ff7fe0'}[bt]||'#ffffff';
  const ring=M_(new T.TorusGeometry(26,1.6,6,32),glow(col,2.2),false);ring.rotation.x=Math.PI/2;ring.position.y=2;x.add(ring);
  if(!m.mx&&(bt==='frost'||bt==='king'))for(let i=0;i<5;i++)x.add(at(rot(cone(3,12,glow('#bfe9ff',1.8),5,false),-.3,0,(i-2)*.25),(i-2)*4,36,-6+i*3));
  if(bt==='alpha'&&!m.mx){x.add(at(scl(sph(12,std('#4a4f58',{r:.9}),false,10,8),1.3,.8,1),0,30,8));}
  if(bt==='charge'&&!m.mx)for(const sx of [-1,1])x.add(at(rot(cone(2.2,10,std('#f4ead2',{r:.5}),6,false),0,0,sx*.5),sx*9,38,26));
  m.g.add(x)}
function setBt(b,bt){setBtLook(b,bt);b.sk=2;b.sk2=3;b.sk3=4;if(bt==='alpha')b.hw=5}
function warn(k,x,y,a,r,t){G.warns=G.warns||[];G.warns.push({id:++G.nid,k,x,y,a,r,t,max:t})}
function bossHit(b,p,dmg,kb){const v=Math.round(dmg*armorOf(p)*DM().atk*(1+(YR()-1)*.15));p.hp-=v;hitLoss(p);p.hurt=.4;p.inv=.7;const k=dist(p.x,p.y,b.x,b.y)||1;p.x+=(p.x-b.x)/k*kb;p.y+=(p.y-b.y)/k*kb;G.shake=Math.max(G.shake,12);float(p.x,p.y,60,`-${v}`,'red');burst(p.x,p.y,24,14,{c:['#ff9a9a','#ffffff'],s0:40,s1:160,l0:.3,l1:.6})}
function bossAct(b,dt,t){if(b.ph)return true;const d=dist(b.x,b.y,t.x,t.y),bt=b.bt,ang=Math.atan2(t.x-b.x,t.y-b.y);b.sk=(b.sk||0)-dt;b.sk2=(b.sk2||0)-dt;b.sk3=(b.sk3||0)-dt;
  if((bt==='charge'||bt==='king')&&b.sk<=0&&d>130&&d<500){b.ph='wc';b.pt=bt==='king'?.85:1.1;b.ca=ang;b.sk=bt==='king'?7:5.5;b.roar=.9;warn('line',b.x,b.y,ang,560,b.pt);return true}
  if((bt==='frost'||bt==='king')&&b.sk2<=0&&d<260){b.ph='wf';b.pt=1.2;b.ca=ang;b.sk2=bt==='king'?9:5;b.roar=.6;warn('cone',b.x,b.y,ang,300,b.pt);return true}
  if(bt==='king'&&b.sk3<=0&&d<180){b.ph='ws';b.pt=1;b.sk3=5.5;b.roar=.8;warn('ring',b.x,b.y,0,215,b.pt);return true}
  if(bt==='queen'&&b.sk<=0&&d<700){b.ph='bu';b.pt=1.8;b.hide=1;b.sk=7.5;b.btT=t;burst(b.x,b.y,10,30,{c:['#e2b877','#c9955b'],s0:80,s1:240,u0:120,u1:300,l0:.5,l1:1,r0:6,r1:12});SFX.chop();return true}
  return false}
function bossPhase(b,dt){b.pt-=dt;b.moving=false;const ph=b.ph;
  if(ph==='wc'){b.dirT=b.ca;if(b.pt<=0){b.ph='ac';b.pt=1.25;b.roar=.5}}
  else if(ph==='ac'){const v=440;b.x+=Math.sin(b.ca)*v*dt;b.y+=Math.cos(b.ca)*v*dt;b.dirT=b.ca;b.moving=true;b.step+=dt*16;
    for(const p of G.players)if(!(p.down>0)&&p.inv<=0&&dist(p.x,p.y,b.x,b.y)<55)bossHit(b,p,44,110);
    if(Math.random()<dt*25)puff(b.x,b.y,4,{c:DES()?'#e2b877':'#e8f2fa',r:14,life:.7,a:.8,vy:14,grow:1.6});
    let stop=b.pt<=0||b.x<60||b.x>WORLD-60||b.y<60||b.y>WORLD-60;if(!b.raid&&dist(b.x,b.y,CX,CY)<FR+45)stop=true;
    if(stop){b.ph='st';b.pt=1.9;G.shake=Math.max(G.shake,8);float(b.x,b.y,120,'目を回した！ 今がチャンス','gold')}}
  else if(ph==='wf'){b.dirT=b.ca;if(b.pt<=0){for(const p of G.players){if(p.down>0)continue;const d=dist(p.x,p.y,b.x,b.y),aa=Math.atan2(p.x-b.x,p.y-b.y),df=Math.abs(Math.atan2(Math.sin(aa-b.ca),Math.cos(aa-b.ca)));if(d<300&&df<.62){p.warm=Math.max(0,p.warm-38);if(p.inv<=0)bossHit(b,p,14,40);float(p.x,p.y,84,'体温をうばわれた！','cold')}}
      for(let i=0;i<34;i++){const a=b.ca+rnd(-.6,.6),r=rnd(30,300);burst(b.x+Math.sin(a)*r,b.y+Math.cos(a)*r,20,1,{c:['#dff3ff','#9fd8ff','#ffffff'],s0:10,s1:50,u0:20,u1:90,l0:.4,l1:.9,r0:5,r1:10,add:true})}b.ph='rs';b.pt=.7;SFX.wave()}}
  else if(ph==='ws'){if(b.pt<=0){for(const p of G.players){if(p.down>0||p.inv>0)continue;if(dist(p.x,p.y,b.x,b.y)<215)bossHit(b,p,40,130)}burst(b.x,b.y,10,50,{c:['#ffffff','#dff3ff','#c9d3dd'],s0:200,s1:420,u0:40,u1:140,l0:.5,l1:.9,r0:6,r1:12});G.shake=18;SFX.bad();b.ph='rs';b.pt=.6}}
  else if(ph==='bu'){const t=b.btT&&G.players.includes(b.btT)&&!(b.btT.down>0)?b.btT:G.players.find(p=>!(p.down>0))||G.players[0];const d=dist(b.x,b.y,t.x,t.y);if(d>10){const k=Math.min(d,300*dt);b.x+=(t.x-b.x)/d*k;b.y+=(t.y-b.y)/d*k}
    if(b.pt<=0){b.ph='we';b.pt=1;b.ex=t.x;b.ey=t.y;warn('circle',t.x,t.y,0,95,1)}}
  else if(ph==='we'){b.x=lerp(b.x,b.ex,Math.min(1,dt*6));b.y=lerp(b.y,b.ey,Math.min(1,dt*6));if(b.pt<=0){b.hide=0;b.x=b.ex;b.y=b.ey;for(const p of G.players){if(p.down>0||p.inv>0)continue;if(dist(p.x,p.y,b.x,b.y)<95)bossHit(b,p,46,120)}
      burst(b.x,b.y,10,50,{c:['#e2b877','#c9955b','#fff1c9'],s0:120,s1:360,u0:200,u1:420,l0:.6,l1:1.1,r0:6,r1:12});G.shake=16;SFX.bad();b.ph='rs';b.pt=1.2}}
  else if(ph==='st'){if(b.pt<=0)b.ph=null}
  else if(ph==='rs'){if(b.pt<=0)b.ph=null}
  else b.ph=null;
  b.x=clamp(b.x,40,WORLD-40);b.y=clamp(b.y,40,WORLD-40)}
function bossPassive(b,dt){if(b.bt!=='alpha'||!(b.state==='chase'||b.raid))return;b.hw=(b.hw||5)-dt;if(b.hw>0)return;b.hw=12;if(G.bears.filter(q=>!q.dead&&q.pack===b.id).length>=5)return;
  b.roar=1.2;float(b.x,b.y,130,'ウオォーン！ 仲間を呼んだ','red');SFX.wave();
  for(let i=0;i<3;i++){let nb;if(b.raid){spawnRaider(false);nb=G.bears[G.bears.length-1];if(G.raid.on)G.raid.total++}else nb=spawnBear(b.zone||'A',true);nb.pack=b.id;nb.x=b.x+rnd(-90,90);nb.y=b.y+rnd(-90,90);nb.m.g.position.set(nb.x,0,nb.y);if(!b.raid&&b.target){nb.state='chase';nb.target=b.target}burst(nb.x,nb.y,10,14,{c:['#ffffff','#e3f0f7'],s0:40,s1:140,u0:60,u1:180,l0:.5,l1:.9,r0:5,r1:9})}}
function xzQuad(w,L){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,w/2,0,L,-w/2,0,0,w/2,0,L,-w/2,0,L],3));return g}
function xzFan(r,half,n){const v=[];for(let i=0;i<n;i++){const a0=-half+2*half*i/n,a1=-half+2*half*(i+1)/n;v.push(0,0,0,Math.sin(a0)*r,0,Math.cos(a0)*r,Math.sin(a1)*r,0,Math.cos(a1)*r)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));return g}
let _wfT=performance.now();
function warnFx(){const now=performance.now(),dt=Math.min(.1,(now-_wfT)/1000);_wfT=now;if(!G||!G.warns)return;
  for(const w of G.warns){if(!w.m){const col={line:'#ff3b3b',cone:'#5ab8ff',ring:'#ff3b3b',circle:'#ffcc33'}[w.k];const geo=w.k==='line'?xzQuad(64,w.r):w.k==='cone'?xzFan(w.r,.62,14):xzFan(w.r,Math.PI,32);
      const mk=o=>{const m=M_(geo,new T.MeshBasicMaterial({color:lin(col),transparent:true,opacity:o,depthWrite:false,depthTest:false,side:T.DoubleSide}),false);m.renderOrder=4;return m};
      const g=new T.Group();g.position.set(w.x,1.5,w.y);g.rotation.y=w.a;const bg=mk(.22),fill=mk(.38);g.add(bg,fill);g.userData.fill=fill;world.add(g);w.m=g}
    w.t-=dt;const k=clamp(1-w.t/w.max,0,1),f=w.m.userData.fill;if(w.k==='line')f.scale.set(1,1,Math.max(.01,k));else f.scale.set(Math.max(.01,k),1,Math.max(.01,k));f.material.opacity=.3+.25*Math.sin(now/60);
    if(w.t<=0&&w.m.parent)world.remove(w.m)}
  if(NET.mode!=='guest')G.warns=G.warns.filter(w=>w.t>0)}
// ---- chapter 3: the ruins and the heart of winter
function ruinVis(){const S=G.story,on=!!(S&&S.ch===3&&DES());if(!on){if(G.ruinV)G.ruinV.visible=false;if(G.heartV)G.heartV.visible=false;return}
  if(!G.ruinV||!G.ruinV.parent){const g=new T.Group();g.position.set(RUIN.x,0,RUIN.y);const stoneM=std('#c9a77a',{r:.9,flat:true}),dk=std('#8a6a48',{r:.9,flat:true});
    g.add(at(scl(sph(120,std('#e2b877',{r:1}),false,16,8),1,.12,1),0,0,0));
    for(let i=0;i<9;i++){const a=i/9*TAU,r=110+(i%2)*14,h=[70,40,90,30,60,85,25,55,75][i];const c=at(cyl(10,12,h,stoneM,8),Math.cos(a)*r,h/2,Math.sin(a)*r);if(i%3===1)c.rotation.z=.35;g.add(c);g.add(at(box(26,6,26,dk),Math.cos(a)*r,h,Math.sin(a)*r))}
    g.add(at(box(90,10,60,dk),0,5,0));const mural=at(box(80,50,8,stoneM),0,35,-50);g.add(mural);const sun=at(cyl(12,12,1.5,glow('#7fd4ff',1.6),20,false),0,42,-45.5);sun.rotation.x=Math.PI/2;g.add(sun);
    const beam=M_(new T.CylinderGeometry(50,50,650,20,1,true),new T.MeshBasicMaterial({color:lin('#7fd4ff'),transparent:true,opacity:.18,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=325;g.add(beam);g.userData.beam=beam;
    const sign=makeTextPlate('古代遺跡',110,28,'rgba(255,250,240,.92)','#8a6a48',.5);sign.position.set(0,140,0);sign.userData.bb=true;g.add(sign);g.userData.sign=sign;world.add(g);G.ruinV=g}
  G.ruinV.visible=true;const t=performance.now()/1000;G.ruinV.userData.beam.visible=S.step===2&&!S.ruin;G.ruinV.userData.beam.material.opacity=.14+Math.sin(t*2)*.06;G.ruinV.userData.sign.quaternion.copy(camera.quaternion);
  if(!G.heartV||!G.heartV.parent){const h=new T.Group();const c=M_(new T.OctahedronGeometry(14,0),glow('#7fd4ff',2.6),false);c.scale.set(1,1.5,1);h.add(c);const l=new T.PointLight(lin('#7fd4ff'),1.6,260,1.6);h.add(l);world.add(h);G.heartV=h}
  const hv=G.heartV;hv.visible=S.step>=4;if(!hv.visible)return;hv.rotation.y=t*2;
  if(S.hs===1&&G.players[S.hc]){const p=G.players[S.hc];hv.position.set(p.x,70+Math.sin(t*4)*3,p.y)}else if(S.hs===3){hv.position.set(CX,34+Math.sin(t*2)*4,CY)}else hv.position.set(S.hx||RUIN.x,26+Math.sin(t*3)*4,S.hy||RUIN.y);
  const me=G.players[G.me]||G.players[0];if(S.step===4&&S.hs!==1&&S.hs!==3&&me&&dist(me.x,me.y,hv.position.x,hv.position.z)<260)label(hv.position.x,hv.position.z,60,'<b>冬の心臓</b><br>近づくと持てる','')}

// ================================================================ story mode (chapters + morning autosave)
var gameMode=store.get('mw-mode','story');var SAVE_K='mw-story1';
var CH={1:{n:'第1章',t:'ホワイトアウト',play:true,open:['その年、冬は終わらなかった。','吹雪は町をのみこみ、\n人々は散り散りになった。','残されたのは、\n消えかけたひとつのかまど――','あなたは、この火を守るために\nこの町へやってきた。'],sub:'目標：町のシンボル像を建て、最後の夜を守りきれ',
  intro:[['村長オルガ','よく来てくれた…この吹雪で、町のかまどの火が消えかけている'],['村長オルガ','木を切って薪をくべておくれ。火さえあれば、人は集まってくる']],
  outro:'像のまわりで、みんなが久しぶりに笑った。\nけれどその夜明け、北の山から戻った斥候カイは青ざめていた。\n\n「家より大きな白い影を見た。狼どもは、あいつに従って動いてる…」\n\n町の人はそれを「白き王」と呼んだ。'},
 2:{n:'第2章',t:'白き王',play:true,open:['像が完成した夜から、ひと月。','北の山から、\n地鳴りのような足音が近づいてくる。','狼たちを束ねる“白き王”――\n町は、ふたたび試されようとしていた。'],sub:'王の正体をつきとめ、町を守りぬけ',
  intro:[['斥候カイ','北の山で見た白い影…狼どもを束ねる“王”がいる'],['村長オルガ','去年より冬も厳しい。まずは守りを固めよう。見張り台を強くしておくれ']],
  outro:'白き王は、灯台の光の下で雪に崩れ落ちた。\n吹雪が、ほんの少しだけ弱まった気がする。\n\n村長オルガ「王がいなくなっても、この冬は終わらない。\n南の砂の向こうに、冬の原因があると聞いたことがある…」\n\n斥候カイは、南への道の雪をかきわけはじめた。'},
 3:{n:'第3章',t:'南への道',play:true,desert:true,open:['白き王は倒れた。\nけれど、冬は終わらなかった。','斥候カイは、南の砂漠に\n“冬の原因”が眠っていると聞く。','雪をかきわけ、たどり着いたのは――\n灼熱の砂の町だった。'],sub:'砂の町で、冬の原因をつきとめろ',
  intro:[['斥候カイ','ここが砂の町か…昼は焼けるように暑いのに、夜は凍えるほど寒い'],['隊長ザラ','北から来た旅人かい？ ここじゃ水が命だ。湧き水をくんで井戸を満たしな']],
  outro:'井戸の底に沈めた心臓は、ゆっくりと青い光を失っていった。\nその夜明け、北の空をおおっていた雲が、はじめて割れた。\n\n隊長ザラ「北の町に帰りな。春が来るかもしれないよ」\n\n――第4章「帰郷」は制作中'},
 4:{n:'第4章',t:'帰郷',play:false,sub:'（制作中）ここからは自由に遊べる'}};
const FP=()=>{const r=ZONES[1].rect;return{x:(r[0]+r[2])/2,y:(r[1]+r[3])/2}};
const stx=o=>typeof o.t==='function'?o.t():o.t;
const kingOf=()=>G.bears.find(b=>b.king&&!b.dead);
const RUIN={x:520,y:330};
const SOBJ={3:[
  {t:'水くみ係を2人雇え',f:()=>[G.workers.filter(w=>w.role==='fisher').length,2],tg:()=>{const p=G.pads.find(q=>q.id==='fisher');return p&&p.vis()?{x:p.x,y:p.y,h:50}:null}},
  {t:'キャラバンと2回取引し、砂の町の悩みを1つ解決しろ',p:()=>`取引 ${Math.min(2,(G.stats.car||0)-(G.story.car0||0))}/2・悩み ${Math.min(1,solvedN('desert'))}/1`,f:()=>[Math.min(2,(G.stats.car||0)-(G.story.car0||0))+Math.min(1,solvedN('desert')),3],on:()=>{G.story.car0=G.stats.car||0;say('隊長ザラ','水が回りだしたね。キャラバンの注文に応えてくれたら、とっておきの話をしてやるよ')},tg:()=>G.car&&G.car.state==='here'?{x:CAR_STOP.x,y:CAR_STOP.y,h:60}:null},
  {t:'北西の古代遺跡を調べろ',f:()=>[G.story.ruin?1:0,1],tg:()=>({x:RUIN.x,y:RUIN.y,h:80}),on:()=>{say('隊長ザラ','約束だ。北西の砂に埋もれた遺跡に、青く光る“冬の心臓”が眠っているって話さ');say('斥候カイ','そいつが冬の原因か…見に行こう')}},
  {t:'砂の女王をたおせ',f:()=>[G.story.queen&&!G.bears.some(b=>b.id===G.story.queen&&!b.dead)?1:0,1],tg:()=>{const b=G.bears.find(b=>b.id===G.story.queen&&!b.dead);return b&&!b.hide?{x:b.x,y:b.y,h:80}:null},on:()=>{say('斥候カイ','壁画だ…“青い太陽”が北へ冷たい風を送ってる…これが冬の心臓か！');say('斥候カイ','待て、砂が動いてる！ 何か出てくるぞ！')}},
  {t:'冬の心臓を井戸まで運べ',f:()=>[G.story.hs===3?1:0,1],tg:()=>{const S=G.story;return S.hs===1?{x:CX,y:CY,h:110}:{x:S.hx||RUIN.x,y:S.hy||RUIN.y,h:60}},on:()=>{const S=G.story;S.hs=0;S.hx=RUIN.x;S.hy=RUIN.y;say('隊長ザラ','女王を倒したのかい！ 心臓を井戸の底に沈めれば、力を封じられるはずだ')}},
  {t:'最後の夜：心臓を狙う群れから井戸を守れ',p:()=>'今夜',f:()=>[0,1],on:()=>{G.finalPending=true;say('斥候カイ','心臓の光に、砂の化け物どもが集まってくる…今夜が最後の勝負だ！')}}],
2:[
  {t:'見張り台を3つともLv2にしろ',f:()=>[TOWERS.filter(t=>G.lv['tw_'+t.id]>=2).length,3],tg:()=>{const t=TOWERS.find(t=>G.lv['tw_'+t.id]<2);return t?{x:t.x,y:t.y,h:50}:null}},
  {t:'襲撃の夜を2回しのぎ、町の悩みを2つ解決しろ',p:()=>`襲撃 ${Math.min(2,G.story.raids||0)}/2・悩み ${Math.min(2,solvedN('snow'))}/2`,f:()=>[Math.min(2,G.story.raids||0)+Math.min(2,solvedN('snow')),4],on:()=>{G.story.raids=0;say('斥候カイ','守りはできた。群れの動きを見たい。2晩しのいでくれ')}},
  {t:'奥地の森で巨大な足跡を調べろ',f:()=>[G.story.fp?1:0,1],tg:()=>Object.assign(FP(),{h:60}),on:()=>{say('斥候カイ','襲ってくる数が明らかに増えてる。奥地の森に、王の足跡があるはずだ');say('斥候カイ','光っている場所を調べてきてくれ')}},
  {t:'王の手下（ボスオオカミ）をたおせ',f:()=>[G.story.minion&&!G.bears.some(b=>b.id===G.story.minion&&!b.dead)?1:0,1],tg:()=>{const b=G.bears.find(b=>b.id===G.story.minion&&!b.dead);return b?{x:b.x,y:b.y,h:70}:null},on:()=>{say('斥候カイ','…でかい。しかも町の方へ続いてる。気をつけろ、手下が来るぞ！')}},
  {t:()=>{const g=goalOf(2);return `${g.n}を建てろ（かまどLv${g.lv}・町人${g.pop}人）`},p:()=>`$${goalOf(2).c.toLocaleString()}`,f:()=>[G.monument?1:0,1],tg:()=>({x:MON.x,y:MON.y,h:60}),on:()=>{say('村長オルガ','手下を倒したか…王は光を嫌うという言い伝えがある');say('村長オルガ','氷の大灯台を建てれば、王をおびき出せるかもしれない')}},
  {t:'白き王をたおし、灯台を守れ',p:()=>{const k=kingOf();return k?`王 HP ${Math.ceil(k.hp)}`:'今夜'},f:()=>[0,1],tg:()=>{const k=kingOf();return k?{x:k.x,y:k.y,h:90}:null},on:()=>{say('斥候カイ','灯台の光に王が気づいた…今夜、来るぞ！')}}]};
const TALKQ=[];let talkT=0;
function say(who,txt,local){if(TALKQ.length<8)TALKQ.push([who,txt]);if(!local&&NET.mode==='host'){NET.outS=NET.outS||[];if(NET.outS.length<6)NET.outS.push([who,txt])}}
function tickTalk(dt){const el=$('talk');if(!el)return;if(!running){el.hidden=true;talkT=0;TALKQ.length=0;return}if(talkT>0){talkT-=dt;if(talkT<=0)el.hidden=true}
  if(talkT<=0&&TALKQ.length){const [w,t]=TALKQ.shift();$('talkWho').textContent=w;$('talkTxt').textContent=t;el.hidden=true;void el.offsetWidth;el.hidden=false;talkT=Math.max(3.4,t.length*.14)}}
function startLabel(room){let db=0;try{db=dbgBio}catch(_){}if(gameMode!=='story'||db)return room?'部屋を作って始める':'火を灯す';const d=store.get(SAVE_K,null);return (d?'つづきから':'第1章をはじめる')+(room?'（部屋を作る）':'')}
function modeUI(){const st=gameMode==='story';$('mStory').setAttribute('aria-pressed',st);$('mFree').setAttribute('aria-pressed',!st);const d=store.get(SAVE_K,null),el=$('storyLine');
  if(st){el.hidden=false;const C=d?(CH[d.story.ch]||CH[3]):CH[1];el.innerHTML=d?`つづき：<b>${C.n}「${C.t}」</b>　DAY ${d.day}${d.fresh?'（章のはじめ）':'の朝から'}`:'はじめから：<b>第1章「ホワイトアウト」</b><br>何日かに分けて遊べる。朝になるたび自動でセーブ';$('storyReset').hidden=!d;$('storyReset').textContent='ものがたりを最初からやり直す'}
  else{el.hidden=true;$('storyReset').hidden=true}
  $('dSeg').style.display=st&&d?'none':'';netLine()}
$('mStory').addEventListener('click',()=>{gameMode='story';store.set('mw-mode',gameMode);modeUI()});
$('mFree').addEventListener('click',()=>{gameMode='free';store.set('mw-mode',gameMode);modeUI()});
$('storyReset').addEventListener('click',e=>{const b=e.currentTarget;if(!b.dataset.sure){b.dataset.sure='1';b.textContent='本当に消す？（もう一度押すと消えます）';setTimeout(()=>{delete b.dataset.sure;modeUI()},4000);return}delete b.dataset.sure;try{localStorage.removeItem(SAVE_K)}catch(_){}toast('ものがたりを最初からにしました','cold',true);modeUI()});
setTimeout(()=>{try{modeUI()}catch(_){}},0);
function saveData(){return{v:1,seed:G.seed,diff:G.diff,year:G.year,day:G.day,cash:Math.floor(G.cash),earned:Math.floor(G.earned),rep:G.rep,fuel:Math.max(45,G.fuel),woodpile:G.woodpile,level:G.level,rank:G.rank||0,
  zones:Object.assign({},G.zones),lv:Object.assign({},G.lv),pm:Object.assign({},G.pm),stats:Object.assign({},G.stats),raidWins:G.raidWins,mission:G.mission,perk:Object.assign({},G.perkCount),yb:G.yearBonus||0,mg:G.metaGiven||0,
  sec:G.secrets?G.secrets.map(q=>q.found?1:0):[],secS:G.secretS||0,stele:G.stele||0,pl:[0,1].map(i=>G.players[i]&&!(NET.mode==='host'&&i===1&&!NET.guestPeer)?{lv:Object.assign({},G.players[i].lv),life:Object.assign({},G.players[i].life||{}),rl:G.players[i].rl||1,rx:G.players[i].rx||0,mats:Object.assign({},G.players[i].mats||{}),cnt:Object.assign({},G.players[i].cnt||{}),chd:(G.players[i].chd||[]).slice(),items:(G.players[i].items||[]).slice(),eq:Object.assign({},G.players[i].eq||{})}:(G.savePl&&G.savePl[i])||null),
  wk:G.workers.map(w=>({r:w.role,st:w.st?w.st.id:null,tw:w.tw,slot:w.slot})),surv:G.surv.filter(q=>!q.frozen&&q.arrived).length,sleds:G.sleds.length,mon:G.monument?1:0,
  story:JSON.parse(JSON.stringify(G.story)),biome:G.biome||0,at:Date.now()}}
function snapSave(){if(!G||!G.story||NET.mode==='guest'||!running)return;store.set(SAVE_K,saveData())}
function storyNew(np,seed){seed=seed||(1+((Math.random()*1e9)|0));
  if(gameMode!=='story'||dbgBio){newGame(np,{seed,diff:gameDiff,biome:dbgBio});G.story=null;return seed}
  const d=store.get(SAVE_K,null);if(d&&d.v===1){if(d.fresh&&CH[d.story.ch]&&CH[d.story.ch].desert&&!d.biome){const sd=1+((Math.random()*1e9)|0);newGame(np,{seed:sd,diff:d.diff||0,biome:1});G.year=2;G.story=JSON.parse(JSON.stringify(d.story));G.story.seen=G.story.seen||{};return sd}newGame(np,{seed:d.seed,diff:d.diff||0,biome:d.biome||0});applySave(d);return d.seed}
  newGame(np,{seed,diff:gameDiff});G.story={ch:1,step:0,seen:{},raids:0};return G.seed}
function applySave(d){G.year=d.year||1;G.day=d.day;G.t=(d.day-1)*G.DAY+.5;G.cash=d.cash;G.earned=d.earned;G.rep=d.rep;G.fuel=d.fuel;G.woodpile=d.woodpile||0;G.level=d.level;G.rank=d.rank||0;
  Object.assign(G.lv,d.lv);Object.assign(G.pm,d.pm);Object.assign(G.stats,d.stats);G.raidWins=d.raidWins||0;G.mission=d.mission;G.perkCount=d.perk||{};G.yearBonus=d.yb;G.metaGiven=d.mg;G.savePl=d.pl;G._dm=null;
  if(G.secrets&&d.sec)G.secrets.forEach((q,i)=>{if(d.sec[i]){q.found=true;if(q.m)q.m.visible=false}});G.secretS=d.secS||0;G.stele=d.stele||0;
  if(DES()){G.year=d.year}for(const z of ZONES)if(d.zones[z.id]){G.zones[z.id]=true;z.fogT=1;z.fog.visible=false;z.sign.visible=false;for(const id in G.stations){const st=G.stations[id];if(st.def.zone===z.id){st.open=true;st.unlockT=0;st.parts.forEach(o=>o.visible=true);if(st.sign)st.sign.visible=false}}if(z.id==='D'){G.spa.on=true;G.spa.fuel=40}if(z.id==='C'){G.bossT=60;for(let i=0;i<4;i++)spawnBear('C',true)}}
  for(const q of G.surv)world.remove(q.m.g);G.surv.length=0;const need=(d.wk||[]).length+(d.surv||0);for(let i=0;i<need;i++)spawnSurvivor(true);
  for(const w of d.wk||[]){if(!hire(w.r,{x:CX,y:CY+80},w.st||undefined))continue;const nw=G.workers[G.workers.length-1];if(w.tw!=null)nw.tw=w.tw;if(w.slot!=null)nw.slot=w.slot}
  while(G.sleds.length<(d.sleds||0))G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});
  G.players.forEach((p,i)=>{if(d.pl&&d.pl[i]){p.lv=Object.assign({gun:0,bag:0},d.pl[i].lv);p.life=Object.assign({},d.pl[i].life||{});rpgRestore(p,d.pl[i])}});
  G.story=JSON.parse(JSON.stringify(d.story));G.story.seen=G.story.seen||{};if(d.mon){G.monument=true;G.monV.visible=true;G.monV.scale.setScalar(.01);G.monPop=0;G.finalPending=true}
  if(G.story.ch===2&&G.story.step===3)G.story.minion=0;if(G.story.ch===3&&G.story.step===3)G.story.queen=0;if(G.story.hs===1)G.story.hs=2;for(const k in (G.story.q||{})){const q=G.story.q[k];if(q.st===1&&QUESTS[k]&&QUESTS[k].type==='escort'){q.f=null;q.x=QUESTS[k].x;q.y=QUESTS[k].y}}G.story.king=0;G.story.back=!d.fresh}
function storyIntro(){const S=G.story,C=CH[S.ch];if(!C)return;
  if(!S.seen.intro){S.seen.intro=1;const go=()=>{if(!running||G.story!==S)return;banner(C.n,C.t,C.sub,'area');setTimeout(()=>{if(running&&G.story===S)for(const [w,t] of C.intro||[])say(w,t)},1600);trackerFlash()};if(C.open){NET.opCh=S.ch;playOpening(C,go)}else setTimeout(go,1500);return}
  setTimeout(()=>{if(running&&G.story===S)banner(C.n,C.t,C.sub,'area')},3400);
  if(S.back)setTimeout(()=>{if(running&&G.story===S)say(DES()?'隊長ザラ':'村長オルガ',`おかえり。DAY ${G.day}の朝から続きだよ`)},4500)}
function custOK(id){if(!isRPG()||id!=='steak')return true;const S=G.story;return S.ch>=2||!!S.shopOpen}
function custFame(){if(!isRPG()||G.story.ch>=2)return 1;return clamp(.35+(G.stats.sold||0)*.025+(G.rank||0)*.2,.35,1)}
function storyRaidEnd(){if(G.story)G.story.raids=(G.story.raids||0)+1}
function beat(id,fn){const S=G.story;if(S.seen[id])return;S.seen[id]=1;fn()}
function spawnMinion(){spawnBoss('alpha');const b=G.bears[G.bears.length-1],f=FP();b.x=f.x+140;b.y=f.y+40;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*1.3);G.story.minion=b.id}
function spawnKing(){spawnRaider(true);const b=G.bears[G.bears.length-1];b.king=true;setBt(b,'king');b.hp=b.max=Math.round(b.max*3);b.m.g.scale.multiplyScalar(1.5);G.story.kingId=b.id;G.shake=18;
  setTimeout(()=>{if(running)banner('第2章','白き王が現れた！','巨大な王が灯台へ向かっている。囲んでたおせ','cold')},900);say('斥候カイ','あれが…白き王だ！ みんなで囲め！')}
function updateStory(dt){const S=G.story;if(!S)return;S.t=(S.t||0)+dt;const ph=(G.t%G.DAY)/G.DAY;
  if(S.ch===1){
    if(isNight()&&G.day===1)beat('n1',()=>say('斥候カイ','日が落ちると一気に冷える。かまどのそばを離れるなよ'));
    if(G.day>=2&&ph>.45&&!isNight())beat('r1',()=>say('斥候カイ','北の森で狼どもがうろついてる。今夜あたり来るぞ。見張り台を建てておけ'));
    if(G.day>=1&&S.t>40)beat('q1',()=>{say('村長オルガ','町のみんなも、それぞれ困りごとを抱えてるんだ');say('村長オルガ','頭に“！”が出ている人に近づいて、Eキーで話しかけてごらん')});
    if(!S.shopOpen&&G.stations.steak.shelf>0)beat('shop',()=>{S.shopOpen=1;G.stations.steak.custT=14;say('村長オルガ','焼いた肉のいい匂いが、吹雪に乗って流れていく…');setTimeout(()=>{if(!running||G.story!==S)return;spawnCustomer(G.stations.steak);say('旅人','いい匂いにつられて来ちまった…一切れ売ってもらえないか？');toast('はじめてのお客さん！ レジに立って売ろう','gold')},3500)});
    if(S.shopOpen&&(G.stats.sold||0)>=1)beat('fame1',()=>{say('旅人','うまい！ この町の肉のこと、みんなに話しておくよ');say('村長オルガ','うわさが広まれば、お客さんはどんどん増えるはずさ')});
    if((G.stats.sold||0)>=15)beat('fame2',()=>say('村長オルガ','うわさが隣の村まで届いたらしい。行列ができはじめたね'));
    if(G.zones.B)beat('zB',()=>say('村長オルガ','氷の湖か…昔はみんなで魚を焼いて冬を越したもんさ'));
    if(G.zones.C)beat('zC',()=>say('斥候カイ','奥地の森で妙な足跡を見た。家ほどもある…ただの狼じゃない'));
    if(G.zones.D)beat('zD',()=>say('村長オルガ','温泉が戻った！ これでみんな凍えずにすむ'));
    if(G.monument)beat('mon',()=>{say('村長オルガ','像ができた…町の灯りがよみがえったね');say('斥候カイ','待て、森が騒がしい。今夜は総出で来るぞ！')})}
  const L=SOBJ[S.ch];if(!L)return;
  if(S.step===0&&!S.seen.s0&&S.t>9){S.seen.s0=1;L[0].on&&L[0].on()}
  if(S.ch===2){if(S.step===3&&S.minion){const mb=G.bears.find(b=>b.id===S.minion);if(mb&&!mb.bt)setBt(mb,'alpha')}const kb=G.bears.find(b=>b.king&&!b.dead);if(kb&&kb.bt!=='king')setBt(kb,'king')}
  if(S.ch===2){if(S.step===2&&!S.fp&&G.players.some(p=>dist(p.x,p.y,FP().x,FP().y)<95)){S.fp=1;burst(FP().x,FP().y,30,40,{c:['#9fe0ff','#ffffff'],s0:60,s1:220,u0:120,u1:320,l0:.6,l1:1.2,add:true})}
    if(S.step===3&&!S.minion)spawnMinion();
    if(S.step>=5&&G.raid.on&&G.raid.final&&!S.king){S.king=1;spawnKing()}}
  if(S.ch===3&&DES()){if(S.step===2&&!S.ruin&&G.players.some(p=>dist(p.x,p.y,RUIN.x,RUIN.y)<120))S.ruin=1;
    if(S.step===3&&!S.queen){const b=spawnBoss('queen');b.x=RUIN.x+160;b.y=RUIN.y+60;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(240*DM().hp);S.queen=b.id}
    if(S.step===4){if(S.hs===0||S.hs===2){const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,S.hx,S.hy)<60);if(p){S.hs=1;S.hc=p.id;toast('冬の心臓を持った！ 井戸まで運べ','gold');SFX.rare()}}
      else if(S.hs===1){const p=G.players[S.hc];if(!p||p.down>0){S.hs=2;if(p){S.hx=p.x;S.hy=p.y}toast('心臓を落とした！ 拾い直せ','cold')}else{S.hx=p.x;S.hy=p.y;if(dist(p.x,p.y,CX,CY)<120){S.hs=3;S.hx=CX;S.hy=CY;burst(CX,CY,60,60,{c:['#9fe0ff','#ffffff','#7fd4ff'],s0:120,s1:360,u0:200,u1:480,l0:.8,l1:1.5,add:true});SFX.ssr();G.shake=12}}}}}
  const o=L[S.step];if(o&&S.step<L.length-1){const [c,g]=o.f();if(c>=g){S.step++;const n=L[S.step];banner('目標達成！',stx(n),'','area');SFX.rare();n.on&&n.on();snapSave();trackerFlash()}}}
function storyHud(){const S=G.story,L=S&&SOBJ[S.ch];if(!L)return false;const i=Math.min(S.step||0,L.length-1),o=L[i],[c,g]=o.f();$('mN').textContent=`${CH[S.ch].n} ${i+1}/${L.length}`;$('mT').textContent=stx(o);$('mP').textContent=o.p?o.p():`${Math.min(c,g)}/${g}`;return true}
function storyT(gp){const S=G.story,L=S&&SOBJ[S.ch];if(!L)return null;const o=L[Math.min(S.step||0,L.length-1)];return o.tg?o.tg(gp):null}
function storyVis(){if(!G)return;ruinVis();const S=G.story,on=!!(S&&S.ch===2&&S.step===2&&!S.fp&&!DES());if(!on){if(G.fpV)G.fpV.visible=false;return}
  if(!G.fpV||!G.fpV.parent){const g=new T.Group(),f=FP();const pm=new T.MeshBasicMaterial({color:lin('#2e4f73'),transparent:true,opacity:.6,depthWrite:false});
    for(let i=0;i<9;i++){const m=M_(new T.CircleGeometry(1,20),pm,false);m.rotation.x=-Math.PI/2;m.scale.set(20,32,1);m.position.set(-260+i*62,1.2,(i%2?-26:26));m.rotation.z=Math.PI/2;g.add(m);
      for(const t of [-1,0,1]){const c=M_(new T.CircleGeometry(1,10),pm,false);c.rotation.x=-Math.PI/2;c.scale.setScalar(6);c.position.set(-260+i*62+30,1.3,(i%2?-26:26)+t*14);g.add(c)}}
    const beam=M_(new T.CylinderGeometry(46,46,620,20,1,true),new T.MeshBasicMaterial({color:lin('#9fe0ff'),transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=310;g.add(beam);g.userData.beam=beam;
    const sign=makeTextPlate('巨大な足跡',120,28,'rgba(255,250,240,.92)','#2e4f73',.5);sign.position.set(0,120,0);sign.userData.bb=true;g.add(sign);g.userData.sign=sign;
    g.position.set(f.x,0,f.y);world.add(g);G.fpV=g}
  G.fpV.visible=true;const t=performance.now()/1000;G.fpV.userData.beam.material.opacity=.16+Math.sin(t*2.2)*.08;G.fpV.userData.sign.quaternion.copy(camera.quaternion);G.fpV.userData.sign.position.y=120+Math.sin(t*1.6)*5}
function storyEnd(cleared,why){$('again').textContent='もう一度';show('again',true);$('endTitle').style.fontSize='';$('endMsg').style.whiteSpace='pre-line';if(!G.story)return;const C=CH[G.story.ch]||CH[3];
  if(cleared){$('endTitle').innerHTML=`<span style="display:block;font-size:.5em">${C.n}</span>${C.t}<em> 完</em>`;$('endTitle').style.fontSize='46px';show('again',false);$('endMsg').textContent=C.outro||$('endMsg').textContent;const N=CH[G.story.ch+1];$('cont').textContent=N&&N.play?`${N.n}「${N.t}」へ`:'このまま続ける（続きの章は制作中）';
    if(NET.mode==='guest')$('endBest').textContent='ホストが次の章に進むのを待っています…';
    else{if(G.story.ch===2)store.set(SAVE_K+'-home',saveData());const d=saveData();d.year=G.year+1;d.day=G.day+1;d.yb=(G.yearBonus||0)+15*G.year;d.mon=0;d.fuel=100;d.story={ch:G.story.ch+1,step:0,seen:{},raids:0};d.fresh=1;store.set(SAVE_K,d)}}
  else{$('endMsg').textContent+='\n\nものがたりは「今日の朝」から続けられる。';$('again').textContent=NET.mode==='guest'?'もう一度参加':'今日の朝からやり直す'}}

function startGame(){audioOn();
  if(nPlayers===2){if(!NET.room){toast('オンラインはこの環境では使えないので、1人で始めます','cold',true);NET.mode='solo';newGame(1)}
    else{const hp=hostPeerNow();if(hp&&hp.presence.seed){NET.mode='guest';NET.hostPeer=hp.peer;NET.hostSeed=hp.presence.seed;NET.hostMiss=0;newGame(2,{seed:hp.presence.seed,guest:true,chars:[hp.presence.ch||'Rogue_Hooded',altCh(hp.presence.ch||'Rogue_Hooded',meta.pick)],diff:hp.presence.df||0,biome:hp.presence.bi||0});NET.room.presence({role:'guest',x:G.players[1].x|0,y:G.players[1].y|0,d:0,ch:meta.pick||'Knight'}).catch(()=>{})}
      else{NET.mode='host';NET.guestPeer=null;NET.endInfo=null;const seed=1+((Math.random()*1e9)|0);const sd=storyNew(1,seed);NET.room.presence({role:'host',seed:sd,ch:meta.pick||'Rogue_Hooded',df:G.diff,bi:G.biome||0}).catch(()=>{})}}}
  else{NET.mode='solo';storyNew(1)}
  running=true;updateCam(0,true);show('title',false);show('end',false);show('perk',false);show('hud',true);show('bottom',true);show('side',true);hudInit();tq.length=0;checkAch();
  if(DES())setTimeout(()=>{if(running)toast('砂漠：昼は動くほどのどが渇く。夜のうちに湧き水をくみ、キャラバンの注文に応えよう','cold',true)},6000);
  banner(DES()?'砂漠の町':'今回の町',`${G.mods[0].t}／${G.mods[1].t}`,`◎${G.mods[0].d}　✕${G.mods[1].d}`,'',true);setTimeout(()=>{if(running&&!G.story)toast('目標：町のシンボル像を建てろ','gold',true)},3200);
  if(NET.mode==='host')toast('部屋を作った！ 友達がこのページを開くと参加できる','gold',true);if(NET.mode==='guest')toast('友達の部屋に参加した！','gold',true);if(G.story&&NET.mode!=='guest')storyIntro()}
function settleShards(cleared){const earnedS=Math.round(Math.max(1,Math.floor(Math.sqrt(Math.max(0,G.earned))/7)+G.day+G.raidWins*2+(G.stats.haul||0)+(cleared?15*YR():0)+(G.yearBonus||0)+(G.secretS||0))*DM().sh),gainS=Math.max(0,earnedS-G.metaGiven);G.metaGiven=earnedS;meta.shards+=gainS;store.set('mw2-meta',meta);return gainS}
function endGame(cleared,why){if(NET.mode==='host'&&NET.guestPeer){NET.endInfo={c:cleared?1:0,w:why||''};sendSnap()}running=false;for(const j of joys)j.on=false;show('perk',false);
  best={day:Math.max(best.day,G.day),earned:Math.max(best.earned,Math.round(G.earned)),cleared:best.cleared||cleared,area:Math.max(best.area,1+Object.values(G.zones).filter(Boolean).length)};store.set('mw2-best',best);
  if(cleared&&NET.mode!=='guest')meta.diffOpen=Math.max(meta.diffOpen||0,Math.min(2,(G.diff||0)+1));if(cleared&&NET.mode==='guest')NET.yearWait=true;
  $('endTitle').innerHTML=cleared?`${YR()}年目<em>クリア！</em>`:why==='rep'?'お店が<em>閉店…</em>':'町が<em>凍りついた…</em>';
  $('endMsg').textContent=cleared?`${goalOf(YR()).n}が完成し、最後の夜を守りきった（${DM().n}）。次の冬はもっと厳しい…`:why==='rep'?'お客さんを待たせすぎて評判が0に。肉を切らさず、レジを空けないように。':'5人の生存者が凍りついた。燃料を切らさず、かまどを強化しよう。';
  $('endStats').innerHTML=[[`DAY ${G.day}`,'生き延びた日数'],[`$${Math.round(G.earned).toLocaleString()}`,'総売上'],[`${1+Object.values(G.zones).filter(Boolean).length}/4`,'解放エリア']].map(([v,l])=>`<div><b>${v}</b><small>${l}</small></div>`).join('');
  const gainS=settleShards(cleared);
  $('endShard').textContent=`★ 星のかけら +${gainS}（合計 ${meta.shards}）タイトルで強化できる`;
  $('endBest').textContent=`ベスト：DAY ${best.day}・$${best.earned.toLocaleString()}${best.cleared?'・町完成':''}`;$('endBadges').innerHTML=badgesHtml(G.newAch);show('cont',cleared&&NET.mode!=='guest');$('cont').textContent=`${YR()+1}年目へ（${DM().n}）`;if(cleared&&NET.mode==='guest')$('endBest').textContent='ホストが次の年に進むのを待っています…';show('end',true);show('hud',false);show('bottom',false);show('side',false);$('combo').hidden=true;$('feverFx').classList.remove('on');storyEnd(cleared,why)}
function toTitle(){if(NET.room&&NET.mode!=='solo')NET.room.presence({role:'idle',seed:null,x:null,y:null,d:null}).catch(()=>{});NET.mode='solo';NET.guestPeer=null;NET.hostPeer=null;running=false;for(const j of joys)j.on=false;show('end',false);show('perk',false);show('hud',false);show('bottom',false);show('side',false);$('combo').hidden=true;$('feverFx').classList.remove('on');$('banner').hidden=true;
  $('bestLine').textContent=best.day?`ベスト：DAY ${best.day}・総売上 $${best.earned.toLocaleString()}${best.cleared?'・町完成':''}　実績 ${ACH.filter(a=>ach.has(a.id)).length}/${ACH.length}`:'はじめての冬';
  $('metaN').textContent=meta.shards;renderDiff();newGame(1);updateCam(0,true);show('title',true);modeUI()}
function renderMeta(){$('metaN').textContent=$('metaN2').textContent=meta.shards;
  const up=META_UP.map(u=>{const l=mlv(u.id),mx=u.max||5,c=(u.cost||META_COST)[l];return `<div class="mrow"><i>${u.k}</i><div><b>${u.t}</b><span class="pips">${Array.from({length:mx},(_,k)=>`<s class="${k<l?'on':''}"></s>`).join('')}</span><small>${l?u.d(l):'まだ強化していない'}${l<mx&&mx>1?` → ${u.d(l+1)}`:''}</small></div><button data-u="${u.id}" ${l>=mx||meta.shards<c?'disabled':''}>${l>=mx?(mx>1?'MAX':'OK'):'★'+c}</button></div>`}).join('');
  const ch=META_CHARS.map(c=>{const own=meta.chars.includes(c.id),use=meta.pick===c.id;return `<div class="mrow"><i>${c.t[0]}</i><div><b>${c.t}</b><small>${CLS[c.id]?CLS[c.id].n+'：'+CLS[c.id].d:''}<br>${use?'使用中':own?'持っている':'買うと使える'}</small></div><button data-c="${c.id}" ${use||(!own&&meta.shards<c.c)?'disabled':''}>${use?'使用中':own?'使う':'★'+c.c}</button></div>`}).join('');
  const df=DIFFS.map((d,i)=>`<div class="mrow"><i>${['普','厳','獄'][i]}</i><div><b>${d.n}</b><small>${i<=meta.diffOpen?`解放済み・星のかけら×${d.sh}`:`「${DIFFS[i-1].n}」で1年目をクリアすると解放`}</small></div><button disabled>${i<=meta.diffOpen?'OK':'🔒'}</button></div>`).join('');
  $('mlist').innerHTML=`<p class="mh">強化</p>${up}<p class="mh">キャラ</p>${ch}<p class="mh">難易度</p>${df}`}
$('metaBtn').addEventListener('click',()=>{renderMeta();show('title',false);show('meta',true)});
$('metaClose').addEventListener('click',()=>{show('meta',false);show('title',true);$('metaN').textContent=meta.shards;renderDiff()});
$('mlist').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.u){const u=META_UP.find(q=>q.id===b.dataset.u),id=u.id,l=mlv(id),mx=u.max||5,c=(u.cost||META_COST)[l];if(l>=mx||meta.shards<c)return;meta.shards-=c;meta.up[id]=l+1}
  else if(b.dataset.c){const c=META_CHARS.find(q=>q.id===b.dataset.c);if(!meta.chars.includes(c.id)){if(meta.shards<c.c)return;meta.shards-=c.c;meta.chars.push(c.id)}meta.pick=c.id}
  store.set('mw2-meta',meta);audioOn();SFX.build();renderMeta()});
let gameBio=0,dbgBio=new URLSearchParams(location.search).get('start')==='desert'?1:0;
function dbgLine(){const el=$('dbgLine');if(el){el.hidden=!dbgBio;el.textContent='テスト：砂漠から始める（Shift+Dで切替）'}}
addEventListener('keydown',e=>{if(e.code==='KeyD'&&e.shiftKey&&!running){dbgBio=dbgBio?0:1;dbgLine();toast(dbgBio?'テスト：砂漠から始めます':'テスト：通常スタートに戻しました','gold')}});function renderBio(){const el=$('bSeg');if(!el)return;const op=meta.bioOpen||0;el.innerHTML=BIOS.map((b,i)=>`<button data-b="${i}" aria-pressed="${i===gameBio}" ${i>op?'disabled':''}>${i>op?'🔒 ':''}${b.n}</button>`).join('')}
function renderDiff(){renderBio();const el=$('dSeg');if(!el)return;el.innerHTML=DIFFS.map((d,i)=>`<button data-d="${i}" aria-pressed="${i===gameDiff}" ${i>meta.diffOpen?'disabled':''}>${i>meta.diffOpen?'🔒 ':''}${d.n}</button>`).join('')}
$('bSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-b]');if(!b||b.disabled)return;gameBio=+b.dataset.b;renderBio()});
$('dSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(!b||b.disabled)return;gameDiff=+b.dataset.d;renderDiff()});
function setPlayers(n){nPlayers=n;$('p1').setAttribute('aria-pressed',n===1);$('p2').setAttribute('aria-pressed',n===2);
  $('ctrlHint').innerHTML='移動：<b>WASD・矢印キー</b>／スマホは<b>画面をドラッグ</b><br>射撃・伐採・釣り・支払いは近づくだけで自動';netLine()}
$('p1').addEventListener('click',()=>setPlayers(1));$('p2').addEventListener('click',()=>setPlayers(2));
$('start').addEventListener('click',startGame);$('again').addEventListener('click',startGame);$('toTitle').addEventListener('click',toTitle);$('quit').addEventListener('click',toTitle);
function nextYear(){G.yearBonus=(G.yearBonus||0)+15*G.year;G.year++;G.monument=false;G.monPop=0;G.finalPending=false;G.raid.on=false;G.mission=MISSIONS.length;G.endless=false;NET.endInfo=null;
  const g=goalOf(G.year);banner(`${G.year}年目`,'もっと厳しい冬が来る',`寒さ・燃料・襲撃・食費が強くなった。目標：${g.n}（$${g.c.toLocaleString()}・町人${g.pop}人・かまどLv${g.lv}）`,'cold');SFX.wave()}
$('cont').addEventListener('click',()=>{nextYear();if(G.story){G.story={ch:G.story.ch+1,step:0,seen:{},raids:0};if(CH[G.story.ch]&&CH[G.story.ch].desert&&!DES()){const st=G.story;startTrip();G.story=st;G.year=2;const d=saveData();d.fresh=0;store.set(SAVE_K,d)}storyIntro()}running=true;show('end',false);show('hud',true);show('bottom',true);show('side',true)});
// adaptive quality: drop bloom and shadow resolution on slow devices
const QL=[{n:'低',pr:.7,sh:0,fx:0,decor:0,snow:.3},{n:'中',pr:1,sh:2048,fx:0,decor:.45,snow:.55},{n:'高',pr:Math.min(devicePixelRatio||1,2),sh:4096,fx:1,decor:1,snow:1}];
window.GQ=null;const GQ=window.GQ={mode:store.get('mw2-gfx','auto'),tier:2,snow:1};const FX0=composer;
function applyGfx(i){i=clamp(i,0,2);GQ.tier=i;const q=QL[i];GQ.snow=q.snow;PR=q.pr;renderer.setPixelRatio(PR);
  composer=q.fx&&FX0?FX0:null;renderer.outputEncoding=composer?T.LinearEncoding:T.sRGBEncoding;
  sun.castShadow=q.sh>0;if(q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  if(G&&G.decor)for(const im of G.decor){im.count=Math.floor(im.userData.n*q.decor);im.visible=im.count>0}
  for(const m of OUTS){if(!m.parent){OUTS.delete(m);continue}m.visible=i===2}resize();gfxLabel()}
function gfxLabel(){const b=$('gfx');if(b)b.textContent='画質：'+(GQ.mode==='auto'?'自動（'+QL[GQ.tier].n+'）':QL[GQ.tier].n)+(GQ.fps?` ・${GQ.fps}fps`:'')}
const GPU=(()=>{try{const gl=renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)):''}catch(e){return ''}})();
const SOFTGL=/SwiftShader|llvmpipe|softpipe|Software|Basic Render|Microsoft Basic/i.test(GPU);
let fpsT=0,fpsN=0;function tickFps(dt){fpsT+=dt;fpsN++;if(fpsT>=1){GQ.fps=Math.round(fpsN/fpsT);fpsT=0;fpsN=0;gfxLabel()}}
let perf={t0:0,f:0,skip:0};
function checkPerf(){tickFps(Math.min(.25,(performance.now()-(checkPerf.l||performance.now()))/1000));checkPerf.l=performance.now();if(!running||GQ.mode!=='auto'||GQ.tier===0){perf.t0=0;return}const now=performance.now();if(!perf.t0){perf.t0=now;perf.f=0;perf.skip=now+2000;return}if(now<perf.skip){perf.t0=now;perf.f=0;return}perf.f++;
  if(now-perf.t0>=3000){const fps=perf.f*1000/(now-perf.t0);perf.t0=now;perf.f=0;if(fps<46){applyGfx(GQ.tier-1);perf.skip=now+2000;toast(`重そうなので画質を「${QL[GQ.tier].n}」に下げました`,'cold')}}}

$('gfx').addEventListener('click',()=>{const order=['auto',2,1,0];GQ.mode=order[(order.indexOf(GQ.mode)+1)%4];store.set('mw2-gfx',GQ.mode);applyGfx(GQ.mode==='auto'?2:GQ.mode);perf={t0:0,f:0,skip:0};toast(GQ.mode==='auto'?'画質：自動（重いと自動で下げます）':'画質：'+QL[GQ.tier].n,'gold')});
function gpuWarn(){if(!SOFTGL)return;const el=$('gpuWarn');el.hidden=false;el.innerHTML='⚠ ブラウザの<b>グラフィックアクセラレーションがオフ</b>になっていて、とても重くなります。<br>Chromeの「設定 → システム →<br>グラフィック アクセラレーションが使用可能な場合は使用する」をオンにして再起動してね';setTimeout(()=>toast('グラフィックアクセラレーションがオフなので重いです（タイトル画面に直し方）','cold',true),1500)}
addEventListener('keydown',e=>{if(e.code==='KeyL'&&!e.repeat&&running&&!(e.target&&e.target.tagName==='INPUT')){toggleLife();return}if(e.code==='KeyQ'&&!e.repeat&&running&&!DLG.open&&isRPG()){const me=G.players[G.me]||G.players[0];if(me&&dist(me.x,me.y,WB.x,WB.y)<90){openCraft();return}}if(DLG.open&&!e.repeat&&(e.code==='KeyE'||e.code==='Space'||e.code==='Enter'||/^Digit[1-9]$/.test(e.code))){dlgKey(e.code);e.preventDefault();return}if(e.code!=='KeyE'||e.repeat||!running)return;if(e.target&&e.target.tagName==='INPUT')return;const me=G.players[G.me]||G.players[0];if(!me)return;const nn=npcNear(me);if(nn){openTalk(nn);return}if(isRPG()&&dist(me.x,me.y,WB.x,WB.y)<90&&!(snowy()&&has(me,'log'))){openCraft();return}const gr=craftGrade();if(NET.mode==='guest'){NET.eCount=(NET.eCount||0)+1;NET.eGrade=gr}else{me.ePress=true;me.eGrade=gr}});
addEventListener('keydown',e=>{if(e.code!=='KeyF'||e.repeat||!running)return;if(e.target&&e.target.tagName==='INPUT')return;if(NET.mode==='guest'){NET.fCount=(NET.fCount||0)+1}else{const me=G.players[G.me]||G.players[0];if(me)me.fPress=true}});
setTimeout(()=>dbgLine(),0);
function boot(){gpuWarn();setPlayers(new URLSearchParams(location.search).get('room')?2:1);toTitle();applyGfx(GQ.mode==='auto'?2:GQ.mode);$('loading').hidden=true;if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(G&&G.pads)for(const q of G.pads)q._key=null});requestAnimationFrame(loop)}
$('loading').textContent='町を組み立てています…';loadKK().catch(e=>{console.warn('assets',e);KK=null;window.__kkErr=String(e&&e.message||e)}).then(()=>{boot();if(!KK){$('credit').textContent='3D素材を読み込めませんでした（'+(window.__kkErr||'ローダーなし')+'）';setTimeout(()=>toast('3D素材を読み込めなかったので簡易表示です','cold',true),800)}});
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!running&&NET.mode==='guest'&&NET.yearWait)applyInbox();
  if(running){if(NET.mode==='guest'){guestTick(dt);if(running)hud()}else if(!G.paused){update(dt);if(running)hud()}if(running&&NET.mode==='host')netHost(dt)}
  else if(!running){G.t+=dt*.3;const p=G.players[0];p.x=CX+Math.cos(G.t*.8)*150;p.y=CY+Math.sin(G.t*.8)*120;p.moving=true;p.step+=dt*8;p.dirT=Math.atan2(-Math.sin(G.t*.8),Math.cos(G.t*.8));updateTrees(dt)}
  for(const f of G.floats)f.life-=dt;G.floats=G.floats.filter(f=>f.life>0);
  for(const f of G.flying){f.t+=dt*f.sp;const t=Math.min(1,f.t),e=t*t*(3-2*t);f.m.position.set(lerp(f.sx,f.tx,e),lerp(f.sh,f.th,e)+Math.sin(t*Math.PI)*50,lerp(f.sy,f.ty,e));f.m.rotation.set(t*6,f.rot+t*4,0);if(f.t>=1){world.remove(f.m);f.done=true;f.land&&f.land()}}
  G.flying=G.flying.filter(f=>!f.done);G.shake=Math.max(0,G.shake-dt*30);
  tickToast(dt);updateCam(dt,false);frame(dt);checkPerf(dt);requestAnimationFrame(loop)}
})();
