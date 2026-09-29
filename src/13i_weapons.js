// ================================================================ weapons grow (Rogue Galaxy style): proficiency → MAX, forging +1..+10, traits, and synthesis of two MAX weapons
MATS.shard='深淵の欠片';MATS.core='虚空の核';
const TRN={fire:'炎',ice:'氷',thunder:'雷',drain:'吸血',crit:'会心'},TRC={fire:'#ff7a3a',ice:'#7fd4ff',thunder:'#ffe45a',drain:'#e0457a',crit:'#ffffff'};
const TRD={fire:l=>`${Math.round(20*l)}%で燃やす`,ice:l=>`${Math.round(15*l)}%で凍らせる`,thunder:l=>`${Math.round(15*l)}%で雷が連鎖`,drain:l=>`当てると体力+${(.8*l).toFixed(1)}`,crit:l=>`${Math.round(12*l)}%で会心`};
const WNOUN={blade:'剣',axe:'大斧',bow:'弓',staff:'杖',fist:'ナックル'},GEN_S=['','・改','・真','・極','・神'];
// legendary results: two MAX weapons of this type whose traits cover both keys
const LEGEND=[
  {t:'blade',k:['fire','ice'],id:'lg_solfrost',n:'紅蓮氷刃ソルフロスト',atk:2.2,tr:{fire:2,ice:2}},
  {t:'blade',k:['thunder','crit'],id:'lg_seiken',n:'星雷の聖剣アストレア',atk:2.4,tr:{thunder:2,crit:2}},
  {t:'axe',k:['fire','crit'],id:'lg_giga',n:'覇王の大斧ギガンテス',atk:2.5,tr:{fire:2,crit:2}},
  {t:'axe',k:['ice','drain'],id:'lg_fenrir',n:'氷狼の大斧フェンリル',atk:2.3,tr:{ice:2,drain:2}},
  {t:'bow',k:['ice','thunder'],id:'lg_aurora',n:'極光の弓オーロラ',atk:2.3,tr:{ice:2,thunder:2}},
  {t:'bow',k:['fire','drain'],id:'lg_phoenix',n:'不死鳥の弓フェニックス',atk:2.2,tr:{fire:2,drain:2}},
  {t:'staff',k:['fire','thunder'],id:'lg_zeus',n:'天雷の杖ゼウス',atk:2.4,tr:{fire:2,thunder:2}},
  {t:'staff',k:['ice','crit'],id:'lg_eternal',n:'永久氷晶の杖',atk:2.3,tr:{ice:2,crit:2}},
  {t:'fist',k:['drain','crit'],id:'lg_marou',n:'魔狼のナックル',atk:2.3,tr:{drain:2,crit:2}}];
for(const L of LEGEND)ITEMS[L.id]={n:L.n,s:'w',atk:L.atk,tr:L.tr,lg:1};
const WP={chain:0};
function wpS(p){p.wp=p.wp||{};p.wp.x=p.wp.x||{};p.wp.f=p.wp.f||{};p.wp.s=p.wp.s||{};return p.wp}
function wpReg(p){if(!p||!p.wp||!p.wp.s)return;for(const id in p.wp.s)ITEMS[id]=Object.assign({s:'w',syn:1},p.wp.s[id])}
const isW=id=>!!(ITEMS[id]&&ITEMS[id].s==='w');
const wpF=(p,id)=>(p&&p.wp&&p.wp.f&&p.wp.f[id])||0;
const wpX=(p,id)=>(p&&p.wp&&p.wp.x&&p.wp.x[id])||0;
const wpG=(p,id)=>Math.min(1,wpX(p,id)/100),wpMax=(p,id)=>wpX(p,id)>=100;
function wpTr(id){const it=ITEMS[id];if(!it||it.s!=='w')return {};if(it.tr)return it.tr;const n=it.n,t={};
  if(/炎|太陽|紅|焔|砂/.test(n))t.fire=1;if(/氷|霜|雪/.test(n))t.ice=1;if(/星|雷|銀/.test(n))t.thunder=1;if(/牙|狼|女王|クモ/.test(n))t.drain=1;if(/古代|片角|王|覇|群れ/.test(n))t.crit=1;
  const k=Object.keys(t).slice(0,2),o={};for(const q of k)o[q]=1;return it.tr=o}
