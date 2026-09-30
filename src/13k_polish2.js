// ================================================================ story-mode polish: fewer floating price tiles, calmer HUD, nicer props (Fantasy Life feel, not a mobile ad)
const P2={t:0};
const rockG=r=>geo('rk'+r,()=>{const g=new T.DodecahedronGeometry(r,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const k=.78+((Math.sin(i*12.9898)*43758.5453)%1+1)%1*.4;p.setXYZ(i,p.getX(i)*k,p.getY(i)*k*.8,p.getZ(i)*k)}g.computeVertexNormals();return g});
// rubble: a low heap of broken stone and charred beams, a toppled crate and a little snow on top
makeRubble=function(i){const g=new T.Group(),R=k=>{const v=Math.sin((i+1)*(k+3)*12.9898)*43758.5453;return v-Math.floor(v)};
  const stones=['#7d828a','#8f949b','#6c7078','#a0a5ab'].map(c=>std(c,{map:TEX.stone,r:.95,flat:true}));const wood=std('#5b4330',{map:TEX.bark,r:.9}),char_=std('#2e2622',{r:1}),brick=std('#7a5646',{r:.92}),sn=std('#e9eef4',{r:.9});
  for(let k=0;k<11;k++){const a=k*.9+R(k)*2,r=k<4?rnd(0,9):rnd(10,22),s=k<4?rnd(8,12):rnd(4,8);const m=M_(rockG(s|0),stones[k%4],true,true);m.position.set(Math.cos(a)*r,s*.42+(k<4?2:0),Math.sin(a)*r);m.rotation.set(R(k+9)*3,R(k+4)*3,0);g.add(m)}
  for(let k=0;k<5;k++){const b=box(9,4,5,brick,true);b.position.set(rnd(-16,16),2+R(k)*6,rnd(-16,16));b.rotation.set(R(k)*.8,R(k+3)*3,R(k+6)*.8);g.add(b)}
  for(let k=0;k<2;k++){const b=box(26+R(k)*10,3.5,4.5,k?char_:wood,true);b.position.set(rnd(-6,6),8+k*2,rnd(-6,6));b.rotation.set(R(k+2)*.3-.15,R(k)*3,R(k+5)*.4-.2);g.add(b)}
  const cr=grp(box(12,10,12,wood,true),at(box(13,1.5,13,char_),0,4.8,0));cr.position.set(15,4,-11);cr.rotation.set(.15,R(7)*3,-.3);g.add(cr);
  const s=M_(geo('snp',()=>new T.SphereGeometry(8,12,6,0,TAU,0,Math.PI/2)),sn,false,true);s.scale.set(1.1,.16,.9);s.position.set(-3,12,2);g.add(s);
  return g};
