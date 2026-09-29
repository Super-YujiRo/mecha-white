// ================================================================ the mystery: clues (手がかり帳), puzzles, chapter 4 「帰郷」
// Truth: 100 years ago Jorun (Olga's grandfather) stole the sun stone from the southern temple to bring an endless summer north.
// Away from its altar the stone turned into the "winter heart"; he hid it under the town furnace. North froze, the south went wild.
const CLUES={
  c1:{t:'終わらない冬',s:'村長オルガ',x:'暦の上では、もう夏至を過ぎている。それなのに、雪は一日もやんだことがない。'},
  c2:{t:'ヨルンの手記・その一',s:'氷の洞窟で拾った紙片',x:'「わしは、この凍える北の地に永遠の夏をもたらしてみせる。南の神殿には、陽を宿す石が祀られているという」――ヨルン'},
  c3:{t:'洞窟の壁画',s:'氷の洞窟・封じられた扉',x:'二つの炉の絵。北の鐘楼と、南の神殿。そのあいだを、四つの季節が輪になって巡っている。'},
  c4:{t:'ヨルンの手記・その二',s:'氷の洞窟・奥の小部屋',x:'「石を持ち帰った。だが町に着くと、石は青く冷たく光りはじめた。……春が、来ない」'},
  c5:{t:'王のかけら',s:'白き王の額',x:'白き王の額に埋まっていた、青く光るかけら。南ではなく、町の中心に近づくほど強く震える。'},
  c6:{t:'ヨルンの手記・その三',s:'凍てつく氷河・光の祭壇',x:'「石の冷気に狼どもが寄ってくる。石は、町でいちばん温かい場所に眠らせた。火が燃え続けるかぎり、冷気は外へ漏れまい」'},
  c7:{t:'空の台座',s:'砂漠の古代遺跡',x:'神殿の台座は空っぽだった。ここには本来、陽を宿す石が祀られていたらしい。'},
  c8:{t:'星の壁画',s:'古代遺跡・星の床',x:'北から来た男が石を奪い去る絵。男の指輪には紋章が刻まれている――雪の結晶と炎。この町の紋章だ。'},
  c9:{t:'隊長ザラの話',s:'砂の町',x:'「100年前から、この砂漠は昼は灼け、夜は凍る。石が台座に戻れば、北にも南にも季節が戻るはずだ」'},
  t_gordon:{t:'ゴードンの証言',s:'猟師のゴードン',x:'「かまどの火は100年、一度も消したことがない。ヨルン様の遺言なんだとさ」'},
  t_mina:{t:'ミーナの証言',s:'パン屋のミーナ',x:'「かまどの下の石組み、夏でもひんやりしてるのよね。パン生地を寝かせるのにちょうどいいの」'},
  t_borg:{t:'ボルグの証言',s:'老人ボルグ',x:'「温泉を掘ったのは、わしが若いころ……30年前じゃ。それより前は、町でいちばん温かいのは、かまどのまわりだけじゃったよ」'}};
const CLUE_ORDER=['c1','c2','c3','c4','c5','c6','c7','c8','c9','t_gordon','t_mina','t_borg'];
const hasClue=id=>!!(G&&G.story&&(G.story.clues||[]).includes(id));
function addClue(id,quiet){const S=G.story;if(!S||!CLUES[id])return;S.clues=S.clues||[];if(S.clues.includes(id))return;S.clues.push(id);if(quiet)return;
  banner('手がかりを得た！',CLUES[id].t,'Jキーの「手がかり帳」でいつでも読み返せる','r-SSR');SFX.rare&&SFX.rare();toast(`手がかり：${CLUES[id].t}`,'gold');snapSave&&snapSave()}
