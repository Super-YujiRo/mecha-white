// ================================================================ 深層ダンジョン「深淵の迷宮」: an endless stack of arenas outside the map. Deeper = tougher beasts, better materials, a boss every 5 floors
const ABX=4000;// anything east of this line is the abyss
const ABY_BOX=[4600,800,5400,1600],ABY_ST={x:4690,y:1510},ABY_EX={x:4660,y:1560},ABY_UP={x:5000,y:1200};
const ABY_GATE={x:760,y:1560};
const inAby=(x)=>x>ABX;
const clX=(x,m)=>x>ABX?clamp(x,ABY_BOX[0]+m,ABY_BOX[2]-m):clamp(x,m,WORLD-m);
const clY=(y,m,x)=>x>ABX?clamp(y,ABY_BOX[1]+m,ABY_BOX[3]-m):clamp(y,m,WORLD-m);
const outW=(x,y,m)=>x>ABX?(x<ABY_BOX[0]+m||x>ABY_BOX[2]-m||y<ABY_BOX[1]+m||y>ABY_BOX[3]-m):(x<m||x>WORLD-m||y<m||y>WORLD-m);
// spawn templates reuse the dungeon look/sync code (dgs codes)
const ABYD={id:'abyss',n:'深淵の迷宮',des:2,key:'Wolf',drop:'shard',box:ABY_BOX,spawns:[{k:'normal',key:'Wolf',bk:'ab'},{k:'big',key:'Wolf',sc:1.4,bk:'ab'},{k:'normal',key:'Spider',sc:1.1,bk:'ab'},{k:'big',key:'Stag',sc:1.3,bk:'ab'},
  {k:'boss',bt:'frost',sc:2.2,bk:'abb',nm:'深淵の番犬'},{k:'boss',bt:'queen',key:'Spider',sc:2.4,bk:'abb',nm:'深淵の女王'},{k:'boss',bt:'charge',key:'Stag',sc:2,bk:'abb',nm:'深淵の角獣'},{k:'boss',bt:'king',sc:2.4,bk:'abb',nm:'深淵の王'}],walls:[],heats:[],chests:[],loot:{3:[]}};
ABYD.i=DUNGEONS.length;DUNGEONS.push(ABYD);ABYD.spawns.forEach((S,j)=>S.code=ABYD.i*100+j+1);BOOK.push(['ab','深淵の獣'],['abb','深淵の主']);
const ABY_BANDS=[{n:'氷の層',floor:'#2c3a4a',wall:'#4d6378',cap:'#7f9bb0',crys:['#7fd4ff','#bfe9ff'],light:'#7fd4ff'},{n:'岩の層',floor:'#3a3129',wall:'#6b5a48',cap:'#8a7a66',crys:['#ffb35a','#ffd9a0'],light:'#ffb070'},
  {n:'溶岩の層',floor:'#2a1512',wall:'#5a2a20',cap:'#7a3a26',crys:['#ff5a2a','#ffb020'],light:'#ff6a3a'},{n:'星の層',floor:'#1c1830',wall:'#3a3060',cap:'#5a4a8a',crys:['#c9a2ff','#7fe8ff'],light:'#b08aff'},{n:'虚無の層',floor:'#0e0e14',wall:'#26262e',cap:'#3a3a44',crys:['#ffffff','#ff4a7a'],light:'#ff4a7a'}];
const abyBand=f=>ABY_BANDS[Math.min(ABY_BANDS.length-1,Math.floor((f-1)/5))];
// pillar layouts, relative to the arena's top-left (arena is 800x800; start bottom-left, stairs at the centre)
const ABY_LAY=[[[180,180,240,240],[560,180,620,240],[560,560,620,620],[180,560,240,500+120]],
  [[120,380,300,420],[500,380,680,420],[380,120,420,300],[380,500,420,680]],
  [[250,150,290,190],[510,150,550,190],[650,380,690,420],[510,610,550,650],[110,380,150,420],[250,610,290,650]],
  [[200,250,600,280],[200,520,600,550]],
  [[150,150,330,190],[470,610,650,650],[610,150,650,330],[150,470,190,560]]];
