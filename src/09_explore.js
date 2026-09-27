// ================================================================ flow
function show(el,on){$(el).hidden=!on}







// ================================================================ exploration (story mode): mining, life challenges, the ice cave, the bestiary
const cnt=(p,k,n=1)=>{if(!p||!isRPG())return;p.cnt=p.cnt||{};p.cnt[k]=(p.cnt[k]||0)+n};
const bkId=b=>b.bk?b.bk:b.rbi!=null?'rb'+b.rbi:(b.m&&b.m.key==='Spider')?(b.kind==='boss'?'spq':'sp'):b.bt?b.bt:b.kind;
const BOOK=[['normal','雪オオカミ'],['big','黒オオカミ'],['boss','森の大オオカミ'],['charge','突進ヘラジカ'],['frost','氷息のオオカミ'],['alpha','群れの長'],['king','白き王'],['rb0','鋼角のヘラジカ'],['rb2','氷の魔獣'],['rb3','雪原の覇者'],['sp','洞窟グモ'],['spq','洞窟の女王グモ'],['gl','氷河オオカミ'],['gls','氷河のヘラジカ'],['glb','氷河の主'],['ru','遺跡サソリ'],['rub','砂の王サソリ']];
const RTK_MINE={iron:{life:'mine',mat:'iron',n:'鉄鉱石の岩',rq:0,hp:5,prop:'Mineral',tint:'#8a8f99',h:44,cash:20},icec:{life:'mine',mat:'icec',n:'氷晶の結晶',rq:2,hp:6,prop:'Crystal1',tint:'#bfe9ff',em:'#4fb8ff',h:64,cash:70},star:{life:'mine',mat:'star',n:'星の結晶',rq:4,hp:8,prop:'Crystal3',tint:'#ffe38a',em:'#ffc629',h:74,cash:220}};
const NODES_SNOW=[['iron',1500,640],['iron',900,650],['iron',2120,300],['iron',1845,2130],['iron',2040,2325],['iron',2050,2140],['icec',2160,2300],['icec',2310,2190],['icec',160,900],['icec',230,2230],['icec',540,2020],['star',95,2150],['star',2310,1890]];
function mkNode(k){const K=RTK[k],g=new T.Group();let tr;const P=KK&&KK.prop&&KK.prop[K.prop];
  if(P){tr=P.scene.clone(true);tr.scale.setScalar(K.h/Math.max(.01,P.h));tr.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.lerp(lin(K.tint),.6);if(K.em){o.material.emissive=lin(K.em);o.material.emissiveIntensity=.5}o.castShadow=true}})}
  else{tr=at(M_(new T.OctahedronGeometry(K.h*.4,0),std(K.tint,{e:K.em||'#000000',ei:K.em?.5:0}),true),0,K.h*.4,0)}
  const grp2=new T.Group();grp2.add(tr);for(const [dx,dz,s2] of [[26,10,.55],[-22,14,.45]]){const c=tr.clone(true);c.scale.multiplyScalar(s2);c.position.set(dx,0,dz);c.rotation.y=dx;grp2.add(c)}
  g.add(grp2);g.userData.tr=grp2;const ring=M_(new T.RingGeometry(40,46,32),new T.MeshBasicMaterial({color:lin(K.em||'#9aa3ad'),transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1.4;g.add(ring);
  const stump=at(scl(sph(18,std('#5c6470',{r:.9}),false,8,6),1.4,.35,1.2),0,2,0);stump.visible=false;g.add(stump);g.userData.stump=stump;return g}
// ---- life challenges ("お題")
const CHAL={wood:[['木を30本切る','chop',30],['大きな古木を切りたおす','rt_old',1],['木を150本切る','chop',150],['氷結樹を切りたおす','rt_ice',1],['精霊の大樹を切りたおす','rt_spirit',1]],
  hunt:[['オオカミを10頭たおす','kill',10],['ボスを1体たおす','boss',1],['襲撃でオオカミを20頭たおす','raidk',20],['鋼角のヘラジカをたおす','bk_rb0',1],['洞窟の女王グモをたおす','bk_spq',1]],
  fish:[['魚を10匹釣る','fish',10],['魚を40匹釣る','fish',40],['ぬしの穴で大物を釣る','bigfish',1],['大物を5回釣る','bigfish',5]],
  mine:[['鉄鉱石を10個掘る','iron',10],['鉄鉱石を40個掘る','iron',40],['氷晶を5個掘る','icec',5],['星の結晶を掘る','star',1]],
  craft:[['吹雪の工房で木工品を5個作る','carve',5],['工房で装備を1つ作る','cr_eq',1],['会心の出来を5回出す','great',5],['工房で装備を3つ作る','cr_eq',3]],
  cook:[['料理を3回作る','cook',3],['料理を5回食べる','eat',5],['料理を15回作る','cook',15],['料理を40回作る','cook',40]],
  smith:[['鉄の剣を鍛える','mk_w_ironsword',1],['武器や防具を3つ鍛える','sm',3],['氷晶の剣を鍛える','mk_w_icesword',1],['星の大剣を鍛える','mk_w_starsword',1]]};
function updateChallenges(){if(!isRPG())return;for(const p of G.players){p.chd=p.chd||[];const c=p.cnt||{};for(const k of LIVES)(CHAL[k]||[]).forEach((ch,i)=>{const id=k+i;if(p.chd.includes(id))return;if((c[ch[1]]||0)>=ch[2]){p.chd.push(id);lifeXp(p,k,25);const v=100+i*80;G.cash+=v;G.earned+=v;float(p.x,p.y,140,`お題達成！ ${ch[0]}（${LIFE[k].n}）+$${v}`,'gold',true);SFX.rare()}})}}
// ---- dungeons: walled areas reached through a portal (story mode). Data-driven: add an entry to DUNGEONS to add an area.
const DUNGEONS=[
  {id:'cave',n:'氷の洞窟',des:0,key:'Spider',drop:'silk',box:[1790,1830,2370,2370],inp:{x:1800,y:1560},ring:{x:1800,y:1590},back:{x:1800,y:1650},start:{x:1880,y:2300},out:{x:1850,y:2210},
    gate:()=>G.zones.B,lock:'氷の湖を解放すると入れる',sub:'宝箱・鉱石・強い魔物',enter:['ひんやりと冷たい…','焚き火のまわりだけは暖かい。奥に宝が眠っている'],
    walls:[[1790,1830,2370,1860],[1790,2340,2370,2370],[1790,1830,1820,2370],[2340,1830,2370,2370],[1790,2090,2240,2110],[2330,2090,2370,2110],[2070,2110,2090,2190],[2070,2270,2090,2370]],
    heats:[{x:1900,y:2250,r:120}],
    spawns:[{x:2150,y:2150,k:'normal'},{x:2300,y:2160,k:'normal'},{x:2120,y:2320,k:'normal'},{x:2200,y:2230,k:'big'},{x:2290,y:2300,k:'big'},{x:2260,y:1930,k:'big'},{x:2100,y:1960,k:'boss',bt:'queen',sc:2.4,bk:'spq'}],
    chests:[{x:2030,y:2140,tier:1},{x:2300,y:2310,tier:2},{x:2090,y:1890,tier:3}],cmat:['iron','icec','star'],
    loot:{1:['w_icicle','c_lantern'],2:['a_silk','w_bluehammer'],3:['w_queenfang','c_starring']},
    look:{floor:'#3c4652',wall:'#5c6b7a',cap:'#eef4fa',crys:['#7fd4ff','#c9a2ff'],ring:'#7fd4ff',mouth:'#5c6b7a',fire:'#ffa23d'}},
  {id:'glacier',n:'凍てつく氷河',des:0,ann:1,key:'Wolf',drop:'fang',box:[30,1830,630,2370],inp:{x:360,y:1735},ring:{x:360,y:1700},back:{x:360,y:1630},start:{x:560,y:2300},out:{x:520,y:2215},rotY:Math.PI,
    gate:()=>G.zones.C&&G.story&&G.story.ch>=2,lock:'第2章から・奥地の森を解放すると入れる',sub:'氷河の宝・氷牙・氷河の主',enter:['吐く息まで凍りつく…','氷の裂け目の奥に、主が眠っているという'],
    walls:[[30,1830,630,1860],[30,2340,630,2370],[30,1830,60,2370],[600,1830,630,2370],[30,2090,470,2110],[560,2090,630,2110],[300,2110,320,2190],[300,2270,320,2370],[180,1860,200,1990],[420,1960,440,2090]],
    heats:[{x:545,y:2285,r:110},{x:330,y:1935,r:95}],
    spawns:[{x:440,y:2180,k:'normal',hpm:1.5},{x:470,y:2320,k:'normal',hpm:1.5},{x:380,y:1900,k:'big',hpm:1.4},{x:220,y:2000,k:'big',hpm:1.4},{x:520,y:1940,k:'big',key:'Stag',sc:1.3,hpm:1.8,bk:'gls',nm:'氷河のヘラジカ'},{x:300,y:2010,k:'normal',hpm:1.5},{x:110,y:1930,k:'boss',bt:'frost',sc:1.9,hpm:5,bk:'glb',nm:'氷河の主'}],
    chests:[{x:170,y:2330,tier:1},{x:520,y:1890,tier:2},{x:90,y:2050,tier:3}],cmat:['icec','icec','star'],
    loot:{1:['c_aurora','w_glaxe'],2:['a_glacier','w_frostbow'],3:['w_glking','c_glheart']},
    look:{nomap:1,floor:'#d6e8f3',wall:'#a9cde6',cap:'#ffffff',crys:['#9fe3ff','#e0f6ff'],ring:'#9fe3ff',mouth:'#8fb8d6',fire:'#ffa23d'}},
  {id:'ruin',n:'遺跡の地下',des:1,ann:1,key:null,drop:'relic',box:[1790,1830,2370,2370],inp:{x:1800,y:1560},ring:{x:1800,y:1590},back:{x:1800,y:1650},start:{x:1880,y:2300},out:{x:1850,y:2210},
    gate:()=>G.zones.B,lock:'東の区画を解放すると入れる',sub:'古代の宝・古代の欠片・砂の王',enter:['ひんやりとした石の回廊…','松明のまわりで一息つける。奥に王の間がある'],
    walls:[[1790,1830,2370,1860],[1790,2340,2370,2370],[1790,1830,1820,2370],[2340,1830,2370,2370],[1790,2060,2150,2080],[2240,2060,2370,2080],[2000,2080,2020,2200],[2170,2200,2190,2340],[2170,1860,2190,1960]],
    heats:[{x:1900,y:2260,r:110},{x:2280,y:2150,r:90}],
    spawns:[{x:1960,y:2160,k:'normal',hpm:1.6},{x:2080,y:2300,k:'normal',hpm:1.6},{x:2100,y:2140,k:'normal',hpm:1.6},{x:2270,y:2280,k:'big',hpm:1.5},{x:2260,y:2120,k:'big',hpm:1.5},{x:1950,y:1950,k:'big',hpm:1.5},{x:2260,y:1940,k:'boss',bt:'charge',sc:2,hpm:5,bk:'rub',nm:'砂の王サソリ'}],
    chests:[{x:2090,y:2230,tier:1},{x:1880,y:1900,tier:2},{x:2300,y:1900,tier:3}],cmat:['iron','relic','relic'],
    loot:{1:['w_sand','c_scarab'],2:['a_pharaoh','w_sunbow'],3:['w_sunspear','c_eye']},
    look:{floor:'#7a5c3c',wall:'#c9a36b',cap:'#e8cf9a',crys:['#ffd166','#ff9f43'],ring:'#ffd166',mouth:'#b08a58',fire:'#ff8a2a'}}];
DUNGEONS.forEach((D,i)=>{D.i=i;D.spawns.forEach((S,j)=>S.code=i*100+j+1)});
const dgByCode=c=>{const D=DUNGEONS[Math.floor((c-1)/100)];return D?{D,S:D.spawns[(c-1)%100]}:null};
// compatibility names (tests and older code)
const CAVE_BOX=DUNGEONS[0].box,CAVE_IN=DUNGEONS[0].inp,CCHEST=DUNGEONS[0].chests;
const dgMap=()=>isRPG()?DUNGEONS.filter(D=>D.des===(DES()?1:0)):[];
const inBox=(x,y,b,m=0)=>x>b[0]-m&&x<b[2]+m&&y>b[1]-m&&y<b[3]+m;
const dgAt=(x,y)=>dgMap().find(D=>inBox(x,y,D.box));
function dgBlock(x,y){return DUNGEONS.some(D=>D.des===(DES()?1:0)&&inBox(x,y,D.box,60))}
function caveWarm(x,y){return dgMap().some(D=>D.heats.some(h=>dist(x,y,h.x,h.y)<h.r))}
function caveWalls(e,r){for(const D of dgMap()){if(!inBox(e.x,e.y,D.box,40))continue;for(const w of D.walls)pushRect(e,w[0],w[1],w[2],w[3],r||12);if(D.id==='cave'&&!caveDoorOpen())pushRect(e,VAULT_DOOR[0],VAULT_DOOR[1],VAULT_DOOR[2],VAULT_DOOR[3],r||12)}}
function dgState(D){G.dg=G.dg||{};return G.dg[D.id]=G.dg[D.id]||{sp:D.spawns.map(()=>3),ch:D.chests.map(()=>({open:0,rt:0}))}}
function dgLook(b,S,D){world.remove(b.m.g);b.m=makeBear(b.kind,S.key||D.key||undefined);if(b.bt)setBtLook(b,b.bt);b.m.g.scale.setScalar(S.sc||(S.k==='boss'?2.4:S.k==='big'?1.4:1));b.m.g.position.set(b.x,0,b.y);world.add(b.m.g);b.dgs=S.code;b.nm=S.nm||null;b.bk=S.bk||(D.id==='cave'?(S.k==='boss'?'spq':'sp'):D.id==='glacier'?'gl':D.id==='ruin'?'ru':null)}
function updateCave(dt){for(const D of dgMap()){if(!D.gate())continue;const C=dgState(D);
  D.spawns.forEach((S,i)=>{if(G.bears.some(b=>b.dgs===S.code&&!b.dead))return;C.sp[i]-=dt;if(C.sp[i]>0)return;C.sp[i]=S.k==='boss'?240:120;let b;
    if(S.k==='boss'){b=spawnBoss(S.bt||'frost',true);b.hp=b.max=Math.round(b.max*(S.hpm||4))}else{b=spawnBear('A',true);b.kind=S.k;b.hp=b.max=Math.round((S.k==='big'?16:8)*(S.hpm||1)*DM().hp*(1+(YR()-1)*.25))}
    b.x=S.x;b.y=S.y;dgLook(b,S,D);b.zone='K';b.dg=D;b.home={x:S.x,y:S.y}});
  D.chests.forEach((c,i)=>{const st=C.ch[i];if(st.open){st.rt-=dt;if(st.rt<=0)st.open=0;return}const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,c.x,c.y)<55);if(!p){st.t=0;return}st.t=(st.t||0)+dt;if(st.t<1)return;st.open=1;st.rt=G.DAY*1.5;
    const pool=D.loot[c.tier].filter(id=>!(p.items||[]).includes(id));if(pool.length)giveItem(p,pool[Math.floor(Math.random()*pool.length)]);addMat(p,D.cmat[c.tier-1],c.tier===3?2:3);const v=Math.round(60*c.tier*(1+D.i*.5)*(1+G.day*.05));G.cash+=v;G.earned+=v;cnt(p,'chest');
    banner('宝箱を開けた！',`+$${v}`,c.tier===3?`${D.n}の奥の宝だ！`:'','r-SSR');SFX.chest&&SFX.chest();burst(c.x,c.y,30,30,{c:['#ffd23f','#ffffff'],s0:60,s1:200,u0:150,u1:300,l0:.6,l1:1,add:true})})}}
