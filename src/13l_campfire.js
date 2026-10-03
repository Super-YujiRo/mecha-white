// ================================================================ campfire spots in dungeons: light them with 3 logs, warm up there, and come back there instead of losing your bag
const CF_LOGS=3;
const CAMPFIRES=[
  {id:'cv1',d:'cave',x:2240,y:2240},{id:'cv2',d:'cave',x:2300,y:2040},
  {id:'gl1',d:'glacier',x:380,y:2230},{id:'gl2',d:'glacier',x:540,y:2030},
  {id:'ru1',d:'ruin',x:2090,y:2150},{id:'ru2',d:'ruin',x:2080,y:1990}];
const cfLit=id=>!!(G&&G.story&&(G.story.fires||[]).includes(id));
const cfList=()=>{const L=dgMap().map(D=>D.id);return CAMPFIRES.filter(c=>L.includes(c.d))};
function cfWarm(x,y){if(!G||!G.story||!isRPG())return false;for(const c of cfList())if(cfLit(c.id)&&dist(x,y,c.x,c.y)<115)return true;return false}
// host: lighting by standing next to an unlit spot with logs
function updateCampfires(dt){if(!isRPG()||!G.story)return;const S=G.story;S.fires=S.fires||[];G.cfT=G.cfT||{};
  for(const c of cfList()){if(cfLit(c.id))continue;const D=DUNGEONS.find(D=>D.id===c.d);if(!D||!D.gate())continue;
    const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,c.x,c.y)<46&&p.bag.filter(k=>k==='log').length>=CF_LOGS);
    if(!p){G.cfT[c.id]=0;continue}G.cfT[c.id]=(G.cfT[c.id]||0)+dt;if(G.cfT[c.id]<1.2)continue;
    for(let i=0;i<CF_LOGS;i++)take(p,'log');S.fires.push(c.id);G.cfT[c.id]=0;SFX.area&&SFX.area();
    burst(c.x,c.y,30,30,{c:['#ffb347','#ffe08a','#ffffff'],s0:60,s1:200,u0:120,u1:280,l0:.5,l1:1,add:true});
    banner('焚き火をつけた！',D.n,'ここで暖まれる。凍えたり倒れたりしても、持ち物を失わずにここへ戻る','r-SSR')}}
// host: freezing / falling inside a dungeon with a lit fire sends you back to it with your bag
function campRescue(p){if(!isRPG()||!G.story)return false;const D=dgAt(p.x,p.y);if(!D)return false;let best=null,bd=1e9;
  for(const c of CAMPFIRES)if(c.d===D.id&&cfLit(c.id)){const d=dist(p.x,p.y,c.x,c.y);if(d<bd){bd=d;best=c}}if(!best)return false;
  const i=G.players.indexOf(p);G.cfko=G.cfko||[0,0];G.cfko[i]=(G.cfko[i]||0)+1;G.cfkoT=G.cfkoT||['',''];G.cfkoT[i]=best.id;
  p.warm=100;p.hp=Math.max(p.hp,70);p.inv=3;p.down=0;float(p.x,p.y,80,'焚き火まで戻った','ice',true);return true}
function cfSnap(){return G.story?[(G.story.fires||[]).join('.'),(G.cfko||[0,0]).join('.'),(G.cfkoT||['','']).join('.')]:null}
function cfApply(v){if(!Array.isArray(v)||!G.story)return;G.story.fires=v[0]?v[0].split('.'):[];G.cfko=String(v[1]).split('.').map(Number);G.cfkoT=String(v[2]).split('.')}
// visuals + local player (each client moves its own player back to the fire)
function cfBuild(c){const g=new T.Group();g.position.set(c.x,0,c.y);const st=std('#6f747c',{map:TEX.stone,r:.95,flat:true}),ch=std('#2a211c',{r:1}),wd=std('#5a3e2a',{map:TEX.bark,r:.9});
  for(let i=0;i<9;i++){const a=i/9*TAU,m=M_(rockG(6),st,true,true);m.position.set(Math.cos(a)*20,3,Math.sin(a)*20);m.rotation.set(i,i*2,0);g.add(m)}
  g.add(at(cyl(15,16,1.5,ch,14,false),0,.9,0));const logs=new T.Group();for(const r of [.2,1.25,2.3])logs.add(at(rot(cyl(2.6,2.6,26,wd,7,true),Math.PI/2,r,0),0,4,0));g.add(logs);
  const fl=makeFlame(11,30);fl.position.y=4;g.add(fl);const glowD=M_(new T.CircleGeometry(60,24),new T.MeshBasicMaterial({color:lin('#ff9a3a'),transparent:true,opacity:.16,blending:T.AdditiveBlending,depthWrite:false}),false);glowD.rotation.x=-Math.PI/2;glowD.position.y=1.2;g.add(glowD);
  const mark=M_(new T.RingGeometry(26,30,32),new T.MeshBasicMaterial({color:lin('#ffd76a'),transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}),false);mark.rotation.x=-Math.PI/2;mark.position.y=1.3;g.add(mark);
  g.userData={fl,glowD,mark};world.add(g);return g}