function wpAtk(p,id){const it=ITEMS[id];if(!it)return 0;return((it.atk||0)+.05*wpF(p,id))*starMul(starOf(p,id))*(1+.3*wpG(p,id))}
const wpName=(p,id)=>ITEMS[id]?ITEMS[id].n+(wpF(p,id)?` +${wpF(p,id)}`:''):'';
function trChips(tr){return Object.entries(tr||{}).map(([k,l])=>`<span style="display:inline-block;background:${TRC[k]};color:${k==='crit'?'#333':'#fff'};border:1px solid #16283a;border-radius:6px;padding:0 5px;margin-right:3px;font-size:10px;font-weight:900;text-shadow:${k==='crit'?'none':'0 1px 0 #0006'}">${TRN[k]}${'Ⅰ Ⅱ Ⅲ'.split(' ')[l-1]||''}</span>`).join('')}
function wpTag(p,id){if(!isW(id))return '';const x=wpX(p,id),mx=x>=100;return `<div style="display:flex;gap:6px;align-items:center;margin-top:2px">${trChips(wpTr(id))}<span style="font-size:10px;font-weight:900;color:${mx?'#d19a1c':'#557'}">熟練 ${mx?'★MAX（合成できる）':Math.floor(x)+'%'}</span><span style="flex:1;max-width:70px;height:5px;background:#0002;border-radius:3px;overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100,x)}%;background:${mx?'#ffb020':'#5ab0ff'}"></i></span></div>`}
// ---- hits: trait effects (host side, inside shoot)
function wpHit(sh,b,dmg){if(WP.chain||!isRPG()||!sh||!sh.eq||!G.players.includes(sh))return dmg;const id=sh.eq.w;if(!id||!classOK(sh,id))return dmg;const tr=wpTr(id);
  if(tr.crit&&Math.random()<.12*tr.crit){dmg*=tr.crit>=3?2.5:2;float(b.x,b.y,110,'会心！','gold',true);hitstop(.05);burst(b.x,b.y,30,12,{c:['#ffffff','#fff2b0'],s0:80,s1:240,u0:40,u1:160,l0:.2,l1:.45,add:true})}
  if(tr.fire&&Math.random()<.2*tr.fire){b.burnT=3;b.burnD=Math.max(b.burnD||0,dmg*.25*tr.fire);b.burnBy=sh;float(b.x,b.y,90,'炎上！','red')}
  if(tr.ice&&Math.random()<.15*tr.ice){b.trapT=Math.max(b.trapT||0,.6+.4*tr.ice);float(b.x,b.y,90,'凍結！','ice');burst(b.x,b.y,20,10,{c:['#bfe9ff','#ffffff'],s0:40,s1:140,u0:40,u1:140,l0:.3,l1:.6,add:true})}
  if(tr.drain&&sh.hp<100){sh.hp=Math.min(100,sh.hp+.8*tr.drain)}
  if(tr.thunder&&Math.random()<.15*tr.thunder){let t2=null,bd=170;for(const o of G.bears){if(o===b||o.dead||o.hide)continue;const d=dist(o.x,o.y,b.x,b.y);if(d<bd){bd=d;t2=o}}
    if(t2){const d2=dmg*(.4+.15*tr.thunder);setTimeout(()=>{if(!running||t2.dead)return;for(let i=0;i<8;i++){const k=i/8;psA.emit({x:lerp(b.x,t2.x,k)+rnd(-6,6),y:26+rnd(-6,6),z:lerp(b.y,t2.y,k)+rnd(-6,6),vx:0,vy:0,vz:0,g:0,life:.18,max:.18,r:6,c:C('#ffe45a'),air:true,fade:.1})}WP.chain=1;try{shoot(sh,t2,d2,true,'none')}finally{WP.chain=0}float(t2.x,t2.y,90,'連鎖！','gold')},90)}}
  return dmg}
