// ================================================================ story mode (chapters + morning autosave)
var gameMode=store.get('mw-mode','story');var SAVE_K='mw-story1';
var CH={1:{n:'第1章',t:'ホワイトアウト',play:true,open:['暦の上では、もう夏至を過ぎた。','それなのに、この町の雪は\n一日もやんだことがない。','吹雪は家々を押しつぶし、\n人々は散り散りになった。','残っていたのは、村長オルガと、\n消えかけたひとつのかまどだけ――','瓦礫を片付け、町を建て直し、\nもう一度みんなを呼び戻そう。'],sub:'瓦礫を片付けて町を建て直し、散り散りになった仲間を呼び戻せ（Jキー：手がかり帳）',
  intro:[['村長オルガ','よく来てくれた…見てのとおり、町は吹雪でぼろぼろさ'],['村長オルガ','まずは広場の瓦礫を片付けて、かまどに薪をくべておくれ'],['村長オルガ','家や店が直れば、散り散りになったみんなも、きっと戻ってくる']],
  outro:'像のまわりで、みんなが久しぶりに笑った。\nけれど、冬は終わらない。\n\n斥候カイ「北の山で、家より大きな白い影を見た。狼どもは、あいつに従って動いてる…」\n\n洞窟で拾った古い手記には、町を作った男「ヨルン」の名があった。\n――この冬には、理由がある。'},
 2:{n:'第2章',t:'白き王',play:true,open:['像が完成した夜から、ひと月。','北の山から、\n地鳴りのような足音が近づいてくる。','狼たちを束ねる“白き王”。\nなぜ獣たちは、この町ばかりを狙うのか――'],sub:'白き王の正体と、狼がこの町を狙う理由をつきとめろ',
  intro:[['斥候カイ','北の山で見た白い影…狼どもを束ねる“王”がいる'],['斥候カイ','妙なんだ。狼どもは、獲物の多い南の谷じゃなく、わざわざこの町を目指してくる'],['村長オルガ','去年より冬も厳しい。まずは守りを固めよう。見張り台を強くしておくれ']],
  outro:'白き王は、灯台の光の下で雪に崩れ落ちた。\n額から転がり落ちた青いかけらは、なぜか町の中心へ引かれるように震えていた。\n\n氷河の手記にはこうあった。「石は、町でいちばん温かい場所に眠らせた」――\n\n村長オルガ「……南の砂の向こうに、冬の原因があると聞いたことがある。ただの言い伝えさ」\n\n一行は、南への道の雪をかきわけはじめた。'},
 3:{n:'第3章',t:'南への道',play:true,desert:true,open:['雪をかきわけ、たどり着いたのは――\n灼熱の砂の町、ラズール。','昼は焼けるように暑く、\n夜は凍えるほど寒い。','この砂漠もまた、\n季節を失っていた。','町の外には、果てしない砂の海。\n古い神殿が、どこかに眠っているという。'],sub:'砂漠を旅して、100年前に何があったのかをつきとめろ',
  intro:[['斥候カイ','ここが砂の町ラズールか…昼は焼けるように暑いのに、夜は凍えるほど寒い'],['斥候カイ','まずは町の隊長に話を聞こう。のどが渇いたら井戸のそばで休むんだ']],
  outro:'流砂の谷の主は、砂の底へと静かに沈んでいった。\n星の壁画が語っていた――100年前、北の男が神殿の「陽の石」を奪った、と。\n男の指輪には、雪の結晶と炎の紋章。\n\n隊長ザラ「石が台座に戻れば、北にも南にも季節が戻る。……頼んだよ、北の旅人」\n\n斥候カイ「かけらは、町に近づくほど震えてた。石は――俺たちの町にある」'},
 4:{n:'第4章',t:'帰郷',play:true,open:['砂の町で知った、100年前の盗み。','奪われた「陽の石」は、\n北の町へ持ち去られた。','けれど町の誰も、\nそんな話はしなかった――','手がかりを集め、\n石の隠し場所をつきとめろ。'],sub:'町のみんなに話を聞き、「冬の心臓」の隠し場所を推理しろ',
  intro:[['斥候カイ','帰ってきたな…さっそく町のみんなに話を聞こう'],['斥候カイ','頭に緑の“？”が出ている人が、何か知ってるはずだ']],
  outro:'心臓――陽の石が南への道を越えたとき、北の空の雲が、はじめて割れた。\n\n石が台座に戻った朝、砂漠には100年ぶりの雨が降り、\n北の町の軒先から、つららが一粒ずつ落ちはじめた。\n\n村長オルガ「祖父がほしかった夏は、盗まなくても、ちゃんと巡ってくるんだね」\n\n――めちゃホワイト　完'},
 5:{n:'エピローグ',t:'春の町',play:true,open:['冬が終わった。','雪どけの町で、\nかまどの火は今日も燃えている。'],sub:'ここからは自由に遊べる。春の町でのんびり暮らそう',intro:[['村長オルガ','おかえり。春の町へようこそ']]}};
