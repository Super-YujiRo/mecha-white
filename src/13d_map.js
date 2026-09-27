// ================================================================ minimap (turns with the camera) + full map (M key)
const MAPV={big:false,t:0};
function mapMarks(){const L=[];const S=G.story,des=DES(),adv=ADV();
  L.push({x:CX,y:CY,k:'town',n:des?(adv?'砂の町ラズール':'砂漠の町'):'町'});
  if(!des){L.push({x:SPA.x,y:SPA.y,k:'water',n:'温泉'});L.push({x:(HOLES[0][0]+HOLES[5][0])/2,y:(HOLES[0][1]+HOLES[5][1])/2,k:'water',n:'氷の湖'})}
  else{L.push({x:SPA.x,y:SPA.y,k:'water',n:'オアシス'});if(adv){for(const o of OASES)L.push({x:o.x,y:o.y,k:'water',n:o.n});L.push({x:CAMP.x,y:CAMP.y,k:'camp',n:'遊牧民キャンプ'});L.push({x:VALLEY.x,y:VALLEY.y,k:'danger',n:VALLEY.n})}}
  if(isRPG()){for(const D of dgMap()){const open=D.gate();L.push({x:D.ring.x,y:D.ring.y,k:open?'cave':'lock',n:D.n})}if(des)L.push({x:RUIN.x,y:RUIN.y,k:'ruin',n:'古代遺跡'})}
  return L}
const MCOL={town:'#e8703a',water:'#3fa9d8',camp:'#b8762e',danger:'#c0392b',cave:'#6b5bd6',lock:'#9aa3ad',ruin:'#a8784a'};
function drawMap(cv,big){const c=cv.getContext('2d'),W=cv.width,H=cv.height,me=G.players[G.me]||G.players[0];if(!me)return;const des=DES();c.clearRect(0,0,W,H);c.save();
  let sc,rot=0,ox,oy;if(big){sc=Math.min(W,H)/WORLD*.94;ox=(W-WORLD*sc)/2;oy=(H-WORLD*sc)/2}else{sc=W/900;rot=CAMS.cur}
  const P=(x,y)=>{if(big)return[ox+x*sc,oy+y*sc];const dx=(x-me.x)*sc,dy=(y-me.y)*sc,cs=Math.cos(rot),sn=Math.sin(rot);return[W/2+dx*cs-dy*sn,H/2+dx*sn+dy*cs]};
  if(!big){c.beginPath();c.arc(W/2,H/2,W/2-2,0,TAU);c.clip()}
  c.fillStyle=des?'#ead19c':'#e9f1f7';c.fillRect(0,0,W,H);
  // world edge
  c.strokeStyle='rgba(60,40,20,.35)';c.lineWidth=2;c.beginPath();[[0,0],[WORLD,0],[WORLD,WORLD],[0,WORLD]].forEach((q,i)=>{const [x,y]=P(q[0],q[1]);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke();
  // locked zones (town-building chapters only)
  if(!ADV())for(const z of ZONES){if(G.zones[z.id])continue;const r=z.rect;c.fillStyle='rgba(120,130,145,.35)';c.beginPath();[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]].forEach((q,i)=>{const [x,y]=P(q[0],q[1]);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fill()}
  // dungeon boxes
  if(isRPG())for(const D of dgMap()){const b=D.box;c.fillStyle='rgba(70,60,120,.18)';c.beginPath();[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]].forEach((q,i)=>{const [x,y]=P(q[0],q[1]);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fill()}
  // town ring
  {const [x,y]=P(CX,CY);c.strokeStyle=des?'rgba(184,120,70,.8)':'rgba(120,90,60,.7)';c.lineWidth=2;c.beginPath();c.arc(x,y,FR*sc,0,TAU);c.stroke()}
  const dot=(x,y,r,col,stroke)=>{const [a,b]=P(x,y);c.fillStyle=col;c.beginPath();c.arc(a,b,r,0,TAU);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke()}return[a,b]};
  const fs=big?13:10;c.font=`800 ${fs}px "Zen Maru Gothic",sans-serif`;c.textAlign='center';
  for(const m of mapMarks()){const [a,b]=dot(m.x,m.y,big?7:5,MCOL[m.k]||'#555','#fff');if(big||m.k==='town'){c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.9)';c.strokeText(m.n,a,b-10);c.fillStyle='#3b2a1a';c.fillText(m.n,a,b-10)}}
  // desert treasure
  if(ADV()&&G.adv)G.adv.tr.forEach((on,i)=>{if(on)dot(TREAS[i][0],TREAS[i][1],big?4:3,'#f5c542','#8a6a1a')});
  // people with something to say
  for(const v of G.npcV||[]){if(!v.m.g.visible)continue;const mk=npcMark(v.n.id);if(mk&&mk!=='…')dot(v.x,v.y,big?5:4,mk==='？'?'#3fc157':'#ffb020','#16283a')}
  // enemies nearby (and every boss)
  for(const b of G.bears){if(b.dead||b.hide)continue;const boss=b.kind==='boss';if(!big&&!boss&&dist(b.x,b.y,me.x,me.y)>700)continue;if(big&&!boss)continue;dot(b.x,b.y,boss?(big?7:5):2.6,boss?'#c0392b':'#e0605a',boss?'#fff':null)}
  // objective
  const t=G._gt;if(t){let [a,b]=P(t.x,t.y);if(!big){const dx=a-W/2,dy=b-H/2,d=Math.hypot(dx,dy),R=W/2-10;if(d>R){a=W/2+dx/d*R;b=H/2+dy/d*R}}c.fillStyle='#ffd23f';c.strokeStyle='#16283a';c.lineWidth=2;c.beginPath();for(let k=0;k<10;k++){const r=k%2?(big?5:4):(big?11:8),an=k/10*TAU-Math.PI/2;c.lineTo(a+Math.cos(an)*r,b+Math.sin(an)*r)}c.closePath();c.fill();c.stroke()}
  // friend + me
  G.players.forEach((p,i)=>{if(p===me)return;dot(p.x,p.y,big?6:5,'#4f9fe8','#fff')});
  {const [a,b]=P(me.x,me.y);const ang=big?-(me.dir||0)+Math.PI:rot-(me.dir||0)+Math.PI;c.save();c.translate(a,b);c.rotate(ang);c.fillStyle='#ff6a3d';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(0,-9);c.lineTo(6,7);c.lineTo(0,3);c.lineTo(-6,7);c.closePath();c.fill();c.stroke();c.restore()}
  c.restore();
  if(!big){c.strokeStyle='#b8913f';c.lineWidth=3;c.beginPath();c.arc(W/2,H/2,W/2-2,0,TAU);c.stroke();c.fillStyle='#1d3150';c.font='900 11px sans-serif';c.fillText('▲',W/2,12)}}
function mapHud(){const mc=$('mini'),bm=$('bigmap');if(!running){mc.hidden=true;bm.hidden=true;MAPV.big=false;return}mc.hidden=false;const now=performance.now();if(now-MAPV.t<120)return;MAPV.t=now;drawMap(mc,false);if(MAPV.big){bm.hidden=false;drawMap($('bigmapC'),true)}else bm.hidden=true}
addEventListener('keydown',e=>{if(e.code!=='KeyM'||e.repeat||!running||(e.target&&e.target.tagName==='INPUT'))return;MAPV.big=!MAPV.big;MAPV.t=0;if(MAPV.big&&document.pointerLockElement)document.exitPointerLock()});