// ---- kills grow the weapon in hand
function wpKill(sh,b){if(!isRPG()||!sh||!sh.eq||!G.players.includes(sh))return;const id=sh.eq.w;if(!id||!classOK(sh,id))return;const S=wpS(sh);const was=S.x[id]||0;if(was>=100)return;
  const g=(b.kind==='boss'?12:b.kind==='big'?3:1)*(b.aby?2:1);S.x[id]=Math.min(100,was+g);if(S.x[id]>=100){float(sh.x,sh.y,140,`${ITEMS[id].n} が熟練MAX！`,'gold',true);banner('武器が育ちきった！',ITEMS[id].n,'熟練MAX：工房で別のMAX武器と合成できる','r-SSR');SFX.ssr&&SFX.ssr()}}
// burning enemies take damage over time (host)
function wpTick(dt){for(const b of G.bears){if(!(b.burnT>0)||b.dead)continue;b.burnT-=dt;b.hp-=(b.burnD||0)*dt;if(Math.random()<dt*10)psA.emit({x:b.x+rnd(-10,10),y:18+rnd(0,14),z:b.y+rnd(-10,10),vx:0,vy:30,vz:0,g:-20,life:.4,max:.4,r:7,c:C(Math.random()<.5?'#ff7a3a':'#ffd23f'),air:true,fade:.2});
  if(b.hp<=0&&b.burnBy){WP.chain=1;try{shoot(b.burnBy,b,.001,true,'none')}finally{WP.chain=0}}if(b.burnT<=0)b.burnD=0}}
// ---- forging
function forgeCost(L){const c={m:{iron:2+L},cash:60*L};if(L>=4)c.m.shard=(L-3)*2;if(L>=7)c.m.core=L-6;return c}
function forgeWhy(p,id){const L=wpF(p,id)+1;if(L>10)return 'もう最大（+10）';const c=forgeCost(L);for(const k in c.m)if(((p.mats||{})[k]||0)<c.m[k])return `${MATS[k]}が足りない`;if(G.cash<c.cash)return `お金が$${c.cash}必要`;return null}
const costTxt=c=>Object.entries(c.m).map(([k,n])=>`${MATS[k]}${n}`).join('+')+`+$${c.cash}`;
function openForge(){const me=G.players[G.me]||G.players[0];const L=(me.items||[]).filter(id=>isW(id)&&classOK(me,id));
  const ch=L.map(id=>{const f=wpF(me,id),why=forgeWhy(me,id);const nx=f<10?(()=>{me.wp=me.wp||{};wpS(me).f[id]=f+1;const v=wpAtk(me,id);wpS(me).f[id]=f;if(!f)delete me.wp.f[id];return v})():0;return [`${why?'🔒':'⚒'}${wpName(me,id)} → +${Math.min(10,f+1)}（攻撃 +${Math.round(wpAtk(me,id)*100)}%${f<10?` → +${Math.round(nx*100)}%`:''}）… ${f>=10?'最大':costTxt(forgeCost(f+1))}`,()=>{const w=forgeWhy(G.players[G.me]||G.players[0],id);if(w){toast(w,'cold',true);return}sendAct('forge',id);setTimeout(()=>{if(running&&!DLG.open)openForge()},350)}]});
  ch.push(['やめる',null]);wbDlg(`どの武器を鍛える？ 1回ごとに攻撃が上がる。+5で光り、+10でオーラをまとう（深層の素材が必要）`,ch)}
