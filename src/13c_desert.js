// ================================================================ chapter 3 as an adventure: the sand town Razul is a finished hub, the desert is for exploring
// (survival mode's desert trip keeps the old town-building rules; this only applies to story chapter 3)
const ADV=()=>!!(G&&G.story&&G.story.ch===3&&DES());
const OASES=[{x:2050,y:1000,r:230,n:'東のオアシス',camp:1},{x:330,y:1250,r:210,n:'西のオアシス'}];
const CAMP={x:1990,y:1080},VALLEY={x:330,y:2080,n:'流砂の谷'};
const TREAS=[[700,420],[1450,380],[1850,560],[2200,700],[420,860],[900,700],[1600,760],[2250,1400],[1850,1650],[1450,1900],[900,1850],[560,1600],[250,1700],[700,2250]];
const ADV_SELL={relic:45,iron:15,icec:40,star:120,silk:20,steel:60,fang:50,horn:200,core:25,icew:30,spirit:150};
function desertClear(x,y,m){if(!DES())return false;return OASES.some(o=>dist(x,y,o.x,o.y)<o.r+m)||dist(x,y,VALLEY.x,VALLEY.y)<250+m||dist(x,y,CAMP.x,CAMP.y)<120+m}
// adobe town wall for the desert (replaces the wooden fence), same gaps as the fence
function adobeWall(seg,pil,L){const wm=std('#dcb384',{r:.92}),cm=std('#b8875a',{r:.9});const W=new T.InstancedMesh(new T.BoxGeometry(L+2,30,10),wm,seg.length),Cp=new T.InstancedMesh(new T.BoxGeometry(L+4,4,13),cm,seg.length),P=new T.InstancedMesh(new T.BoxGeometry(16,40,16),wm,pil.length),PC=new T.InstancedMesh(new T.BoxGeometry(19,5,19),cm,pil.length);const o=new T.Object3D();
  seg.forEach(([x,y,r],i)=>{o.position.set(x,15,y);o.rotation.set(0,r,0);o.updateMatrix();W.setMatrixAt(i,o.matrix);o.position.y=32;o.updateMatrix();Cp.setMatrixAt(i,o.matrix)});pil.forEach(([x,y,r],i)=>{o.position.set(x,20,y);o.rotation.set(0,r,0);o.updateMatrix();P.setMatrixAt(i,o.matrix);o.position.y=42;o.updateMatrix();PC.setMatrixAt(i,o.matrix)});
  for(const m of [W,Cp,P,PC]){m.castShadow=true;m.receiveShadow=true;world.add(m)}return[W,Cp,P,PC]}
function survDesertFx(){if(!G||!DES()||ADV()){if(G&&G.sPalmV)G.sPalmV.visible=false;return}if(!G.sPalmV||G.sPalmV.parent!==world){const g=new T.Group();for(const [deg,r] of [[-45,240],[-135,240],[-62,330],[-118,330],[-30,330],[-150,330]]){const a=deg*Math.PI/180,p=makePalm();p.position.set(CX+Math.cos(a)*r,0,CY+Math.sin(a)*r);p.rotation.y=deg;g.add(p)}world.add(g);G.sPalmV=g}G.sPalmV.visible=true}
function advWarm(x,y){if(!ADV())return false;if(OASES.some(o=>dist(x,y,o.x,o.y)<o.r))return true;return false}
// ---- the town of Razul: adobe houses around the well, market stalls, palms
function advLayout(){if(G._advL)return G._advL;const L={houses:[],stalls:[],palms:[]};const npcs=(NPCS.desert||[]).map(n=>[n.x,n.y]);
  const A=[15,38,62,108,132,158,200,224,248,290,314,338];A.forEach((deg,i)=>{const a=deg*Math.PI/180,r=i%2?410:315,x=CX+Math.cos(a)*r,y=CY+Math.sin(a)*r;if(npcs.some(q=>dist(q[0],q[1],x,y)<95))return;
    L.houses.push({x,y,w:80+(i*37%40),d:64+(i*23%30),h:48+(i*13%36),a:Math.atan2(CX-x,CY-y),aw:i%3===0,c:['#e3c093','#d9b07e','#e8caa0','#cfa06c'][i%4]})});
  [[CX+150,CY-120],[CX-160,CY-110],[CX+165,CY+110],[CX-150,CY+130]].forEach(([x,y],i)=>{if(npcs.some(q=>dist(q[0],q[1],x,y)<70))return;L.stalls.push({x,y,c:['#d9534f','#3f8cc4','#f0a830','#5fb35a'][i],a:Math.atan2(CX-x,CY-y),n:['串焼き屋','革細工屋','串焼き屋','革細工屋'][i],buy:[['meat'],['fur','salt'],['meat'],['fur','salt']][i]})});
  for(const deg of [0,90,180,270])for(const s of [-1,1]){const a=(deg+s*11)*Math.PI/180;L.palms.push([CX+Math.cos(a)*250,CY+Math.sin(a)*250])}
  for(const o of OASES)for(let k=0;k<5;k++){const a=k/5*TAU+.4;L.palms.push([o.x+Math.cos(a)*(o.r*.55),o.y+Math.sin(a)*(o.r*.55)])}
  return G._advL=L}