const FP=()=>{const r=ZONES[1].rect;return{x:(r[0]+r[2])/2,y:(r[1]+r[3])/2}};
const stx=o=>typeof o.t==='function'?o.t():o.t;
const kingOf=()=>G.bears.find(b=>b.king&&!b.dead);
const RUIN={x:520,y:330};
const SOBJ={3:[
  {t:'砂の町ラズールの隊長ザラに話を聞け',f:()=>[G.story.zara?1:0,1],tg:()=>({x:1120,y:1085,h:70})},
  {t:'東のオアシスの遊牧民キャンプへ行け',f:()=>[G.story.camp?1:0,1],tg:()=>({x:CAMP.x,y:CAMP.y,h:80}),on:()=>{say('斥候カイ','東のオアシスか。のどが渇いたら、オアシスの水辺で休もう')}},
  {t:'遊牧民の長ハミドの話を聞け',f:()=>[G.story.hamid?1:0,1],tg:()=>({x:1950,y:1040,h:70})},
  {t:'北西の古代遺跡を調べろ',f:()=>[G.story.ruin?1:0,1],tg:()=>({x:RUIN.x,y:RUIN.y,h:80}),on:()=>{say('斥候カイ','陽の石…ヨルンの手記に出てきた石だ。北西の遺跡へ行こう');say('斥候カイ','途中でキラキラ光る砂を見つけたら、掘ってみるといい')}},
  {t:'遺跡の「星の床」の謎を解け',f:()=>[hasClue('c8')?1:0,1],tg:()=>({x:SF.x,y:SF.y,h:40}),on:()=>{addClue('c7');say('斥候カイ','台座が空っぽだ…ここに石があったのか');say('斥候カイ','床に星の模様がある。そばの石板に何か書いてあるぞ')}},
  {t:'流砂の谷の主・巨大サンドワームをたおせ',p:()=>{const b=G.bears.find(b=>b.id===G.story.worm&&!b.dead);return b?`HP ${Math.ceil(b.hp)}`:'南西の谷'},f:()=>[G.story.wend?1:0,1],tg:()=>{const b=G.bears.find(b=>b.id===G.story.worm&&!b.dead&&!b.hide);return b?{x:b.x,y:b.y,h:110}:{x:VALLEY.x,y:VALLEY.y,h:90}},on:()=>{say('斥候カイ','石を奪った男の紋章は、雪の結晶と炎…俺たちの町だ');say('遊牧民の長ハミド','神殿の番人は、石を失って谷の主になり果てた。あやつを鎮めねば、この砂漠の怒りはおさまらん');say('斥候カイ','南西の流砂の谷だ。行こう！')}}],
2:[
  {t:'見張り台を3つともLv2にしろ',f:()=>[TOWERS.filter(t=>G.lv['tw_'+t.id]>=2).length,3],tg:()=>{const t=TOWERS.find(t=>G.lv['tw_'+t.id]<2);return t?{x:t.x,y:t.y,h:50}:null}},
  {t:'襲撃の夜を2回しのぎ、町の悩みを2つ解決しろ',p:()=>`襲撃 ${Math.min(2,G.story.raids||0)}/2・悩み ${Math.min(2,solvedN('snow'))}/2`,f:()=>[Math.min(2,G.story.raids||0)+Math.min(2,solvedN('snow')),4],on:()=>{G.story.raids=0;say('斥候カイ','守りはできた。群れの動きを見たい。2晩しのいでくれ')}},
  {t:'奥地の森で巨大な足跡を調べろ',f:()=>[G.story.fp?1:0,1],tg:()=>Object.assign(FP(),{h:60}),on:()=>{say('斥候カイ','群れは、まっすぐ町の真ん中を目指してくる。まるで何かに引き寄せられてるみたいだ');say('斥候カイ','奥地の森に、王の足跡があるはずだ。光っている場所を調べてきてくれ')}},
  {t:'王の手下（ボスオオカミ）をたおせ',f:()=>[G.story.minion&&!G.bears.some(b=>b.id===G.story.minion&&!b.dead)?1:0,1],tg:()=>{const b=G.bears.find(b=>b.id===G.story.minion&&!b.dead);return b?{x:b.x,y:b.y,h:70}:null},on:()=>{say('斥候カイ','…でかい。しかも足跡は森の南の氷河から続いてる。気をつけろ、手下が来るぞ！')}},
  {t:'凍てつく氷河の「光の祭壇」を調べろ（鏡の謎）',f:()=>[hasClue('c6')?1:0,1],tg:()=>G.zones.C?{x:MR.alt.x,y:MR.alt.y,h:60}:null,on:()=>{say('斥候カイ','手下の足跡は、森の南の「凍てつく氷河」へ続いてた');say('斥候カイ','氷河の奥に祭壇があるらしい。氷の鏡で光を導く仕掛けだそうだ')}},
  {t:()=>{const g=goalOf(2);return `${g.n}を建てろ（かまどLv${g.lv}・町人${g.pop}人）`},p:()=>`$${goalOf(2).c.toLocaleString()}`,f:()=>[G.monument?1:0,1],tg:()=>({x:MON.x,y:MON.y,h:60}),on:()=>{say('斥候カイ','ヨルンの手記…「石は、町でいちばん温かい場所に眠らせた」？ どういう意味だ…');say('村長オルガ','……それより王だよ。王は光を嫌うという言い伝えがある。氷の大灯台を建てて、おびき出そう')}},
  {t:'白き王をたおし、灯台を守れ',p:()=>{const k=kingOf();return k?`王 HP ${Math.ceil(k.hp)}`:'今夜'},f:()=>[0,1],tg:()=>{const k=kingOf();return k?{x:k.x,y:k.y,h:90}:null},on:()=>{say('斥候カイ','灯台の光に王が気づいた…今夜、来るぞ！')}}],
4:[
  {t:'町のみんなに話を聞け（緑の“？”）',f:()=>[['t_gordon','t_mina','t_borg'].filter(hasClue).length,3],tg:()=>{const n=NPCS.snow.find(n=>CLUES['t_'+n.id]&&!hasClue('t_'+n.id));return n?{x:n.x,y:n.y,h:70}:null}},
  {t:'冬の心臓の隠し場所を推理しろ（Jキー→推理する）',f:()=>[G.story.deduced?1:0,1],on:()=>{say('斥候カイ','手がかりはそろった。手がかり帳（Jキー）を開いて、推理してみよう')}},
  {t:'村長オルガと話せ',f:()=>[G.story.olga?1:0,1],tg:()=>({x:1085,y:890,h:70}),on:()=>{say('斥候カイ','かまどの下…町の真ん中じゃないか。オルガさんは、何か知ってるはずだ')}},
  {t:'かまどのそばに立ち、火を落として地下を調べろ',f:()=>[G.story.dig?1:0,1],tg:()=>({x:CX,y:CY,h:110}),on:()=>{say('村長オルガ','100年守ってきた火だ。……でも、もういい。落としておくれ')}},
  {t:'心臓の番人をたおせ',f:()=>[G.story.gdead?1:0,1],p:()=>{const b=G.bears.find(b=>b.id===G.story.guard&&!b.dead);return b?`HP ${Math.ceil(b.hp)}`:''},tg:()=>{const b=G.bears.find(b=>b.id===G.story.guard&&!b.dead);return b?{x:b.x,y:b.y,h:90}:null}},
  {t:'冬の心臓を「南への道」の入口まで運べ',f:()=>[G.story.hs===3?1:0,1],tg:()=>{const S=G.story;return S.hs===1?{x:ROAD.x,y:ROAD.y,h:90}:{x:S.hx||CX,y:S.hy||CY,h:60}},on:()=>{say('斥候カイ','石を南へ返そう。心臓を持って、北東の「南への道」まで運ぶんだ！')}},
  {t:'最後の夜：心臓を追う群れから町を守れ',p:()=>'今夜',f:()=>[0,1],on:()=>{G.finalPending=true;say('斥候カイ','カイが心臓を砂の町へ運んでいく。狼どもは最後の悪あがきだ…今夜を守りきれ！')}}]};
const TALKQ=[];let talkT=0;
function say(who,txt,local){if(TALKQ.length<8)TALKQ.push([who,txt]);if(!local&&NET.mode==='host'){NET.outS=NET.outS||[];if(NET.outS.length<6)NET.outS.push([who,txt])}}
function tickTalk(dt){const el=$('talk');if(!el)return;if(!running){el.hidden=true;talkT=0;TALKQ.length=0;return}if(talkT>0){talkT-=dt;if(talkT<=0)el.hidden=true}
  if(talkT<=0&&TALKQ.length){const [w,t]=TALKQ.shift();$('talkWho').textContent=w;$('talkTxt').textContent=t;el.hidden=true;void el.offsetWidth;el.hidden=false;talkT=Math.max(3.4,t.length*.14)}}