function clueHtml(){const S=G.story||{},L=S.clues||[];if(!L.length)return '<small>まだ手がかりはない。町の人の話や、洞窟・遺跡の奥を調べてみよう</small>';
  let h=CLUE_ORDER.filter(id=>L.includes(id)).map(id=>{const c=CLUES[id];return `<div style="margin:6px 0;padding:6px 8px;background:rgba(255,255,255,.55);border:1.5px solid #d8c38e;border-radius:8px"><b style="font-size:12.5px">${c.t}</b><br><small style="opacity:.7">${c.s}</small><div style="font-size:12px;line-height:1.55;margin-top:2px">${c.x}</div></div>`}).join('');
  if(S.ch===4&&S.step===1&&!S.deduced)h=`<button data-deduce="1" style="width:100%;font:inherit;font-weight:900;border:2px solid #b8913f;border-radius:8px;padding:7px;background:linear-gradient(180deg,#2b4a73,#1d3150);color:#fff8e2;cursor:pointer;margin-bottom:4px">🔎 推理する：冬の心臓はどこに？</button>`+h;
  return h}
const DEDUCE=[['氷の湖の底','ゴードン「湖はもともと凍ってる。“冷気が外へ漏れない”場所じゃないだろう」'],['温泉の底','ボルグ「温泉は30年前に掘ったもんじゃ。100年前にはなかったよ」'],['かまどの下',null],['氷の洞窟の奥','カイ「洞窟は町から遠い。王のかけらは、町の真ん中でいちばん震えてた」']];
function openDeduce(){Object.assign(DLG,{open:true,npc:{n:{n:'推理'},x:CX,y:CY},pages:['ヨルンが隠した「冬の心臓」は、どこに眠っている？','手記には「町でいちばん温かい場所」「火が燃え続けるかぎり冷気は漏れない」とあった……'],i:0,ch:DEDUCE.map(([t],i)=>[t,()=>sendAct('deduce',i)])});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
function mysteryAct(p,type,id){const S=G.story;if(!S)return false;
  if(type==='clue'){addClue(id);return true}
  if(type==='olga'){if(S.ch===4&&S.step===2)S.olga=1;return true}
  if(type==='deduce'){if(S.ch!==4||S.step!==1||S.deduced)return true;const a=DEDUCE[id];if(!a)return true;if(a[1]){say(a[1].split('「')[0],'「'+a[1].split('「').slice(1).join('「'));toast('ちがうようだ…手がかり帳を読み返そう','cold')}else{S.deduced=1;banner('推理が当たった！','冬の心臓は、かまどの下に','ヨルンは町でいちばん温かい場所――100年消えない火の下に、石を隠した','r-SSR');SFX.ssr&&SFX.ssr()}return true}
  return false}
// ---- NPC lines for the mystery (overrides the normal quest talk when relevant)
function mysteryTalk(v){const S=G.story;if(!S||!isRPG()||DES())return null;const id=v.n.id;
  if(id==='olga'){if(S.ch===4&&S.step===2&&!S.olga)return{pages:['……砂の町の壁画、か。','ああ、知っていたよ。祖父ヨルンの日記を、子どものころに読んだ。','町の人には言えなかった。「この町の冬は、わしらの祖先のせいだ」なんて……','かまどの火を落としておくれ。祖父の罪は、わたしが一緒に背負う'],ch:[['……わかった',()=>sendAct('olga',1)]]};
    const L={1:['暦の上じゃ、もう夏のはずなんだがね。こんな冬は、わたしも初めてだよ','火さえあれば、人は集まってくる。かまどを頼んだよ'],2:['白き王……北の山の伝説の獣さ','南の砂の向こうに冬の原因がある、と聞いたことがあるよ。……ただの言い伝えさ'],3:['砂の町はどうだった？','……無事に帰っておいで'],4:['おかえり。……何か、見つけたのかい？'],5:['春の匂いがする。祖父も、きっと喜んでいるよ']};return{pages:[(L[S.ch]||L[1])[Math.floor((S.t||0)/20)%((L[S.ch]||L[1]).length)]]}}
  if(S.ch===4&&S.step===0){const k='t_'+id;if(CLUES[k]&&!hasClue(k)){const pre={gordon:'ヨルン様？ ああ、町を作った人だろう。',mina:'かまど？ いつもお世話になってるわよ。',borg:'100年前のことか……わしの爺さんから聞いた話じゃが。'}[id];return{pages:[pre,CLUES[k].x.replace(/^「|」$/g,'')],ch:[['手がかり帳に書きとめる',()=>sendAct('clue',k)]]}}}
  return null}
function mysteryMark(nid){const S=G.story;if(!S||DES())return '';if(nid==='olga')return S.ch===4&&S.step===2&&!S.olga?'！':'';if(S.ch===4&&S.step===0&&CLUES['t_'+nid]&&!hasClue('t_'+nid))return '？';return ''}
// ================================================================ puzzles (host simulates, everyone draws)
// 1) ice cave: light the four braziers in the order the sun walks (east → south → west → north). Opens the sealed vault.
const BRZ=[{d:'東',x:2045,y:2230},{d:'南',x:1975,y:2300},{d:'西',x:1905,y:2230},{d:'北',x:1975,y:2160}],BRZ_MURAL={x:1975,y:2230},VAULT_DOOR=[1970,1860,1990,2090],VAULT_NOTE={x:1895,y:1960};
// 2) glacier: turn three ice mirrors so the light from the crack reaches the altar
const MR={src:{x:62,y:2160},m:[{x:240,y:2160},{x:240,y:2300},{x:110,y:2300}],alt:{x:110,y:2205},room:[60,2110,300,2340],init:[0,1,0]};
// 3) desert ruin: draw the "wing" constellation (an X) on the 3x3 star floor
const SF={x:520,y:540,gap:60,sol:[1,0,1,0,1,0,1,0,1]};const sfPos=i=>({x:SF.x+((i%3)-1)*SF.gap,y:SF.y+(Math.floor(i/3)-1)*SF.gap});
function mrTrace(st){let x=MR.src.x,y=MR.src.y,dx=1,dy=0;const R=MR.room,segs=[];
  for(let k=0;k<6;k++){let best=-1,bd=1e9;MR.m.forEach((m,i)=>{const t=dx?(m.x-x)*dx:(m.y-y)*dy,off=dx?Math.abs(m.y-y):Math.abs(m.x-x);if(t>5&&off<6&&t<bd){bd=t;best=i}});
    const wt=dx>0?R[2]-x:dx<0?x-R[0]:dy>0?R[3]-y:y-R[1];const end=best>=0?bd:wt;
    const a=MR.alt,ta=dx?(a.x-x)*dx:(a.y-y)*dy,oa=dx?Math.abs(a.y-y):Math.abs(a.x-x);if(ta>0&&ta<end&&oa<14){segs.push([x,y,x+dx*ta,y+dy*ta]);return{segs,hit:true}}
    segs.push([x,y,x+dx*end,y+dy*end]);if(best<0)break;const m=MR.m[best];x=m.x;y=m.y;if(st[best]===1){const t=dx;dx=dy;dy=t}else{const t=dx;dx=-dy;dy=-t}}
  return{segs,hit:false}}
function pzState(){G.pz=G.pz||{br:{lit:[0,0,0,0],seq:[],fail:0},mr:{st:MR.init.slice()},sf:{on:[0,0,0,0,0,0,0,0,0]}};return G.pz}
function updatePuzzles(dt){if(!isRPG()||!G.story)return;const P=pzState(),S=G.story;
  if(!DES()){
    // brazier
    if(!hasClue('c3')&&G.zones.B){const B=P.br;if(B.fail>0){B.fail-=dt;if(B.fail<=0){B.lit=[0,0,0,0];B.seq=[]}}else
      BRZ.forEach((b,i)=>{const on=G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,b.x,b.y)<34);b._t=on?(b._t||0)+dt:0;if(on&&b._t>.7&&!B.lit[i]){B.lit[i]=1;B.seq.push(i);SFX.chop&&SFX.chop();burst(b.x,b.y,16,40,{c:['#ffb347','#ffe07a'],s0:30,s1:120,u0:60,u1:200,l0:.3,l1:.7,add:true});
        const ok=B.seq.every((v,k)=>v===k);if(!ok){B.fail=1.2;toast('炎がふっと消えた…順番がちがうようだ','cold')}else if(B.seq.length===4){addClue('c3');G.shake=10;banner('扉が開いた！','洞窟の壁画','陽の歩みのとおりに火を灯すと、封じられた扉が動いた','area');say('斥候カイ','扉の奥に小部屋がある…何か落ちてるぞ')}}})}
    if(hasClue('c3')&&!hasClue('c4')&&G.players.some(p=>!(p.down>0)&&dist(p.x,p.y,VAULT_NOTE.x,VAULT_NOTE.y)<45)){addClue('c4');G.cash+=300;G.earned+=300}
    if(S.ch===2&&S.kingId&&!hasClue('c5')&&G.bears.every(b=>b.id!==S.kingId||b.dead)){addClue('c5');say('斥候カイ','王の額から、青いかけらが落ちた…冷たい。町の方へ引っぱられるみたいに震えてる')}
    if(!hasClue('c2')&&!S._c2&&G.players.some(p=>p.x>CAVE_BOX[0]&&p.y>CAVE_BOX[1])&&(S._c2=1))setTimeout(()=>{if(running&&G.story&&!hasClue('c2')){addClue('c2');say('斥候カイ','古い紙が落ちてた…「ヨルン」？ この町を作った人の名前だ')}},1800);
    // mirrors
    if(!hasClue('c6')&&(S.ch||1)>=2&&G.zones.C){const M=P.mr;MR.m.forEach((m,i)=>{const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,m.x,m.y)<30);if(!p){m._t=0;m._arm=true;return}if(!m._arm)return;m._t=(m._t||0)+dt;if(m._t>.6){m._arm=false;m._t=0;M.st[i]^=1;SFX.pop&&SFX.pop();burst(m.x,m.y,10,30,{c:['#bfe9ff','#ffffff'],s0:30,s1:90,u0:60,u1:150,l0:.2,l1:.5,add:true});
        if(mrTrace(M.st).hit){addClue('c6');G.shake=8;banner('光が祭壇に届いた！','凍てつく氷河','祭壇の氷がとけて、古い手記が現れた','area');burst(MR.alt.x,MR.alt.y,50,40,{c:['#bfe9ff','#ffffff','#ffe07a'],s0:80,s1:260,u0:150,u1:400,l0:.6,l1:1.2,add:true});for(const q of G.players)addMat(q,'star',1)}}})}
  }else if(S.ch===3&&S.step>=4&&!hasClue('c8')){const F=P.sf;
    G.players.forEach(p=>{if(p.down>0)return;let t=-1;for(let i=0;i<9;i++){const q=sfPos(i);if(Math.abs(p.x-q.x)<24&&Math.abs(p.y-q.y)<24){t=i;break}}if(t!==p._sf){p._sf=t;if(t>=0){F.on[t]^=1;SFX.pop&&SFX.pop();const q=sfPos(t);burst(q.x,q.y,8,6,{c:F.on[t]?['#ffe07a','#ffffff']:['#8a6a48'],s0:20,s1:60,u0:20,u1:80,l0:.2,l1:.4,add:!!F.on[t]})}}});
    if(F.on.every((v,i)=>v===SF.sol[i])){addClue('c8');G.shake=10;say('斥候カイ','壁画が浮かび上がった…北の男が石を奪っていく絵だ');say('斥候カイ','あの指輪の紋章……雪の結晶と炎。俺たちの町の紋章じゃないか！')}}}