function advSolids(e,r){if(!ADV())return;const L=advLayout();for(const h of L.houses)pushCircle(e,h.x,h.y,Math.max(h.w,h.d)*.5+(r||0)*.4);for(const s of L.stalls)pushCircle(e,s.x,s.y,26);for(const p of L.palms)pushCircle(e,p[0],p[1],10)}
function makePalm(){const g=new T.Group(),bark=std('#8a6a44',{r:.9}),leaf=std('#4f9a3c',{r:.8});for(let i=0;i<6;i++)g.add(at(rot(cyl(5-i*.4,6-i*.4,14,bark,7),.06*i,0,.05*i),i*1.2,7+i*13,0));
  for(let k=0;k<7;k++){const a=k/7*TAU;const l=at(rot(scl(cone(7,46,leaf,4),1,1,.35),0,a,1.9),Math.cos(a)*16+7,84,Math.sin(a)*16);l.rotation.set(0,-a,1.95);l.position.set(7+Math.cos(a)*20,82,Math.sin(a)*20);g.add(l)}
  g.add(at(sph(5,std('#6b4a2a'),false,6,5),9,78,3),at(sph(5,std('#6b4a2a'),false,6,5),4,79,-4));return g}
function makeAdobe(h){const g=new T.Group(),wall=std(h.c,{r:.92}),trim=std('#b8875a',{r:.9}),dark=std('#3a2618',{r:1});
  g.add(at(box(h.w,h.h,h.d,wall,true,true),0,h.h/2,0));g.add(at(box(h.w+6,6,h.d+6,trim),0,h.h+3,0));
  for(const s of [-1,1])g.add(at(box(8,10,8,wall),s*(h.w/2-4),h.h+10,h.d/2-4),at(box(8,10,8,wall),s*(h.w/2-4),h.h+10,-(h.d/2-4)));
  g.add(at(box(18,30,2,dark),0,15,h.d/2+1));for(const s of [-1,1])g.add(at(box(10,10,2,dark),s*h.w*.28,h.h*.62,h.d/2+1));
  for(let i=0;i<3;i++)g.add(at(rot(cyl(1.6,1.6,14,trim,5),Math.PI/2,0,0),(i-1)*h.w*.3,h.h-6,h.d/2+6));
  if(h.aw)g.add(at(rot(box(h.w*.6,2,26,std(['#d9534f','#3f8cc4','#f0a830'][Math.floor(h.x)%3],{r:.8})),.35,0,0),0,h.h*.52,h.d/2+12));
  g.position.set(h.x,0,h.y);g.rotation.y=h.a;return g}