// ---- synthesis
function synthOK(p,a,b){return a!==b&&isW(a)&&isW(b)&&wpMax(p,a)&&wpMax(p,b)&&wType(a)===wType(b)&&(p.items||[]).includes(a)&&(p.items||[]).includes(b)}
function synthPlan(p,a,b){const t=wType(a),ta=wpTr(a),tb=wpTr(b),tr={};for(const k of new Set([...Object.keys(ta),...Object.keys(tb)]))tr[k]=Math.min(3,Math.max(ta[k]||0,tb[k]||0)+(ta[k]&&tb[k]?1:0));
  const top=Object.entries(tr).sort((x,y)=>y[1]-x[1]).slice(0,3);const tr3={};for(const [k,l] of top)tr3[k]=l;
  const gen=Math.min(4,Math.max(ITEMS[a].gen||0,ITEMS[b].gen||0)+1);const ea=(ITEMS[a].atk||0)+.05*wpF(p,a),eb=(ITEMS[b].atk||0)+.05*wpF(p,b);const hi=Math.max(ea,eb),lo=Math.min(ea,eb),base=hi*1.1+lo*.3+.08*gen;
  const f=Math.floor((wpF(p,a)+wpF(p,b))/4),st=Math.max(starOf(p,a),starOf(p,b));
  const lg=LEGEND.find(L=>L.t===t&&L.k.every(k=>tr3[k])&&!(p.items||[]).includes(L.id));
  if(lg)return {id:lg.id,n:lg.n,atk:Math.max(lg.atk,Math.round((base+.2)*100)/100),tr:lg.tr,gen,f,st,lg:1};
  const pre=top.slice(0,2).map(([k])=>TRN[k]).join('')||'合成';
  return {id:null,n:`${pre}の${WNOUN[t]||'剣'}${GEN_S[gen]}`,atk:Math.round(base*100)/100,tr:tr3,gen,f,st}}
function doSynth(p,a,b){if(!synthOK(p,a,b))return false;const P=synthPlan(p,a,b),S=wpS(p);let id=P.id;
  if(!id){id='sx'+(Date.now()%1e8).toString(36)+Math.floor(Math.random()*1e3);S.s[id]={n:P.n,atk:P.atk,tr:P.tr,gen:P.gen};ITEMS[id]=Object.assign({s:'w',syn:1},S.s[id])}else{ITEMS[id].atk=P.atk;ITEMS[id].gen=P.gen;S.s[id]={n:P.n,atk:P.atk,tr:P.tr,gen:P.gen,lg:1}}
  p.eq=p.eq||{};const eqA=(p.eq.w===a||p.eq.w===b);p.items=(p.items||[]).filter(x=>x!==a&&x!==b);for(const k of [a,b]){delete S.x[k];delete S.f[k];if(S.s[k])delete S.s[k]}
  if(!p.items.includes(id))p.items.push(id);S.f[id]=P.f;S.x[id]=0;p.istar=p.istar||{};p.istar[id]=P.st;if(eqA||!p.eq.w)p.eq.w=id;
  banner(P.lg?'伝説の武器が生まれた！':'武器を合成した！',P.n,`攻撃+${Math.round(P.atk*100)}%・${Object.entries(P.tr).map(([k,l])=>TRN[k]+l).join('・')||'特性なし'}`,'r-SSR');SFX.ssr&&SFX.ssr();hitstop(.12);
  burst(WB.x,WB.y,60,40,{c:P.lg?['#ffd23f','#ff7a3a','#7fd4ff','#ffffff']:['#c9a2ff','#ffffff','#ffd23f'],s0:80,s1:300,u0:150,u1:380,l0:.6,l1:1.3,add:true,r0:5,r1:10});cnt(p,'synth');gainRX(p,30);return true}