function startLabel(room){let db=0;try{db=dbgBio}catch(_){}if(gameMode!=='story'||db)return room?'部屋を作って始める':'火を灯す';const d=store.get(SAVE_K,null);return (d?'つづきから':'第1章をはじめる')+(room?'（部屋を作る）':'')}
function modeUI(){const st=gameMode==='story';$('mStory').setAttribute('aria-pressed',st);$('mFree').setAttribute('aria-pressed',!st);const d=store.get(SAVE_K,null),el=$('storyLine');
  if(st){el.hidden=false;const C=d?(CH[d.story.ch]||CH[3]):CH[1];el.innerHTML=d?`つづき：<b>${C.n}「${C.t}」</b>　DAY ${d.day}${d.fresh?'（章のはじめ）':'の朝から'}`:'はじめから：<b>第1章「ホワイトアウト」</b><br>何日かに分けて遊べる。朝になるたび自動でセーブ';$('storyReset').hidden=!d;$('storyReset').textContent='ものがたりを最初からやり直す'}
  else{el.hidden=true;$('storyReset').hidden=true}
  $('dSeg').style.display=st&&d?'none':'';netLine()}
$('mStory').addEventListener('click',()=>{gameMode='story';store.set('mw-mode',gameMode);modeUI()});
$('mFree').addEventListener('click',()=>{gameMode='free';store.set('mw-mode',gameMode);modeUI()});
$('storyReset').addEventListener('click',e=>{const b=e.currentTarget;if(!b.dataset.sure){b.dataset.sure='1';b.textContent='本当に消す？（もう一度押すと消えます）';setTimeout(()=>{delete b.dataset.sure;modeUI()},4000);return}delete b.dataset.sure;try{localStorage.removeItem(SAVE_K)}catch(_){}toast('ものがたりを最初からにしました','cold',true);modeUI()});
setTimeout(()=>{try{modeUI()}catch(_){}},0);
function saveData(){return{v:1,seed:G.seed,diff:G.diff,year:G.year,day:G.day,cash:Math.floor(G.cash),earned:Math.floor(G.earned),rep:G.rep,fuel:Math.max(45,G.fuel),woodpile:G.woodpile,level:G.level,rank:G.rank||0,
  zones:Object.assign({},G.zones),lv:Object.assign({},G.lv),pm:Object.assign({},G.pm),stats:Object.assign({},G.stats),raidWins:G.raidWins,mission:G.mission,perk:Object.assign({},G.perkCount),yb:G.yearBonus||0,mg:G.metaGiven||0,
  sec:G.secrets?G.secrets.map(q=>q.found?1:0):[],secS:G.secretS||0,stele:G.stele||0,pl:[0,1].map(i=>G.players[i]&&!(NET.mode==='host'&&i===1&&!NET.guestPeer)?{lv:Object.assign({},G.players[i].lv),life:Object.assign({},G.players[i].life||{}),rl:G.players[i].rl||1,rx:G.players[i].rx||0,mats:Object.assign({},G.players[i].mats||{}),cnt:Object.assign({},G.players[i].cnt||{}),chd:(G.players[i].chd||[]).slice(),items:(G.players[i].items||[]).slice(),eq:Object.assign({},G.players[i].eq||{}),food:(G.players[i].food||[]).slice(),istar:Object.assign({},G.players[i].istar||{})}:(G.savePl&&G.savePl[i])||null),
  wk:G.workers.map(w=>({r:w.role,st:w.st?w.st.id:null,tw:w.tw,slot:w.slot})),surv:G.surv.filter(q=>!q.frozen&&q.arrived).length,sleds:G.sleds.length,mon:G.monument?1:0,
  story:JSON.parse(JSON.stringify(G.story)),biome:G.biome||0,at:Date.now()}}
function snapSave(){if(!G||!G.story||NET.mode==='guest'||!running)return;store.set(SAVE_K,saveData())}
function storyNew(np,seed){seed=seed||(1+((Math.random()*1e9)|0));
  if(gameMode!=='story'||dbgBio){newGame(np,{seed,diff:gameDiff,biome:dbgBio});G.story=null;return seed}
  const d=store.get(SAVE_K,null);if(d&&d.v===1&&d.fresh&&d.story.ch===4&&d.biome){const h=store.get(SAVE_K+'-home',null);const st=JSON.parse(JSON.stringify(d.story));if(h){newGame(np,{seed:h.seed,diff:h.diff||0,biome:0});applySave(h);G.players.forEach((p,i)=>{if(d.pl&&d.pl[i]){p.life=Object.assign({},d.pl[i].life||{});rpgRestore(p,d.pl[i])}});G.year=(d.year||h.year||2);G.story=st;G.story.seen=G.story.seen||{};G.finalPending=false;G.raid.on=false;return h.seed}newGame(np,{seed,diff:d.diff||0});G.story=st;return G.seed}
  if(d&&d.v===1){if(d.fresh&&CH[d.story.ch]&&CH[d.story.ch].desert&&!d.biome){const sd=1+((Math.random()*1e9)|0);newGame(np,{seed:sd,diff:d.diff||0,biome:1});G.year=2;G.story=JSON.parse(JSON.stringify(d.story));keepGear(d.pl);G.story.seen=G.story.seen||{};return sd}newGame(np,{seed:d.seed,diff:d.diff||0,biome:d.biome||0});applySave(d);return d.seed}
  newGame(np,{seed,diff:gameDiff});G.story={ch:1,step:0,seen:{},raids:0,joined:[],rb:[]};for(const q of G.surv.splice(1))world.remove(q.m.g);G.baseCap=3;G.survT=40;return G.seed}
