// ================================================================ rank-gated world (story mode): big trees, armored beasts, the big fish hole
const BIGHOLE={x:2240,y:1660};
const UNL={cook:[[1,'狩人のシチュー・砂漠の塩焼きを作れる'],[3,'ごちそうプレートを作れる']],wood:[[2,'大きな古木（古木の芯材）を切れる'],[3,'氷結樹（氷結木材）を切れる'],[5,'精霊の大樹（精霊の枝）を切れる']],hunt:[[2,'鋼角のヘラジカに攻撃が通る'],[3,'氷の魔獣に攻撃が通る'],[4,'雪原の覇者に攻撃が通る']],fish:[[2,'氷の湖の“ぬしの穴”で大物が釣れる']],mine:[[2,'氷晶の結晶を掘れる'],[4,'星の結晶を掘れる']],smith:[[1,'鉄の斧・鉄の鎧を鍛えられる'],[2,'氷晶の剣を鍛えられる'],[3,'星のお守りを鍛えられる'],[4,'星の大剣を鍛えられる']],craft:[[1,'古木の大弓・古木の盾を作れる'],[2,'氷結樹の杖を作れる'],[3,'氷結の鎧・精霊のお守りを作れる'],[4,'精霊の弓を作れる']]};
const RTK={old:{mat:'core',n:'大きな古木',rq:2,hp:8,h:240,col:null,em:null,cash:40,item:null},ice:{mat:'icew',n:'氷結樹',rq:3,hp:12,h:250,col:'#bfe9ff',em:'#4fb8ff',cash:150,item:'c_icegem'},spirit:{mat:'spirit',n:'精霊の大樹',rq:5,hp:20,h:340,col:'#ffe9a8',em:'#ffc629',cash:500,item:'c_spirit'}};
const RTREES_SNOW=[['old',700,480],['old',1660,470],['old',1000,260],['old',560,1480],['old',1850,230],['ice',400,300],['ice',2050,520],['ice',300,1080],['spirit',180,1650]];
const RB_SNOW=[{mat:'steel',n:'鋼角のヘラジカ',rq:2,bt:'charge',hpm:2.5,x:820,y:250,rw:{cash:150,xp:30,item:'a_steel',ic:.5}},{mat:'steel',n:'鋼角のヘラジカ',rq:2,bt:'charge',hpm:2.5,x:1880,y:330,rw:{cash:150,xp:30,item:'a_steel',ic:.5}},
  {mat:'fang',n:'氷の魔獣',rq:3,bt:'frost',hpm:3.5,x:250,y:1260,rw:{cash:300,xp:60,item:'w_frost',ic:.6}},{mat:'horn',n:'雪原の覇者',rq:4,bt:'king',hpm:5,x:1260,y:210,rw:{cash:600,xp:120,item:'w_king',ic:1}}];
const RB_DES=[{mat:'steel',n:'鋼殻の大サソリ',rq:2,bt:'charge',hpm:2.5,x:620,y:240,rw:{cash:200,xp:40,item:'a_scorp',ic:.6}},{mat:'fang',n:'砂嵐の化身',rq:3,bt:'queen',hpm:3.5,x:1900,y:330,rw:{cash:400,xp:80,item:'w_frost',ic:.5}}];
const rbList=()=>DES()?RB_DES:RB_SNOW;
function rtInit(){Object.assign(RTK,RTK_MINE);if(G.rtrees)return;G.rtrees=DES()?[]:RTREES_SNOW.concat(NODES_SNOW).map(([k,x,y])=>({k,x,y,alive:true,hp:RTK[k].hp,rt:0,zone:(inZone(x,y)||{}).id||null}))}
function updateRankObj(dt){rtInit();if(!isRPG())return;
  for(const t of G.rtrees){const K=RTK[t.k];if(!t.alive){t.rt-=dt;if(t.rt<=0){t.alive=true;t.hp=K.hp}continue}if(t.zone&&!G.zones[t.zone])continue;
    for(const p of G.players){if(p.down>0||p.riding||dist(p.x,p.y,t.x,t.y)>72)continue;
      const lf=K.life||'wood';if(lifeRank(p,lf)<K.rq){if(!p._tk||G.t-p._tk>2){p._tk=G.t;float(t.x,t.y,120,`${LIFE[lf].n}「${LR[K.rq].n}」で${lf==='mine'?'掘れる':'切れる'}`,'red')}continue}
      if(lf==='wood'&&p.bag.length>=cap(p))continue;p.rtT=(p.rtT||0)+dt;if(p.rtT<.4/lifeB(p,lf,lf==='mine'?.08:.07))continue;p.rtT=0;t.hp--;t.shake=.3;if(lf==='mine'){addMat(p,K.mat,1);cnt(p,K.mat);lifeXp(p,'mine',2)}else{give(p,'log',1);lifeXp(p,'wood',1)}SFX.chop();burst(t.x,t.y,30,5,{c:['#c9955b','#e7c08e','#ffffff'],s0:40,s1:120,u0:60,u1:180,l0:.3,l1:.6,r0:3,r1:6});
      if(t.hp<=0){t.alive=false;t.rt=lf==='mine'?100:150;if(lf==='mine'){addMat(p,K.mat,1);cnt(p,K.mat);lifeXp(p,'mine',5)}else{give(p,'log',4);addMat(p,K.mat,t.k==='spirit'?1:2);lifeXp(p,'wood',6);cnt(p,'rt_'+t.k)}const v=Math.round(K.cash*(1+G.day*.05));G.cash+=v;G.earned+=v;gainRX(p,K.rq*10);if(K.item&&Math.random()<.5)giveItem(p,K.item);
        banner(lf==='mine'?`${K.n}を掘りつくした！`:`${K.n}を切りたおした！`,`+$${v}${lf==='mine'?'':'・薪たくさん'}`,'','r-SSR');SFX.ssr();G.shake=12;burst(t.x,t.y,60,40,{c:[K.em||'#c9955b','#ffffff','#ffe07a'],s0:80,s1:260,u0:150,u1:360,l0:.7,l1:1.3,add:!!K.em,r0:5,r1:10})}}}
  const L=rbList();G.rbT=G.rbT||L.map(()=>8);L.forEach((R,i)=>{if(G.bears.some(b=>b.rbi===i&&!b.dead))return;G.rbT[i]-=dt;if(G.rbT[i]>0)return;const z=R.y<690?null:DES()?null:'C';if(z&&!G.zones[z])return;
    const b=spawnBoss(R.bt,true);b.rbi=i;b.rq=R.rq;b.home={x:R.x,y:R.y};b.zone=R.y<690?'A':'C';b.x=R.x;b.y=R.y;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*R.hpm);G.rbT[i]=180})}
