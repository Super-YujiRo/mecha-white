// ================================================================ くらし (life ranks), workshop crafting, blizzard chores
const LIVES=['wood','hunt','fish','mine','craft','smith','cook'];
const LIFE={wood:{n:'木こり',k:'斧',c:'#3f7a45',b:r=>`伐採の速さ +${r*7}%`},hunt:{n:'狩人',k:'弓',c:'#c0392b',b:r=>`攻撃力 +${r*6}%`},fish:{n:'釣り人',k:'釣',c:'#2f7de0',b:r=>DES()?`水くみの速さ +${r*8}%`:`釣りの速さ +${r*8}%`},craft:{n:'木工職人',k:'工',c:'#a8743f',b:r=>`作品の値段 +${r*15}%`},mine:{n:'採掘師',k:'掘',c:'#7a6a9a',b:r=>`採掘の速さ +${r*8}%`},smith:{n:'鍛冶屋',k:'鍛',c:'#5a6470',b:r=>`作れる武器が増える`},cook:{n:'料理人',k:'料',c:'#e8703a',b:r=>`料理の効き目 +${r*10}%`}};
const LR=[{n:'見習い',x:0},{n:'かけだし',x:15},{n:'一人前',x:45},{n:'ベテラン',x:100},{n:'達人',x:180},{n:'マスター',x:300},{n:'伝説',x:480}];
const CRAFTN=['木のスプーン','木のおもちゃ','木彫りのクマ','ゆり椅子','からくり箱','精霊の木像','伝説の大彫刻'];
const lifeRank=(p,k)=>{const x=((p&&p.life)||{})[k]||0;let r=0;for(let i=0;i<LR.length;i++)if(x>=LR[i].x)r=i;return r};
const isRPG=()=>!!(G&&G.story);
const lifeB=(p,k,st)=>isRPG()?1+lifeRank(p,k)*st:1;
function lifeXp(p,k,n){if(!p||!isRPG())return;p.life=p.life||{};p.life[k]=(p.life[k]||0)+n}
function toggleLife(){const el=$('lifeCard');if(!isRPG()){el.hidden=true;return}el.hidden=!el.hidden;lifeHud(true)}
$('lifeBtn').addEventListener('click',toggleLife);
let _lhT=0;function lifeHud(force){const me=G&&(G.players[G.me]||G.players[0]);if(!me)return;const rpg=isRPG(),lb=$('lifeBtn');if(lb&&lb.hidden===rpg)lb.hidden=!rpg;if(!rpg){$('lifeCard').hidden=true;return}
  if(!me._lr){me._lr={};for(const k of LIVES)me._lr[k]=lifeRank(me,k)}
  for(const k of LIVES){const r=lifeRank(me,k);if(r>me._lr[k]){me._lr[k]=r;banner(`${LIFE[k].n} ランクUP！`,`「${LR[r].n}」になった`,LIFE[k].b(r),'r-SSR',true);SFX.ssr();burst(me.x,me.y,40,30,{c:['#ffd23f','#ffffff','#8ff08f'],s0:60,s1:220,u0:150,u1:320,l0:.6,l1:1.1,add:true,r0:5,r1:9})}else if(r<me._lr[k])me._lr[k]=r}
  const el=$('lifeCard');if(el.hidden)return;const now=performance.now();if(!force&&now-_lhT<300)return;_lhT=now;
  if(statusTab(me))return;$('rpgBox').innerHTML=rpgBoxHtml(me);$('lifeRows').innerHTML=LIVES.map(k=>{const r=lifeRank(me,k),x=(me.life||{})[k]||0,nx=LR[r+1],pr=nx?Math.round(100*(x-LR[r].x)/(nx.x-LR[r].x)):100;const L=LIFE[k];
    const un=(UNL[k]||[]).find(u=>u[0]>r);return `<div class="lr"><span class="ic" style="background:${L.c}">${L.k}</span><span><b>${L.n}</b> <span class="rk">${LR[r].n}</span></span><span style="opacity:.7">${L.b(r)}</span><span class="pb"><i style="width:${pr}%"></i></span>${un?`<small style="grid-column:2/4;color:#8a5a30">次：「${LR[un[0]].n}」で${un[1]}</small>`:''}</div>`}).join('')}
