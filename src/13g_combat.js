// ================================================================ feel & depth: dodge roll, 3-hit combo + hitstop, loot stars, twin plates, hidden chests, golden beasts, friendship
// ---- weapon types per class: each class only uses its own kind of weapon
const WTN={bow:'弓',staff:'杖・槍',axe:'斧・ハンマー',blade:'剣',fist:'ナックル'};
function wType(id){const n=(ITEMS[id]&&ITEMS[id].n)||'';return /弓/.test(n)?'bow':/杖|槍/.test(n)?'staff':/斧|ハンマー|槌/.test(n)?'axe':/ナックル/.test(n)?'fist':'blade'}
const CLS_W={Rogue_Hooded:['bow'],Rogue:['bow'],Knight:['blade'],Barbarian:['axe','fist'],Mage:['staff']};
function classOK(p,id){const it=ITEMS[id];if(!it||it.s!=='w'||!isRPG())return true;return(CLS_W[clsKey(p)]||['blade']).includes(wType(id))}
// ---- hitstop: the whole world freezes for a heartbeat when a big hit lands
const HS={t:0};function hitstop(s){HS.t=Math.max(HS.t,s)}
function hsDt(dt){if(HS.t>0){HS.t-=dt;return dt*.08}return dt}
// ---- dodge roll (Shift): a quick dash with a moment of invincibility
const DODGE={req:false};
addEventListener('keydown',e=>{if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat&&running&&isRPG()&&!DLG.open){DODGE.req=true;if(NET.mode==='guest')NET.dgN=(NET.dgN||0)+1}});
function dashTick(p,dt){const local=p===(G.players[G.me]||G.players[0])&&!p.remote;p.dgCd=Math.max(0,(p.dgCd||0)-dt);
  if(local&&DODGE.req){DODGE.req=false;if(isRPG()&&p.dgCd<=0&&!(p.down>0)&&!p.riding&&!p.fishing){const iv=inputVec(0);let a=Math.hypot(iv.x,iv.y)>.2?Math.atan2(iv.x,iv.y):p.dir||0;p.dash={t:.26,vx:Math.sin(a)*470,vy:Math.cos(a)*470};p.dirT=a;p.dir=a;p.inv=Math.max(p.inv||0,.42);p.dgCd=.75;burst(p.x,p.y,8,4,{c:DES()?['#e8cf9a']:['#ffffff','#dfe9f2'],s0:30,s1:90,u0:10,u1:50,l0:.2,l1:.4})}}
  if(p.dash&&p.dash.t>0){p.dash.t-=dt;p.x=clX(p.x+p.dash.vx*dt,30);p.y=clY(p.y+p.dash.vy*dt,30,p.x);if(p.dash.t<=0)p.dash=null}}
// ---- combo: every third hit in a row is a finisher (1.8x, bigger effect, hitstop)
function comboHit(p,tgt,dmg,melee){if(!isRPG())return dmg;p.cmb=(p.cmbT>0?(p.cmb||0)+1:1);p.cmbT=1.1;
  if(p.cmb%3===0){dmg*=1.8;hitstop(.085);G.shake=Math.max(G.shake,6);float(tgt.x,tgt.y,110,'フィニッシュ！','gold',true);burst(tgt.x,tgt.y,24,30,{c:['#ffe07a','#ffffff','#ff9a5a'],s0:80,s1:240,u0:80,u1:220,l0:.3,l1:.6,add:true,r0:4,r1:8})}
  else if(melee)hitstop(.03);return dmg}