function abyWalls(){const A=G.aby;if(!A||!A.on)return [];const L=ABY_LAY[A.lay%ABY_LAY.length],B=ABY_BOX;return L.map(r=>[B[0]+r[0],B[1]+r[1],B[0]+r[2],B[1]+r[3]])}
const abyCp=best=>{const L=[1];for(let f=6;f<=best;f+=5)L.push(f);return L};
const abyBest=p=>(p&&p.cnt&&p.cnt.aby_best)||0;
const abyGateOK=()=>isRPG()&&(DES()||G.zones.B);
// ---- host: run state
function abyStart(fl){const A=G.aby=G.aby||{};Object.assign(A,{on:1,fl,clear:0,lay:0,left:0,emp:0,ko:A.ko||[0,0],up:0,rw:0});abyFloor()}
function abyFloor(){const A=G.aby;A.clear=0;A.rw=0;A.up=0;A.lay=(A.fl*7+3)%ABY_LAY.length;for(const b of G.bears)if(b.aby&&!b.dead){b.dead=true;b.deadT=9;b.m&&b.m.g&&(b.m.g.visible=false)}
  const f=A.fl,boss=f%5===0,n=boss?2:Math.min(12,4+Math.floor(f*.6));const hpk=Math.pow(1.17,f-1),am=1+.07*(f-1);const W=abyWalls();
  const pos=()=>{for(let t=0;t<40;t++){const x=rnd(ABY_BOX[0]+80,ABY_BOX[2]-80),y=rnd(ABY_BOX[1]+80,ABY_BOX[3]-80);if(dist(x,y,ABY_ST.x,ABY_ST.y)<300)continue;if(W.some(w=>x>w[0]-40&&x<w[2]+40&&y>w[1]-40&&y<w[3]+40))continue;return{x,y}}return{x:ABY_UP.x,y:ABY_UP.y-120}};
  const mk=(j,P)=>{const S=ABYD.spawns[j];let b;if(S.k==='boss'){b=spawnBoss(S.bt,true);b.hp=b.max=Math.round(b.max*1.4*hpk)}else{b=spawnBear('A',true);b.kind=S.k;b.hp=b.max=Math.round((S.k==='big'?16:8)*DM().hp*hpk)}
    b.x=P.x;b.y=P.y;dgLook(b,S,ABYD);b.zone='K';b.dg=ABYD;b.home={x:P.x,y:P.y};b.aby=1;b.am=am;return b};
  for(let i=0;i<n;i++){const r=Math.random();mk(f<3?(r<.75?0:2):r<.45?0:r<.65?2:r<.85?1:3,pos())}
  if(boss){const b=mk(4+((f/5-1)%4),{x:ABY_UP.x,y:ABY_UP.y-160});banner(`地下${f}階`,`${b.nm}があらわれた！`,'たおすと階段と宝がひらく','cold');SFX.wave&&SFX.wave()}
  A.left=n+(boss?1:0)}
