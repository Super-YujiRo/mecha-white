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
function bossHit(b,p,dmg,kb){if(p.dash&&p.inv>0){float(p.x,p.y,90,'回避！','gold',true);return}if(p.jz>22&&!(b.bt==='king'&&Math.random()<.5)){float(p.x,p.y,90,'かわした！','gold',true);return}const v=Math.round(dmg*armorOf(p)*DM().atk*(1+(YR()-1)*.15));p.hp-=v;hitLoss(p);p.hurt=.4;p.inv=.7;const k=dist(p.x,p.y,b.x,b.y)||1;p.x+=(p.x-b.x)/k*kb;p.y+=(p.y-b.y)/k*kb;G.shake=Math.max(G.shake,12);float(p.x,p.y,60,`-${v}`,'red');burst(p.x,p.y,24,14,{c:['#ff9a9a','#ffffff'],s0:40,s1:160,l0:.3,l1:.6})}
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
  G.ruinV.visible=true;const t=performance.now()/1000;G.ruinV.userData.beam.visible=S.step===3&&!S.ruin;G.ruinV.userData.beam.material.opacity=.14+Math.sin(t*2)*.06;G.ruinV.userData.sign.quaternion.copy(camera.quaternion);
  if(!G.heartV||!G.heartV.parent){const h=new T.Group();const c=M_(new T.OctahedronGeometry(14,0),glow('#7fd4ff',2.6),false);c.scale.set(1,1.5,1);h.add(c);const l=new T.PointLight(lin('#7fd4ff'),1.6,260,1.6);h.add(l);world.add(h);G.heartV=h}
  const hv=G.heartV;hv.visible=false;if(!hv.visible)return;hv.rotation.y=t*2;
  if(S.hs===1&&G.players[S.hc]){const p=G.players[S.hc];hv.position.set(p.x,70+Math.sin(t*4)*3,p.y)}else if(S.hs===3){hv.position.set(CX,34+Math.sin(t*2)*4,CY)}else hv.position.set(S.hx||RUIN.x,26+Math.sin(t*3)*4,S.hy||RUIN.y);
  const me=G.players[G.me]||G.players[0];if(S.step===4&&S.hs!==1&&S.hs!==3&&me&&dist(me.x,me.y,hv.position.x,hv.position.z)<260)label(hv.position.x,hv.position.z,60,'<b>冬の心臓</b><br>近づくと持てる','')}