function caveDoorOpen(){return hasClue('c3')}
// ---- puzzle visuals
function pzBuild(){const g=new T.Group(),stone=std('#7d858f',{map:TEX.stone,r:.9}),dark=std('#2a323c',{r:1});const U={};
  if(!DES()){U.br=BRZ.map(b=>{const o=new T.Group();o.position.set(b.x,0,b.y);o.add(at(cyl(10,14,28,stone,8),0,14,0),at(cyl(16,12,6,dark,10),0,30,0));const f=at(makeFlame(10,30),0,32,0);f.visible=false;o.add(f);const l=new T.PointLight(lin('#ffa050'),0,220,1.6);l.position.y=60;o.add(l);g.add(o);return{o,f,l}});
    const mural=at(box(120,70,10,std('#9aa6b2',{map:TEX.stone,r:.9})),BRZ_MURAL.x,35,2120);g.add(mural);
    const door=at(box(VAULT_DOOR[2]-VAULT_DOOR[0],70,VAULT_DOOR[3]-VAULT_DOOR[1],std('#4b5866',{map:TEX.stone,r:.95}),true,true),(VAULT_DOOR[0]+VAULT_DOOR[2])/2,35,(VAULT_DOOR[1]+VAULT_DOOR[3])/2);g.add(door);U.door=door;
    const note=at(box(18,3,14,std('#f3e3bf',{r:1})),VAULT_NOTE.x,8,VAULT_NOTE.y);g.add(note);U.note=note;
    U.mr=MR.m.map(m=>{const o=new T.Group();o.position.set(m.x,0,m.y);o.add(at(cyl(20,22,6,stone,12),0,3,0));const pl=at(box(40,48,4,std('#dff4ff',{m:.6,r:.08,e:'#4fb8ff',ei:.25})),0,32,0);o.add(pl);g.add(o);return{o,pl}});
    const src=at(box(8,40,30,glow('#bfe9ff',2)),MR.src.x,30,MR.src.y);g.add(src);
    const alt=new T.Group();alt.position.set(MR.alt.x,0,MR.alt.y);alt.add(at(cyl(26,30,20,stone,10),0,10,0));const gem=at(new T.Mesh(new T.OctahedronGeometry(10,0),glow('#9fe3ff',1.2)),0,34,0);alt.add(gem);g.add(alt);U.gem=gem;
    U.beam=[0,1,2,3,4,5].map(()=>{const m=M_(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:lin('#dff6ff'),transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}),false);m.visible=false;g.add(m);return m})}
  else{U.sf=[];for(let i=0;i<9;i++){const q=sfPos(i);const t=at(box(50,3,50,std('#b9905e',{r:.9})),q.x,1.6,q.y);g.add(t);const s=at(box(20,4,20,glow('#ffe07a',1.8)),q.x,2.5,q.y);s.visible=false;g.add(s);U.sf.push(s)}}
  g.userData=U;world.add(g);return g}
