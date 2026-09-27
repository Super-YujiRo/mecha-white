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
function solids(e,r){pushCircle(e,CX,CY,70);for(const d of G.drifts||[])pushCircle(e,d.x,d.y,20*d.s);if(isRPG())pushCircle(e,WB.x,WB.y,24);caveWalls(e,r);if(G.monV&&G.monV.visible)pushCircle(e,MON.x,MON.y,52*G.monV.scale.x);for(const id in G.stations){const st=G.stations[id];if(!st.open)continue;const s=st.def;pushRect(e,s.conv.x-34,s.conv.y-16,s.conv.x+34,s.conv.y+16,r*.6);pushRect(e,s.counter.x-52,s.counter.y-12,s.counter.x+52,s.counter.y+12,r*.6);pushCircle(e,s.pile.x,s.pile.y,14)}
  if(G.zones.D){pushCircle(e,SPA.boiler.x,SPA.boiler.y,28)}
  for(const z of ZONES)if(!G.zones[z.id]){const [x0,y0,x1,y1]=z.rect;pushRect(e,x0,y0,x1,y1,r)}}
function nav(e,tx,ty){const ia=dist(e.x,e.y,CX,CY)<FR,ib=dist(tx,ty,CX,CY)<FR;if(ia===ib)return{x:tx,y:ty};
  let best=null,bd=1e9;for(const a of GATE_ANG.concat([Math.PI/2])){const gi={x:CX+Math.cos(a)*(FR-40),y:CY+Math.sin(a)*(FR-40)},go={x:CX+Math.cos(a)*(FR+45),y:CY+Math.sin(a)*(FR+45)};const f=ia?gi:go,s=ia?go:gi;const d=dist(e.x,e.y,f.x,f.y)+dist(s.x,s.y,tx,ty);if(d<bd){bd=d;best={f,s}}}
  // once past the inner gate point, keep heading out (no flip-flopping at the gate)
  if(dist(e.x,e.y,best.s.x,best.s.y)<=dist(best.f.x,best.f.y,best.s.x,best.s.y)+3)return best.s;
  return dist(e.x,e.y,best.f.x,best.f.y)>6?best.f:best.s}
function moveTo(e,tx,ty,v,dt){const d=dist(e.x,e.y,tx,ty);if(d>2){const s=Math.min(d,v*dt);e.x+=(tx-e.x)/d*s;e.y+=(ty-e.y)/d*s;e.dirT=Math.atan2(tx-e.x,ty-e.y);e.step+=dt*9;e.moving=true}else e.moving=false;return d}
function turnTo(o,target,dt,k=12){let d=target-o.dir;d=Math.atan2(Math.sin(d),Math.cos(d));o.dir+=d*Math.min(1,dt*k)}