function applySave(d){G.year=d.year||1;G.day=d.day;G.t=(d.day-1)*G.DAY+.5;G.cash=d.cash;G.earned=d.earned;G.rep=d.rep;G.fuel=d.fuel;G.woodpile=d.woodpile||0;G.level=d.level;G.rank=d.rank||0;
  Object.assign(G.lv,d.lv);Object.assign(G.pm,d.pm);Object.assign(G.stats,d.stats);G.raidWins=d.raidWins||0;G.mission=d.mission;G.perkCount=d.perk||{};G.yearBonus=d.yb;G.metaGiven=d.mg;G.savePl=d.pl;G._dm=null;
  if(G.secrets&&d.sec)G.secrets.forEach((q,i)=>{if(d.sec[i]){q.found=true;if(q.m)q.m.visible=false}});G.secretS=d.secS||0;G.stele=d.stele||0;
  if(DES()){G.year=d.year}for(const z of ZONES)if(d.zones[z.id]){G.zones[z.id]=true;z.fogT=1;z.fog.visible=false;z.sign.visible=false;for(const id in G.stations){const st=G.stations[id];if(st.def.zone===z.id){st.open=true;st.unlockT=0;st.parts.forEach(o=>o.visible=true);if(st.sign)st.sign.visible=false}}if(z.id==='D'){G.spa.on=true;G.spa.fuel=40}if(z.id==='C'){G.bossT=60;for(let i=0;i<4;i++)spawnBear('C',true)}}
  for(const q of G.surv)world.remove(q.m.g);G.surv.length=0;const need=(d.wk||[]).length+(d.surv||0);for(let i=0;i<need;i++)spawnSurvivor(true);
  for(const w of d.wk||[]){if(!hire(w.r,{x:CX,y:CY+80},w.st||undefined))continue;const nw=G.workers[G.workers.length-1];if(w.tw!=null)nw.tw=w.tw;if(w.slot!=null)nw.slot=w.slot}
  while(G.sleds.length<(d.sleds||0))G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});
  G.players.forEach((p,i)=>{if(d.pl&&d.pl[i]){p.lv=Object.assign({gun:0,bag:0},d.pl[i].lv);p.life=Object.assign({},d.pl[i].life||{});rpgRestore(p,d.pl[i])}});
  G.story=JSON.parse(JSON.stringify(d.story));G.story.seen=G.story.seen||{};if(d.mon){G.monument=true;G.monV.visible=true;G.monV.scale.setScalar(.01);G.monPop=0;G.finalPending=true}
  if(G.story.ch===2&&G.story.step===3)G.story.minion=0;if(G.story.ch===3&&G.story.step===5){G.story.worm=0}if(G.story.ch===4&&G.story.step===4&&!G.story.gdead){G.story.step=3;G.story.dig=0;G.story.dg=0}if(G.story.ch===4)G.finalPending=G.story.step>=6;if(G.story.hs===1)G.story.hs=2;for(const k in (G.story.q||{})){const q=G.story.q[k];if(q.st===1&&QUESTS[k]&&QUESTS[k].type==='escort'){q.f=null;q.x=QUESTS[k].x;q.y=QUESTS[k].y}}G.story.king=0;G.story.back=!d.fresh}
// chapter 4: back to the snow town (its snapshot from the end of chapter 2), keeping everyone's gear from the desert
function keepGear(pl){if(pl)G.players.forEach((p,i)=>{if(pl[i]){p.life=Object.assign({},pl[i].life||{});rpgRestore(p,pl[i])}})}
function goHome(st){const h=store.get(SAVE_K+'-home',null),pl=saveData().pl,chars=G.charOf.slice(),diff=G.diff,seed=h?h.seed:1+((Math.random()*1e9)|0);if(NET.mode==='host'){NET.guestPeer=null;NET.endInfo=null}
  newGame(1,{seed,diff,biome:0,chars});if(h)applySave(h);G.players.forEach((p,i)=>{if(pl&&pl[i]){p.life=Object.assign({},pl[i].life||{});rpgRestore(p,pl[i])}});G.story=st;G.story.seen=G.story.seen||{};G.finalPending=false;G.raid.on=false;G.year=Math.max(G.year||1,3);
  if(NET.mode==='host')NET.room.presence({role:'host',seed,ch:meta.pick||'Rogue_Hooded',df:diff,bi:0,trip:1}).catch(()=>{});updateCam(0,true);hudInit();const d=saveData();d.fresh=0;store.set(SAVE_K,d)}
function storyIntro(){const S=G.story,C=CH[S.ch];if(!C)return;
  if(!S.seen.intro){S.seen.intro=1;const go=()=>{if(!running||G.story!==S)return;banner(C.n,C.t,C.sub,'area');setTimeout(()=>{if(running&&G.story===S)for(const [w,t] of C.intro||[])say(w,t)},1600);trackerFlash()};if(C.open){NET.opCh=S.ch;playOpening(C,go)}else setTimeout(go,1500);return}
  setTimeout(()=>{if(running&&G.story===S)banner(C.n,C.t,C.sub,'area')},3400);
  if(S.back)setTimeout(()=>{if(running&&G.story===S)say(DES()?'隊長ザラ':'村長オルガ',`おかえり。DAY ${G.day}の朝から続きだよ`)},4500)}
function custOK(id){if(!isRPG()||id!=='steak')return true;const S=G.story;return S.ch>=2||!!S.shopOpen}
function custFame(){if(!isRPG()||G.story.ch>=2)return 1;return clamp(.35+(G.stats.sold||0)*.025+(G.rank||0)*.2,.35,1)}
function storyRaidEnd(){if(G.story)G.story.raids=(G.story.raids||0)+1}
function beat(id,fn){const S=G.story;if(S.seen[id])return;S.seen[id]=1;fn()}
function spawnMinion(){spawnBoss('alpha');const b=G.bears[G.bears.length-1],f=FP();b.x=f.x+140;b.y=f.y+40;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*1.3);G.story.minion=b.id}
function spawnKing(){spawnRaider(true);const b=G.bears[G.bears.length-1];b.king=true;setBt(b,'king');b.hp=b.max=Math.round(b.max*3);b.m.g.scale.multiplyScalar(1.5);G.story.kingId=b.id;G.shake=18;
  setTimeout(()=>{if(running)banner('第2章','白き王が現れた！','巨大な王が灯台へ向かっている。囲んでたおせ','cold')},900);say('斥候カイ','あれが…白き王だ！ みんなで囲め！')}
