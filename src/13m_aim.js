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
// ---- pads no longer take money just because you walked over them: stand on one and press E (or the 支払う button) to start paying
const padIsCash=pad=>pad&&pad.pay==='cash';
const PADL={arm:null};
function padLocalCost(pad,me){return pad.personal?pad.costP(me):pad.cost()}
function padHere(me){if(!me||!G||!G.pads)return null;for(const pad of G.pads){if(!pad.shown||!padIsCash(pad))continue;if(dist(me.x,me.y,pad.x,pad.y)>(pad.big?50:40))continue;if(!pad.personal&&pad.req&&pad.req())continue;const c=padLocalCost(pad,me);if(c==null)continue;return pad}return null}
function padLocalPress(){if(!running||!G)return false;const me=G.players[G.me]||G.players[0];const pad=padHere(me);if(!pad)return false;
  PADL.arm=pad.id+':'+padLocalCost(pad,me);if(NET.mode!=='guest')me.padPress=true;SFX.pop&&SFX.pop();return true}
function padBtnPress(){if(!running||!G)return;const me=G.players[G.me]||G.players[0];if(!padHere(me))return;if(NET.mode==='guest'){NET.eCount=(NET.eCount||0)+1;NET.eGrade=0}padLocalPress()}
function padPromptFx(){let b=document.getElementById('payBtn');if(!b){b=document.createElement('button');b.id='payBtn';b.hidden=true;b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();padBtnPress()});document.body.appendChild(b)}
  const me=G&&running&&(G.players[G.me]||G.players[0]);const pad=me&&!(me.down>0)&&!DLG.open?padHere(me):null;
  if(!pad){PADL.arm=null;b.hidden=true;return}
  const c=padLocalCost(pad,me),key=pad.id+':'+c;
  // host: the authoritative arm is cleared when a level is bought, so ask again for the next level
  if(NET.mode!=='guest'&&PADL.arm===key&&me.padArm!==pad.id&&!me.padPress)PADL.arm=null;
  if(PADL.arm===key){b.hidden=true;return}
  const left=Math.max(0,c-(pad.personal?(pad.pp[me.id]||0):pad.paid));const short=G.cash<=0;
  label(pad.x,pad.y,70,`<b>${pad.name||''}</b><br><small>${short?'お金が足りない':`<b style="color:#ffd23f">Eキー</b>で $${Math.ceil(left).toLocaleString()} を払う`}</small>`,short?'':'gold');
  b.textContent=short?'お金が足りない':`💰 $${Math.ceil(left).toLocaleString()} 払う（E）`;b.disabled=short;b.hidden=false}
// ---- hit feel (story mode): damage numbers, a meaty hit sound, a small flinch + squash, a bigger punch on the killing blow
let _hitSnd=0;
SFX.hit=(melee,heavy)=>{const n=performance.now();if(n-_hitSnd<45)return;_hitSnd=n;noise(melee?.07:.045,melee?.17:.08,melee?520:1500);tone(heavy?90:melee?120:240,heavy?.14:.08,'triangle',melee?.13:.06,.45);if(heavy)tone(60,.2,'sine',.12,.6)};
function hitFeel(sh,b,dmg,fx){if(!isRPG()||!sh||!G.players.includes(sh)||b.hide||!(dmg>0))return;
  const melee=fx==='slash'||fx==='spin',fin=(sh.cmb||0)%3===0&&sh.cmbT>1,kill=b.hp<=0;
  const v=Math.max(1,Math.round(dmg*10));const mine=sh===(G.players[G.me]||G.players[0]);
  if(mine||NET.outF.length<6)float(b.x+rnd(-10,10),b.y,(b.kind==='boss'?110:b.kind==='big'?80:62)+rnd(0,10),String(v),fin||kill?'dmg crit':'dmg',fin,!mine&&NET.mode!=='host');
  if(b.kind!=='boss'&&!kill){const k=melee?9:4,dx=b.x-sh.x,dy=b.y-sh.y,d=Math.hypot(dx,dy)||1;b.x+=dx/d*k;b.y+=dy/d*k;if(isRPG()&&(dgAt(b.x,b.y)||b.x>ABX))caveWalls(b,16)}
  b._sq=melee||fin||kill?.16:.1;if(melee)G.shake=Math.max(G.shake,fin?5:2.5);
  if(mine||NET.mode==='solo')SFX.hit(melee,fin||kill);
  if(kill){hitstop(b.kind==='boss'?.14:.06);G.shake=Math.max(G.shake,b.kind==='boss'?12:5);burst(b.x,b.y,28,18,{c:['#ffffff','#ffe07a','#ff9a5a'],s0:80,s1:240,u0:80,u1:220,l0:.3,l1:.6,add:true,r0:3,r1:7})}}