function dgKill(b,p){const D=b.dg;if(!D||!p)return;addMat(p,D.drop,b.kind==='boss'?4:1);if(b.kind!=='boss')return;cnt(p,'dgboss');const v=Math.round(250*(1+D.i*.6)*(1+G.day*.05));G.cash+=v;G.earned+=v;gainRX(p,20+D.i*10);
  const pool=D.loot[3].filter(id=>!(p.items||[]).includes(id));if(pool.length&&Math.random()<.35)giveItem(p,pool[Math.floor(Math.random()*pool.length)]);banner(`${b.nm||'主'}をたおした！`,`+$${v}`,`${MATS[D.drop]}を手に入れた`,'r-SSR')}
function dgSnap(){return dgMap().map(D=>{const C=G.dg&&G.dg[D.id];return D.chests.map((_,i)=>C&&C.ch[i]&&C.ch[i].open?1:0).join('')}).join('.')}
function dgApply(s){if(typeof s!=='string')return;const L=dgMap(),P=s.split('.');L.forEach((D,j)=>{const C=dgState(D),v=P[j]||'';D.chests.forEach((_,i)=>C.ch[i].open=v[i]==='1'?1:0)})}
function dgBuild(D){const L=D.look,g=new T.Group();const stone=std(L.wall,{map:TEX.stone,r:.95}),dark=std('#2a323c',{r:1}),B=D.box;
  const fl=M_(new T.PlaneGeometry(B[2]-B[0],B[3]-B[1]),(L.nomap?std(L.floor,{r:.55}):std(L.floor,{map:TEX.stone,r:1})),false,true);fl.rotation.x=-Math.PI/2;fl.position.set((B[0]+B[2])/2,.25,(B[1]+B[3])/2);g.add(fl);
  for(const w of D.walls){const WH=70;const m=M_(new T.BoxGeometry(w[2]-w[0],WH,w[3]-w[1]),stone,true,true);m.position.set((w[0]+w[2])/2,WH/2,(w[1]+w[3])/2);g.add(m);const cap=M_(new T.BoxGeometry(w[2]-w[0]+4,8,w[3]-w[1]+4),std(L.cap,{r:.9}),false);cap.position.set((w[0]+w[2])/2,WH+4,(w[1]+w[3])/2);g.add(cap)}
  for(let i=0;i<24;i++){const x=rnd(B[0]+50,B[2]-50),y=rnd(B[1]+50,B[3]-50);if(D.walls.some(w=>x>w[0]-20&&x<w[2]+20&&y>w[1]-20&&y<w[3]+20))continue;if(D.chests.some(c=>dist(x,y,c.x,c.y)<50))continue;g.add(at(rot(cone(rnd(4,8),rnd(14,30),glow(L.crys[i%2],1.4),5,false),0,0,rnd(-.3,.3)),x,6,y))}
  for(const h of D.heats){g.add(at(cyl(16,20,10,dark,10),h.x,5,h.y));g.add(at(cone(12,26,glow(L.fire,2.4),8,false),h.x,24,h.y));const l=new T.PointLight(lin('#ffa050'),1.6,300,1.5);l.position.set(h.x,60,h.y);g.add(l)}
  const mouth=new T.Group();mouth.position.set(D.inp.x,0,D.inp.y);const mb=new T.Group();mb.rotation.y=D.rotY||0;mb.add(at(scl(sph(70,std(L.mouth,{map:TEX.stone,r:.95}),true,12,8),1.4,1,1),0,20,-30),at(box(90,70,6,dark),0,35,8));mouth.add(mb);
  const ms=makeTextPlate(D.n,90,24,'rgba(255,250,240,.92)','#3a4a5a',.5);ms.position.set(0,110,0);ms.userData.bb=true;mouth.add(ms);g.userData.ms=ms;g.add(mouth);
  const ring=(c,x,y,r0,r1)=>{const m=M_(new T.RingGeometry(r0,r1,32),new T.MeshBasicMaterial({color:lin(c),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false);m.rotation.x=-Math.PI/2;m.position.set(x,1.5,y);g.add(m)};
  ring(L.ring,D.ring.x,D.ring.y,34,42);ring('#ffd166',D.out.x,D.out.y,30,38);
  g.userData.chests=D.chests.map(c=>{const cg=new T.Group();cg.position.set(c.x,0,c.y);const mk=nm=>{const P=KK&&KK.prop&&KK.prop[nm];if(!P)return at(box(30,22,20,std(c.tier===3?'#ffcf4a':'#8a5a30')),0,11,0);const o=P.scene.clone(true);o.scale.setScalar(34/Math.max(.01,P.w));if(c.tier===3)o.traverse(q=>{if(q.isMesh){q.material=q.material.clone();q.material.emissive=lin('#a86a00');q.material.emissiveIntensity=.4}});return o};const cl=mk('Chest_Closed'),op=mk('Chest_Open');op.visible=false;cg.add(cl,op);g.add(cg);return{cg,cl,op}});
  world.add(g);return g}
let _cvT=0;
function caveFx(){if(!G||!running)return;const me=G.players[G.me]||G.players[0];G.dgV=G.dgV||{};const L=dgMap();
  for(const id in G.dgV){const V=G.dgV[id];if(V.parent!==world){delete G.dgV[id];continue}V.visible=L.some(D=>D.id===id)}
  if(!me)return;const now=performance.now(),dt=Math.min(.3,(now-_cvT)/1000);_cvT=now;const cur=dgAt(me.x,me.y);let near=false;
  for(const D of L){const V=G.dgV[D.id]||(G.dgV[D.id]=dgBuild(D));V.userData.ms.quaternion.copy(camera.quaternion);const C=G.dg&&G.dg[D.id];const open=D.gate();
    if(open&&D.ann&&G.story){G.story.seen=G.story.seen||{};if(!G.story.seen['dg_'+D.id]){G.story.seen['dg_'+D.id]=1;banner('新しい探索地',D.n,`${D.sub}。入口は地図の「${D.n}」の看板`,'area',true)}}
    V.userData.chests.forEach((o,i)=>{const op=!!(C&&C.ch[i]&&C.ch[i].open);o.cl.visible=!op;o.op.visible=op;const c=D.chests[i];if(cur===D&&!op&&dist(me.x,me.y,c.x,c.y)<220)label(c.x,c.y,50,`<b>${c.tier===3?'黄金の宝箱':'宝箱'}</b><br><small>そばに立つと開く</small>`,'')});
    if(cur&&cur!==D)continue;
    if(!open&&!cur){if(dist(me.x,me.y,D.ring.x,D.ring.y)<300)label(D.ring.x,D.ring.y,90,`<b>${D.n}</b><br><small>🔒 ${D.lock}</small>`,'note');continue}
    const P=cur?D.out:D.ring,d=dist(me.x,me.y,P.x,P.y);if(d<320)label(P.x,P.y,cur?60:90,cur?`<b>出口</b><br><small>立つと外へ出る</small>`:`<b>${D.n}</b><br><small>立つと中へ入る（${D.sub}）</small>`,'');
    if(d<40&&!(me.down>0)&&!me.riding){near=true;me.ptT=(me.ptT||0)+dt;if(me.ptT>1.1){me.ptT=0;const T2=cur?D.back:D.start;me.x=T2.x;me.y=T2.y;me.vx=me.vy=0;updateCam(0,true);SFX.area();if(!cur)banner(D.n,D.enter[0],D.enter[1],'cold',true);return}}}
  if(!near)me.ptT=0}
function statusTab(me){const tab=G._stab||'eq',rows=$('lifeRows'),lct=document.querySelector('#lifeCard .lct');const tabs=`<div style="display:flex;gap:4px;margin-bottom:6px">${[['eq','装備'],['life','くらし'],['chal','お題'],['book','図鑑'],['clue','手がかり']].map(([k,n])=>`<button data-tab="${k}" style="flex:1;font:inherit;font-size:11px;font-weight:800;border:2px solid #16283a;border-radius:8px;padding:3px;background:${tab===k?'#ffd23f':'#fff'};cursor:pointer">${n}</button>`).join('')}</div>`;
  if(tab==='clue'){$('rpgBox').innerHTML=tabs+'<div style="font-weight:900;margin:2px 0 4px">手がかり帳</div>'+clueHtml();rows.innerHTML='';lct.style.display='none';return true}
  if(tab==='eq'){$('rpgBox').innerHTML=tabs+rpgBoxHtml(me);rows.innerHTML='';lct.style.display='none';return true}
  if(tab==='life'){$('rpgBox').innerHTML=tabs;lct.style.display='';return false}
  lct.style.display='none';rows.innerHTML='';const c=me.cnt||{},chd=me.chd||[];
  if(tab==='chal'){$('rpgBox').innerHTML=tabs+LIVES.map(k=>`<div style="margin:4px 0"><b style="color:${LIFE[k].c}">${LIFE[k].n}</b>${(CHAL[k]||[]).map((ch,i)=>{const done=chd.includes(k+i);return `<div style="font-size:11.5px;${done?'color:#2f8a3a':''}">${done?'✓':'・'} ${ch[0]} <small>${done?'':`${Math.min(c[ch[1]]||0,ch[2])}/${ch[2]}`}</small></div>`}).join('')}</div>`).join('')+'<small>お題を達成すると、くらしの経験とお金がもらえる</small>';return true}
  const own=me.items||[],all=Object.keys(ITEMS);$('rpgBox').innerHTML=tabs+`<b>装備 ${own.length}/${all.length}</b><div style="font-size:11px;line-height:1.6">${all.map(id=>own.includes(id)?ITEMS[id].n:'？？？').join('・')}</div>
    <b style="display:block;margin-top:6px">魔物 ${BOOK.filter(([id])=>c['bk_'+id]).length}/${BOOK.length}</b><div style="font-size:11px;line-height:1.6">${BOOK.map(([id,n])=>c['bk_'+id]?`${n}（${c['bk_'+id]}）`:'？？？').join('・')}</div>`;return true}
$('lifeCard').addEventListener('click',e=>{if(e.target.closest('button[data-deduce]')){$('lifeCard').hidden=true;openDeduce();return}const b=e.target.closest('button[data-tab]');if(!b)return;G._stab=b.dataset.tab;lifeHud(true)});

// ---- workshop recipes: special wood and beast materials become gear
const MATS={iron:'鉄鉱石',icec:'氷晶',star:'星の結晶',silk:'クモの糸',core:'古木の芯材',icew:'氷結木材',spirit:'精霊の枝',relic:'古代の欠片',herb:'香草',steel:'鋼の角',fang:'氷牙',horn:'覇者の角'};
function addMat(p,k,n){if(!p||!k)return;p.mats=p.mats||{};p.mats[k]=(p.mats[k]||0)+n;float(p.x,p.y,100,`${MATS[k]} +${n}`,'gold',true)}
const RECIPES={
  bow_old:{id:'w_oldbow',m:{core:3},log:10,cash:100,rk:1},shield_old:{id:'a_oldshield',m:{core:2,steel:1},log:6,cash:150,rk:1},
  staff_ice:{id:'w_icestaff',m:{icew:3,fang:1},log:8,cash:300,rk:2},armor_ice:{id:'a_icearmor',m:{icew:2,steel:2},log:8,cash:400,rk:3},
  sw_iron:{life:'smith',id:'w_ironsword',m:{iron:4},cash:80,rk:0},ax_iron:{life:'smith',id:'w_ironaxe',m:{iron:5,core:1},cash:120,rk:1},ar_iron:{life:'smith',id:'a_iron',m:{iron:8,steel:1},cash:200,rk:1},
  sw_ice:{life:'smith',id:'w_icesword',m:{icec:3,iron:3,fang:1},cash:400,rk:2},ch_star:{life:'smith',id:'c_star',m:{star:1,icec:2},cash:500,rk:3},sw_star:{life:'smith',id:'w_starsword',m:{star:2,icec:3,horn:1},cash:900,rk:4},silk_cloak:{id:'a_silk',m:{silk:6,core:1},log:4,cash:200,rk:1},
  sw_relic:{life:'smith',id:'w_relic',m:{relic:5,iron:4},cash:600,rk:3},ch_relic:{id:'c_relic',m:{relic:4},log:4,cash:400,rk:2},bow_fang:{id:'w_fangbow',m:{fang:4,icew:2,core:1},log:8,cash:500,rk:2},
  charm_spirit:{id:'c_spiritcharm',m:{spirit:1,core:3},log:5,cash:400,rk:3},bow_spirit:{id:'w_spiritbow',m:{spirit:2,horn:1,icew:2},log:12,cash:800,rk:4}};
function craftWhy(p,R){const lf=R.life||'craft';if(lifeRank(p,lf)<R.rk)return `${LIFE[lf].n}「${LR[R.rk].n}」が必要`;for(const k in R.m)if(((p.mats||{})[k]||0)<R.m[k])return `${MATS[k]}が足りない`;if(p.bag.filter(x=>x==='log').length<(R.log||0))return `薪が${R.log}本必要`;if(G.cash<(R.cash||0))return `お金が$${R.cash}必要`;if((p.items||[]).includes(R.id))return 'もう持っている';return null}
function openCraft(){const me=G.players[G.me]||G.players[0];const mt=Object.entries(me.mats||{}).filter(([k,n])=>n>0&&MATS[k]).map(([k,n])=>`${MATS[k]}×${n}`).join('・')||'なし';
  const ch=Object.keys(RECIPES).sort((a,b)=>(RECIPES[a].life==='smith')-(RECIPES[b].life==='smith')).map(k=>{const R=RECIPES[k],it=ITEMS[R.id],why=craftWhy(me,R);const need=Object.entries(R.m).map(([m,n])=>`${MATS[m]}${n}`).join('+')+(R.log?`+薪${R.log}`:'')+(R.cash?`+$${R.cash}`:'');
    return [`${why?'🔒':R.life==='smith'?'🔨':'🪚'} ${it.n}（${itemDesc(it)}）… ${need}`,()=>{const w=craftWhy(G.players[G.me]||G.players[0],R);if(w){toast(w,'cold',true);return}sendAct('craft',k)}]});
  ch.push(['やめる',null]);Object.assign(DLG,{open:true,npc:{n:{n:'工房'},x:WB.x,y:WB.y},pages:[`何を作る？（持っている素材：${mt}）`],i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
// ---- chapter openings (letterboxed text over the town) and the objective tracker
let OPN=null;
function playOpening(C,done){const el=$('opening'),tx=$('opTxt');const slides=C.open.map(t=>({t})).concat([{card:1}]);let i=0,tm=null;OPN={done};
  if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;el.hidden=false;G.camPan={x:CX,y:CY-80,t:0,z:.42,d:slides.length*3.6+1};
  const show=()=>{clearTimeout(tm);tx.classList.remove('on');setTimeout(()=>{if(!OPN)return;const sl=slides[i];tx.innerHTML=sl.card?`<span class="chn">${C.n}</span><span class="cht">${C.t}</span>`:sl.t.replace(/</g,'&lt;');void tx.offsetWidth;tx.classList.add('on');if(sl.card)SFX.area();tm=setTimeout(next,sl.card?2600:3400)},i?450:150)};
  const next=()=>{i++;if(i>=slides.length){end();return}show()};
  const end=()=>{clearTimeout(tm);if(!OPN)return;const d=OPN.done;OPN=null;el.hidden=true;tx.classList.remove('on');if(NET.mode==='solo'&&G)G.paused=false;if(G.camPan)G.camPan.t=Math.max(G.camPan.t,(G.camPan.d||2)-.5);d&&d()};
  OPN.next=next;OPN.end=end;show()}
$('opening').addEventListener('click',e=>{if(!OPN)return;if(e.target.id==='opSkip'){OPN.end();return}OPN.next()});
addEventListener('keydown',e=>{if(!OPN)return;if(e.code==='Escape'){OPN.end();e.preventDefault()}else if(e.code==='Space'||e.code==='Enter'||e.code==='KeyE'){OPN.next();e.preventDefault()}},true);
function trackerFlash(){const el=$('tracker');el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
let _tkT=0;function trackerHud(){const el=$('tracker');{const on=!!(isRPG()&&running);if(document.body.classList.contains('rpg')!==on)document.body.classList.toggle('rpg',on)}if(!isRPG()||!running){el.hidden=true;return}const now=performance.now();if(now-_tkT<250)return;_tkT=now;{const me=G.players[G.me]||G.players[0],sk=SKILLS[clsKey(me)],el=$('kbSk');const cd=NET.mode==='guest'?(NET.skAt>0?Math.max(0,sk.cd-(performance.now()-NET.skAt)/1000):0):(me.skCd||0);const h=`<kbd class="w">右クリック</kbd>${sk.n}${cd>0?` ${Math.ceil(cd)}s`:''}`;if(el.innerHTML!==h)el.innerHTML=h;el.className=cd>0?'cd':'ready'}const S=G.story,C=CH[S.ch]||CH[4],L=SOBJ[S.ch];
  const pg=(c,g)=>`<div class="pg"><span><u style="width:${Math.round(100*Math.min(1,c/Math.max(1,g)))}%"></u></span><small>${Math.min(c,g)}/${g}</small></div>`;
  let h=`<div class="tk-h">${C.n}<em>「${C.t}」</em></div>`;
  if(L){const i=Math.min(S.step||0,L.length-1),o=L[i],[c,g]=o.f();h+=`<div class="sec now"><i>▶ いまやること（${i+1}/${L.length}）</i><b>${stx(o)}</b>${o.p?`<small>${o.p()}</small>`:pg(c,g)}</div>`}
  else{const g=goalOf(YR());const rows=[[`かまど Lv${G.level} / ${g.lv}`,G.level>=g.lv],[`町人 ${popNow()} / ${g.pop}人`,popNow()>=g.pop],[`お金 $${Math.floor(G.cash).toLocaleString()} / $${g.c.toLocaleString()}`,G.cash>=g.c]];
    if(G.mission<MISSIONS.length){const m=MISSIONS[G.mission],[c,gg]=m.f();h+=`<div class="sec now"><i>▶ いまやること</i><b>${m.t}</b>${pg(c,gg)}</div>`}
    const fm=Math.round(custFame()*5);h+=`<div class="sec"><i>★ 町の知名度（お客さんの多さ）</i><b style="color:#e8a020">${G.story.shopOpen?'★'.repeat(fm)+'☆'.repeat(5-fm):'<small>まだ誰にも知られていない</small>'}</b></div>`;h+=`<div class="sec"><i>◆ 章の目標</i><b>${G.monument?'今夜、像を守りぬけ！':g.n+'を建てて、最後の夜を守れ'}</b>${G.monument?'':rows.map(([t,ok])=>`<div class="ck ${ok?'ok':'ng'}">${t}</div>`).join('')}</div>`}
  const qs=[];for(const k in (S.q||{})){const Q=QUESTS[k],q=S.q[k];if(!Q||Q.bio!==bioKey()||q.st===3)continue;const pr=q.st===2?`→ ${npcName(Q.npc)}に報告`:Q.type==='bring'?`${{log:'薪',fish:'魚',meat:'肉'}[Q.k]||Q.k} ${q.p||0}/${Q.n}`:Q.type==='build'?`${Math.min(Q.chk(),Q.n)}/${Q.n}`:Q.type==='count'?`${Math.min(Q.chk(q),Q.n)}/${Q.n}`:Q.where?`（${Q.where}）`:'';qs.push(`<div class="q ${q.st===2?'ok':''}">・${Q.t} ${pr}</div>`)}
  const avail=G.npcV?G.npcV.filter(v=>npcMark(v.n.id)==='！').length:0;
  h+=`<div class="sec"><i>✉ 住人の依頼</i>${qs.join('')||'<div class="q">受けている依頼はない</div>'}${avail?`<div class="q" style="color:#e8703a">“！”の住人が${avail}人いる（Eキーで話す）</div>`:''}</div>`;
  {const me=G.players[G.me]||G.players[0],b=me&&me.buff;if(b&&b.t>0)h+=`<div class="sec"><i>🍳 料理の効果</i><b style="font-size:12.5px">${b.n}</b><small>${dishD(DISH[b.k])}・残り${Math.ceil(b.t)}秒</small></div>`;else if(me&&(me.food||[]).length)h+=`<div class="sec"><i>🍳 料理</i><small>${me.food.length}品持っている（Vキーで食べる）</small></div>`}
  if(el._h!==h){el.innerHTML=h;el._h=h}el.hidden=false}