function updateStory(dt){const S=G.story;if(!S)return;S.t=(S.t||0)+dt;const ph=(G.t%G.DAY)/G.DAY;
  if(S.ch===1){
    if(G.day>=2&&!isNight())beat('cal',()=>{say('村長オルガ','今朝、暦をめくって驚いたよ。……暦の上じゃ、もう夏至を過ぎてるんだ');say('村長オルガ','こんなに雪がやまない年は、わたしも初めてさ');addClue('c1')});
    if(isNight()&&G.day===1)beat('n1',()=>say('斥候カイ','日が落ちると一気に冷える。かまどのそばを離れるなよ'));
    if(G.day>=2&&ph>.45&&!isNight())beat('r1',()=>say('斥候カイ','北の森で狼どもがうろついてる。今夜あたり来るぞ。見張り台を建てておけ'));
    if(G.day>=1&&S.t>40)beat('q1',()=>{say('村長オルガ','町のみんなも、それぞれ困りごとを抱えてるんだ');say('村長オルガ','頭に“！”が出ている人に近づいて、Eキーで話しかけてごらん')});
    if(!S.shopOpen&&G.stations.steak.shelf>0)beat('shop',()=>{S.shopOpen=1;G.stations.steak.custT=14;say('村長オルガ','焼いた肉のいい匂いが、吹雪に乗って流れていく…');setTimeout(()=>{if(!running||G.story!==S)return;spawnCustomer(G.stations.steak);say('旅人','いい匂いにつられて来ちまった…一切れ売ってもらえないか？');toast('はじめてのお客さん！ レジに立って売ろう','gold')},3500)});
    if(S.shopOpen&&(G.stats.sold||0)>=1)beat('fame1',()=>{say('旅人','うまい！ この町の肉のこと、みんなに話しておくよ');say('村長オルガ','うわさが広まれば、お客さんはどんどん増えるはずさ')});
    if((G.stats.sold||0)>=15)beat('fame2',()=>say('村長オルガ','うわさが隣の村まで届いたらしい。行列ができはじめたね'));
    if(G.zones.B)beat('zB',()=>{say('村長オルガ','氷の湖か…昔はみんなで魚を焼いて冬を越したもんさ');say('斥候カイ','湖の南東に氷の洞窟がある。奥に、昔の人が封じた扉があるって話だ')});
    if(G.zones.C)beat('zC',()=>say('斥候カイ','奥地の森で妙な足跡を見た。家ほどもある…ただの狼じゃない'));
    if(G.zones.D)beat('zD',()=>say('村長オルガ','温泉が戻った！ これでみんな凍えずにすむ'));
    if(G.monument)beat('mon',()=>{say('村長オルガ','像ができた…町の灯りがよみがえったね');say('斥候カイ','待て、森が騒がしい。今夜は総出で来るぞ！')})}
  updateRebuild(dt);updatePuzzles(dt);updateCh4(dt);updateAdv(dt);updateTwins(dt);updateHidden(dt);updateGold(dt);
  const L=SOBJ[S.ch];if(!L)return;
  if(S.step===0&&!S.seen.s0&&S.t>9){S.seen.s0=1;L[0].on&&L[0].on()}
  if(S.ch===2){if(S.step===3&&S.minion){const mb=G.bears.find(b=>b.id===S.minion);if(mb&&!mb.bt)setBt(mb,'alpha')}const kb=G.bears.find(b=>b.king&&!b.dead);if(kb&&kb.bt!=='king')setBt(kb,'king')}
  if(S.ch===2){if(S.step===2&&!S.fp&&G.players.some(p=>dist(p.x,p.y,FP().x,FP().y)<95)){S.fp=1;burst(FP().x,FP().y,30,40,{c:['#9fe0ff','#ffffff'],s0:60,s1:220,u0:120,u1:320,l0:.6,l1:1.2,add:true})}
    if(S.step===3&&!S.minion)spawnMinion();
    if(S.step>=6&&G.raid.on&&G.raid.final&&!S.king){S.king=1;spawnKing()}}
  const o=L[S.step];if(o&&S.step<L.length-1){const [c,g]=o.f();if(c>=g){S.step++;const n=L[S.step];banner('目標達成！',stx(n),'','area');SFX.rare();n.on&&n.on();snapSave();trackerFlash()}}}