function pzFx(){if(!G||!running)return;const on=isRPG()&&G.story;if(!on){if(G.pzV)G.pzV.visible=false;return}const key=DES()?'d':'s';
  if(!G.pzV||G.pzV.parent!==world||G.pzK!==key){if(G.pzV&&G.pzV.parent)G.pzV.parent.remove(G.pzV);G.pzV=pzBuild();G.pzK=key}
  const V=G.pzV,U=V.userData,P=pzState(),me=G.players[G.me]||G.players[0],S=G.story;V.visible=true;
  if(!DES()){const done=hasClue('c3');U.br.forEach((b,i)=>{const lit=done||!!P.br.lit[i];b.f.visible=lit;b.l.intensity=lit?1.6:0;if(me&&dist(me.x,me.y,BRZ[i].x,BRZ[i].y)<260)label(BRZ[i].x,BRZ[i].y,70,`<b>${BRZ[i].d}の燭台</b>${lit?'':'<br><small>そばに立つと火が灯る</small>'}`,'')});
    U.door.visible=!done;U.note.visible=done&&!hasClue('c4');
    if(me&&dist(me.x,me.y,BRZ_MURAL.x,2120)<300&&!done)label(BRZ_MURAL.x,2120,90,'<b>壁画</b><br><small>「朝の火、昼の火、夕の火、夜の火――<br>陽の歩みのとおりに灯せ」</small>','note');
    if(done&&!hasClue('c4')&&me&&dist(me.x,me.y,VAULT_NOTE.x,VAULT_NOTE.y)<260)label(VAULT_NOTE.x,VAULT_NOTE.y,40,'<b>古い紙片</b><br><small>近づいて拾う</small>','');
    const mdone=hasClue('c6'),st=mdone?[1,0,1]:P.mr.st;U.mr.forEach((m,i)=>{m.pl.rotation.y=(st[i]?-1:1)*Math.PI/4;if(me&&dist(me.x,me.y,MR.m[i].x,MR.m[i].y)<240&&!mdone)label(MR.m[i].x,MR.m[i].y,80,'<b>氷の鏡</b><br><small>上に立つと向きが変わる</small>','')});
    const tr=mrTrace(st),seen=me&&me.x<MR.room[2]+40&&me.y>MR.room[1]-40;U.beam.forEach((b,i)=>{const s=tr.segs[i];b.visible=!!s&&!!seen;if(!s)return;const L=Math.hypot(s[2]-s[0],s[3]-s[1]);b.position.set((s[0]+s[2])/2,32,(s[1]+s[3])/2);b.scale.set(s[0]===s[2]?5:L,5,s[0]===s[2]?L:5)});
    if(mdone&&!U.gemDone){U.gemDone=1;U.gem.material=glow('#ffe07a',2.4)}U.gem.rotation.y+=.02;if(seen&&!mdone&&me&&dist(me.x,me.y,MR.alt.x,MR.alt.y)<260)label(MR.alt.x,MR.alt.y,70,'<b>光の祭壇</b><br><small>裂け目の光を、鏡で導け</small>','note')}
  else{const done=hasClue('c8'),F=P.sf;U.sf.forEach((s,i)=>s.visible=done?!!SF.sol[i]:!!F.on[i]);
    if(S.ch===3&&S.step>=4&&!done&&me&&dist(me.x,me.y,SF.x,SF.y)<340)label(SF.x,SF.y-110,60,'<b>石板</b><br><small>「空を渡る翼の星座を、床に描け」</small><br><span style="font-family:monospace;font-size:15px;line-height:1.1;letter-spacing:4px">◆・◆<br>・◆・<br>◆・◆</span><br><small>床を踏むと光る／もう一度踏むと消える</small>','note')}}
