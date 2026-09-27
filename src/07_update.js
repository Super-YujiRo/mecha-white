// ================================================================ core update
function update(dt){
  G.t+=dt;const nd=1+Math.floor(G.t/G.DAY);if(nd!==G.day){G.day=nd;dailyUpkeep();snapSave()}
  const night=isNight();const waveDay=waveDayN(G.day);
  if(waveDay&&!night&&((G.t%G.DAY)/G.DAY)>.6&&G.waveWarned!==G.day){G.waveWarned=G.day;banner('今夜',DES()?'大熱波が来る！':'大寒波が来る！',DES()?'井戸の水をためておけ（水の減りと渇きが倍）':'燃料をためておけ（燃料の減りと寒さが倍）','cold');SFX.wave()}
  G.wave=waveDay&&night;
  G.wind=Math.sin(G.t*.3)*.5+Math.sin(G.t*.11)*.5+(G.wave?1.2:0);
  const adv=ADV(),R=adv?420:heatR();G.onPads=new Set();tickCombo(dt);tickChests(dt);
  for(const p of G.players){const px=p.x,py=p.y;if(p.remote){followNet(p,dt);continue}const iv=p.down>0?{x:0,y:0}:inputVec(p.id),sp0=195*G.pm.speed*(p.riding?1.8:1)*(1+eqv(p,'spd'));p.vx=lerp(p.vx,iv.x*sp0,Math.min(1,dt*12));p.vy=lerp(p.vy,iv.y*sp0,Math.min(1,dt*12));
    p.x=clamp(p.x+p.vx*dt,30,WORLD-30);p.y=clamp(p.y+p.vy*dt,30,WORLD-30);const sp=Math.hypot(p.vx,p.vy);p.moving=sp>20;if(p.moving){p.step+=dt*sp*.06;p.dirT=Math.atan2(p.vx,p.vy);if(Math.random()<dt*6)puff(p.x-p.vx*.05,p.y-p.vy*.05,2,{r:7,life:.6,a:.7,vy:10,grow:1})}
    fenceCollide(p,px,py);solids(p,12);for(const t of G.trees)if(t.alive&&t.fall<=0&&Math.abs(t.x-p.x)<30&&Math.abs(t.y-p.y)<30)pushCircle(p,t.x,t.y,18*t.s);jumpTick(p,dt);
    p.bb=lerp(p.bb,0,dt*8);p.flash=Math.max(0,p.flash-dt);p.hurt=Math.max(0,p.hurt-dt);p.inv=Math.max(0,p.inv-dt)}
  if(G.players.length>1&&NET.mode==='solo'){const [a,b]=G.players;for(const [p,o] of [[a,b],[b,a]]){p.x=clamp(p.x,o.x-640,o.x+640);p.y=clamp(p.y,o.y-640,o.y+640)}}
  for(const p of G.players)playerActions(p,dt,R);
  for(const pad of G.pads)pad.pulse=Math.max(0,pad.pulse-dt*2);
  // furnace
  if(adv)G.fuel=100;const burn=adv?0:(.6+G.level*.14+G.day*.05)*(night?1.4:1)*(G.wave?1.8:1)*G.pm.burn*(wxIs('snap')?1.3:1)*(DES()&&!isNight()?1.25:1)*DM().burn*(1+(YR()-1)*.12)*(1+.05*((G.drifts||[]).length));G.fuel=Math.max(0,G.fuel-burn*dt);
  if(G.fuel<20&&!G.lowWarned){G.lowWarned=true;toast('かまどの燃料が少ない！ 薪をくべろ','cold');SFX.bad()}if(G.fuel>35)G.lowWarned=false;
  if(G.fuel<=0&&!G.outWarned){G.outWarned=true;banner(DES()?'井戸が干上がった！':'かまどの火が消えた！',DES()?'町の人が倒れていく':'町の人が凍っていく',DES()?'湧き水をくんで井戸を満たせ。倒れた町人が5人でゲームオーバー':'薪をくべて火を戻せ。凍った町人が5人でゲームオーバー','cold');SFX.wave()}if(G.fuel>5)G.outWarned=false;
  // stations frozen state
  for(const id in G.stations){const st=G.stations[id];const d=dist(st.def.conv.x,st.def.conv.y,CX,CY);const fz=st.open&&d>R;if(fz&&!st.frozen){toast(`${st.def.name}が凍った！ かまどを強化・燃料を`,'cold')}st.frozen=fz}
  updateTrees(dt);updateBears(dt);updatePickups(dt);updateSecrets(dt);
  if(!adv){updateWoodpile(dt);updateRaid(dt);tickTowers(dt,true);updateHauls(dt);updateWorkers(dt);updateStations(dt);updateSurvivors(dt,R);updateMilitia(dt);updateSpa(dt);updateHoles(dt);updateRescue(dt);updateTax(dt);updateRoad(dt);updateCaravan(dt);checkMission(dt);updateDrifts(dt);updateFireside(dt)}
  updateStory(dt);updateCraft(dt);updateQuests(dt);updateRankObj(dt);updateCave(dt);updateChallenges();G.achT-=dt;if(G.achT<=0){G.achT=.5;checkAch()}
  if(G.pendingLv>0&&!G.paused&&!adv)openPerk();
  if(G.frozen>=5&&!G.endless&&!adv)endGame(false,'freeze');
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
  const fd=dist(p.x,p.y,CX,CY),inHeat=fd<R||spaWarm(p.x,p.y)||caveWarm(p.x,p.y)||advWarm(p.x,p.y);
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
  p.shooting=null;p.chopping=null;const rpgA=isRPG();
  if(rpgA){if(!p.remote&&p===(G.players[G.me]||G.players[0]))p.atkHold=INP.atk;p.skCd=Math.max(0,(p.skCd||0)-dt);p.skillT=Math.max(0,(p.skillT||0)-dt);if(p.skillReq){p.skillReq=false;if(p.skCd<=0&&!(p.down>0)&&!p.riding)doSkill(p)}}
  const cl=clsOf(p),melee=cl.rng<130;let tgt=null,td=cl.rng+p.lv.gun*(melee?4:15);for(const b of G.bears){if(b.dead)continue;const d=dist(p.x,p.y,b.x,b.y);if(d<td){td=d;tgt=b}}
  const gunInt=.5*cl.rate*Math.pow(.86,p.lv.gun)*G.pm.rate*(G.feverT>0?.5:1);
  if(rpgA){if(!p.atkHold)tgt=null;else if(!p._ah)p.actT=99;p._ah=!!p.atkHold}
  if(tgt){p.shooting=tgt;p.aimDir=Math.atan2(tgt.x-p.x,tgt.y-p.y);p.actT+=dt;if(p.actT>=gunInt){p.actT=0;p.flash=.07;let dmg=(1+p.lv.gun*.5+G.pm.dmg)*cl.dmg*(G.feverT>0?2:1)*lifeB(p,'hunt',.06)*(1+eqv(p,'atk')+(isRPG()?(rlv(p)-1)*.05:0));
    const o=G.players.length>1&&G.players.find(q=>q!==p&&q.shooting===tgt);if(o){const a1=Math.atan2(p.x-tgt.x,p.y-tgt.y),a2=Math.atan2(o.x-tgt.x,o.y-tgt.y);if(Math.abs(Math.atan2(Math.sin(a1-a2),Math.cos(a1-a2)))>1.6){dmg*=2;if(!(tgt.pinT>0)){tgt.pinT=1.5;float(tgt.x,tgt.y,120,'挟み撃ち！ ダメージ2倍','gold',true);SFX.combo(8)}}}
    if(cl.cleave){for(const b of G.bears){if(b.dead||b===tgt)continue;if(dist(p.x,p.y,b.x,b.y)<cl.rng+12){shoot(p,b,dmg,true,cl.fx);if(cl.stun)b.atkCd=Math.max(b.atkCd,cl.stun)}}}
    if(cl.stun)tgt.atkCd=Math.max(tgt.atkCd||0,cl.stun);if(cl.heal)p.hp=Math.min(100,p.hp+cl.heal);
    if(cl.splash){for(const b of G.bears){if(b.dead||b===tgt)continue;if(dist(tgt.x,tgt.y,b.x,b.y)<cl.splash)shoot(tgt,b,dmg*.6,true,'none')}}
    shoot(p,tgt,dmg,true,cl.fx)}}
  else{let tree=null,tdd=48;if(p.bag.length<cap(p)&&!p.riding&&!ADV())for(const t of G.trees){if(!t.alive||t.fall>0||(t.zone&&!G.zones[t.zone]))continue;const d=dist(p.x,p.y,t.x,t.y);if(d<tdd){tdd=d;tree=t}}
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
// ---- jumping (story mode, Space)
const JMP={req:false};
function jumpTick(p,dt){if(p===(G.players[G.me]||G.players[0])&&JMP.req){JMP.req=false;if(isRPG()&&!(p.jz>0)&&!(p.down>0)&&!p.riding&&!p.fishing){p.jv=330;p.jz=.01;SFX.coin&&SFX.coin(1)}}
  if(p.jz>0){p.jv-=1100*dt;p.jz+=p.jv*dt;if(p.jz<=0){p.jz=0;p.jv=0;burst(p.x,p.y,6,2,{c:DES()?['#e8cf9a','#d9b47a']:['#ffffff','#dfe9f2'],s0:30,s1:80,u0:10,u1:40,l0:.25,l1:.45,r0:3,r1:6})}}}
// ---- story-mode combat: left click attacks, right click (or R) fires the class skill
const SKILLS={Rogue_Hooded:{n:'拡散射撃',cd:7},Rogue:{n:'貫通の一矢',cd:8},Knight:{n:'シールドバッシュ',cd:7},Barbarian:{n:'大回転斬り',cd:8},Mage:{n:'氷の大爆発',cd:9}};
const clsKey=p=>{const k=G&&G.charOf&&G.charOf[G.players.indexOf(p)];return SKILLS[k]?k:'Rogue_Hooded'};
function skillPress(){if(!running||!isRPG()||G.paused)return;if(NET.mode==='guest'){NET.skN=(NET.skN||0)+1;const sk=SKILLS[clsKey(G.players[G.me])];if(!(NET.skAt>0)||performance.now()-NET.skAt>sk.cd*1000)NET.skAt=performance.now();return}const me=G.players[G.me]||G.players[0];if(me)me.skillReq=true}
function doSkill(p){const key=clsKey(p),S=SKILLS[key],cl=CLS[key];const base=(1+p.lv.gun*.5+G.pm.dmg)*cl.dmg*lifeB(p,'hunt',.06)*(1+eqv(p,'atk')+(rlv(p)-1)*.05);
  const near=r=>G.bears.filter(b=>!b.dead&&!b.hide&&dist(p.x,p.y,b.x,b.y)<r);const nearest=r=>{let t=null,d0=r;for(const b of G.bears){if(b.dead||b.hide)continue;const d=dist(p.x,p.y,b.x,b.y);if(d<d0){d0=d;t=b}}return t};
  const kb=(b,x,y,f)=>{const a=Math.atan2(b.x-x,b.y-y);b.x+=Math.sin(a)*f;b.y+=Math.cos(a)*f};let hit=0;
  if(key==='Rogue_Hooded'){for(const b of near(cl.rng*1.5)){shoot(p,b,base*1.6,true,'bolt');hit++}}
  else if(key==='Rogue'){const t=nearest(cl.rng*1.7);if(t){p.aimDir=Math.atan2(t.x-p.x,t.y-p.y);shoot(p,t,base*5,true,'bolt');if(!t.dead){kb(t,p.x,p.y,70);t.atkCd=Math.max(t.atkCd||0,1.2)}hit=1}}
  else if(key==='Knight'){const a=p.dir;for(let i=0;i<6;i++){const ox=p.x,oy=p.y;p.x=clamp(p.x+Math.sin(a)*20,30,WORLD-30);p.y=clamp(p.y+Math.cos(a)*20,30,WORLD-30);fenceCollide(p,ox,oy);solids(p,12);burst(p.x,p.y,4,6,{c:['#ffffff','#cfe3f0'],s0:20,s1:60,u0:20,u1:60,l0:.2,l1:.4,r0:3,r1:6})}
    for(const b of near(100)){shoot(p,b,base*3,true,'slash');if(!b.dead){b.atkCd=Math.max(b.atkCd||0,2);kb(b,p.x,p.y,60)}hit++}}
  else if(key==='Barbarian'){for(const b of near(170)){shoot(p,b,base*3,true,'spin');if(!b.dead)kb(b,p.x,p.y,45);hit++}burst(p.x,p.y,30,12,{c:['#ffffff','#ffd6a0'],s0:120,s1:260,u0:20,u1:80,l0:.3,l1:.5,r0:4,r1:8})}
  else if(key==='Mage'){const t=nearest(cl.rng*1.4);const cx=t?t.x:p.x+Math.sin(p.dir)*150,cy=t?t.y:p.y+Math.cos(p.dir)*150;if(t)p.aimDir=Math.atan2(t.x-p.x,t.y-p.y);
    burst(cx,cy,50,20,{c:['#bfe9ff','#7fd4ff','#ffffff'],s0:80,s1:320,u0:80,u1:260,l0:.5,l1:1,r0:5,r1:11,add:true});for(const b of G.bears){if(b.dead||b.hide||dist(cx,cy,b.x,b.y)>160)continue;shoot(p,b,base*2.6,true,'none');if(!b.dead)b.trapT=3;hit++}}
  p.skCd=S.cd;p.skillT=.5;G.shake=Math.max(G.shake,hit?9:4);SFX.rare&&SFX.rare();float(p.x,p.y,110,`${S.n}！${hit?'':'（空振り）'}`,'gold',true)}
function shoot(sh,b,dmg,isPlayer,fx){const a=Math.atan2(b.x-sh.x,b.y-sh.y);const mx=sh.x+Math.sin(a)*28,my=sh.y+Math.cos(a)*28;fx=fx||'bolt';
  if(fx==='bolt'){for(let i=0;i<7;i++){const k=i/7;psA.emit({x:lerp(mx,b.x,k),y:lerp(24,22,k),z:lerp(my,b.y,k),vx:0,vy:0,vz:0,g:0,life:.07+k*.05,max:.12,r:5,c:C('#fff2b0'),air:true,fade:.1})}}
  else if(fx==='magic'){for(let i=0;i<10;i++){const k=i/10;psA.emit({x:lerp(mx,b.x,k),y:lerp(30,22,k)+Math.sin(k*9)*4,z:lerp(my,b.y,k),vx:0,vy:0,vz:0,g:0,life:.12+k*.08,max:.2,r:7,c:C(i%2?'#c9a2ff':'#7fe8ff'),air:true,fade:.1})}burst(b.x,b.y,22,14,{c:['#c9a2ff','#7fe8ff','#ffffff'],s0:60,s1:180,u0:60,u1:180,l0:.3,l1:.6,r0:4,r1:8,add:true})}
  else if(fx==='slash'||fx==='spin'){const n=fx==='spin'?12:7;for(let i=0;i<n;i++){const aa=a+(fx==='spin'?i/n*TAU:(i/n-.5)*1.6),rr=fx==='spin'?60:34;psA.emit({x:sh.x+Math.sin(aa)*rr,y:22,z:sh.y+Math.cos(aa)*rr,vx:Math.sin(aa)*40,vy:0,vz:Math.cos(aa)*40,g:0,life:.16,max:.16,r:6,c:C('#ffffff'),air:true,fade:.1})}const k2=dist(sh.x,sh.y,b.x,b.y)||1;b.x+=(b.x-sh.x)/k2*10;b.y+=(b.y-sh.y)/k2*10;if(isPlayer)SFX.chop()}
  if(b.hide)return;if(b.rq&&isPlayer&&G.players.includes(sh)&&isRPG()&&lifeRank(sh,'hunt')<b.rq){b.hit=.05;if(!b._lk||G.t-b._lk>1.4){b._lk=G.t;float(b.x,b.y,120,`かたい！ 狩人「${LR[b.rq].n}」が必要`,'red')}return}b.hp-=dmg*(b.ph==='st'?2:1);b.hit=.14;if(isPlayer&&G.players.includes(sh)){b.state='chase';b.target=sh;b.roar=.7;if(fx==='bolt'||fx==='magic')SFX.shot()}
  burst(b.x,b.y,24,4,{c:['#ffffff','#ffd6d6'],s0:20,s1:70,u0:40,u1:120,l0:.2,l1:.4,r0:3,r1:5});if(b.hp<=0){if(isPlayer&&G.players.includes(sh)){lifeXp(sh,'hunt',b.kind==='boss'?10:b.kind==='big'?4:2);cnt(sh,'kill');if(b.kind==='boss')cnt(sh,'boss');if(b.raid)cnt(sh,'raidk');cnt(sh,'bk_'+bkId(b));if(b.dg&&isRPG())dgKill(b,sh)}if(b.rbi!=null)rbKilled(b,sh);gainRX(sh,b.kind==='boss'?25:b.kind==='big'?6:3);if(isRPG()&&b.kind==='boss'&&!b.qid&&Math.random()<.45)giveItem(sh,Math.random()<.5?'w_bear':'a_bear');killBear(b,isPlayer)}}
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
        if(d<r+6&&b.atkCd<=0&&t.inv<=0&&!(t.jz>22)){b.atkCd=1.2;const dmg=Math.round((b.kind==='boss'?35:b.kind==='big'?25:16)*armorOf(t)*DM().atk*(1+(YR()-1)*.15));t.hp-=dmg;hitLoss(t);t.hurt=.35;t.inv=.5;const k=d||1;t.x+=(t.x-b.x)/k*44;t.y+=(t.y-b.y)/k*44;G.shake=11;float(t.x,t.y,60,`-${dmg}`,'red');b.swipe=.3;burst(t.x,t.y,24,10,{c:['#ff9a9a','#ffffff'],s0:40,s1:130,l0:.3,l1:.6})}}}
    else{const ag=G.players.find(p=>!(p.down>0)&&!p.inHeat&&dist(p.x,p.y,b.x,b.y)<(b.kind==='normal'?110:160));if(ag){b.state='chase';b.target=ag;b.roar=.6}b.wT-=dt;if(b.wT<=0){b.wT=rnd(1.5,4);b.wdir=rnd(0,TAU);b.idle=Math.random()<.35}if(!b.idle){b.x+=Math.sin(b.wdir)*28*dt;b.y+=Math.cos(b.wdir)*28*dt;b.dirT=b.wdir;b.step+=dt*4.5;b.moving=true}}
    if(b.home&&b.state!=='chase'&&dist(b.x,b.y,b.home.x,b.home.y)>120){b.wdir=Math.atan2(b.home.x-b.x,b.home.y-b.y);b.idle=false}
    if(b.guardOf&&b.state!=='chase'){const R=G.rescue;if(R&&R.id===b.guardOf&&dist(b.x,b.y,R.x,R.y)>150){b.wdir=Math.atan2(R.x-b.x,R.y-b.y);b.idle=false}}
    const rect=b.zone==='K'?(b.dg?b.dg.box:CAVE_BOX):b.zone==='C'?ZONES[1].rect:HUNT_A;if(b.state!=='chase'&&!b.guardOf){if(b.x<rect[0]||b.x>rect[2]||b.y<rect[1]||b.y>rect[3]){b.wdir=Math.atan2((rect[0]+rect[2])/2-b.x,(rect[1]+rect[3])/2-b.y);b.idle=false}}
    b.x=clamp(b.x,40,WORLD-40);b.y=clamp(b.y,40,WORLD-40);
    const dc=dist(b.x,b.y,CX,CY);if(dc<FR+45){b.x=CX+(b.x-CX)/dc*(FR+45);b.y=CY+(b.y-CY)/dc*(FR+45)}
    for(const z of ZONES)if(!G.zones[z.id]&&z.id!=='C'||(z.id==='C'&&!G.zones.C)){const [x0,y0,x1,y1]=z.rect;pushRect(b,x0,y0,x1,y1,10)}
    if(b.y>1580&&b.zone!=='K')b.y=1580;if(b.zone==='K')caveWalls(b,16);else if(isRPG()&&dgAt(b.x,b.y))caveWalls(b,16);
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
  if(g.t==='m'){if(!(G.monHP>0)){b.goal=null;return true}const mx=G.monV.position.x,my=G.monV.position.z,d=dist(b.x,b.y,mx,my);if(d>40+52*G.monV.scale.x){const n=nav(b,mx,my);moveTo(b,n.x,n.y,sp,dt);return true}
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
  if(t&&b.bt&&bossAct(b,dt,t)){}else if(t){const d=dist(b.x,b.y,t.x,t.y),r=30;if(d>r)moveTo(b,t.x,t.y,sp,dt);if(d<r+6&&b.atkCd<=0&&t.inv<=0&&!(t.jz>22))bearSwipe(b,t,d)}
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
  G.cash+=carry;updateCam(0,true);hudInit();if(gameMode!=='story')banner('砂漠の町に着いた',`一文無しからの再出発 ・ ★+${gain}`,'昼は灼熱で水分が減る。湧き水をくんで井戸へ。稼ぎはキャラバンとの取引だけ','r-SSR');SFX.ssr()}
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