// ---- guide marker for story: a floating golden crystal with a soft light beam instead of the blocky arrow
const guideRPG=(()=>{const g=new T.Group();const cm=std('#ffd76a',{e:'#ffb020',ei:.8,m:.3,r:.25});const cry=M_(new T.OctahedronGeometry(6,0),cm,false);cry.scale.set(1,1.6,1);g.add(cry);
  const beam=M_(new T.CylinderGeometry(4,10,120,16,1,true),new T.MeshBasicMaterial({color:lin('#ffe39a'),transparent:true,opacity:.18,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=60;g.add(beam);
  const ring=rot(M_(new T.RingGeometry(16,19,40),new T.MeshBasicMaterial({color:lin('#ffd76a'),transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0);ring.position.y=1.2;g.add(ring);
  g.visible=false;scene.add(g);return{g,cry,beam,ring}})();
function guideStory(t){const tg=G._gt,me0=G.players[G.me]||G.players[0],on=!!(running&&isRPG()&&tg&&!(me0&&inAby(me0.x)));guideRPG.g.visible=on;if(!on)return;
  guideRPG.g.position.set(tg.x,0,tg.y);guideRPG.cry.position.y=(tg.h||60)+Math.sin(t*2.2)*5;guideRPG.cry.rotation.y=t*1.4;guideRPG.ring.scale.setScalar(1+Math.sin(t*3)*.08);guideRPG.beam.material.opacity=.12+Math.sin(t*2)*.05}
// ---- per frame: fade price tiles, signs and survival HUD bits in story mode
function storyPolish(){fogTick();flameTick();if(!G||!running)return;const rpg=isRPG();const me=G.players[G.me]||G.players[0];if(!me)return;const now=performance.now();
  guideStory(G.t);
  if(typeof bloom!=='undefined'&&bloom)bloom.strength=rpg?.34:.5;
  const v=G.v;if(v&&rpg){if(v.embers)for(const e of v.embers)e.visible=false;if(v.ring){v.ring.material.transparent=true;v.ring.material.opacity=.32}if(v.f){if(v.f.plate)v.f.plate.visible=false;if(v.f.flames)v.f.flames.forEach((fl,i)=>{fl.scale.x*=.72;fl.scale.z*=.72;fl.scale.y*=1.05;const M=fl.material;if(!M._p2){M._p2=1;M.transparent=true;M.opacity=[.5,.6,.75][i]||.6;M.depthWrite=false;M.blending=T.AdditiveBlending;M.needsUpdate=true}});if(v.f.coals&&!v.f.coals.material._p2){const M=v.f.coals.material=v.f.coals.material.clone();M._p2=1;M.color.set(lin('#7a2a10'));M.emissive&&M.emissive.set(lin('#ff5a1a'))}}}else if(v&&v.ring&&v.ring.material.opacity!==1){v.ring.material.opacity=1}
  for(const pad of G.pads||[]){const m=pad.mesh;if(!m||!m.mesh)continue;const mat=m.mesh.material;
    if(!rpg){if(mat._p2){mat.transparent=false;mat.depthTest=false;mat.alphaTest=.35;mat.opacity=1;mat._p2=0;mat.needsUpdate=true;m.icon.visible=true}continue}
    if(!mat._p2){mat._p2=1;mat.transparent=true;mat.depthTest=true;mat.alphaTest=.02;mat.needsUpdate=true}
    const d=dist(me.x,me.y,pad.x,pad.y),k=clamp(1-(d-170)/190,0,1);mat.opacity=k;m.mesh.visible=k>.02;m.icon.visible=false}
  for(const id in G.stations||{}){const st=G.stations[id];if(st.sign){if(!rpg){st.sign.material.opacity=1;continue}const s=st.def,d=dist(me.x,me.y,s.counter.x,s.counter.y);st.sign.material.transparent=true;st.sign.material.opacity=clamp(1-(d-160)/140,0,1)}}
  for(const z of ZONES){if(!z.sign||!z.sign.visible)continue;const mt=z.sign.material;if(!rpg){if(mt._p2){mt.opacity=1-(z.fogT>0?z.fogT:0);mt._p2=0;if(z.sign.userData._s0)z.sign.scale.setScalar(z.sign.userData._s0)}continue}mt._p2=1;mt.transparent=true;if(!z.sign.userData._s0)z.sign.userData._s0=z.sign.scale.x;z.sign.scale.setScalar(z.sign.userData._s0*.62);const c=z.rect,zx=clamp(me.x,c[0],c[2]),zy=clamp(me.y,c[1],c[3]),d=dist(me.x,me.y,zx,zy);mt.opacity=Math.min(1-(z.fogT>0?z.fogT:0),clamp(1-(d-120)/200,0,1)*.9)}
  if(now-P2.t>300){P2.t=now;const fz=$('hFrzBox');if(fz){const n=parseInt(($('hFrzN')||{}).textContent||'0',10);fz.classList.toggle('p2hide',rpg&&!(n>0))}}}
$('menuBtn').addEventListener('click',e=>{e.stopPropagation();$('side').classList.toggle('open')});
addEventListener('pointerdown',e=>{const s=$('side');if(s&&s.classList.contains('open')&&!s.contains(e.target))s.classList.remove('open')});
// ruined house: stone footing, jagged half-walls, a fallen roof slab, a chimney stub and a light dusting of snow
makeRuinHouse=function(){const g=new T.Group(),seed=Math.random()*99,R=k=>{const v=Math.sin((seed+k)*12.9898)*43758.5453;return v-Math.floor(v)};
  const plank=std('#6e5440',{map:TEX.bark,r:.92}),dark=std('#3b2e26',{map:TEX.bark,r:.95}),stone=std('#8b9097',{map:TEX.stone,r:.95}),sn=std('#eef3f8',{r:.85});
  g.add(at(box(70,5,56,stone,true,true),0,2.5,0));
  // back wall: planks of uneven height
  for(let k=0;k<9;k++){const h=8+R(k)*26;g.add(at(box(7.4,h,5,k%3?plank:dark,true),-30+k*7.6,5+h/2,-25))}
  // left wall: shorter, broken
  for(let k=0;k<6;k++){const h=4+R(k+20)*18;g.add(at(box(5,h,8.6,plank,true),-33,5+h/2,-20+k*8.8))}
  // right corner post and a leaning beam
  g.add(at(box(6,30,6,dark,true),33,20,-25),at(rot(box(6,5,54,dark,true),.55,0,.1),28,16,-2));
  // fallen roof slab
  const roof=new T.Group();for(let k=0;k<6;k++)roof.add(at(box(9,2.5,40,k%2?plank:dark,true),-22+k*9,0,0));roof.position.set(-6,11,6);roof.rotation.set(.18,.3,-.32);g.add(roof);
  // chimney stub
  g.add(at(box(12,26,12,stone,true),22,18,-18),at(box(14,3,14,std('#6f757c',{r:.9}),true),22,32,-18));
  // loose stones
  for(let k=0;k<7;k++){const s=4+R(k+40)*5,m=M_(rockG(s|0),stone,true,true);m.position.set(-30+R(k+50)*62,s*.4,14+R(k+60)*16);m.rotation.set(R(k)*3,R(k+1)*3,0);g.add(m)}
  // snow: thin caps on the wall tops and a few flat patches
  for(let k=0;k<4;k++){const s=M_(geo('snp',()=>new T.SphereGeometry(8,12,6,0,TAU,0,Math.PI/2)),sn,false,true);s.scale.set(1.2+R(k+70),.22,1+R(k+80)*.8);s.position.set(-24+k*16,6,-4+R(k+90)*20);g.add(s)}
  g.add(at(box(70,1.6,6,sn,false),0,6,-25.5));return g};
makeRuinTower=function(){const g=new T.Group(),w=std('#4e3a2c',{map:TEX.bark,r:.95}),ch=std('#2a211c',{r:1}),stone=std('#8b9097',{map:TEX.stone,r:.95});
  g.add(at(box(34,4,34,stone,true,true),0,2,0));const hs=[24,14,30,9];[[-13,-13],[13,-13],[-13,13],[13,13]].forEach(([x,z],i)=>g.add(at(box(5,hs[i],5,i%2?ch:w,true),x,4+hs[i]/2,z)));
  g.add(at(rot(box(38,4,5,w,true),0,.5,.55),2,14,0),at(rot(box(30,3,4,ch,true),.3,-.7,-.2),-4,6,8));
  for(let k=0;k<4;k++){const m=M_(rockG(5),stone,true,true);m.position.set(rnd(-16,16),2,rnd(-16,16));g.add(m)}return g};
// soft fog over locked areas: fades out at the edges and toward the top, slowly drifting (replaces the solid white box)
const FOGU={t:{value:0}};
function makeFogMat(x0,y0,x1,y1,col){const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:FOGU.t,uOp:{value:.93},uMin:{value:new T.Vector2(x0,y0)},uMax:{value:new T.Vector2(x1,y1)},uC:{value:lin(col)},uC2:{value:lin(DES()?'#d9b27a':'#c9dcef')}},
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT,uOp;uniform vec2 uMin,uMax;uniform vec3 uC,uC2;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){vec2 d=min(vW.xz-uMin,uMax-vW.xz);float e=smoothstep(0.,160.,min(d.x,d.y));vec2 q=vW.xz*.004+vec2(uT*.02,uT*.013);float c=n(q)*.6+n(q*2.3)*.4;float a=uOp*e*(.78+.22*c);gl_FragColor=vec4(mix(uC2,uC,.55+.45*c),a);}'});
  m.userData.fog=1;return m}
function fogTick(){FOGU.t.value=performance.now()/1000;for(const z of ZONES){const m=z.fog&&z.fog.material;if(m&&m.uniforms&&m.uniforms.uOp)m.uniforms.uOp.value=m.opacity}}
// nomad tent: striped canopy on poles, a rug and clay pots
const STRIPE={};function stripeTex(a,b){const k=a+b;if(STRIPE[k])return STRIPE[k];STRIPE[k]=canvasTex(128,128,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?a:b;g.fillRect(i*w/8,0,w/8,h)}g.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<40;i++)g.fillRect(Math.random()*w,Math.random()*h,2,2)});return STRIPE[k]}
function makeNomadTent(i){const g=new T.Group(),cols=[['#b8412e','#f1dfbf'],['#2f6f8b','#efe2c4'],['#c07a1f','#f3e4c6']][i%3];const cloth=stdU('#ffffff',{map:stripeTex(cols[0],cols[1]),r:.95,side:T.DoubleSide}),pole=std('#6b4a2e',{map:TEX.bark,r:.9});
  for(const s of [-1,1]){const r=M_(new T.BoxGeometry(94,1.6,48),cloth,true,true);r.position.set(0,44,s*22);r.rotation.x=s*.32;g.add(r)}
  g.add(at(box(94,40,1.5,cloth,true),0,22,-44));for(const [x,z] of [[-44,-40],[44,-40],[-44,40],[44,40],[0,-44],[0,44]])g.add(at(cyl(1.6,1.8,z===0||Math.abs(z)<44?52:40,pole,6,true),x,Math.abs(x)<1?26:20,z));
  g.add(at(cyl(1.8,1.8,50,pole,6,true),0,26,0));
  const rug=M_(new T.PlaneGeometry(60,34),stdU('#ffffff',{map:stripeTex('#7a2a3a','#d9a441'),r:1}),false,true);rug.rotation.x=-Math.PI/2;rug.position.set(0,.6,56);g.add(rug);
  const clay=std('#b86a3a',{r:.85});g.add(at(scl(sph(6,clay,true,10,8),1,1.2,1),40,7,56),at(cyl(3,4,5,clay,8,true),40,15,56),at(scl(sph(4.5,clay,true,10,8),1,1.1,1),-38,5,58));
  return g}
// wooden signpost with a plank, readable but not a floating billboard
function makeSignpost(text,col){const g=new T.Group(),wd=std('#7a5436',{map:TEX.bark,r:.9});g.add(at(cyl(2.4,2.8,64,wd,8,true),0,32,0));const pl=makeTextPlate(text,96,24,'#f3e2c0',col||'#5b3a1e',.5);pl.position.set(0,58,3);g.add(at(box(100,28,3,wd,true),0,58,0),pl);g.userData.bb=false;return g}
// layered canyon rock: irregular strata in alternating reds, a flat cap with a few boulders
function makeMesaRock(w,h,seed){const g=new T.Group(),cols=['#b8683c','#a0552f','#c98150','#8f4a2a'];const n=4;let y=0,r=w;
  for(let k=0;k<n;k++){const hh=h/n*(k===n-1?1.1:1),rt=r*(.9-.04*k);const geo_=new T.CylinderGeometry(rt,r,hh,9,1);const p=geo_.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),j=1+.12*Math.sin(a*3+seed*1.7+k)+.07*Math.sin(a*7+seed);p.setX(i,x*j);p.setZ(i,z*j)}geo_.computeVertexNormals();
    const m=M_(geo_,std(cols[(k+seed)%4],{r:.95,flat:true}),true,true);m.position.y=y+hh/2;m.rotation.y=seed+k*.7;g.add(m);y+=hh;r=rt*.97}
  const cap=M_(new T.CylinderGeometry(r*.96,r,5,9),std('#c9925e',{r:.95,flat:true}),true,true);cap.position.y=y+2.5;g.add(cap);
  for(let k=0;k<3;k++){const s=rnd(4,9),b=M_(rockG(s|0),std('#a0552f',{r:.95,flat:true}),true,true);b.position.set(rnd(-r*.5,r*.5),y+5+s*.3,rnd(-r*.5,r*.5));g.add(b)}
  return g}