function makeStall(s){const g=new T.Group(),wood=std('#8a5a30',{r:.9}),cloth=std(s.c,{r:.8});for(const [x,z] of [[-24,-14],[24,-14],[-24,14],[24,14]])g.add(at(cyl(2,2,40,wood,6),x,20,z));
  g.add(at(box(56,4,34,cloth),0,42,0));g.add(at(box(52,16,26,wood),0,8,0));for(let i=0;i<4;i++)g.add(at(sph(5,std(['#f0c040','#e0703a','#8ac66a','#d9534f'][i]),false,6,5),-18+i*12,19,0));
  g.position.set(s.x,0,s.y);g.rotation.y=s.a;return g}
function advBuild(){const g=new T.Group(),L=advLayout();for(const h of L.houses)g.add(makeAdobe(h));for(const s of L.stalls)g.add(makeStall(s));for(const p of L.palms){const m=makePalm();m.position.set(p[0],0,p[1]);m.rotation.y=p[0]*.7;g.add(m)}
  for(const o of OASES){const oa=makeOasis();oa.g.position.set(o.x,0,o.y);oa.g.scale.setScalar(o.r/260);g.add(oa.g);const sg=makeSignpost(o.n,'#1f5f7b');{const a=Math.atan2(CY-o.y,CX-o.x);sg.position.set(o.x+Math.cos(a)*o.r*.85,0,o.y+Math.sin(a)*o.r*.85);sg.rotation.y=-a+Math.PI/2}g.add(sg)}
  const camp=new T.Group();camp.position.set(CAMP.x,0,CAMP.y);for(let i=0;i<3;i++){const t=makeNomadTent(i);t.scale.setScalar(1.05);t.position.set(Math.cos(i*2.1)*80,0,Math.sin(i*2.1)*80);t.rotation.y=-i*2.1;camp.add(t)}
  camp.add(at(cyl(14,18,6,std('#3a2618'),10),0,3,0),at(cone(10,24,glow('#ffa23d',2.4),8,false),0,18,0));const cl=new T.PointLight(lin('#ffa050'),1.2,260,1.6);cl.position.y=50;camp.add(cl);g.add(camp);
  const vy=new T.Group();vy.position.set(VALLEY.x,0,VALLEY.y);const sand=M_(new T.RingGeometry(40,230,40),std('#c99a5e',{r:1}),false,true);sand.rotation.x=-Math.PI/2;sand.position.y=.6;vy.add(sand);
  const pit=M_(new T.CircleGeometry(40,30),std('#6b4a2a',{r:1}),false,true);pit.rotation.x=-Math.PI/2;pit.position.y=.7;vy.add(pit);g.userData.pit=pit;for(let i=0;i<8;i++){const a=i/8*TAU;vy.add(at(rot(cyl(6,9,40+i*7%30,std('#d8cfc0',{r:.8}),6),.5*Math.cos(a),0,.5*Math.sin(a)),Math.cos(a)*250,15,Math.sin(a)*250))}
  const vs=makeSignpost(VALLEY.n,'#7a3a1a');vs.position.set(0,0,210);vy.add(vs);g.add(vy);
  world.add(g);return g}
function advSetup(){if(!ADV()||(G.advV&&G.advV.parent===world))return;
  for(const pd of G.pads){pd.vis=()=>false;if(pd.mesh)pd.mesh.g.visible=false}
  for(const z of ZONES){G.zones[z.id]=true;z.fogT=1;if(z.fog)z.fog.visible=false;if(z.sign)z.sign.visible=false}
  for(const q of G.surv)world.remove(q.m.g);G.surv.length=0;for(const w of G.workers)if(w.m)world.remove(w.m.g);G.workers.length=0;
  for(const h of G.houses||[])h.g.visible=false;for(const k in G.towerV||{})G.towerV[k].g.visible=false;for(const m of G.trapV||[])m.visible=false;if(G.sledV)for(const s of [].concat(G.sledV))if(s&&s.visible!=null)s.visible=false;
  G.sleds.length=0;G.spa.on=true;G.spa.fuel=100;G.fuel=100;G.raid.on=false;G.advV=advBuild();G.adv=G.adv||{tr:TREAS.map((_,i)=>i%3===0?1:0),rt:TREAS.map(()=>0)}}