function updateAbyss(dt){if(!isRPG())return;const A=G.aby;if(!A||!A.on)return;const inside=G.players.filter(p=>inAby(p.x));
  if(!inside.length){A.emp+=dt;if(A.emp>4){A.on=0;for(const b of G.bears)if(b.aby&&!b.dead){b.dead=true;b.deadT=9}}return}A.emp=0;
  const alive=G.bears.filter(b=>b.aby&&!b.dead).length;A.left=alive;
  if(!A.clear&&alive===0){A.clear=1;const boss=A.fl%5===0;if(boss&&!A.rw){A.rw=1;for(const p of inside){addMat(p,'core',1+(A.fl>=15?1:0));addMat(p,'shard',3+Math.floor(A.fl/5));const v=Math.round(200*(1+A.fl*.25));G.cash+=v;G.earned+=v;gainRX(p,20+A.fl*2);abyLoot(p,.6)}
      banner(`地下${A.fl}階を制覇！`,'宝と階段があらわれた',`虚空の核・深淵の欠片を手に入れた。次は${abyBand(A.fl+1).n}`,'r-SSR');SFX.chest&&SFX.chest()}
    else float(ABY_UP.x,ABY_UP.y,80,'階段があらわれた！','gold',true)}
  if(A.clear){const on=inside.some(p=>!(p.down>0)&&dist(p.x,p.y,ABY_UP.x,ABY_UP.y)<46);A.up=on?A.up+dt:0;if(A.up>1.2){A.fl++;for(const p of inside){p.cnt=p.cnt||{};if((p.cnt.aby_best||0)<A.fl)p.cnt.aby_best=A.fl}
      if(A.fl%5===1&&A.fl>1)banner(`地下${A.fl}階・${abyBand(A.fl).n}`,'チェックポイント到達','次からはこの階から始められる','area');abyFloor()}}}
function abyLoot(p,ch){if(Math.random()>ch)return;const pool=Object.keys(ITEMS).filter(id=>ITEMS[id].s==='w'&&!ITEMS[id].lg&&!ITEMS[id].syn&&classOK(p,id)&&!(p.items||[]).includes(id));if(!pool.length)return;const id=pool[Math.floor(Math.random()*pool.length)];giveItem(p,id);grantStar(p,id,.25)}
function abyKill(b,p){const f=(G.aby&&G.aby.fl)||1;if(b.kind==='boss')return;if(Math.random()<(b.kind==='big'?.55:.22)+f*.01)addMat(p,'shard',1);if(f>=10&&Math.random()<.03+f*.002)addMat(p,'core',1);if(Math.random()<.015+f*.001)abyLoot(p,1);const v=Math.round(6+f*2);G.cash+=v;G.earned+=v}
function abyKO(p){if(!inAby(p.x))return false;const A=G.aby=G.aby||{ko:[0,0]};A.ko=A.ko||[0,0];const i=G.players.indexOf(p);A.ko[i]=(A.ko[i]||0)+1;p.hp=100;p.inv=3;
  float(p.x,p.y,80,'力尽きた…地上へ戻される','red',true);return true}