function comboTick(p,dt){if(p.cmbT>0)p.cmbT-=dt}
// ---- loot stars: the same weapon can drop at ★1〜★3; stars multiply its stats
function rollStar(bonus){const r=Math.random()-(bonus||0);return r<.1?3:r<.4?2:1}
function starOf(p,id){return(p&&p.istar&&p.istar[id])||1}
const starMul=s=>1+.2*(s-1);const starTxt=s=>'★'.repeat(s)+'☆'.repeat(3-s);
function grantStar(p,id,bonus){p.istar=p.istar||{};const s=rollStar(bonus);const old=p.istar[id]||0;if(s>old){p.istar[id]=s;if(old)float(p.x,p.y,150,`${ITEMS[id].n} が ${starTxt(s)} になった！`,'gold',true)}}
// ---- twin plates: two stones that must be pressed at (almost) the same time — easy with a friend, a sprint alone
const TWINS=[{d:'cave',a:{x:2300,y:1900},b:{x:2300,y:2320},c:{x:2210,y:2240},n:'双子の宝箱'},{d:'glacier',a:{x:360,y:2330},b:{x:560,y:1990},c:{x:470,y:2230},n:'双子の宝箱'},{d:'ruin',a:{x:1850,y:2320},b:{x:2320,y:2320},c:{x:2090,y:2300},n:'双子の宝箱'}];
function twinList(){return TWINS.filter(t=>dgMap().some(D=>D.id===t.d&&D.gate()))}
function updateTwins(dt){if(!isRPG())return;G.tw=G.tw||{};for(const T2 of twinList()){const s=G.tw[T2.d]=G.tw[T2.d]||{a:0,b:0,open:0,rt:0};if(s.open){s.rt-=dt;if(s.rt<=0){s.open=0}continue}
    for(const k of ['a','b']){const q=T2[k];if(G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,q.x,q.y)<32))s[k]=G.players.length>1?1.2:3.5;else s[k]=Math.max(0,s[k]-dt)}
    if(s.a>0&&s.b>0){s.open=1;s.rt=G.DAY*2;s.a=s.b=0;const D=DUNGEONS.find(D=>D.id===T2.d);for(const p of G.players){const pool=D.loot[3].concat(D.loot[2]).filter(k=>classOK(p,k));if(!pool.length)continue;const id=pool[Math.floor(Math.random()*pool.length)];giveItem(p,id);grantStar(p,id,.25);addMat(p,D.cmat[2],2)}
      const v=Math.round(300*(1+D.i*.5)*(1+G.day*.05));G.cash+=v;G.earned+=v;banner('双子の宝箱が開いた！',`+$${v}`,G.players.length>1?'息ぴったり！ 2人の装備がもらえた':'ひとりで走りきった！','r-SSR');SFX.ssr&&SFX.ssr();burst(T2.c.x,T2.c.y,50,40,{c:['#ffd23f','#ffffff','#9fe3ff'],s0:80,s1:300,u0:200,u1:450,l0:.7,l1:1.3,add:true})}}}
// ---- hidden chests scattered in the wild (only visible up close)
const HIDDEN={snow:[[420,330],[1760,260],[2250,520],[180,1100],[560,1480],[2280,980],[1600,1640],[860,560],[1980,1720],[300,760]],desert:[[260,300],[2150,300],[1500,1300],[620,1850],[1300,2250],[2250,1150],[900,1000],[1900,1900]]};
function hidLocked(x,y){if(DES())return false;const z=inZone(x,y);return !!(z&&!G.zones[z.id])}
function updateHidden(dt){if(!isRPG())return;const L=HIDDEN[DES()?'desert':'snow'];G.hid=G.hid||{};const H=G.hid[DES()?'d':'s']=G.hid[DES()?'d':'s']||L.map(()=>({open:0,rt:0}));
  L.forEach(([x,y],i)=>{const s=H[i];if(s.open){s.rt-=dt;if(s.rt<=0)s.open=0;return}if(hidLocked(x,y))return;const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,x,y)<40);if(!p){s.t=0;return}s.t=(s.t||0)+dt;if(s.t<.9)return;s.open=1;s.rt=G.DAY*1.5;
    const v=Math.round(rnd(60,160)*(1+G.day*.05));G.cash+=v;G.earned+=v;const mats=DES()?['relic','herb','iron']:['iron','herb','core','icec'];const m=mats[Math.floor(Math.random()*mats.length)];addMat(p,m,2);cnt(p,'chest');
    if(Math.random()<.25){const pool=Object.keys(ITEMS).filter(k=>ITEMS[k].s!=='c'&&!/queen|king|glking|sunspear|starsword|star(staff|axe|bow)/.test(k)&&classOK(p,k));const id=pool[Math.floor(Math.random()*pool.length)];giveItem(p,id);grantStar(p,id,0)}
    banner('隠された宝箱！',`+$${v}`,`${MATS[m]}を見つけた`,'r-SSR');SFX.chest&&SFX.chest();burst(x,y,26,24,{c:['#ffd23f','#ffffff'],s0:60,s1:200,u0:150,u1:300,l0:.6,l1:1,add:true})})}
// ---- golden beasts: a rare shiny enemy wanders the wild some days
function updateGold(dt){if(!isRPG()||ADV()&&false)return;G.goldT=(G.goldT==null?60:G.goldT)-dt;if(G.goldT>0)return;G.goldT=G.DAY*.8;if(G.bears.some(b=>b.gold&&!b.dead)||Math.random()<.4)return;
  const b=spawnBear(DES()||!G.zones.C?'A':'C',true);b.kind='big';b.gold=1;b.nm=DES()?'金色のサソリ':'金色の狼';b.hp=b.max=Math.round(60*DM().hp);b.m.g.traverse(o=>{if(o.isMesh&&o!==b.m.ring&&o.material){o.material=o.material.clone();if(o.isSkinnedMesh)o.material.skinning=true;o.material.color&&o.material.color.set('#ffd23f');o.material.emissive=lin('#a86a00');o.material.emissiveIntensity=.45;o.material.metalness=.6}});b.m.g.scale.multiplyScalar(1.25);
  toast(`${b.nm}が現れた！ 地図の赤い点をさがせ`,'gold')}