// ---- the giant sandworm (boss of chapter 3): rides the burrowing boss AI with its own body
function makeWorm(){const g=new T.Group(),skin=std('#d8ad78',{r:.8,e:'#4a2f14',ei:.12}),band=std('#a5703f',{r:.85});const segs=[];
  for(let i=0;i<10;i++){const r=24-i*1.3;const s=new T.Group();s.add(sph(r,skin,true,14,10));const bd=at(rot(cyl(r*1.03,r*1.03,4,band,16),Math.PI/2,0,0),0,0,-r*.5);s.add(bd);g.add(s);segs.push(s)}
  const head=segs[0];const mouth=at(rot(cyl(14,19,10,std('#3a1010',{r:1}),14),Math.PI/2,0,0),0,0,-22);head.add(mouth);for(let k=0;k<10;k++){const a=k/10*TAU;head.add(at(rot(cone(3,12,std('#f4ead2',{r:.6}),5),-Math.PI/2,0,0),Math.cos(a)*15,Math.sin(a)*15,-27))}
  const mound=at(scl(sph(40,std('#d6a86c',{r:1}),false,14,8),1,.25,1),0,0,-80);g.add(mound);
  g.userData.segs=segs;return g}
function spawnWorm(){const b=spawnBoss('queen',true);b.x=VALLEY.x;b.y=VALLEY.y;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(260*DM().hp);b.nm='巨大サンドワーム';b.home={x:VALLEY.x,y:VALLEY.y};
  wormLook(b);G.story.worm=b.id;G.shake=18;banner('第3章','巨大サンドワームが現れた！','流砂の谷の主。砂にもぐったら、出てくる場所から離れろ','cold');say('遊牧民の長ハミド','あれが谷の主じゃ…神殿の石が消えてから、あやつは狂ってしもうた')}