function abyAct(p,type,id){if(type!=='aby')return false;if(!abyGateOK())return true;const A=G.aby;if(A&&A.on)return true;const f=Math.max(1,Math.min(+id||1,abyBest(p)||1));abyStart(abyCp(abyBest(p)).includes(f)?f:1);return true}
function abySnap(){const A=G.aby;return A&&A.on?[1,A.fl,A.clear,A.lay,(A.ko||[0,0]).join('.'),A.left||0,+(A.up||0).toFixed(1)]:[0,0,0,0,(A&&A.ko||[0,0]).join('.'),0,0]}
function abyApply(v){if(!Array.isArray(v))return;const A=G.aby=G.aby||{};A.on=v[0];A.fl=v[1];A.clear=v[2];A.lay=v[3];A.ko=String(v[4]).split('.').map(Number);A.left=v[5];A.up=v[6]}
// ---- visuals + local player (every client moves its own player in and out)
function abyBuild(){const A=G.aby,Bd=abyBand(A.fl),g=new T.Group(),B=ABY_BOX,cx=(B[0]+B[2])/2,cy=(B[1]+B[3])/2;const stone=std(Bd.wall,{map:TEX.stone,r:.95});
  const under=M_(new T.PlaneGeometry(9000,9000),new T.MeshBasicMaterial({color:lin('#07070b')}),false);under.rotation.x=-Math.PI/2;under.position.set(cx,-.25,cy);g.add(under);
  const ft=TEX.stone.clone();ft.needsUpdate=true;ft.wrapS=ft.wrapT=T.RepeatWrapping;ft.repeat.set(10,10);const fl=M_(new T.PlaneGeometry(B[2]-B[0],B[3]-B[1]),stdU(Bd.floor,{map:ft,r:.95}),false,true);fl.rotation.x=-Math.PI/2;fl.position.set(cx,.9,cy);g.add(fl);
  const walls=[[B[0]-30,B[1]-30,B[2]+30,B[1]],[B[0]-30,B[3],B[2]+30,B[3]+30],[B[0]-30,B[1],B[0],B[3]],[B[2],B[1],B[2]+30,B[3]]].concat(abyWalls());
  for(const w of walls){const WH=80;const m=M_(new T.BoxGeometry(w[2]-w[0],WH,w[3]-w[1]),stone,true,true);m.position.set((w[0]+w[2])/2,WH/2,(w[1]+w[3])/2);g.add(m);const cap=M_(new T.BoxGeometry(w[2]-w[0]+4,8,w[3]-w[1]+4),std(Bd.cap,{r:.9}),false);cap.position.set((w[0]+w[2])/2,WH+4,(w[1]+w[3])/2);g.add(cap)}
  const W=abyWalls();for(let i=0;i<30;i++){const x=rnd(B[0]+40,B[2]-40),y=rnd(B[1]+40,B[3]-40);if(W.some(w=>x>w[0]-20&&x<w[2]+20&&y>w[1]-20&&y<w[3]+20)||dist(x,y,ABY_UP.x,ABY_UP.y)<80||dist(x,y,ABY_ST.x,ABY_ST.y)<80)continue;g.add(at(rot(cone(rnd(4,9),rnd(14,36),glow(Bd.crys[i%2],1.5),5,false),0,0,rnd(-.3,.3)),x,6,y))}
  for(const [x,y] of [[cx-180,cy+180],[cx+180,cy-180]]){const l=new T.PointLight(lin(Bd.light),1.5,700,1.2);l.position.set(x,110,y);g.add(l)}
  // rune circle in the middle, torches along the walls
  const rune=new T.Group();rune.position.set(cx,1.2,cy);const rm=c=>new T.MeshBasicMaterial({color:lin(c),transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
  for(const [a,b] of [[150,156],[118,121],[70,73]]){const r=M_(new T.RingGeometry(a,b,64),rm(Bd.light),false);r.rotation.x=-Math.PI/2;rune.add(r)}
  for(let i=0;i<6;i++){const a=i/6*TAU,s=M_(new T.PlaneGeometry(4,236),rm(Bd.crys[1]),false);s.rotation.set(-Math.PI/2,0,a);rune.add(s)}
  for(let i=0;i<12;i++){const a=i/12*TAU,d=M_(new T.CircleGeometry(6,4),rm(Bd.light),false);d.rotation.x=-Math.PI/2;d.position.set(Math.cos(a)*136,0,Math.sin(a)*136);rune.add(d)}g.add(rune);g.userData.rune=rune;
  const tstone=std(Bd.wall,{map:TEX.stone,r:.9}),tf=new T.MeshBasicMaterial({color:lin('#ffb347'),transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false});g.userData.torch=[];
  for(let i=0;i<12;i++){const side=i%4,k=(Math.floor(i/4)+1)/4;const x=side===0?B[0]+k*(B[2]-B[0]):side===1?B[2]:side===2?B[0]+k*(B[2]-B[0]):B[0],y=side===0?B[1]:side===1?B[1]+k*(B[3]-B[1]):side===2?B[3]:B[1]+k*(B[3]-B[1]);
    const nx=side===1?-1:side===3?1:0,ny=side===0?1:side===2?-1:0;const t=new T.Group();t.position.set(x+nx*8,0,y+ny*8);t.add(at(box(8,12,8,tstone,true),0,52,0),at(cyl(5,3,6,std('#2a2320',{m:.5,r:.5}),8),0,60,0));const f=at(M_(new T.SphereGeometry(4,10,8),tf,false),0,68,0);f.scale.set(1,1.8,1);t.add(at(M_(new T.SphereGeometry(9,10,8),new T.MeshBasicMaterial({color:lin('#ff8a3a'),transparent:true,opacity:.18,blending:T.AdditiveBlending,depthWrite:false}),false),0,68,0));t.add(f);g.add(t);g.userData.torch.push({x:x+nx*8,y:y+ny*8,f})}
  const ring=(c,x,y,r0,r1)=>{const m=M_(new T.RingGeometry(r0,r1,40),new T.MeshBasicMaterial({color:lin(c),transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),false);m.rotation.x=-Math.PI/2;m.position.set(x,1.5,y);g.add(m);return m};
  ring('#ffd166',ABY_EX.x,ABY_EX.y,24,31);const up=new T.Group();up.position.set(ABY_UP.x,0,ABY_UP.y);up.add(at(cyl(40,46,6,std('#1a1a22',{r:.8}),24),0,3,0));const hole=M_(new T.CircleGeometry(34,32),new T.MeshBasicMaterial({color:lin('#000000')}),false);hole.rotation.x=-Math.PI/2;hole.position.y=6.5;up.add(hole);
  const ur=M_(new T.RingGeometry(36,44,40),new T.MeshBasicMaterial({color:lin(Bd.light),transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false}),false);ur.rotation.x=-Math.PI/2;ur.position.y=7;up.add(ur);g.add(up);g.userData.up=up;
  world.add(g);try{renderer.compile(scene,camera)}catch(_){}return g}
function abyGateBuild(){const g=new T.Group();g.position.set(ABY_GATE.x,0,ABY_GATE.y);const st=std('#8b8f99',{map:TEX.stone,r:.92}),dk=std('#4a4656',{map:TEX.stone,r:.95}),rim=std('#c9a24a',{m:.7,r:.35});
  // round stone well-mouth with steps spiralling down into the dark
  g.add(at(cyl(62,68,6,dk,28),0,3,0));for(let i=0;i<22;i++){const a=i/22*TAU;const b=at(rbox(17,10,12,2,i%2?st:dk),Math.cos(a)*54,11,Math.sin(a)*54);b.rotation.y=-a;g.add(b)}
  g.add(at(rot(tor(54,2.2,rim,false,6,48),Math.PI/2,0,0),0,16.5,0));
  for(let k=0;k<4;k++){const r=44-k*9;const m=M_(new T.RingGeometry(r-9,r,32),std(k%2?'#3a3644':'#2c2934',{r:.95,side:T.DoubleSide}),false,true);m.rotation.x=-Math.PI/2;m.position.y=6.2-k*1.2;g.add(m)}
  const hole=M_(new T.CircleGeometry(10,24),new T.MeshBasicMaterial({color:lin('#030206')}),false);hole.rotation.x=-Math.PI/2;hole.position.y=1.4;g.add(hole);
  const glowD=M_(new T.CircleGeometry(40,32),new T.MeshBasicMaterial({color:lin('#8a5aff'),transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false}),false);glowD.rotation.x=-Math.PI/2;glowD.position.y=7;g.add(glowD);g.userData.r={material:glowD.material};
  // pointed stone arch over the back of the well
  const arch=new T.Group();arch.position.z=-40;for(const s of [-1,1]){arch.add(at(rbox(14,64,14,2,st),s*46,32,0),at(rbox(18,8,18,2,dk),s*46,4,0));const top=at(rot(rbox(12,40,12,2,st),0,0,s*.55),s*30,76,0);arch.add(top)}
  arch.add(at(rot(M_(new T.OctahedronGeometry(7,0),glow('#b08aff',2.2),false),0,.6,0),0,98,0),at(box(20,6,14,dk,true),0,90,0));
  for(const s of [-1,1]){const c=at(scl(M_(new T.OctahedronGeometry(5,0),glow('#9f7aff',2),false),1,2,1),s*46,74,0);arch.add(c)}
  g.add(arch);g.userData.cry=arch;
  const sign=makeTextPlate('深淵の迷宮',84,20,'rgba(30,20,50,.88)','#e8dcff',.5);sign.position.set(0,122,-40);g.add(sign);g.userData.sign=sign;world.add(g);return g}
function abyTo(me,P){me.x=P.x;me.y=P.y;me.vx=me.vy=0;updateCam(0,true);SFX.area&&SFX.area();let el=$('fadeOv');if(!el){el=document.createElement('div');el.id='fadeOv';document.body.appendChild(el)}el.style.transition='none';el.style.opacity='1';void el.offsetWidth;setTimeout(()=>{el.style.transition='opacity .9s ease';el.style.opacity='0'},120)}
let _abT=0;
function abyFx(){if(!G||!running)return;const me=G.players[G.me]||G.players[0];const A=G.aby||{};const now=performance.now(),dt=Math.min(.3,(now-_abT)/1000);_abT=now;
  // gate on the map
  const gok=abyGateOK();if(gok&&G.story){G.story.seen=G.story.seen||{};if(!G.story.seen.aby){G.story.seen.aby=1;setTimeout(()=>{if(running)banner('新しい探索地','深淵の迷宮','町の南西。潜るほど強い敵と良い素材。武器を育てて挑め','area',true)},6000)}}if(gok&&(!G.abyG||G.abyG.parent!==world))G.abyG=abyGateBuild();if(G.abyG){G.abyG.visible=gok;G.abyG.userData.sign.quaternion.copy(camera.quaternion);G.abyG.userData.r.material.opacity=.16+.1*Math.sin(now/400);if(Math.random()<.25)psA.emit({x:ABY_GATE.x+rnd(-30,30),y:6,z:ABY_GATE.y+rnd(-30,30),vx:rnd(-4,4),vy:rnd(18,36),vz:rnd(-4,4),g:-6,life:1.6,max:1.6,r:rnd(3,5),c:C(Math.random()<.5?'#b08aff':'#7fe8ff'),air:true,fade:.6})}
  // arena
  const want=A.on?A.fl+':'+A.lay:null;if(G.abyV&&(G.abyV.userData.k!==want||G.abyV.parent!==world)){world.remove(G.abyV);G.abyV.traverse(o=>{o.geometry&&o.geometry.dispose()});G.abyV=null}
  if(want&&!G.abyV){G.abyV=abyBuild();G.abyV.userData.k=want}if(G.abyV){const u=G.abyV.userData.up;u.visible=!!A.clear;u.rotation.y+=.02;const U=G.abyV.userData;if(U.rune)U.rune.rotation.y+=.002;if(U.torch)for(const t of U.torch){t.f.scale.set(1,1.8+Math.sin(now/90+t.x)*.3,1);if(Math.random()<.08)psA.emit({x:t.x+rnd(-2,2),y:74,z:t.y+rnd(-2,2),vx:rnd(-4,4),vy:rnd(20,40),vz:rnd(-4,4),g:-10,life:.6,max:.6,r:rnd(3,5),c:C(Math.random()<.5?'#ffb347':'#ffd76a'),air:true,fade:.3})}}
  {const ina=!!(me&&inAby(me.x));document.body.classList.toggle('aby',ina);if(snow&&snow.pts)snow.pts.visible=!ina;if(ina&&A.on){const Bd=abyBand(A.fl||1);scene.fog.color.set(lin('#0b0a12'));if(sky&&sky.material&&sky.material.uniforms){sky.material.uniforms.top.value.set(lin('#07060c'));if(sky.material.uniforms.bot)sky.material.uniforms.bot.value.set(lin('#141020'));if(sky.material.uniforms.mid)sky.material.uniforms.mid.value.set(lin('#0e0b18'))}if(Math.random()<.5)psA.emit({x:me.x+rnd(-400,400),y:rnd(10,120),z:me.y+rnd(-300,300),vx:rnd(-6,6),vy:rnd(4,12),vz:rnd(-6,6),g:0,life:3,max:3,r:rnd(2,4),c:C(Bd.crys[Math.random()<.5?0:1]),air:true,fade:1})}}
  if(!me)return;const mi=G.players.indexOf(me);
  if(inAby(me.x)){
    if(!A.on){if(performance.now()-(me._abIn||0)<4000)return;abyTo(me,{x:ABY_GATE.x,y:ABY_GATE.y+70});toast('深淵から地上に戻った','gold',true);me._abF=0;return}
    const ko=(A.ko||[])[mi]||0;if(me._abK==null)me._abK=ko;if(ko>me._abK){me._abK=ko;abyTo(me,{x:ABY_GATE.x,y:ABY_GATE.y+70});toast('力尽きて地上に戻された…（最深記録は残る）','cold',true);me._abF=0;return}
    if(me._abF!==A.fl){const first=!me._abF;me._abF=A.fl;if(!first)abyTo(me,ABY_ST);banner(`地下${A.fl}階`,abyBand(A.fl).n,A.fl%5===0?'主の階…気をつけろ':`敵をすべて倒すと、下への階段があらわれる`,'cold',true)}
    abyHud(me,A);
    if(A.clear)label(ABY_UP.x,ABY_UP.y,70,`<b>下への階段</b><br><small>${A.up>0?'■'.repeat(Math.min(5,Math.ceil(A.up/.24))):'乗ると次の階へ（地下'+(A.fl+1)+'階）'}</small>`,'gold');
    const de=dist(me.x,me.y,ABY_EX.x,ABY_EX.y);if(de<200)label(ABY_EX.x,ABY_EX.y,60,'<b>地上へ戻る</b><br><small>立つと戻る（記録は残る）</small>','');
    if(de<30&&!(me.down>0)){me._abX=(me._abX||0)+dt;if(me._abX>1.1){me._abX=0;me._abF=0;abyTo(me,{x:ABY_GATE.x,y:ABY_GATE.y+70});toast('地上に戻った','gold',true)}}else me._abX=0;return}
  me._abK=(A.ko||[])[mi]||0;
  if(!gok)return;const d=dist(me.x,me.y,ABY_GATE.x,ABY_GATE.y);const best=abyBest(me);
  if(d<380)label(ABY_GATE.x,ABY_GATE.y,100,`<b>深淵の迷宮</b><br><small>${A.on?`${G.players.length>1?'仲間が':''}地下${A.fl}階で挑戦中・乗ると合流`:`乗ると挑戦（最深記録：${best?'地下'+best+'階':'なし'}）`}</small>`,'note');
  if(d<44&&!(me.down>0)&&!me.riding&&!DLG.open){me._abE=(me._abE||0)+dt;if(me._abE>1){me._abE=0;
      if(A.on){me._abF=A.fl;abyTo(me,ABY_ST);banner(`地下${A.fl}階`,abyBand(A.fl).n,'仲間と合流した','cold',true)}
      else{const cps=abyCp(best);if(cps.length===1){abyEnter(1)}else{const ch=cps.map(f=>[`地下${f}階から（${abyBand(f).n}）`,()=>abyEnter(f)]);ch.push(['やめる',null]);Object.assign(DLG,{open:true,npc:{n:{n:'深淵の迷宮'},x:ABY_GATE.x,y:ABY_GATE.y},pages:[`どこから潜る？ 最深記録：地下${best}階。深いほど敵が強く、良い素材が出る`],i:0,ch});if(NET.mode==='solo')G.paused=true;drawDlg()}}}}else me._abE=0}
function abyEnter(f){const me=G.players[G.me]||G.players[0];sendAct('aby',f);me._abF=0;me._abIn=performance.now();abyTo(me,ABY_ST)}
function abyHud(me,A){let el=$('abyHud');if(!el){el=document.createElement('div');el.id='abyHud';document.body.appendChild(el)}const h=`<b>地下${A.fl}階</b><small>${abyBand(A.fl).n}</small><span>${A.clear?'階段があらわれた！':`のこり ${A.left||0}体`}</span><i>最深 地下${Math.max(abyBest(me),A.fl)}階</i>`;if(el._h!==h){el._h=h;el.innerHTML=h}}