function storyHud(){const S=G.story,L=S&&SOBJ[S.ch];if(!L)return false;const i=Math.min(S.step||0,L.length-1),o=L[i],[c,g]=o.f();$('mN').textContent=`${CH[S.ch].n} ${i+1}/${L.length}`;$('mT').textContent=stx(o);$('mP').textContent=o.p?o.p():`${Math.min(c,g)}/${g}`;return true}
function storyT(gp){const S=G.story,L=S&&SOBJ[S.ch];if(!L)return null;const o=L[Math.min(S.step||0,L.length-1)];return o.tg?o.tg(gp):null}
function storyVis(){if(!G)return;ruinVis();const S=G.story,on=!!(S&&S.ch===2&&S.step===2&&!S.fp&&!DES());if(!on){if(G.fpV)G.fpV.visible=false;return}
  if(!G.fpV||!G.fpV.parent){const g=new T.Group(),f=FP();const pm=new T.MeshBasicMaterial({color:lin('#2e4f73'),transparent:true,opacity:.6,depthWrite:false});
    for(let i=0;i<9;i++){const m=M_(new T.CircleGeometry(1,20),pm,false);m.rotation.x=-Math.PI/2;m.scale.set(20,32,1);m.position.set(-260+i*62,1.2,(i%2?-26:26));m.rotation.z=Math.PI/2;g.add(m);
      for(const t of [-1,0,1]){const c=M_(new T.CircleGeometry(1,10),pm,false);c.rotation.x=-Math.PI/2;c.scale.setScalar(6);c.position.set(-260+i*62+30,1.3,(i%2?-26:26)+t*14);g.add(c)}}
    const beam=M_(new T.CylinderGeometry(46,46,620,20,1,true),new T.MeshBasicMaterial({color:lin('#9fe0ff'),transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=310;g.add(beam);g.userData.beam=beam;
    const sign=makeTextPlate('巨大な足跡',120,28,'rgba(255,250,240,.92)','#2e4f73',.5);sign.position.set(0,120,0);sign.userData.bb=true;g.add(sign);g.userData.sign=sign;
    g.position.set(f.x,0,f.y);world.add(g);G.fpV=g}
  G.fpV.visible=true;const t=performance.now()/1000;G.fpV.userData.beam.material.opacity=.16+Math.sin(t*2.2)*.08;G.fpV.userData.sign.quaternion.copy(camera.quaternion);G.fpV.userData.sign.position.y=120+Math.sin(t*1.6)*5}
function storyEnd(cleared,why){$('again').textContent='もう一度';show('again',true);$('endTitle').style.fontSize='';$('endMsg').style.whiteSpace='pre-line';if(!G.story)return;const C=CH[G.story.ch]||CH[3];
  if(cleared){$('endTitle').innerHTML=`<span style="display:block;font-size:.5em">${C.n}</span>${C.t}<em> 完</em>`;$('endTitle').style.fontSize='46px';show('again',false);$('endMsg').textContent=C.outro||$('endMsg').textContent;const N=CH[G.story.ch+1];$('cont').textContent=N&&N.play?`${N.n}「${N.t}」へ`:'このまま続ける（続きの章は制作中）';
    if(NET.mode==='guest')$('endBest').textContent='ホストが次の章に進むのを待っています…';
    else{if(G.story.ch===2)store.set(SAVE_K+'-home',saveData());const d=saveData();d.year=G.year+1;d.day=G.day+1;d.yb=(G.yearBonus||0)+15*G.year;d.mon=0;d.fuel=100;d.story={ch:G.story.ch+1,step:0,seen:{},raids:0,clues:(G.story.clues||[]).slice()};d.fresh=1;store.set(SAVE_K,d)}}
  else{$('endMsg').textContent+='\n\nものがたりは「今日の朝」から続けられる。';$('again').textContent=NET.mode==='guest'?'もう一度参加':'今日の朝からやり直す'}}

function startGame(){audioOn();
  if(nPlayers===2){if(!NET.room){toast('オンラインはこの環境では使えないので、1人で始めます','cold',true);NET.mode='solo';newGame(1)}
    else{const hp=hostPeerNow();if(hp&&hp.presence.seed){NET.mode='guest';NET.hostPeer=hp.peer;NET.hostSeed=hp.presence.seed;NET.hostMiss=0;newGame(2,{seed:hp.presence.seed,guest:true,chars:[hp.presence.ch||'Rogue_Hooded',altCh(hp.presence.ch||'Rogue_Hooded',meta.pick)],diff:hp.presence.df||0,biome:hp.presence.bi||0});NET.room.presence({role:'guest',x:G.players[1].x|0,y:G.players[1].y|0,d:0,ch:meta.pick||'Knight'}).catch(()=>{})}
      else{NET.mode='host';NET.guestPeer=null;NET.endInfo=null;const seed=1+((Math.random()*1e9)|0);const sd=storyNew(1,seed);NET.room.presence({role:'host',seed:sd,ch:meta.pick||'Rogue_Hooded',df:G.diff,bi:G.biome||0}).catch(()=>{})}}}
  else{NET.mode='solo';storyNew(1)}
  running=true;updateCam(0,true);show('title',false);show('end',false);show('perk',false);show('hud',true);show('bottom',true);show('side',true);hudInit();tq.length=0;checkAch();
  if(DES()&&!G.story)setTimeout(()=>{if(running)toast('砂漠：昼は動くほどのどが渇く。夜のうちに湧き水をくみ、キャラバンの注文に応えよう','cold',true)},6000);
  banner(DES()?'砂漠の町':'今回の町',`${G.mods[0].t}／${G.mods[1].t}`,`◎${G.mods[0].d}　✕${G.mods[1].d}`,'',true);setTimeout(()=>{if(running&&!G.story)toast('目標：町のシンボル像を建てろ','gold',true)},3200);
  if(NET.mode==='host')toast('部屋を作った！ 友達がこのページを開くと参加できる','gold',true);if(NET.mode==='guest')toast('友達の部屋に参加した！','gold',true);if(G.story&&NET.mode!=='guest')storyIntro()}
function settleShards(cleared){const earnedS=Math.round(Math.max(1,Math.floor(Math.sqrt(Math.max(0,G.earned))/7)+G.day+G.raidWins*2+(G.stats.haul||0)+(cleared?15*YR():0)+(G.yearBonus||0)+(G.secretS||0))*DM().sh),gainS=Math.max(0,earnedS-G.metaGiven);G.metaGiven=earnedS;meta.shards+=gainS;store.set('mw2-meta',meta);return gainS}
function endGame(cleared,why){if(NET.mode==='host'&&NET.guestPeer){NET.endInfo={c:cleared?1:0,w:why||''};sendSnap()}running=false;for(const j of joys)j.on=false;show('perk',false);
  best={day:Math.max(best.day,G.day),earned:Math.max(best.earned,Math.round(G.earned)),cleared:best.cleared||cleared,area:Math.max(best.area,1+Object.values(G.zones).filter(Boolean).length)};store.set('mw2-best',best);
  if(cleared&&NET.mode!=='guest')meta.diffOpen=Math.max(meta.diffOpen||0,Math.min(2,(G.diff||0)+1));if(cleared&&NET.mode==='guest')NET.yearWait=true;
  $('endTitle').innerHTML=cleared?`${YR()}年目<em>クリア！</em>`:why==='rep'?'お店が<em>閉店…</em>':'町が<em>凍りついた…</em>';
  $('endMsg').textContent=cleared?`${goalOf(YR()).n}が完成し、最後の夜を守りきった（${DM().n}）。次の冬はもっと厳しい…`:why==='rep'?'お客さんを待たせすぎて評判が0に。肉を切らさず、レジを空けないように。':'5人の生存者が凍りついた。燃料を切らさず、かまどを強化しよう。';
  $('endStats').innerHTML=[[`DAY ${G.day}`,'生き延びた日数'],[`$${Math.round(G.earned).toLocaleString()}`,'総売上'],[`${1+Object.values(G.zones).filter(Boolean).length}/4`,'解放エリア']].map(([v,l])=>`<div><b>${v}</b><small>${l}</small></div>`).join('');
  const gainS=settleShards(cleared);
  $('endShard').textContent=`★ 星のかけら +${gainS}（合計 ${meta.shards}）タイトルで強化できる`;
  $('endBest').textContent=`ベスト：DAY ${best.day}・$${best.earned.toLocaleString()}${best.cleared?'・町完成':''}`;$('endBadges').innerHTML=badgesHtml(G.newAch);show('cont',cleared&&NET.mode!=='guest');$('cont').textContent=`${YR()+1}年目へ（${DM().n}）`;if(cleared&&NET.mode==='guest')$('endBest').textContent='ホストが次の年に進むのを待っています…';show('end',true);show('hud',false);show('bottom',false);show('side',false);$('combo').hidden=true;$('feverFx').classList.remove('on');storyEnd(cleared,why)}
function toTitle(){if(NET.room&&NET.mode!=='solo')NET.room.presence({role:'idle',seed:null,x:null,y:null,d:null}).catch(()=>{});NET.mode='solo';NET.guestPeer=null;NET.hostPeer=null;running=false;for(const j of joys)j.on=false;show('end',false);show('perk',false);show('hud',false);show('bottom',false);show('side',false);$('combo').hidden=true;$('feverFx').classList.remove('on');$('banner').hidden=true;
  $('bestLine').textContent=best.day?`ベスト：DAY ${best.day}・総売上 $${best.earned.toLocaleString()}${best.cleared?'・町完成':''}　実績 ${ACH.filter(a=>ach.has(a.id)).length}/${ACH.length}`:'はじめての冬';
  $('metaN').textContent=meta.shards;renderDiff();newGame(1);updateCam(0,true);show('title',true);modeUI()}
function renderMeta(){$('metaN').textContent=$('metaN2').textContent=meta.shards;
  const up=META_UP.map(u=>{const l=mlv(u.id),mx=u.max||5,c=(u.cost||META_COST)[l];return `<div class="mrow"><i>${u.k}</i><div><b>${u.t}</b><span class="pips">${Array.from({length:mx},(_,k)=>`<s class="${k<l?'on':''}"></s>`).join('')}</span><small>${l?u.d(l):'まだ強化していない'}${l<mx&&mx>1?` → ${u.d(l+1)}`:''}</small></div><button data-u="${u.id}" ${l>=mx||meta.shards<c?'disabled':''}>${l>=mx?(mx>1?'MAX':'OK'):'★'+c}</button></div>`}).join('');
  const ch=META_CHARS.map(c=>{const own=meta.chars.includes(c.id),use=meta.pick===c.id;return `<div class="mrow"><i>${c.t[0]}</i><div><b>${c.t}</b><small>${CLS[c.id]?CLS[c.id].n+'：'+CLS[c.id].d:''}<br>${use?'使用中':own?'持っている':'買うと使える'}</small></div><button data-c="${c.id}" ${use||(!own&&meta.shards<c.c)?'disabled':''}>${use?'使用中':own?'使う':'★'+c.c}</button></div>`}).join('');
  const df=DIFFS.map((d,i)=>`<div class="mrow"><i>${['普','厳','獄'][i]}</i><div><b>${d.n}</b><small>${i<=meta.diffOpen?`解放済み・星のかけら×${d.sh}`:`「${DIFFS[i-1].n}」で1年目をクリアすると解放`}</small></div><button disabled>${i<=meta.diffOpen?'OK':'🔒'}</button></div>`).join('');
  $('mlist').innerHTML=`<p class="mh">強化</p>${up}<p class="mh">キャラ</p>${ch}<p class="mh">難易度</p>${df}`}
$('metaBtn').addEventListener('click',()=>{renderMeta();show('title',false);show('meta',true)});
$('metaClose').addEventListener('click',()=>{show('meta',false);show('title',true);$('metaN').textContent=meta.shards;renderDiff()});
$('mlist').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.u){const u=META_UP.find(q=>q.id===b.dataset.u),id=u.id,l=mlv(id),mx=u.max||5,c=(u.cost||META_COST)[l];if(l>=mx||meta.shards<c)return;meta.shards-=c;meta.up[id]=l+1}
  else if(b.dataset.c){const c=META_CHARS.find(q=>q.id===b.dataset.c);if(!meta.chars.includes(c.id)){if(meta.shards<c.c)return;meta.shards-=c.c;meta.chars.push(c.id)}meta.pick=c.id}
  store.set('mw2-meta',meta);audioOn();SFX.build();renderMeta()});
