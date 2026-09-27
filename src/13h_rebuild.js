// ================================================================ chapter 1 「再建」: the town starts in ruins, you clear rubble, repair buildings and gather its people back
const REB=()=>!!(G&&G.story&&G.story.ch===1&&!DES());
// who comes back, and what brings them
const JOIN={
  teo:{why:'家を1軒直す（テントでOK）',ok:()=>houseLv(0)+houseLv(1)+houseLv(2)+houseLv(3)+houseLv(4)>0,msg:['大工のテオ','屋根のある家ができたって？ 大工の出番だな！ 住まわせてくれ']},
  mina:{why:'肉屋ではじめて売る',ok:()=>!!(G.story&&G.story.shopOpen)&&(G.stats.sold||0)>=1,msg:['パン屋のミーナ','いい匂いがしたから来ちゃった。わたしもここでパンを焼かせて！']},
  gordon:{why:'北の森で凍えている猟師を助ける',spot:{x:760,y:420},ok:null,msg:['猟師のゴードン','助かった…狼に追われて動けなくなってたんだ。町まで連れてってくれ']},
  elza:{why:'見張り台を1つ建てる',ok:()=>TOWERS.some(t=>G.lv['tw_'+t.id]>0),msg:['見張りのエルザ','見張り台が立ったのね。夜の見張りはわたしに任せて']},
  pip:{why:'氷の湖のほとりで迷子の少年を見つける',spot:{x:1840,y:1480},ok:null,need:()=>G.zones.B,msg:['少年ピップ','…ひとりで寒かった。この町に、ぼくの居場所はある？']},
  borg:{why:'温泉郷を解放する',ok:()=>G.zones.D,msg:['老人ボルグ','温泉がよみがえったか…わしも昔はこの町に住んでおったんじゃ']}};
const JOIN_ORDER=['teo','mina','gordon','elza','pip','borg'];
function joined(id){const S=G&&G.story;if(!S||DES())return true;if(!JOIN[id])return true;if(S.ch>=2)return true;return(S.joined||[]).includes(id)}
const joinedN=()=>JOIN_ORDER.filter(joined).length;
// rubble: piles of broken beams and stones sitting on every build spot around the plaza
function rubbleList(){if(G._rbl)return G._rbl;const skip=/^(furnace|zone_|monument|cook_|cashier_|price_)/;const L=[];for(const p of G.pads||[]){if(skip.test(p.id))continue;if(dist(p.x,p.y,CX,CY)>560)continue;L.push({x:p.x+14,y:p.y-8,pad:p.id})}
  for(const [a,r] of [[.3,230],[1.2,260],[2.1,240],[2.8,220],[3.6,250],[4.4,230],[5.3,260]])L.push({x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r});return G._rbl=L}