function wormLook(b){if(!b.m||b.m.worm)return;b.m.g.traverse(o=>{if(o.isMesh&&o!==b.m.ring)o.visible=false});const w=makeWorm();w.scale.setScalar(1.6);b.m.g.add(w);b.m.worm=w}
function wormAnim(b,t){const w=b.m&&b.m.worm;if(!w)return;const segs=w.userData.segs,n=segs.length;segs.forEach((s,i)=>{const k=i/(n-1),ph=Math.PI*(.35+.65*k);const y=72*Math.sin(ph)+2,z=40-k*120,ty=72*.65*Math.PI*Math.cos(ph),tz=-120;s.position.set(Math.sin(t*2.2+i*.7)*7*(1-k),y,z);s.rotation.set(-Math.atan2(ty,tz),0,0)});segs[0].rotation.x+=Math.sin(t*6)*.12}
// ---- update (host) and visuals
function updateAdv(dt){if(!ADV())return;advSetup();G.fuel=100;G.spa.fuel=100;const S=G.story,A=G.adv;
  // buried treasure: a few shimmering spots at a time; stand on one to dig it up
  // market stalls buy what you carry back from the dunes (meat → skewer stall, hides → leather stall)
  const L=advLayout();for(const p of G.players){if(p.down>0||!p.bag.length)continue;const s=L.stalls.find(s=>dist(p.x,p.y,s.x,s.y)<75&&p.bag.some(k=>s.buy.includes(k)));if(!s){p._sellT=0;continue}p._sellT=(p._sellT||0)+dt;if(p._sellT<.14)continue;p._sellT=0;const i=p.bag.findIndex(k=>s.buy.includes(k));const k=p.bag.splice(i,1)[0];const v=Math.round(({meat:9,fur:16,salt:12}[k]||8)*(1+G.day*.04));G.cash+=v;G.earned+=v;flyItem(k,p.x,p.y,30,s.x,s.y,20,null,3);float(s.x,s.y,70,`+$${v}`,'cash');SFX.coin&&SFX.coin(2);cnt(p,'sold')}
  A.tr.forEach((on,i)=>{if(!on){A.rt[i]-=dt;if(A.rt[i]<=0&&A.tr.filter(Boolean).length<5&&Math.random()<dt*.05){A.tr[i]=1}return}const [x,y]=TREAS[i];const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,x,y)<40);if(!p){TREAS[i]._t=0;return}TREAS[i]._t=(TREAS[i]._t||0)+dt;if(Math.random()<dt*8)burst(x,y,3,4,{c:['#e2b877','#c9955b'],s0:20,s1:70,u0:30,u1:90,l0:.2,l1:.4});
    if(TREAS[i]._t>1.6){TREAS[i]._t=0;A.tr[i]=0;A.rt[i]=90;const v=Math.round(rnd(80,200)*(1+G.day*.04));G.cash+=v;G.earned+=v;const r=Math.random();const mat=r<.4?'relic':r<.7?'iron':r<.9?'herb':'star';addMat(p,mat,mat==='star'?1:2);cnt(p,'dig');lifeXp(p,'mine',4);
      const pool=['c_scarab','w_sand','a_pharaoh','w_sunbow'].filter(id=>!(p.items||[]).includes(id));if(pool.length&&Math.random()<.14)giveItem(p,pool[Math.floor(Math.random()*pool.length)]);
      banner('お宝を掘り当てた！',`+$${v}`,`${MATS[mat]}を見つけた`,'r-SSR');SFX.chest&&SFX.chest();burst(x,y,30,20,{c:['#ffd23f','#ffffff','#e2b877'],s0:60,s1:200,u0:150,u1:300,l0:.6,l1:1,add:true})}});
  if(S.step===1&&!S.camp&&G.players.some(p=>dist(p.x,p.y,CAMP.x,CAMP.y)<200))S.camp=1;
  if(S.step===3&&!S.ruin&&G.players.some(p=>dist(p.x,p.y,RUIN.x,RUIN.y)<120))S.ruin=1;
  if(S.step===5){const w=G.bears.find(b=>b.id===S.worm);if(!S.worm||(!w&&!S.wend)){if(G.players.some(p=>dist(p.x,p.y,VALLEY.x,VALLEY.y)<420))spawnWorm()}
    else if(w&&w.dead&&!S.wend){S.wend=1;addClue('c9');banner('巨大サンドワームをたおした！','流砂の谷が静まった','隊長ザラ「……あんたたちに、この砂漠の昔話の続きを聞かせなきゃね」','r-SSR');SFX.ssr&&SFX.ssr();setTimeout(()=>{if(running&&ADV()&&NET.mode!=='guest')endGame(true)},6500)}}
  for(const b of G.bears)if(b.id===S.worm&&!b.dead&&b.bt!=='queen')setBt(b,'queen');wormLeash()}
function advFx(){if(!G||!running)return;const on=ADV();if(G.advV)G.advV.visible=on;if(!on)return;if(!G.advV||G.advV.parent!==world)return;const me=G.players[G.me]||G.players[0],t=performance.now()/1000,A=G.adv;
  G.advV.traverse(o=>{if(o.userData&&o.userData.bb)o.quaternion.copy(camera.quaternion)});
  if(A)A.tr.forEach((on,i)=>{if(!on||!me)return;const [x,y]=TREAS[i];const d=dist(me.x,me.y,x,y);if(d<520&&Math.random()<.08)psA.emit({x:x+rnd(-10,10),y:4,z:y+rnd(-10,10),vx:0,vy:40,vz:0,g:0,life:.5,max:.5,r:4,c:C('#fff2b0'),air:true,fade:.2});if(d<240)label(x,y,30,'<b>砂に埋もれた何か</b><br><small>上に立つと掘る</small>','')});
  for(const b of G.bears)if(b.nm==='巨大サンドワーム'){if(!b.m.worm)wormLook(b);wormAnim(b,t)}
  if(me)for(const s of advLayout().stalls)if(dist(me.x,me.y,s.x,s.y)<260){const has=me.bag.some(k=>s.buy.includes(k));label(s.x,s.y,70,`<b>${s.n}</b><br><small>${s.buy.includes('meat')?'肉':'毛皮・塩'}を買い取る${has?'（そばに立つと売れる）':''}</small>`,has?'gold':'')}
  const S=G.story;if(me&&S.step===5&&!S.wend&&dist(me.x,me.y,VALLEY.x,VALLEY.y)<700&&!G.bears.some(b=>b.nm==='巨大サンドワーム'&&!b.dead))label(VALLEY.x,VALLEY.y,80,'<b>流砂の谷</b><br><small>近づくと主が目覚める</small>','note')}