let gameBio=0,dbgBio=new URLSearchParams(location.search).get('start')==='desert'?1:0;
function dbgLine(){const el=$('dbgLine');if(el){el.hidden=!dbgBio;el.textContent='テスト：砂漠から始める（Shift+Dで切替）'}}
addEventListener('keydown',e=>{if(e.code==='KeyD'&&e.shiftKey&&!running){dbgBio=dbgBio?0:1;dbgLine();toast(dbgBio?'テスト：砂漠から始めます':'テスト：通常スタートに戻しました','gold')}});function renderBio(){const el=$('bSeg');if(!el)return;const op=meta.bioOpen||0;el.innerHTML=BIOS.map((b,i)=>`<button data-b="${i}" aria-pressed="${i===gameBio}" ${i>op?'disabled':''}>${i>op?'🔒 ':''}${b.n}</button>`).join('')}
function renderDiff(){renderBio();const el=$('dSeg');if(!el)return;el.innerHTML=DIFFS.map((d,i)=>`<button data-d="${i}" aria-pressed="${i===gameDiff}" ${i>meta.diffOpen?'disabled':''}>${i>meta.diffOpen?'🔒 ':''}${d.n}</button>`).join('')}
$('bSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-b]');if(!b||b.disabled)return;gameBio=+b.dataset.b;renderBio()});
$('dSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(!b||b.disabled)return;gameDiff=+b.dataset.d;renderDiff()});
function setPlayers(n){nPlayers=n;$('p1').setAttribute('aria-pressed',n===1);$('p2').setAttribute('aria-pressed',n===2);
  $('ctrlHint').innerHTML='移動：<b>WASD・矢印キー</b>／スマホは<b>画面をドラッグ</b><br>射撃・伐採・釣り・支払いは近づくだけで自動';netLine()}
$('p1').addEventListener('click',()=>setPlayers(1));$('p2').addEventListener('click',()=>setPlayers(2));
$('start').addEventListener('click',startGame);$('again').addEventListener('click',startGame);$('toTitle').addEventListener('click',toTitle);$('quit').addEventListener('click',toTitle);
function nextYear(){G.yearBonus=(G.yearBonus||0)+15*G.year;G.year++;G.monument=false;G.monPop=0;G.finalPending=false;G.raid.on=false;G.mission=MISSIONS.length;G.endless=false;NET.endInfo=null;
  const g=goalOf(G.year);banner(`${G.year}年目`,'もっと厳しい冬が来る',`寒さ・燃料・襲撃・食費が強くなった。目標：${g.n}（$${g.c.toLocaleString()}・町人${g.pop}人・かまどLv${g.lv}）`,'cold');SFX.wave()}
$('cont').addEventListener('click',()=>{nextYear();if(G.story){G.story={ch:G.story.ch+1,step:0,seen:{},raids:0,clues:(G.story.clues||[]).slice()};if(G.story.ch===4&&DES())goHome(G.story);else if(CH[G.story.ch]&&CH[G.story.ch].desert&&!DES()){const st=G.story,pl0=saveData().pl;startTrip();G.story=st;keepGear(pl0);G.year=2;const d=saveData();d.fresh=0;store.set(SAVE_K,d)}storyIntro()}running=true;show('end',false);show('hud',true);show('bottom',true);show('side',true)});
// adaptive quality: drop bloom and shadow resolution on slow devices
const QL=[{n:'低',pr:.7,sh:0,fx:0,decor:0,snow:.3},{n:'中',pr:1,sh:2048,fx:0,decor:.45,snow:.55},{n:'高',pr:Math.min(devicePixelRatio||1,2),sh:4096,fx:1,decor:1,snow:1}];
window.GQ=null;const GQ=window.GQ={mode:store.get('mw2-gfx','auto'),tier:2,snow:1};const FX0=composer;
function applyGfx(i){i=clamp(i,0,2);GQ.tier=i;const q=QL[i];GQ.snow=q.snow;PR=q.pr;renderer.setPixelRatio(PR);
  composer=q.fx&&FX0?FX0:null;renderer.outputEncoding=composer?T.LinearEncoding:T.sRGBEncoding;
  sun.castShadow=q.sh>0;if(q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  if(G&&G.decor)for(const im of G.decor){im.count=Math.floor(im.userData.n*q.decor);im.visible=im.count>0}
  for(const m of OUTS){if(!m.parent){OUTS.delete(m);continue}m.visible=i===2}resize();gfxLabel()}
function gfxLabel(){const b=$('gfx');if(b)b.textContent='画質：'+(GQ.mode==='auto'?'自動（'+QL[GQ.tier].n+'）':QL[GQ.tier].n)+(GQ.fps?` ・${GQ.fps}fps`:'')}
const GPU=(()=>{try{const gl=renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)):''}catch(e){return ''}})();
const SOFTGL=/SwiftShader|llvmpipe|softpipe|Software|Basic Render|Microsoft Basic/i.test(GPU);
let fpsT=0,fpsN=0;function tickFps(dt){fpsT+=dt;fpsN++;if(fpsT>=1){GQ.fps=Math.round(fpsN/fpsT);fpsT=0;fpsN=0;gfxLabel()}}
let perf={t0:0,f:0,skip:0};
function checkPerf(){tickFps(Math.min(.25,(performance.now()-(checkPerf.l||performance.now()))/1000));checkPerf.l=performance.now();if(!running||GQ.mode!=='auto'||GQ.tier===0){perf.t0=0;return}const now=performance.now();if(!perf.t0){perf.t0=now;perf.f=0;perf.skip=now+2000;return}if(now<perf.skip){perf.t0=now;perf.f=0;return}perf.f++;
  if(now-perf.t0>=3000){const fps=perf.f*1000/(now-perf.t0);perf.t0=now;perf.f=0;if(fps<46){applyGfx(GQ.tier-1);perf.skip=now+2000;toast(`重そうなので画質を「${QL[GQ.tier].n}」に下げました`,'cold')}}}