function rbState(){const S=G.story;S.rb=S.rb||[];return S.rb}
const rbGone=i=>rbState().includes(i);
function padBlocked(pad){if(!REB())return false;const L=rubbleList();return L.some((r,i)=>r.pad===pad.id&&!rbGone(i))}
function rebSolids(e,r){if(!REB())return;const L=rubbleList();for(let i=0;i<L.length;i++)if(!rbGone(i))pushCircle(e,L[i].x,L[i].y,24)}
function updateRebuild(dt){if(!REB())return;const S=G.story;S.joined=S.joined||[];S.rbh=S.rbh||{};const L=rubbleList();
  // clear rubble by standing next to it (like chopping)
  for(const p of G.players){if(p.down>0||p.shooting)continue;let best=-1,bd=52;L.forEach((r,i)=>{if(rbGone(i))return;const d=dist(p.x,p.y,r.x,r.y);if(d<bd){bd=d;best=i}});if(best<0){p._rbT=0;continue}
    const r=L[best];p.chopping={x:r.x,y:r.y};p.aimDir=Math.atan2(r.x-p.x,r.y-p.y);p._rbT=(p._rbT||0)+dt;if(p._rbT<.4)continue;p._rbT=0;S.rbh[best]=(S.rbh[best]||0)+1;SFX.chop&&SFX.chop();G.shake=Math.max(G.shake,2);burst(r.x,r.y,8,20,{c:['#8a7058','#c9c2b8','#ffffff'],s0:30,s1:110,u0:60,u1:160,l0:.3,l1:.6});
    if(S.rbh[best]>=5){rbState().push(best);give(p,'log',2);if(Math.random()<.35)addMat(p,'iron',1);lifeXp(p,'wood',2);cnt(p,'rubble');gainRX(p,3);float(r.x,r.y,70,'瓦礫を片付けた！','gold');burst(r.x,r.y,20,30,{c:['#ffe07a','#ffffff'],s0:60,s1:180,u0:120,u1:260,l0:.5,l1:.9,add:true});
      const left=L.filter((_,i)=>!rbGone(i)).length;if(left===L.length-1)say('村長オルガ','その調子だ。瓦礫の下には、昔の建物の土台が残ってる。片付ければ直せるようになるよ');if(left===0)say('斥候カイ','広場の瓦礫はぜんぶ片付いた！ これで町を建て直せる')}}
  // people come back when the town is ready for them
  for(const id of JOIN_ORDER){if(S.joined.includes(id))continue;const J=JOIN[id];if(J.need&&!J.need())continue;
    if(J.spot){if(G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,J.spot.x,J.spot.y)<70)){S.joined.push(id);joinFx(id)}}
    else if(J.ok()){S.joined.push(id);joinFx(id)}}}
function joinFx(id){const J=JOIN[id];banner('仲間が町に戻ってきた！',npcName(id),J.why+'ことで、町に戻ってきた','r-SSR');say(J.msg[0],J.msg[1]);SFX.ssr&&SFX.ssr();G.rep=Math.min(5,(G.rep||0)+.4);
  const n=joinedN();if(n===2)setTimeout(()=>{if(running)say('村長オルガ','人が戻ってくると、町に灯りが増えるね。頭に“！”が出ている人は、困りごとを抱えてるよ')},4000);if(n===6)setTimeout(()=>{if(running)say('村長オルガ','みんな戻ってきた…！ あとは町のシンボルを建てるだけだね')},4000)}
// ---- visuals: rubble piles, ruined houses & towers, stranded villagers waiting for rescue
function makeRubble(i){const g=new T.Group(),st=std('#8f949a',{map:TEX.stone,r:.95}),wd=std('#6b4a2e',{map:TEX.bark,r:.9}),sn=std('#f4f8fb',{r:.9});
  for(let k=0;k<6;k++){const a=k*1.7+i,r=6+k*3;g.add(at(rot(box(14+k%3*6,8+k%2*6,12,st),0,a,.2*(k%2)),Math.cos(a)*r,5,Math.sin(a)*r))}
  for(let k=0;k<3;k++)g.add(at(rot(box(46,5,6,wd),.25*(k-1),k*1.1+i,.35),rnd(-8,8),10+k*3,rnd(-8,8)));g.add(at(scl(sph(20,sn,false,10,6),1.3,.35,1.1),0,15,0));return g}
function makeRuinHouse(){const g=new T.Group(),w=std('#7a6552',{map:TEX.bark,r:.95}),st=std('#8f949a',{map:TEX.stone,r:.95}),sn=std('#f4f8fb',{r:.9});
  g.add(at(box(64,14,6,w,true),0,7,-24),at(box(6,26,44,w,true),-30,13,0),at(box(6,10,30,w,true),30,5,6),at(rot(box(70,5,8,w),0,.3,.4),6,18,0),at(rot(box(60,5,8,w),.2,-.5,-.3),-4,12,10));
  g.add(at(box(66,4,54,st),0,2,0),at(scl(sph(22,sn,false,10,6),1.5,.3,1.2),8,6,4));return g}
