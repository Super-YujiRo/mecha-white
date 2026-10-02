// ================================================================ aiming (story mode): attacks go where the camera faces; early-game damage curve; keep running in a background tab while online
// damage grows with your level: Lv1 deals 55%, full strength from Lv10
function earlyK(p){return isRPG()?Math.min(1,.55+(rlv(p)-1)*.05):1}
// aim direction in world (atan2(dx,dy) convention): the local player aims where the camera looks; a guest sends theirs
function aimOf(p){if(!isRPG()||!p)return null;const me=G.players[G.me]||G.players[0];if(p===me&&!p.remote)return CAMS.cur+Math.PI;return typeof p.aimA==='number'?p.aimA:null}
const angD=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function aimPick(p,A,range,melee){const cone=melee?1.0:.42,R=melee?range:range*1.15;let best=null,bs=1e9;
  for(const b of G.bears){if(b.dead||b.hide)continue;const d=dist(p.x,p.y,b.x,b.y);if(d>R)continue;const da=angD(Math.atan2(b.x-p.x,b.y-p.y),A);
    // very close enemies count even a bit off-center; otherwise must be inside the cone
    if(da>cone&&!(d<40&&da<cone*2))continue;const sc=da*(melee?60:260)+d*.35;if(sc<bs){bs=sc;best=b}}return best}
// attack into empty space: show the swing / shot so aiming feels responsive
function aimMiss(p,cl,melee,gunInt,dt){const A=aimOf(p);p.shooting=true;p.aimDir=A;p.actT+=dt;if(p.actT<gunInt)return;p.actT=0;p.flash=.07;
  const R=melee?Math.max(40,cl.rng*.55):cl.rng;shoot(p,{x:p.x+Math.sin(A)*R,y:p.y+Math.cos(A)*R,hide:true,hp:1e9},0,true,cl.fx);if(!melee&&SFX.shot)SFX.shot()}
// visuals: a faint aim fan on the ground in front of you and a lock-on ring on whoever you would hit
const AIMV={};
function aimFx(){if(!G||!running)return;const me=G.players[G.me]||G.players[0];const on=isRPG()&&me&&!(me.down>0)&&!me.riding&&!DLG.open;
  if(!AIMV.g){const g=new T.Group();
    const fanM=new T.MeshBasicMaterial({color:lin('#fff3c4'),transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
    const fan=new T.Mesh(new T.CircleGeometry(1,24,-.42,.84),fanM);fan.rotation.x=-Math.PI/2;fan.position.y=1.6;fan.renderOrder=3;g.add(fan);
    const tick=new T.Mesh(new T.RingGeometry(.96,1,40,1,-.42,.84),new T.MeshBasicMaterial({color:lin('#ffe9a0'),transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}));tick.rotation.x=-Math.PI/2;tick.position.y=1.7;g.add(tick);
    const ring=new T.Group();const rm=new T.MeshBasicMaterial({color:lin('#ff5a4a'),transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});
    for(let i=0;i<4;i++){const a=new T.Mesh(new T.RingGeometry(20,24,10,1,i*Math.PI/2+.25,Math.PI/2-.5),rm);ring.add(a)}ring.rotation.x=-Math.PI/2;ring.position.y=2;ring.renderOrder=4;
    world.add(g);world.add(ring);AIMV.g=g;AIMV.fan=fan;AIMV.tick=tick;AIMV.ring=ring;AIMV.rm=rm}
  if(AIMV.g.parent!==world){world.add(AIMV.g);world.add(AIMV.ring)}
  if(!on){AIMV.g.visible=AIMV.ring.visible=false;return}
  const cl=clsOf(me),melee=cl.rng<130,A=aimOf(me),range=cl.rng+me.lv.gun*(melee?4:15);
  // only show when there is something to fight nearby (or you are attacking)
  let near=false;for(const b of G.bears){if(!b.dead&&!b.hide&&dist(me.x,me.y,b.x,b.y)<range*1.8){near=true;break}}
  const show=near||INP.atk;AIMV.g.visible=show&&!cl.cleave;
  if(AIMV.g.visible){const R=melee?range:range*1.15,cone=melee?1.0:.42;AIMV.g.position.set(me.x,0,me.y);AIMV.g.rotation.y=A;
    const sx=R;AIMV.fan.scale.set(sx,sx,1);AIMV.tick.scale.set(sx,sx,1);
    // CircleGeometry is built for the ranged cone; widen for melee by scaling the angle via a rebuilt geometry once per class change
    if(AIMV.cone!==cone){AIMV.cone=cone;AIMV.fan.geometry.dispose();AIMV.tick.geometry.dispose();AIMV.fan.geometry=new T.CircleGeometry(1,24,-Math.PI/2-cone,cone*2);AIMV.tick.geometry=new T.RingGeometry(.96,1,40,1,-Math.PI/2-cone,cone*2)}
    AIMV.fan.material.opacity=INP.atk?.2:.1}
  const t=show&&!cl.cleave?aimPick(me,A,range,melee):null;AIMV.ring.visible=!!t;
  if(t){const s=t.kind==='boss'?2.2:t.kind==='big'?1.5:1;AIMV.ring.position.set(t.x,2,t.y);AIMV.ring.scale.set(s,s,s);AIMV.ring.rotation.z=performance.now()/600;AIMV.rm.opacity=INP.atk?.95:.6}}
// ---- keep the game running while the tab is in the background during online play (browsers stop drawing hidden tabs, which froze your friend's game)
const BG={w:null,on:false,n:0};
function bgStart(){if(BG.w)return;try{const src='let h=null;onmessage=e=>{if(e.data==="go"&&!h)h=setInterval(()=>postMessage(0),33);if(e.data==="stop"&&h){clearInterval(h);h=null}}';
    BG.w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));BG.w.onmessage=bgTick}catch(e){plog('bg worker failed '+e);BG.w={postMessage(m){if(m==='go'&&!BG.iv)BG.iv=setInterval(bgTick,33);if(m==='stop'&&BG.iv){clearInterval(BG.iv);BG.iv=null}}}}}
function bgTick(){if(!document.hidden||!running||!(NET.mode==='host'||NET.mode==='guest'))return;BG.n++;
  try{loopBody(performance.now())}catch(e){try{loopErr(e)}catch(_){}}}
document.addEventListener('visibilitychange',()=>{const online=running&&(NET.mode==='host'||NET.mode==='guest');
  if(document.hidden&&online){bgStart();BG.w.postMessage('go');BG.on=true;plog('hidden: background tick on ('+NET.mode+')')}
  else if(BG.on){BG.w.postMessage('stop');BG.on=false;plog('visible: background ticks '+BG.n);BG.n=0}});