// story mode: world labels are gathered each frame and only the nearest few are shown in full (no more walls of floating text)
const LQ=[];const _labelNow=label,_endLabelsNow=endLabels;
label=function(x,y,h,html,cls,op,sc){if(running&&G&&isRPG()){LQ.push([x,y,h,html,cls,op,sc]);return}_labelNow(x,y,h,html,cls,op,sc)};
endLabels=function(){if(LQ.length){const me=G&&(G.players[G.me]||G.players[0]);const L=LQ.splice(0);if(me){for(const q of L)q.d=dist(me.x,me.y,q[0],q[1])+(/bar|cbar|■/.test(q[3])?-1e4:0)+(q[4]==='gold'?-40:0);L.sort((a,b)=>a.d-b.d)}
    let full=0;for(const q of L){const keep=q.d<0;if(keep||full<3){if(!keep)full++;_labelNow(q[0],q[1],q[2],q[3],q[4],q[5],q[6])}else if(q.d<320){const m=/^<b>[^<]*<\/b>/.exec(q[3]);if(m)_labelNow(q[0],q[1],q[2],m[0],(q[4]||'')+' lbmini',.8,.86)}}}
  _endLabelsNow()};
// soft layered flame (additive), flickers every frame; replaces the solid glowing cones
const FLAMES=[];const _fm={};const flameMat=(c,o)=>_fm[c+o]||(_fm[c+o]=new T.MeshBasicMaterial({color:lin(c),transparent:true,opacity:o,blending:T.AdditiveBlending,depthWrite:false}));
function makeFlame(r,h,col){const g=new T.Group();const outer=M_(geo('flo',()=>new T.ConeGeometry(1,1,10,1,true)),flameMat(col||'#ff7a2a',.45),false);outer.scale.set(r,h,r);outer.position.y=h*.45;
  const inner=M_(geo('fli',()=>new T.ConeGeometry(1,1,10)),flameMat('#ffc04a',.7),false);inner.scale.set(r*.6,h*.72,r*.6);inner.position.y=h*.34;
  const core=M_(geo('flc',()=>new T.SphereGeometry(1,10,8)),flameMat('#fff3c0',.85),false);core.scale.set(r*.42,r*.5,r*.42);core.position.y=r*.3;
  const halo=M_(geo('flh',()=>new T.SphereGeometry(1,12,8)),flameMat(col||'#ff8a3a',.12),false);halo.scale.setScalar(Math.max(r,h)*.9);halo.position.y=h*.4;
  g.add(outer,inner,core,halo);g.userData.fl={outer,inner,r,h,ph:Math.random()*9};FLAMES.push(g);return g}