function makeRuinTower(){const g=new T.Group(),w=std('#5a4030',{map:TEX.bark,r:.95});for(const [x,z] of [[-12,-12],[12,-12],[-12,12],[12,12]])g.add(at(cyl(3,3.5,18+Math.abs(x+z)*.5,w,6),x,9,z));g.add(at(rot(box(40,4,6,w),0,.4,.6),0,14,0),at(scl(sph(14,std('#f4f8fb',{r:.9}),false,8,5),1.4,.3,1.4),0,3,0));return g}
function rebuildFx(){if(!G||!running)return;const on=REB();G.rebV=G.rebV||{};const me=G.players[G.me]||G.players[0];
  const L=rubbleList();if(!G.rebV.rb||G.rebV.rb.parent!==world){const g=new T.Group();G.rebV.items=L.map((r,i)=>{const m=makeRubble(i);m.position.set(r.x,0,r.y);g.add(m);return m});world.add(g);G.rebV.rb=g}
  G.rebV.rb.visible=on;if(on)G.rebV.items.forEach((m,i)=>{m.visible=!rbGone(i)});
  // ruined houses (until the first repair) and burnt watchtowers
  (G.houses||[]).forEach((h,i)=>{if(!h.ruin){h.ruin=makeRuinHouse();h.g.add(h.ruin)}h.ruin.visible=isRPG()&&!DES()&&houseLv(i)===0});
  if(!G.rebV.tw||G.rebV.tw.parent!==world){const g=new T.Group();G.rebV.tws=TOWERS.map(t=>{const m=makeRuinTower();m.position.set(t.mx,0,t.my);g.add(m);return m});world.add(g);G.rebV.tw=g}
  G.rebV.tw.visible=isRPG()&&!DES();TOWERS.forEach((t,i)=>{G.rebV.tws[i].visible=!(G.lv['tw_'+t.id]>0)});
  if(!on||!me)return;
  {let bi=-1,bd=170;L.forEach((r,i)=>{if(rbGone(i))return;const d=dist(me.x,me.y,r.x,r.y);if(d<bd){bd=d;bi=i}});if(bi>=0){const r=L[bi],h=(G.story.rbh||{})[bi]||0;label(r.x,r.y,52,`<b>瓦礫</b><br><small>${h?`${'■'.repeat(h)}${'□'.repeat(5-h)}`:'そばに立つと片付ける'}</small>`,'')}}
  // stranded villagers (rescue spots)
  G.rebV.sp=G.rebV.sp||{};for(const id of JOIN_ORDER){const J=JOIN[id];if(!J.spot)continue;let v=G.rebV.sp[id];const show=!joined(id)&&(!J.need||J.need());
    if(show&&(!v||v.g.parent!==world)){const n=NPCS.snow.find(n=>n.id===id);const m=makeVillager(PALS[n.pal%PALS.length],Object.assign({noShadow:false},n.o));m.g.position.set(J.spot.x,0,J.spot.y);world.add(m.g);v=G.rebV.sp[id]=m}
    if(v){v.g.visible=show;if(show){animWalk(v,0,false);v.g.rotation.y=Math.sin(performance.now()/300)*.15;if(dist(me.x,me.y,J.spot.x,J.spot.y)<420)label(J.spot.x,J.spot.y,80,`<b>${npcName(id)}</b><br><small>${id==='gordon'?'凍えて動けない…近づいて助けよう':'ひとりで震えている…近づいて声をかけよう'}</small>`,'gold')}}}}
function rebuildHtml(){if(!REB())return '';const L=rubbleList(),left=L.filter((_,i)=>!rbGone(i)).length,n=joinedN();const next=JOIN_ORDER.find(id=>!joined(id));
  return `<div class="sec"><i>🏚 町の再建</i><small>瓦礫 残り${left}/${L.length}・戻った仲間 ${n}/6</small>${next?`<div class="q">次の仲間：${npcName(next)}（${JOIN[next].why}）</div>`:''}</div>`}
function rebSnap(){const S=G.story;return S?{j:S.joined||[],rb:S.rb||[],rbh:S.rbh||{}}:null}
function rebApply(x){if(!x||!G.story)return;G.story.joined=x.j;G.story.rb=x.rb;G.story.rbh=x.rbh}
