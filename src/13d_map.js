// ================================================================ minimap (turns with the camera) + full map (M key)
const MAPV={big:false,t:0};
function mapMarks(){const L=[];const S=G.story,des=DES(),adv=ADV();
  L.push({x:CX,y:CY,k:'town',n:des?(adv?'砂の町ラズール':'砂漠の町'):'町'});
  if(!des){L.push({x:SPA.x,y:SPA.y,k:'water',n:'温泉'});L.push({x:(HOLES[0][0]+HOLES[5][0])/2,y:(HOLES[0][1]+HOLES[5][1])/2,k:'water',n:'氷の湖'})}
  else{L.push({x:SPA.x,y:SPA.y,k:'water',n:'オアシス'});if(adv){for(const o of OASES)L.push({x:o.x,y:o.y,k:'water',n:o.n});L.push({x:CAMP.x,y:CAMP.y,k:'camp',n:'遊牧民キャンプ'});L.push({x:VALLEY.x,y:VALLEY.y,k:'danger',n:VALLEY.n})}}
  if(isRPG()){for(const D of dgMap()){const open=D.gate();L.push({x:D.ring.x,y:D.ring.y,k:open?'cave':'lock',n:D.n})}if(abyGateOK())L.push({x:ABY_GATE.x,y:ABY_GATE.y,k:'cave',n:'深淵の迷宮'});for(const c of cfList()){const D=DUNGEONS.find(D=>D.id===c.d);if(D&&D.gate())L.push({x:c.x,y:c.y,k:cfLit(c.id)?'fire':'fire0',n:cfLit(c.id)?'焚き火':'焚き火跡',sm:1})}if(des)L.push({x:RUIN.x,y:RUIN.y,k:'ruin',n:'古代遺跡'})}
  return L}