function rbKilled(b,p){const R=rbList()[b.rbi];if(!R)return;if(R.mat)addMat(p,R.mat,R.rq>=4?1:2);const v=Math.round(R.rw.cash*(1+G.day*.05));G.cash+=v;G.earned+=v;gainRX(p,R.rw.xp);lifeXp(p,'hunt',12);if(R.rw.item&&Math.random()<R.rw.ic)giveItem(p,R.rw.item);
  setTimeout(()=>{if(running)banner(`${R.n}をたおした！`,`+$${v}・EXP+${R.rw.xp}`,'しばらくすると、また現れる','r-SSR')},700)}
function mkRankTree(k){const K=RTK[k],g=new T.Group();let tr;if(K.life==='mine')return mkNode(k);
  if(KK&&KK.nat&&KK.nat.pine5){tr=KK.nat.pine5.clone(true);tr.scale.setScalar(K.h/(KK.natH.pine5||1));tr.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.isSkinnedMesh)o.material.skinning=true;if(K.col)o.material.color.lerp(lin(K.col),.55);if(K.em){(o.material.emissive&&o.material.emissive.set(lin(K.em)));o.material.emissiveIntensity=.35}o.castShadow=true}})}
  else{tr=new T.Group();tr.add(at(cyl(10,14,K.h*.3,std('#6e4524'),8),0,K.h*.15,0),at(cone(K.h*.3,K.h*.8,std(K.col),8),0,K.h*.6,0))}
  g.add(tr);g.userData.tr=tr;const ring=M_(new T.RingGeometry(58,66,40),new T.MeshBasicMaterial({color:lin(K.em||'#8a5a30'),transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1.4;g.add(ring);
  if(k==='spirit')for(let i=0;i<6;i++){const o=M_(new T.SphereGeometry(5,8,6),glow('#ffe38a',2.4),false);o.userData.a=i/6*TAU;g.add(o);(g.userData.orbs=g.userData.orbs||[]).push(o)}
  if(k==='ice')for(let i=0;i<5;i++)g.add(at(rot(cone(5,22,glow('#bfe9ff',1.8),5,false),0,0,rnd(-.4,.4)),rnd(-40,40),rnd(4,10),rnd(-40,40)));
  const stump=at(cyl(18,22,16,std('#6e4524',{map:TEX.bark}),10),0,8,0);stump.visible=false;g.add(stump);g.userData.stump=stump;return g}
let _rfT=performance.now();
function rankFx(){if(!G||!running)return;rtInit();const now=performance.now(),dt=Math.min(.1,(now-_rfT)/1000);_rfT=now;const on=isRPG();
  if(!G.rtV){G.rtV=G.rtrees.map(t=>{const g=mkRankTree(t.k);g.position.set(t.x,0,t.y);g.visible=false;world.add(g);return g})}
  const me=G.players[G.me]||G.players[0];
  G.rtrees.forEach((t,i)=>{const g=G.rtV[i];g.visible=on;if(!on)return;g.userData.tr.visible=t.alive;g.userData.stump.visible=!t.alive;t.shake=Math.max(0,(t.shake||0)-dt);g.userData.tr.rotation.z=Math.sin(now/40)*t.shake*.15;
    if(g.userData.orbs)g.userData.orbs.forEach((o,j)=>{const a=o.userData.a+now/1400;o.position.set(Math.cos(a)*60,90+Math.sin(now/500+j)*20,Math.sin(a)*60);o.visible=t.alive});
    if(me&&t.alive&&dist(me.x,me.y,t.x,t.y)<320){const K=RTK[t.k],lf=K.life||'wood',ok=lifeRank(me,lf)>=K.rq;label(t.x,t.y,lf==='mine'?(ok?45:55):(ok?60:70),`<b>${K.n}</b><br><small>${ok?`近づくと${lf==='mine'?'掘れる':'切れる'}（${t.hp}/${K.hp}）`:`🔒 ${LIFE[lf].n}「${LR[K.rq].n}」が必要`}</small>`,ok?'':'note')}});
  const h=G.holes.find(q=>q.rq);if(h&&me&&on&&dist(me.x,me.y,h.x,h.y)<260){const ok=lifeRank(me,'fish')>=h.rq;label(h.x,h.y,50,`<b>ぬしの穴</b><br><small>${ok?'大物が釣れる！':`🔒 釣り人「${LR[h.rq].n}」で釣れる`}</small>`,ok?'':'note')}}