function goldKilled(b,p){if(!b.gold||!p||!G.players.includes(p))return;const v=Math.round(400*(1+G.day*.05));G.cash+=v;G.earned+=v;addMat(p,DES()?'relic':'star',DES()?4:1);const pool=['w_icesword','w_iceaxe','w_icestaff','a_icearmor','w_frostbow','c_star','w_sunbow','a_pharaoh'].filter(k=>ITEMS[k]&&classOK(p,k));const id=pool[Math.floor(Math.random()*pool.length)];giveItem(p,id);grantStar(p,id,.3);banner(`${b.nm}をたおした！`,`+$${v}`,'レアな装備を落とした','r-SSR')}
// ---- friendship: chat once a day, give a dish; hearts unlock small thank-you gifts
const AFF_LV=[3,8,15,25];const affLv=n=>AFF_LV.filter(x=>n>=x).length;
function affAct(p,type,id){if(type!=='chat'&&type!=='gift')return false;const S=G.story;if(!S)return true;S.aff=S.aff||{};S.affD=S.affD||{};const before=affLv(S.aff[id]||0);
  if(type==='chat'){if(S.affD[id]===G.day){toast('今日はもうたくさん話した','cold');return true}S.affD[id]=G.day;S.aff[id]=(S.aff[id]||0)+1;float(p.x,p.y,90,`${npcName(id)}となかよし +1`,'gold',true)}
  else{const F=p.food||[];if(!F.length){toast('プレゼントできる料理がない','cold');return true}const k=F.shift();S.aff[id]=(S.aff[id]||0)+3;float(p.x,p.y,90,`${DISH[k].n}をあげた！ なかよし +3`,'gold',true)}
  const after=affLv(S.aff[id]);if(after>before){const v=150*after;G.cash+=v;G.earned+=v;for(const q of G.players)addMat(q,['herb','iron','icec','star'][Math.min(3,after-1)],2);banner(`${npcName(id)}となかよし度 ${'♥'.repeat(after)}`,`お礼に $${v} と素材をもらった`,'話すほど、プレゼントするほど仲良くなれる','r-SSR');SFX.ssr&&SFX.ssr()}return true}
const hearts=id=>{const n=((G.story&&G.story.aff)||{})[id]||0,l=affLv(n);return l?' '+'♥'.repeat(l):''};
// ---- visuals for plates / hidden chests
function extrasFx(){if(!G||!running||!isRPG())return;const me=G.players[G.me]||G.players[0];if(!me)return;
  for(const T2 of twinList()){const s=(G.tw||{})[T2.d]||{};for(const k of ['a','b']){const q=T2[k];if(dist(me.x,me.y,q.x,q.y)<300)label(q.x,q.y,24,`<b>${s.open?'✓':'◎'} 双子の石</b><br><small>${s.open?'開いた':'2つ同時に踏む'}</small>`,s[k]>0?'gold':'')}if(!s.open&&dist(me.x,me.y,T2.c.x,T2.c.y)<300)label(T2.c.x,T2.c.y,50,`<b>${T2.n}</b><br><small>${G.players.length>1?'2人で双子の石を同時に踏め':'石を踏んで3.5秒以内にもう片方へ'}</small>`,'note')}
  const L=HIDDEN[DES()?'desert':'snow'],H=(G.hid||{})[DES()?'d':'s']||[];L.forEach(([x,y],i)=>{if(H[i]&&H[i].open)return;if(hidLocked(x,y))return;const d=dist(me.x,me.y,x,y);if(d<230){if(Math.random()<.15)psA.emit({x:x+rnd(-8,8),y:6,z:y+rnd(-8,8),vx:0,vy:50,vz:0,g:0,life:.6,max:.6,r:4,c:C('#ffe07a'),air:true,fade:.2});if(d<150)label(x,y,24,'<b>✦ 何か光っている</b>','gold')}});
  for(const b of G.bears)if(b.gold&&!b.dead&&dist(me.x,me.y,b.x,b.y)<500)label(b.x,b.y,90,`<b>${b.nm}</b>`,'gold')}
function extrasSnap(){return{tw:G.tw||null,hid:G.hid||null}}
function extrasApply(x){if(!x)return;if(x.tw)G.tw=x.tw;if(x.hid)G.hid=x.hid}