// ================================================================ chapter 4 「帰郷」
const OLGA={id:'olga',n:'村長オルガ',pal:7,x:1085,y:890,o:{apron:true}};
function spawnGuardian(){const b=spawnBoss('frost',true);b.x=CX+40;b.y=CY+150;b.m.g.position.set(b.x,0,b.y);b.hp=b.max=Math.round(b.max*4*DM().hp);b.nm='心臓の番人';b.m.g.scale.multiplyScalar(1.5);G.story.guard=b.id;G.shake=18;
  banner('第4章','心臓の番人が目覚めた！','かまどの下から、冷気の獣が這い出してくる','cold');say('斥候カイ','石を守ってやがる…こいつを倒さないと心臓に近づけない！')}
function updateCh4(dt){const S=G.story;if(!S||S.ch!==4||DES())return;
  if(S.step===3&&!S.dig){const near=G.players.filter(p=>!(p.down>0)&&dist(p.x,p.y,CX,CY)<130).length;if(near){S.dg=(S.dg||0)+dt;if(Math.random()<dt*6)burst(CX+rnd(-40,40),CY+rnd(-40,40),6,10,{c:['#8a7058','#bfe9ff'],s0:20,s1:80,u0:40,u1:140,l0:.3,l1:.6})}if((S.dg||0)>4){S.dig=1;G.fuel=Math.min(G.fuel,25);burst(CX,CY,60,40,{c:['#9fe0ff','#ffffff'],s0:120,s1:360,u0:200,u1:500,l0:.8,l1:1.5,add:true});spawnGuardian()}}
  if(S.step===4&&S.dig&&!G.bears.some(b=>b.id===S.guard&&!b.dead)&&!S.gdead){S.gdead=1;S.hs=0;S.hx=CX;S.hy=CY+60;say('村長オルガ','かまどの下から…青い石が。これが、祖父の盗んだ“陽の石”なんだね')}
  if(S.step===5){if(S.hs===0||S.hs===2){const p=G.players.find(p=>!(p.down>0)&&dist(p.x,p.y,S.hx,S.hy)<60);if(p){S.hs=1;S.hc=p.id;toast('冬の心臓を持った！ 南への道まで運べ','gold');SFX.rare()}}
    else if(S.hs===1){const p=G.players[S.hc];if(!p||p.down>0){S.hs=2;if(p){S.hx=p.x;S.hy=p.y}toast('心臓を落とした！ 拾い直せ','cold')}else{S.hx=p.x;S.hy=p.y;if(dist(p.x,p.y,ROAD.x,ROAD.y)<130){S.hs=3;S.hx=ROAD.x;S.hy=ROAD.y;burst(ROAD.x,ROAD.y,60,60,{c:['#9fe0ff','#ffffff','#ffe07a'],s0:120,s1:360,u0:200,u1:480,l0:.8,l1:1.5,add:true});SFX.ssr&&SFX.ssr();G.shake=12}}}}}