function campfireFx(){if(!G||!running)return;G.cfV=G.cfV||{};const me=G.players[G.me]||G.players[0];const L=cfList(),now=performance.now();
  for(const id in G.cfV){const V=G.cfV[id];if(V.parent!==world){delete G.cfV[id];continue}const c0=CAMPFIRES.find(c=>c.id===id),D0=c0&&DUNGEONS.find(D=>D.id===c0.d);V.visible=L.some(c=>c.id===id)&&!!(me&&D0&&inBox(me.x,me.y,D0.box,90))}
  for(const c of L){const V=G.cfV[c.id]||(G.cfV[c.id]=cfBuild(c));const lit=cfLit(c.id);V.userData.fl.visible=lit;V.userData.glowD.visible=lit;V.userData.mark.visible=!lit;if(!lit)V.userData.mark.material.opacity=.35+.3*Math.sin(now/300);
    if(!me||dgAt(me.x,me.y)!==DUNGEONS.find(D=>D.id===c.d))continue;const d=dist(me.x,me.y,c.x,c.y);if(d>260)continue;
    if(lit)label(c.x,c.y,58,'<b>焚き火</b><br><small>暖まれる・凍えたらここに戻る</small>','gold');
    else{const n=me.bag.filter(k=>k==='log').length,t=(G.cfT&&G.cfT[c.id])||0;label(c.x,c.y,52,`<b>焚き火跡</b><br><small>${t>0?'■'.repeat(Math.min(5,Math.ceil(t/.24))):n>=CF_LOGS?`そばに立つと薪${CF_LOGS}本で火をつける`:`薪が${CF_LOGS}本必要（いま${n}本）`}</small>`,n>=CF_LOGS?'gold':'')}}
  if(!me)return;const mi=G.players.indexOf(me);const ko=(G.cfko||[])[mi]||0;if(me._cfk==null)me._cfk=ko;
  if(ko>me._cfk){me._cfk=ko;const c=CAMPFIRES.find(c=>c.id===(G.cfkoT||[])[mi]);if(c){me.x=c.x+30;me.y=c.y+30;me._sx=null;me.vx=me.vy=0;updateCam(0,true);toast('焚き火まで戻った（持ち物は無事）','gold',true)}}}
// ---- never let a knockback / dodge / blast carry a player through dungeon walls (it used to drop you into the void between dungeon rooms)
function dgWallsAt(x,y){if(x>ABX)return abyWalls();const D=dgAt(x,y);if(!D)return null;const W=D.walls.slice();if(D.id==='cave'&&typeof caveDoorOpen==='function'&&!caveDoorOpen())W.push(VAULT_DOOR);return W}
function wallGuard(p){if(!isRPG()||!p)return;if(p._sx==null||p.down>0&&p._sx==null){p._sx=p.x;p._sy=p.y;return}
  const sx=p._sx,sy=p._sy,dx=p.x-sx,dy=p.y-sy,L=Math.hypot(dx,dy);
  if(L>400||L<.5){p._sx=p.x;p._sy=p.y;return} // real teleports (enter/exit/rescue) are long jumps
  const W=dgWallsAt(sx,sy);
  if(W){const n=Math.ceil(L/4);let lx=sx,ly=sy,hit=false;
    for(let i=1;i<=n;i++){const x=sx+dx*i/n,y=sy+dy*i/n;if(W.some(w=>x>w[0]&&x<w[2]&&y>w[1]&&y<w[3])){hit=true;break}lx=x;ly=y}
    const inS=(sx>ABX)||dgAt(sx,sy),inE=(p.x>ABX)===(sx>ABX)&&(sx>ABX||dgAt(p.x,p.y)===dgAt(sx,sy));
    if(hit||!inE){p.x=lx;p.y=ly;if(p.dash)p.dash=null;p.vx*=.2;p.vy*=.2;if(!p._wgT||performance.now()-p._wgT>3000){p._wgT=performance.now();plog('wallGuard kept p'+G.players.indexOf(p)+' inside')}}}
  p._sx=p.x;p._sy=p.y}