function flameTick(){const t=performance.now()/1000;for(let i=FLAMES.length-1;i>=0;i--){const g=FLAMES[i];if(!g.parent){FLAMES.splice(i,1);continue}if(!g.visible)continue;const F=g.userData.fl,k=1+Math.sin(t*13+F.ph)*.09+Math.sin(t*23+F.ph*2)*.06;F.outer.scale.set(F.r*(1.05-.05*k),F.h*k,F.r*(1.05-.05*k));F.inner.scale.set(F.r*.6,F.h*.72*(2-k),F.r*.6);F.outer.rotation.y=t*2+F.ph;
  if(Math.random()<.12){const p=new T.Vector3();g.getWorldPosition(p);psA.emit({x:p.x+rnd(-F.r*.4,F.r*.4),y:p.y+F.h*.7,z:p.z+rnd(-F.r*.4,F.r*.4),vx:rnd(-6,6),vy:rnd(30,60),vz:rnd(-6,6),g:-10,life:.6,max:.6,r:rnd(2,3.5),c:C(Math.random()<.5?'#ffb347':'#ffe08a'),air:true,fade:.3})}}}
// error log: a menu button copies what went wrong, so it can be sent to fix it
setInterval(()=>{const b=$('errBtn');if(b)b.hidden=!ERRLOG.length},1500);
$('errBtn').addEventListener('click',e=>{e.stopPropagation();const t=`めちゃホワイト ${BUILD}\n`+ERRLOG.join('\n');try{navigator.clipboard.writeText(t).then(()=>toast('不具合の記録をコピーしました。チャットに貼り付けて送ってください','gold',true),()=>prompt('これをコピーして送ってください',t))}catch(_){prompt('これをコピーして送ってください',t)}});