$('gfx').addEventListener('click',()=>{const order=['auto',2,1,0];GQ.mode=order[(order.indexOf(GQ.mode)+1)%4];store.set('mw2-gfx',GQ.mode);applyGfx(GQ.mode==='auto'?2:GQ.mode);perf={t0:0,f:0,skip:0};toast(GQ.mode==='auto'?'画質：自動（重いと自動で下げます）':'画質：'+QL[GQ.tier].n,'gold')});
function gpuWarn(){if(!SOFTGL)return;const el=$('gpuWarn');el.hidden=false;el.innerHTML='⚠ ブラウザの<b>グラフィックアクセラレーションがオフ</b>になっていて、とても重くなります。<br>Chromeの「設定 → システム →<br>グラフィック アクセラレーションが使用可能な場合は使用する」をオンにして再起動してね';setTimeout(()=>toast('グラフィックアクセラレーションがオフなので重いです（タイトル画面に直し方）','cold',true),1500)}
addEventListener('keydown',e=>{if(e.code==='KeyJ'&&!e.repeat&&running&&isRPG()&&!DLG.open&&!(e.target&&e.target.tagName==='INPUT')){const el=$('lifeCard');if(!el.hidden&&G._stab==='clue'){el.hidden=true}else{G._stab='clue';el.hidden=false;lifeHud(true)}return}if(e.code==='KeyL'&&!e.repeat&&running&&!(e.target&&e.target.tagName==='INPUT')){toggleLife();return}if(e.code==='KeyQ'&&!e.repeat&&running&&!DLG.open&&isRPG()){const me=G.players[G.me]||G.players[0];if(me&&dist(me.x,me.y,WB.x,WB.y)<90){openCraft();return}}if(DLG.open&&!e.repeat&&(e.code==='KeyE'||e.code==='Space'||e.code==='Enter'||/^Digit[1-9]$/.test(e.code))){dlgKey(e.code);e.preventDefault();return}if(e.code!=='KeyE'||e.repeat||!running)return;if(e.target&&e.target.tagName==='INPUT')return;const me=G.players[G.me]||G.players[0];if(!me)return;const nn=npcNear(me);if(nn){openTalk(nn);return}if(isRPG()&&dist(me.x,me.y,WB.x,WB.y)<90&&!(snowy()&&has(me,'log'))){openCraft();return}const gr=craftGrade();if(NET.mode==='guest'){NET.eCount=(NET.eCount||0)+1;NET.eGrade=gr}else{me.ePress=true;me.eGrade=gr}});
addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&running&&isRPG()&&!(e.target&&e.target.tagName==='INPUT'))skillPress()});
addEventListener('keydown',e=>{if(e.code!=='KeyF'||e.repeat||!running)return;if(e.target&&e.target.tagName==='INPUT')return;if(NET.mode==='guest'){NET.fCount=(NET.fCount||0)+1}else{const me=G.players[G.me]||G.players[0];if(me)me.fPress=true}});
setTimeout(()=>dbgLine(),0);
function boot(){gpuWarn();setPlayers(new URLSearchParams(location.search).get('room')?2:1);toTitle();applyGfx(GQ.mode==='auto'?2:GQ.mode);$('loading').hidden=true;if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(G&&G.pads)for(const q of G.pads)q._key=null});requestAnimationFrame(loop)}
$('loading').textContent='町を組み立てています…';loadKK().catch(e=>{console.warn('assets',e);KK=null;window.__kkErr=String(e&&e.message||e)}).then(()=>{boot();if(!KK){$('credit').textContent='3D素材を読み込めませんでした（'+(window.__kkErr||'ローダーなし')+'）';setTimeout(()=>toast('3D素材を読み込めなかったので簡易表示です','cold',true),800)}});
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!running&&NET.mode==='guest'&&NET.yearWait)applyInbox();
  if(running){if(NET.mode==='guest'){guestTick(dt);if(running)hud()}else if(!G.paused){update(hsDt(dt));if(running)hud()}if(running&&NET.mode==='host')netHost(dt)}
  else if(!running){G.t+=dt*.3;const p=G.players[0];p.x=CX+Math.cos(G.t*.8)*150;p.y=CY+Math.sin(G.t*.8)*120;p.moving=true;p.step+=dt*8;p.dirT=Math.atan2(-Math.sin(G.t*.8),Math.cos(G.t*.8));updateTrees(dt)}
  for(const f of G.floats)f.life-=dt;G.floats=G.floats.filter(f=>f.life>0);
  for(const f of G.flying){f.t+=dt*f.sp;const t=Math.min(1,f.t),e=t*t*(3-2*t);f.m.position.set(lerp(f.sx,f.tx,e),lerp(f.sh,f.th,e)+Math.sin(t*Math.PI)*50,lerp(f.sy,f.ty,e));f.m.rotation.set(t*6,f.rot+t*4,0);if(f.t>=1){world.remove(f.m);f.done=true;f.land&&f.land()}}
  G.flying=G.flying.filter(f=>!f.done);G.shake=Math.max(0,G.shake-dt*30);
  {const on=!!(running&&isRPG());if(document.body.classList.contains('rpg')!==on)document.body.classList.toggle('rpg',on);const av=!!(running&&ADV());if(document.body.classList.contains('adv')!==av)document.body.classList.toggle('adv',av);if(document.pointerLockElement&&(!on||G.paused||DLG.open||OPN||!$('lifeCard').hidden||!$('perk').hidden||!$('end').hidden))document.exitPointerLock();document.body.classList.toggle('mlock',!!document.pointerLockElement)}tickToast(dt);updateCam(dt,false);frame(dt);try{bgmTick()}catch(_){}checkPerf(dt);requestAnimationFrame(loop)}