function heart4Fx(){const S=G.story,on=!!(isRPG()&&S&&S.ch===4&&!DES()&&S.step>=5);if(!on){if(G.heart4V)G.heart4V.visible=false;return}
  if(!G.heart4V||G.heart4V.parent!==world){const h=new T.Group();const c=M_(new T.OctahedronGeometry(14,0),glow('#7fd4ff',2.6),false);c.scale.set(1,1.5,1);h.add(c);const l=new T.PointLight(lin('#7fd4ff'),1.6,260,1.6);h.add(l);world.add(h);G.heart4V=h}
  const hv=G.heart4V,t=performance.now()/1000;hv.visible=true;hv.rotation.y=t*2;if(S.hs===1&&G.players[S.hc]){const p=G.players[S.hc];hv.position.set(p.x,70+Math.sin(t*4)*3,p.y)}else hv.position.set(S.hx||CX,26+Math.sin(t*3)*4,S.hy||CY);
  const me=G.players[G.me]||G.players[0];if(S.hs!==1&&S.hs!==3&&me&&dist(me.x,me.y,hv.position.x,hv.position.z)<300)label(hv.position.x,hv.position.z,60,'<b>冬の心臓</b><br>近づくと持てる','');
  if(S.hs===1&&me)label(ROAD.x,ROAD.y,90,'<b>南への道</b><br><small>ここまで心臓を運ぶ</small>','note')}