// ---- people of the desert
function advTalk(v){const S=G.story;if(!ADV())return null;const id=v.n.id;
  if(id==='zara'){if(S.step===0&&!S.zara)return{pages:['北から来た旅人かい？ ようこそ、砂の町ラズールへ','この砂漠は100年前から、昼は灼けて夜は凍る。昔は季節があったって、じいさんたちは言うけどね','神殿の話が聞きたいなら、東のオアシスにいる遊牧民の長ハミドを訪ねな。砂漠のことなら、あの人がいちばん詳しい','のどが渇いたら、町の井戸かオアシスのそばで休むんだよ'],ch:[['東のオアシスへ行く',()=>sendAct('zara',1)]]};
    return{pages:[['砂の中には、昔の品が埋まってる。キラキラ光る砂を見つけたら掘ってみな','西のオアシスもある。遠出するなら覚えておきな','流砂の谷には近づくんじゃないよ…あそこには主がいる'][Math.floor((S.t||0)/15)%3]]}}
  if(id==='hamid'){if(S.step===2&&!S.hamid)return{pages:['北の町から来たのか……ならば話そう。100年前のことを','北西の神殿には「陽の石」が祀られておった。石は季節を巡らせる炉の心臓じゃ','ある年、北から来た男が石を持ち去った。それから砂漠は狂い、流砂の谷には大ミミズが棲みついた','神殿の遺跡は、北西の砂の中に今も眠っておる。行ってみるがいい'],ch:[['北西の遺跡へ向かう',()=>sendAct('hamid',1)]]};
    return{pages:[['石が戻れば、この砂漠にも雨が降るじゃろう','谷の主は、神殿の番人のなれの果てかもしれん'][Math.floor((S.t||0)/15)%2]]}}
  if(id==='said'&&!npcQuest('said')){const me=G.players[G.me]||G.players[0],m=me.mats||{};const val=Object.keys(ADV_SELL).reduce((a,k)=>a+(m[k]||0)*ADV_SELL[k],0);
    return{pages:['水は売ってないが、珍しい品なら買い取るよ',`あんたの素材だと、全部で$${val}ってところだね（古代の欠片 1つ$45 など）`],ch:[['古代の欠片だけ売る',()=>sendAct('sell','relic')],['素材を全部売る',()=>sendAct('sell','all')],['やめておく',null]]}}
  return null}
function advAct(p,type,id){const S=G.story;if(!S)return false;
  if(type==='zara'){if(S.ch===3&&S.step===0)S.zara=1;return true}
  if(type==='hamid'){if(S.ch===3&&S.step===2)S.hamid=1;return true}
  if(type==='sell'){const m=p.mats||{};let v=0;for(const k in ADV_SELL){if(id!=='all'&&k!==id)continue;v+=(m[k]||0)*ADV_SELL[k];m[k]=0}if(v>0){G.cash+=v;G.earned+=v;banner('素材を売った！',`+$${v}`,'','area');SFX.cash&&SFX.cash(3)}else toast('売れる素材を持っていない','cold');return true}
  return false}
function advMark(nid){const S=G.story;if(!ADV())return '';if(nid==='zara'&&S.step===0&&!S.zara)return '！';if(nid==='hamid'&&S.step===2&&!S.hamid)return '！';return ''}