const snowy=()=>!!(G&&(wxIs('blizzard')||G.wave));
// ---- workshop bench by the fire: timing craft during storms
const WB={x:1330,y:1145};
function makeBench(){const g=new T.Group(),wood=std('#a8743f',{map:TEX.wood}),dk=std('#6e4524',{map:TEX.wood});g.add(at(rbox(64,6,34,2,wood),0,24,0));for(const [x,z] of [[-26,-12],[26,-12],[-26,12],[26,12]])g.add(at(box(5,24,5,dk),x,12,z));
  g.add(at(rot(cyl(5,5,26,std('#8a5a30',{map:TEX.bark}),8),0,0,Math.PI/2),-10,31,0),at(box(12,14,10,std('#c9a24a',{m:.5,r:.5})),16,33,2),at(rot(box(3,3,22,std('#3a3f48',{m:.6,r:.4})),0,.6,0),12,28,-8));
  g.add(at(box(22,14,14,std('#3a3f48',{m:.6,r:.4})),-44,7,6),at(box(30,6,14,std('#4a5058',{m:.6,r:.4})),-44,17,6));if(KK&&KK.prop&&KK.prop.Hammer_Small){const hm=KK.prop.Hammer_Small.scene.clone(true);hm.scale.setScalar(18/Math.max(1,KK.prop.Hammer_Small.h));hm.position.set(-44,21,6);hm.rotation.z=Math.PI/2;g.add(hm)}const sign=makeTextPlate('工房・鍛冶台',84,20,'#fff7ea','#8a5a30',.45);sign.position.set(0,58,-6);g.add(sign);g.position.set(WB.x,0,WB.y);g.rotation.y=-.6;world.add(g);G.benchV=g}
const craftV=()=>{const u=(G.t*1.25)%2;return u<1?u:2-u};
function craftGrade(){const v=craftV(),dv=Math.abs(v-.5);return dv<.07?2:dv<.17?1:0}
function updateCraft(dt){if(!isRPG()){for(const p of G.players)p.ePress=false;return}const on=snowy();for(const p of G.players){if(!p.ePress)continue;p.ePress=false;if(!on||p.down>0||dist(p.x,p.y,WB.x,WB.y)>80||!take(p,'log'))continue;
  const gr=p.eGrade||0,rk=lifeRank(p,'craft');p.cc=gr===2?(p.cc||0)+1:0;const base=(6+G.level*1.6)*(G.mod?G.mod.price:1)*(1+.15*rk);const val=Math.round(base*[.4,1.2,2.2][gr]*(1+Math.min(5,p.cc)*.1));
  G.cash+=val;G.earned+=val;lifeXp(p,'craft',[1,2,3][gr]);G.stats.craft=(G.stats.craft||0)+1;cnt(p,'carve');if(gr===2)cnt(p,'great');
  float(WB.x,WB.y,80,`${['しっぱい…','いい出来！','会心の出来！'][gr]} ${CRAFTN[Math.min(CRAFTN.length-1,rk)]} +$${val}${p.cc>1?`（${p.cc}連続）`:''}`,gr===2?'gold':gr?'cash':'red',gr===2);
  if(gr===2){SFX.rare();burst(WB.x,WB.y,40,16,{c:['#ffd23f','#ffffff'],s0:40,s1:160,u0:100,u1:240,l0:.4,l1:.8,add:true})}else if(gr)SFX.coin(2);else SFX.bad()}}
// ---- snow drifts pile up inside the town during storms
function driftMesh(d){const g=new T.Group(),m=std(DES()?'#e2c08a':'#f4f8fc',{r:.95});g.add(at(scl(sph(24,m,false,12,8),1.3,.55,1),0,0,0),at(scl(sph(16,m,false,10,6),1,.7,1),14,4,8),at(scl(sph(14,m,false,10,6),1,.6,1),-14,2,-6));
  g.add(at(rot(cyl(1.4,1.4,34,std('#8a5a30',{map:TEX.wood}),6),.5,0,.3),10,20,0),at(rot(box(10,1.5,12,std('#9aa3ad',{m:.6,r:.4})),.5,0,.3),16,6,2));g.position.set(d.x,0,d.y);g.scale.setScalar(.01);world.add(g);d.mesh=g}
function updateDrifts(dt){G.drifts=G.drifts||[];const on=snowy();G.driftT=(G.driftT||2)-dt;
  if(on&&G.driftT<=0&&G.drifts.length<9){G.driftT=rnd(2.5,4.5);let x=0,y=0,ok=false;for(let t=0;t<25&&!ok;t++){const a=rnd(0,TAU),r=rnd(130,FR-50);x=CX+Math.cos(a)*r;y=CY+Math.sin(a)*r;ok=!(G.pads.some(p=>Math.abs(p.x-x)<58&&Math.abs(p.y-y)<58)||G.drifts.some(q=>dist(q.x,q.y,x,y)<80)||dist(x,y,WB.x,WB.y)<80||Object.values(STN).some(q=>dist(q.conv.x,q.conv.y,x,y)<80||dist(q.counter.x,q.counter.y,x,y)<95)||G.players.some(p=>dist(p.x,p.y,x,y)<60))}
    if(ok){const d={id:++G.nid,x,y,p:0,s:rnd(.9,1.3)};G.drifts.push(d);if(!G.driftTold){G.driftTold=1;toast(DES()?'町に砂がたまってきた！ そばに立つと砂かき（燃えにくくなる）':'町に雪がふきだまってきた！ そばに立つと雪かきできる（放っておくと火が弱る）','cold')}}}
  for(const d of G.drifts){const near=G.players.filter(p=>!(p.down>0)&&!p.riding&&dist(p.x,p.y,d.x,d.y)<46+18*d.s).length;
    if(near){d.p+=dt*near;if(d.p>=1.3){d.dead=1;const v=Math.round((4+G.day*1.2)*(G.mod?G.mod.price:1));G.cash+=v;G.earned+=v;float(d.x,d.y,50,`${DES()?'砂':'雪'}かき +$${v}`,'cash');const r=Math.random();if(r<.25)dropItem(d.x,d.y,'log');else if(r<.33)dropItem(d.x,d.y,'meat');
      burst(d.x,d.y,10,22,{c:DES()?['#e2c08a','#fff1c9']:['#ffffff','#dff3ff'],s0:60,s1:200,u0:120,u1:280,l0:.5,l1:.9,r0:5,r1:10});SFX.chop();G.stats.shovel=(G.stats.shovel||0)+1}}
    else d.p=Math.max(0,d.p-dt*.3);if(!on){d.melt=(d.melt||0)+dt;if(d.melt>25)d.dead=1}}
  for(const d of G.drifts)if(d.dead&&d.mesh)world.remove(d.mesh);G.drifts=G.drifts.filter(d=>!d.dead)}