function openSynth(first){const me=G.players[G.me]||G.players[0];const mx=(me.items||[]).filter(id=>isW(id)&&classOK(me,id)&&wpMax(me,id));
  if(!first){const ch=mx.map(id=>[`✦ ${wpName(me,id)}（${Object.entries(wpTr(id)).map(([k,l])=>TRN[k]+l).join('・')||'特性なし'}）`,()=>setTimeout(()=>openSynth(id),60)]);ch.push(['やめる',null]);
    wbDlg(mx.length?'1本目の武器を選ぶ（熟練MAXの武器だけ）':'熟練MAXの武器がない。装備して敵を倒すと熟練がたまる（深層だと2倍）',ch);return}
  const ch=mx.filter(id=>id!==first&&wType(id)===wType(first)).map(id=>{const P=synthPlan(me,first,id);return [`${P.lg?'🌟':'✦'} ＋ ${wpName(me,id)} → ${P.n}（攻撃+${Math.round(P.atk*100)}%・${Object.entries(P.tr).map(([k,l])=>TRN[k]+l).join('・')||'特性なし'}）`,()=>sendAct('synth',first+'|'+id)]});
  ch.push(['やめる',null]);wbDlg(ch.length>1?`「${wpName(me,first)}」と合成する武器を選ぶ。2本とも無くなり、新しい武器が1本できる。特性は受け継ぎ、同じ特性は強くなる`:'同じ種類の熟練MAX武器がもう1本必要',ch)}
function wbDlg(txt,ch){Object.assign(DLG,{open:true,npc:{n:{n:'工房'},x:WB.x,y:WB.y},pages:[txt],i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
function wpAct(p,type,id){if(type==='forge'){if(!isW(id)||!(p.items||[]).includes(id))return true;const why=forgeWhy(p,id);if(why){float(p.x,p.y,90,why,'red',true);return true}const L=wpF(p,id)+1,c=forgeCost(L);
    for(const k in c.m)p.mats[k]-=c.m[k];G.cash-=c.cash;wpS(p).f[id]=L;float(WB.x,WB.y,90,`${ITEMS[id].n} +${L}！`,'gold',true);SFX.chop&&SFX.chop();G.shake=Math.max(G.shake,4);
    burst(WB.x,WB.y,30,26,{c:L>=10?['#ffd23f','#ffffff','#ff7a3a']:['#ffb020','#ffffff'],s0:60,s1:220,u0:80,u1:260,l0:.3,l1:.7,add:true});if(L===5||L===10)banner(L===10?'武器が極まった！':'武器が光を帯びた！',`${ITEMS[id].n} +${L}`,L===10?'オーラをまとった':'','r-SSR');cnt(p,'forge');return true}
  if(type==='synth'){const [a,b]=String(id).split('|');doSynth(p,a,b);return true}return false}
// ---- visuals: forged weapons glow, +10 gets an aura
function wpFx(){if(!G||!running||!isRPG())return;for(const p of G.players){const m=p.m;if(!m)continue;const id=p.eq&&p.eq.w;const f=id?wpF(p,id):0,tr=id?wpTr(id):{};const tk=Object.keys(tr)[0];const key=id+':'+(f>=10?2:f>=5?1:0)+':'+(tk||'');
    if(m._wg!==key){m._wg=key;const lvl=f>=10?2:f>=5?1:0;const col=lin(tk?TRC[tk]:'#ffcf4a');const objs=[].concat(m.clsW||[],m.backW?[m.backW]:[]);for(const o of objs)o.traverse&&o.traverse(q=>{if(!q.isMesh||q.isSkinnedMesh||!q.material||Array.isArray(q.material))return;if(!lvl){if(q.userData._wm){q.material=q.userData._wm;q.userData._wm=null}return}if(!q.userData._wm){q.userData._wm=q.material;q.material=q.material.clone()}const M=q.material;if(M.emissive){M.emissive=col.clone();M.emissiveIntensity=lvl===2?.9:.45}})}
    if(f>=10&&Math.random()<.35)psA.emit({x:p.x+rnd(-16,16),y:rnd(6,40),z:p.y+rnd(-16,16),vx:0,vy:rnd(20,50),vz:0,g:-10,life:.7,max:.7,r:rnd(4,7),c:C(tk?TRC[tk]:'#ffd23f'),air:true,fade:.3})}}