const MCOL={town:'#e8703a',water:'#3fa9d8',camp:'#b8762e',danger:'#c0392b',cave:'#6b5bd6',lock:'#9aa3ad',ruin:'#a8784a',abyss:'#7a4fd6',fire:'#ff7a2a',fire0:'#9a8a78'};
// painted terrain layer, cached until the zones/biome change
let MLAY=null;
function mapLayer(){const des=DES(),key=[des?1:0,ADV()?1:0,ZONES.map(z=>G.zones[z.id]?1:0).join(''),(G.houses||[]).length,G.trees?G.trees.length:0,isRPG()?1:0].join('|');if(MLAY&&MLAY.key===key&&MLAY.g===G)return MLAY.cv;
  const N=720,k=N/WORLD,cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d');const R=(a)=>{const v=Math.sin(a*12.9898)*43758.5453;return v-Math.floor(v)};
  // base: parchment for sand, pale blue-white for snow, with soft mottling
  c.fillStyle=des?'#ecd3a0':'#eef3f7';c.fillRect(0,0,N,N);
  for(let i=0;i<900;i++){c.fillStyle=des?`rgba(180,130,70,${.03+R(i)*.05})`:`rgba(150,175,200,${.03+R(i)*.05})`;c.beginPath();c.arc(R(i+1)*N,R(i+2)*N,4+R(i+3)*22,0,TAU);c.fill()}
  // rim of mountains / dunes
  const gr=c.createRadialGradient(N/2,N/2,N*.36,N/2,N/2,N*.74);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,des?'rgba(150,95,45,.45)':'rgba(90,110,135,.42)');c.fillStyle=gr;c.fillRect(0,0,N,N);
  // paths out of town
  c.strokeStyle=des?'rgba(160,110,60,.35)':'rgba(140,120,100,.28)';c.lineWidth=8;c.lineCap='round';c.setLineDash([10,8]);c.beginPath();c.moveTo(CX*k,(CY-FR)*k);c.lineTo(CX*k,420*k);c.moveTo((CX+FR)*k,CY*k);c.lineTo(1800*k,CY*k);c.moveTo((CX-FR)*k,CY*k);c.lineTo(600*k,CY*k);c.moveTo(1300*k,1700*k);c.lineTo(1300*k,2000*k);c.stroke();c.setLineDash([]);
  // water
  const pond=(x,y,rx,ry)=>{c.fillStyle=des?'#7cc6e0':'#9fcfe8';c.beginPath();c.ellipse(x*k,y*k,rx*k,ry*k,0,0,TAU);c.fill();c.strokeStyle=des?'#3f97b8':'#5a9cc4';c.lineWidth=2;c.stroke();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1.2;for(let j=0;j<3;j++){c.beginPath();c.ellipse(x*k,(y+(j-1)*ry*.35)*k,rx*k*.5,2,0,0,Math.PI);c.stroke()}};
  if(!des)pond(2040,1230,190,330);else{pond(SPA.x,SPA.y,90,60);if(ADV())for(const o of OASES)pond(o.x,o.y,o.r*.55,o.r*.4)}
  if(!des)pond(SPA.x,SPA.y,70,45);
  // trees as tiny painted glyphs
  for(const t of G.trees||[]){if(!t.alive)continue;const x=t.x*k,y=t.y*k;if(des){c.fillStyle='rgba(70,120,60,.8)';c.beginPath();c.arc(x,y,2.4,0,TAU);c.fill()}else{c.fillStyle='rgba(52,98,78,.85)';c.beginPath();c.moveTo(x,y-5);c.lineTo(x+3.4,y+2.5);c.lineTo(x-3.4,y+2.5);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.7)';c.fillRect(x-1,y-4.5,2,1.4)}}
  // dungeons: dark stone blocks
  if(isRPG())for(const D of dgMap()){const b=D.box;c.fillStyle=D.id==='glacier'?'rgba(120,170,210,.35)':'rgba(70,60,110,.28)';c.fillRect(b[0]*k,b[1]*k,(b[2]-b[0])*k,(b[3]-b[1])*k);c.strokeStyle='rgba(60,50,90,.5)';c.lineWidth=1.5;c.strokeRect(b[0]*k,b[1]*k,(b[2]-b[0])*k,(b[3]-b[1])*k)}
  // town: plaza, wall ring and houses
  c.fillStyle=des?'rgba(210,160,100,.55)':'rgba(214,190,160,.55)';c.beginPath();c.arc(CX*k,CY*k,FR*k,0,TAU);c.fill();
  c.strokeStyle=des?'#9a6a3a':'#7a5a3a';c.lineWidth=3.5;c.beginPath();c.arc(CX*k,CY*k,FR*k,0,TAU);c.stroke();c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;c.beginPath();c.arc(CX*k,CY*k,FR*k-3,0,TAU);c.stroke();
  for(const h of G.houses||[]){const x=h.x*k,y=h.y*k;c.fillStyle='#b85c3a';c.beginPath();c.moveTo(x-6,y);c.lineTo(x,y-6);c.lineTo(x+6,y);c.closePath();c.fill();c.fillStyle='#f3e6cc';c.fillRect(x-4.5,y,9,6)}
  c.fillStyle='#ff9a3d';c.beginPath();c.arc(CX*k,CY*k,7,0,TAU);c.fill();c.fillStyle='#ffe07a';c.beginPath();c.arc(CX*k,CY*k,3.5,0,TAU);c.fill();
  // locked zones: drifting fog with a padlock
  if(!ADV())for(const z of ZONES){if(G.zones[z.id])continue;const r=z.rect,x0=r[0]*k,y0=r[1]*k,w=(r[2]-r[0])*k,h=(r[3]-r[1])*k;c.save();c.beginPath();c.rect(x0,y0,w,h);c.clip();c.fillStyle='rgba(235,240,246,.78)';c.fillRect(x0,y0,w,h);
    for(let i=0;i<40;i++){c.fillStyle=`rgba(200,210,222,${.25+R(i+z.id.charCodeAt(0))*.25})`;c.beginPath();c.arc(x0+R(i*3+z.id.charCodeAt(0))*w,y0+R(i*5+7)*h,10+R(i*7)*26,0,TAU);c.fill()}
    c.restore();c.strokeStyle='rgba(120,130,150,.6)';c.setLineDash([6,5]);c.lineWidth=1.5;c.strokeRect(x0+1,y0+1,w-2,h-2);c.setLineDash([]);
    const lx=x0+w/2,ly=y0+h/2;c.fillStyle='#8a93a0';c.fillRect(lx-7,ly-2,14,11);c.strokeStyle='#8a93a0';c.lineWidth=2.4;c.beginPath();c.arc(lx,ly-3,5,Math.PI,0);c.stroke();
    c.font='800 12px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.fillStyle='#6a7380';c.fillText(z.name,lx,ly+24)}
  // abyss gate
  MLAY={key,cv,g:G};return cv}
function mapIcon(c,k,a,b,s){c.save();c.translate(a,b);c.scale(s,s);c.lineJoin='round';const col=MCOL[k]||'#555';
  c.fillStyle='rgba(255,250,240,.95)';c.strokeStyle='#4a3a28';c.lineWidth=1.6;c.beginPath();c.arc(0,0,9,0,TAU);c.fill();c.stroke();c.fillStyle=col;c.strokeStyle=col;
  if(k==='town'){c.beginPath();c.moveTo(-6,0);c.lineTo(0,-6);c.lineTo(6,0);c.closePath();c.fill();c.fillRect(-4,0,8,5)}
  else if(k==='water'){c.beginPath();c.moveTo(0,-6);c.quadraticCurveTo(6,1,0,6);c.quadraticCurveTo(-6,1,0,-6);c.fill()}
  else if(k==='cave'){c.beginPath();c.moveTo(-6,5);c.lineTo(-6,0);c.arc(0,0,6,Math.PI,0);c.lineTo(6,5);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(-2.5,5);c.lineTo(-2.5,1);c.arc(0,1,2.5,Math.PI,0);c.lineTo(2.5,5);c.fill()}
  else if(k==='abyss'){c.lineWidth=2;c.beginPath();for(let t=0;t<14;t++){const an=t*.55,r=1+t*.4;t?c.lineTo(Math.cos(an)*r,Math.sin(an)*r):c.moveTo(1,0)}c.stroke()}
  else if(k==='lock'){c.fillRect(-4.5,-1,9,7);c.lineWidth=1.8;c.beginPath();c.arc(0,-1.5,3.2,Math.PI,0);c.stroke()}
  else if(k==='camp'){c.beginPath();c.moveTo(-6,5);c.lineTo(0,-6);c.lineTo(6,5);c.closePath();c.fill()}
  else if(k==='fire'||k==='fire0'){c.beginPath();c.moveTo(0,-7);c.quadraticCurveTo(6,-1,4,4);c.quadraticCurveTo(0,7,-4,4);c.quadraticCurveTo(-6,-1,0,-7);c.fill();if(k==='fire'){c.fillStyle='#ffd76a';c.beginPath();c.arc(0,2,2.4,0,TAU);c.fill()}}
  else if(k==='danger'){c.font='900 12px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('!',0,1)}
  else{c.beginPath();c.arc(0,0,4,0,TAU);c.fill()}
  c.restore()}
function drawMap(cv,big){const c=cv.getContext('2d'),W=cv.width,H=cv.height,me=G.players[G.me]||G.players[0];if(!me)return;const des=DES();c.clearRect(0,0,W,H);c.save();
  let sc,rot=0,ox,oy;if(big){sc=Math.min(W,H)/WORLD*.94;ox=(W-WORLD*sc)/2;oy=(H-WORLD*sc)/2}else{sc=W/900;rot=CAMS.cur}
  const P=(x,y)=>{if(big)return[ox+x*sc,oy+y*sc];const dx=(x-me.x)*sc,dy=(y-me.y)*sc,cs=Math.cos(rot),sn=Math.sin(rot);return[W/2+dx*cs-dy*sn,H/2+dx*sn+dy*cs]};
  if(!big){c.beginPath();c.arc(W/2,H/2,W/2-2,0,TAU);c.clip()}
  c.fillStyle=des?'#d9b47a':'#cfdbe6';c.fillRect(0,0,W,H);
  const inA=inAby(me.x);
  if(inA&&!big){c.fillStyle='#16121f';c.fillRect(0,0,W,H)}
  else{const L=mapLayer();c.save();if(big){c.translate(ox,oy);c.scale(sc,sc)}else{c.translate(W/2,H/2);c.rotate(rot);c.scale(sc,sc);c.translate(-me.x,-me.y)}c.imageSmoothingEnabled=true;c.drawImage(L,0,0,WORLD,WORLD);c.restore()}
  const fs=big?13:10;c.font=`800 ${fs}px "Zen Maru Gothic",sans-serif`;c.textAlign='center';c.textBaseline='alphabetic';
  if(!inA||big)for(const m of mapMarks()){const [a,b]=P(m.x,m.y);const k=m.n==='深淵の迷宮'?'abyss':m.k;mapIcon(c,k,a,b,(big?1.15:.8)*(m.sm?.75:1));if((big&&!m.sm)||m.k==='town'){const tw=c.measureText(m.n).width+12,ty=b-(big?15:12);c.fillStyle='rgba(255,250,240,.9)';c.strokeStyle='rgba(120,90,50,.55)';c.lineWidth=1;c.beginPath();c.roundRect?c.roundRect(a-tw/2,ty-fs+1,tw,fs+5,5):c.rect(a-tw/2,ty-fs+1,tw,fs+5);c.fill();c.stroke();c.fillStyle='#3b2a1a';c.fillText(m.n,a,ty+2)}}
  const dot=(x,y,r,col,stroke)=>{const [a,b]=P(x,y);c.fillStyle=col;c.beginPath();c.arc(a,b,r,0,TAU);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke()}return[a,b]};
  // desert treasure
  if(ADV()&&G.adv)G.adv.tr.forEach((on,i)=>{if(on)dot(TREAS[i][0],TREAS[i][1],big?4:3,'#f5c542','#8a6a1a')});
  // people with something to say
  if(!inA)for(const v of G.npcV||[]){if(!v.m.g.visible)continue;const mk=npcMark(v.n.id);if(mk&&mk!=='…'){const [a,b]=P(v.x,v.y),col=mk==='？'?'#3fc157':'#ffb020',pu=(performance.now()/900)%1,R=big?7:5.5;c.strokeStyle=col;c.globalAlpha=1-pu;c.lineWidth=2;c.beginPath();c.arc(a,b,R+pu*(big?12:9),0,TAU);c.stroke();c.globalAlpha=1;c.fillStyle=col;c.strokeStyle='#16283a';c.lineWidth=1.8;c.beginPath();c.arc(a,b,R,0,TAU);c.fill();c.stroke();c.fillStyle='#fff';c.font=`900 ${big?11:9}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(mk==='？'?'?':'!',a,b+.5);c.textBaseline='alphabetic'}}
  // where accepted quests take you (orange flag)
  if(!inA&&G.story&&G.story.q)for(const k in G.story.q){const Q=QUESTS[k],q=G.story.q[k];if(!Q||q.st!==1||Q.bio!==bioKey()||Q.x==null)continue;const qx=Q.type==='escort'&&q.x!=null?q.x:Q.x,qy=Q.type==='escort'&&q.y!=null?q.y:Q.y;
    let [a,b]=P(qx,qy);if(!big){const dx=a-W/2,dy=b-H/2,r=Math.hypot(dx,dy),lim=W/2-12;if(r>lim){a=W/2+dx/r*lim;b=H/2+dy/r*lim}}
    const s2=big?1.2:.9,pu=(performance.now()/700)%1;c.strokeStyle='#ff8a1a';c.globalAlpha=1-pu;c.lineWidth=2;c.beginPath();c.arc(a,b,6+pu*12,0,TAU);c.stroke();c.globalAlpha=1;
    c.strokeStyle='#16283a';c.lineWidth=2;c.beginPath();c.moveTo(a,b+2);c.lineTo(a,b-14*s2);c.stroke();c.fillStyle='#ff8a1a';c.beginPath();c.moveTo(a,b-14*s2);c.lineTo(a+11*s2,b-10*s2);c.lineTo(a,b-6*s2);c.closePath();c.fill();c.stroke();
    if(big){c.font='800 11px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#fff';c.strokeText(Q.t,a,b+14);c.fillStyle='#c05a10';c.fillText(Q.t,a,b+14)}}
  // enemies nearby (and every boss)
  for(const b of G.bears){if(b.dead||b.hide)continue;if(inAby(b.x)!==inA)continue;const boss=b.kind==='boss';if(!big&&!boss&&dist(b.x,b.y,me.x,me.y)>700)continue;if(big&&!boss)continue;dot(b.x,b.y,boss?(big?7:5):2.6,boss?'#c0392b':'#e0605a',boss?'#fff':null)}
  // objective
  const t=G._gt;if(t){let [a,b]=P(t.x,t.y);if(!big){const dx=a-W/2,dy=b-H/2,d=Math.hypot(dx,dy),R=W/2-10;if(d>R){a=W/2+dx/d*R;b=H/2+dy/d*R}}c.fillStyle='#ffd23f';c.strokeStyle='#16283a';c.lineWidth=2;c.beginPath();for(let k=0;k<10;k++){const r=k%2?(big?5:4):(big?11:8),an=k/10*TAU-Math.PI/2;c.lineTo(a+Math.cos(an)*r,b+Math.sin(an)*r)}c.closePath();c.fill();c.stroke()}
  // friend + me
  G.players.forEach((p,i)=>{if(p===me||inAby(p.x)!==inA)return;dot(p.x,p.y,big?6:5,'#4f9fe8','#fff')});
  if(!(big&&inA)){const [a,b]=P(me.x,me.y);const ang=big?-(me.dir||0)+Math.PI:rot-(me.dir||0)+Math.PI;c.save();c.translate(a,b);c.rotate(ang);c.fillStyle='#ff6a3d';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(0,-9);c.lineTo(6,7);c.lineTo(0,3);c.lineTo(-6,7);c.closePath();c.fill();c.stroke();c.restore()}
  if(big){// compass rose
    c.save();c.translate(W-46,46);c.fillStyle='rgba(255,250,240,.9)';c.strokeStyle='#8a6a3a';c.lineWidth=1.5;c.beginPath();c.arc(0,0,26,0,TAU);c.fill();c.stroke();for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle=i===3?'#c0392b':'#5b4636';c.beginPath();c.moveTo(0,-22);c.lineTo(5,0);c.lineTo(-5,0);c.closePath();c.fill()}c.fillStyle='#3b2a1a';c.font='900 10px sans-serif';c.fillText('N',0,-28+2);c.restore();
    if(inA){c.fillStyle='rgba(22,18,31,.55)';c.fillRect(0,H/2-26,W,52);c.fillStyle='#efe6ff';c.font='800 16px "Zen Maru Gothic",sans-serif';c.fillText(`いまは深淵の迷宮・地下${(G.aby&&G.aby.fl)||1}階にいる`,W/2,H/2+6)}}
  c.restore();
  if(!big){c.strokeStyle='#b8913f';c.lineWidth=3;c.beginPath();c.arc(W/2,H/2,W/2-2,0,TAU);c.stroke();c.fillStyle='#1d3150';c.font='900 11px sans-serif';c.fillText('▲',W/2,12)}}
function mapHud(){const mc=$('mini'),bm=$('bigmap');if(!running){mc.hidden=true;bm.hidden=true;MAPV.big=false;return}mc.hidden=false;const now=performance.now();if(now-MAPV.t<120)return;MAPV.t=now;drawMap(mc,false);if(MAPV.big){bm.hidden=false;drawMap($('bigmapC'),true)}else bm.hidden=true}
addEventListener('keydown',e=>{if(e.code!=='KeyM'||e.repeat||!running||(e.target&&e.target.tagName==='INPUT'))return;MAPV.big=!MAPV.big;MAPV.t=0;if(MAPV.big&&document.pointerLockElement)document.exitPointerLock()});