function driftFx(){if(!G||!G.drifts)return;const me=G.players[G.me]||G.players[0];for(const d of G.drifts){if(!d.mesh)driftMesh(d);const g=d.mesh;g.userData.g=Math.min(1,(g.userData.g||0)+.03);g.scale.setScalar(d.s*g.userData.g*(1-.55*clamp(d.p/1.3,0,1)));
    if(me&&dist(me.x,me.y,d.x,d.y)<170)label(d.x,d.y,48,d.p>0?bar(100*d.p/1.3,'blue'):`<small>${DES()?'砂':'雪'}かき</small>`,'')}}
// ---- stories by the fire during storms
const TALES=['昔、この谷は一年中あたたかい緑の土地だった。雪なんて、年に一度降るかどうかだったのさ','冬が明けなくなったのは、南の砂漠で“何か”が掘り出された年からだと言われている','白い狼たちは、もともと北の果ての山にしか住んでいなかった。冬と一緒に降りてきたんだ','火を絶やすな。火は人を集め、人は町をつくる。それがこの土地の教えだよ','オーロラの夜には、昔の人の声が聞こえるそうだ。“心臓を眠らせよ”ってね','砂漠の民は、冬の心臓を“青い太陽”と呼んで恐れていたらしい'];
function updateFireside(dt){if(!isRPG())return;const on=snowy();const key=G.day+(G.wave?'w':'b');for(const p of G.players){if(p.down>0||!on||dist(p.x,p.y,CX,CY)>175){p.taleT=0;continue}p.taleT=(p.taleT||0)+dt;
    if(p.taleT>4&&G.taleKey!==key){G.taleKey=key;const i=(G.stats.tales||0)%TALES.length;G.stats.tales=(G.stats.tales||0)+1;say(DES()?'隊長ザラ':'村長オルガ',TALES[i]);if(!G.taleEnd)G.pm.dmg+=.25;G.taleEnd=G.t+G.DAY;banner('焚き火の昔話','みんなの攻撃力 +25%','明日のこの時間まで','area');SFX.rare()}}
  if(G.taleEnd&&G.t>G.taleEnd){G.taleEnd=0;G.pm.dmg=Math.max(0,G.pm.dmg-.25);toast('昔話の元気が切れた','cold')}}
function fireFx(){if(!G||!running)return;if(G.benchV)G.benchV.visible=isRPG();if(!isRPG()){if(snowy()&&!G.wxDisc){G.wxDisc=1;toast('吹雪の間は大工仕事がはかどる：建設費20%オフ','gold')}if(!snowy())G.wxDisc=0;return}const me=G.players[G.me]||G.players[0];if(!me)return;const on=snowy();
  const dw=dist(me.x,me.y,WB.x,WB.y);if(dw<170){if(!on)label(WB.x,WB.y,70,'<b>工房</b><br><small>Eキーで装備を作る（特別な木材や素材を使う）</small>','');
    else if(!has(me,'log'))label(WB.x,WB.y,70,'<b>工房</b><br><small>Eキーで装備を作る・薪があれば吹雪の内職</small>','');
    else label(WB.x,WB.y,76,`<b>工房</b> 緑でEキー！（Qで装備づくり）<div class="cbar"><i style="left:${(craftV()*100).toFixed(1)}%"></i></div>`,'')}
  if(on&&dist(me.x,me.y,CX,CY)<175&&dw>=170&&G.taleKey!==G.day+(G.wave?'w':'b'))label(CX,CY,150,`<small>焚き火のそばにいると、${DES()?'ザラ':'オルガ'}が昔話をしてくれる…</small>`,'')}

