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