function hitFx(){if(!G||!running)return;const dt=1/60;for(const b of G.bears){const m=b.m;if(!m||!m.g)continue;
  if(b._sq>0){if(b._bs==null)b._bs=m.g.scale.x;b._sq=Math.max(0,b._sq-dt);const k=b._sq/.16,s=b._bs;m.g.scale.set(s*(1+.14*k),s*(1-.18*k),s*(1+.14*k));if(b._sq<=0){m.g.scale.setScalar(s);b._bs=null}}}}
// ---- trees never hide what matters: ones between the camera and you, right around you, or on top of an SOS / quest spot are tucked away
const TOCC={t:0,on:new Set()};
function treeOccFx(){if(!G||!running||!forest||!G.trees)return;const now=performance.now();if(now-TOCC.t<150)return;TOCC.t=now;
  const me=G.players[G.me]||G.players[0];if(!me)return;const cx=camera.position.x,cz=camera.position.z,px=me.x,pz=me.y;const sx=px-cx,sz=pz-cz,L2=sx*sx+sz*sz||1;
  const spots=[];const R=G.rescue;if(R&&R.state==='wait')spots.push([R.x,R.y,110]);
  if(G.story&&G.story.q)for(const k in G.story.q){const Q=QUESTS[k],q=G.story.q[k];if(Q&&q.st===1&&Q.x!=null&&Q.bio===bioKey())spots.push([Q.x,Q.y,90])}
  const want=new Set();
  for(const t of G.trees){if(!t.alive||t.fall>0)continue;const dx=t.x-px,dz=t.y-pz;if(dx*dx+dz*dz<55*55||t===me.chopping)continue;
    if(Math.abs(t.x-px)<700&&Math.abs(t.y-pz)<700){const u=((t.x-cx)*sx+(t.y-cz)*sz)/L2;if(u>0&&u<1){const qx=cx+sx*u-t.x,qz=cz+sz*u-t.y;if(qx*qx+qz*qz<(40*t.s)**2){want.add(t);continue}}}
    for(const s of spots)if(Math.abs(t.x-s[0])<s[2]&&Math.abs(t.y-s[1])<s[2]&&dist(t.x,t.y,s[0],s[1])<s[2]){want.add(t);break}}
  for(const t of TOCC.on)if(!want.has(t)){t.occ=false;forest.upd(t)}
  for(const t of want)if(!t.occ){t.occ=true;forest.upd(t)}TOCC.on=want}
// ---- SOS you can't miss: a pulsing chip under the objective, a repeating alarm, and a "hurry" call when time is short
const SOSU={id:null,beep:0,warned:false};
function sosFx(){let el=document.getElementById('sosChip');if(!el){el=document.createElement('div');el.id='sosChip';el.hidden=true;document.body.appendChild(el)}
  const R=G&&running?G.rescue:null,me=G&&(G.players[G.me]||G.players[0]);if(!R||R.state!=='wait'||!me){el.hidden=true;SOSU.id=null;return}
  const d=Math.round(dist(me.x,me.y,R.x,R.y)/10),t=Math.ceil(R.t),near=d<12;
  if(SOSU.id!==R.id){SOSU.id=R.id;SOSU.beep=0;SOSU.warned=false}
  el.hidden=false;el.classList.toggle('urgent',t<=15);el.textContent=`🆘 遭難者${R.n}人がSOS！ あと${t}秒・${near?'ここ！':d+'m'}${R.kind==='hot'&&!R.hotDone?'（お湯が必要）':R.kind==='bears'&&R.gb>0?`（敵${R.gb}体）`:R.kind==='sled'?'（犬ぞりで運ぶ）':''}`;
  const now=performance.now();if(!near&&now-SOSU.beep>(t<=15?3500:9000)){SOSU.beep=now;try{tone(880,.12,'square',.05);tone(660,.12,'square',.05,0,.16);tone(880,.12,'square',.05,0,.32)}catch(_){}}
  if(t<=15&&!SOSU.warned&&!near){SOSU.warned=true;toast(`🆘 急げ！ 遭難者があと${t}秒で凍えてしまう`,'cold',true)}}