function mysterySnap(){const S=G.story;if(!S)return null;const P=G.pz;return{rb:rebSnap(),ex:extrasSnap(),cl:S.clues||[],pz:P?[P.br.lit,P.mr.st,P.sf.on]:null,d4:[S.deduced||0,S.olga||0,S.dig||0,S.guard||0,S.gdead||0,S.zara||0,S.camp||0,S.hamid||0,S.worm||0,S.wend||0,S.ruin||0],adv:G.adv?G.adv.tr:null,aff:S.aff||null}}
function mysteryApply(x){if(!x||!G.story)return;extrasApply(x.ex);rebApply(x.rb);if(x.aff)G.story.aff=x.aff;G.story.clues=x.cl||[];if(x.pz){const P=pzState();P.br.lit=x.pz[0];P.mr.st=x.pz[1];P.sf.on=x.pz[2]}const d=x.d4||[];G.story.deduced=d[0];G.story.olga=d[1];G.story.dig=d[2];G.story.guard=d[3];G.story.gdead=d[4];G.story.zara=d[5];G.story.camp=d[6];G.story.hamid=d[7];G.story.worm=d[8];G.story.wend=d[9];G.story.ruin=d[10];if(x.adv){G.adv=G.adv||{tr:[],rt:[]};G.adv.tr=x.adv}}
