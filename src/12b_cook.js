// ================================================================ cooking (料理人): cook at a fire (C key), eat with V for a timed buff
const DISH={
  kushi:{n:'こんがり串焼き',need:{bag:{meat:2}},buff:'atk',v:.25,d:'攻撃+25%'},
  sakana:{n:'ほくほく焼き魚',need:{bag:{fish:2}},buff:'cold',v:.4,d:()=>DES()?'暑さに強い+40%':'寒さに強い+40%'},
  stew:{n:'狩人のシチュー',need:{bag:{meat:2,fish:1}},buff:'def',v:.25,regen:1.2,d:'防御+25%・体力が少しずつ回復',rk:1},
  herb:{n:'香草のロースト',need:{bag:{meat:1},mats:{herb:2}},buff:'spd',v:.2,d:'足の速さ+20%'},
  salt:{n:'砂漠の塩焼き',need:{bag:{meat:2,salt:1}},buff:'cold',v:.45,atk:.15,d:'暑さに強い+45%・攻撃+15%',rk:1},
  feast:{n:'ごちそうプレート',need:{bag:{meat:3,fish:2},mats:{herb:2}},buff:'atk',v:.4,def:.2,regen:2,d:'攻撃+40%・防御+20%・回復',rk:3}};
const dishD=D=>typeof D.d==='function'?D.d():D.d;
function nearFire(p){if(dist(p.x,p.y,CX,CY)<150)return true;if(caveWarm(p.x,p.y)||advWarm(p.x,p.y))return true;if(ADV()&&dist(p.x,p.y,CAMP.x,CAMP.y)<120)return true;return false}
function cookWhy(p,k){const D=DISH[k];if(lifeRank(p,'cook')<(D.rk||0))return `料理人「${LR[D.rk].n}」が必要`;for(const it in D.need.bag||{})if(p.bag.filter(x=>x===it).length<D.need.bag[it])return `${itemName(it)}が足りない`;for(const m in D.need.mats||{})if(((p.mats||{})[m]||0)<D.need.mats[m])return `${MATS[m]}が足りない`;if((p.food||[]).length>=5)return '料理は5つまでしか持てない';return null}
const itemName=k=>({meat:'肉',fish:'魚',salt:'塩',fur:'毛皮',log:'薪',water:'水'})[k]||k;
function openCook(){const me=G.players[G.me]||G.players[0];if(!nearFire(me)){toast('火のそば（かまど・井戸・焚き火）で料理できる','cold',true);return}
  const ch=Object.keys(DISH).map(k=>{const D=DISH[k],why=cookWhy(me,k);const need=[...Object.entries(D.need.bag||{}).map(([i,n])=>`${itemName(i)}${n}`),...Object.entries(D.need.mats||{}).map(([m,n])=>`${MATS[m]}${n}`)].join('+');
    return [`${why?'🔒':'🍳'} ${D.n}（${dishD(D)}）… ${need}`,()=>{const w=cookWhy(G.players[G.me]||G.players[0],k);if(w){toast(w,'cold',true);return}sendAct('cook',k)}]});
  ch.push(['やめる',null]);Object.assign(DLG,{open:true,npc:{n:{n:'料理'},x:me.x,y:me.y},pages:[`何を作る？（持っている料理 ${(me.food||[]).length}/5・Vキーで食べる）`],i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
function openEat(){const me=G.players[G.me]||G.players[0],F=me.food||[];if(!F.length){toast('料理を持っていない（火のそばでCキー）','cold',true);return}
  const ch=F.map((k,i)=>[`${DISH[k].n}（${dishD(DISH[k])}）`,()=>sendAct('eat',i)]);ch.push(['やめる',null]);
  Object.assign(DLG,{open:true,npc:{n:{n:'料理を食べる'},x:me.x,y:me.y},pages:[me.buff&&me.buff.t>0?`いまの効果：${me.buff.n}（残り${Math.ceil(me.buff.t)}秒）。食べると上書きされる`:'どれを食べる？'],i:0,ch});if(NET.mode==='solo')G.paused=true;for(const j of joys)j.on=false;drawDlg()}
function cookAct(p,type,id){if(type==='cook'){const D=DISH[id];if(!D)return true;const w=cookWhy(p,id);if(w){float(p.x,p.y,90,w,'red',true);return true}
    for(const it in D.need.bag||{})for(let i=0;i<D.need.bag[it];i++)take(p,it);for(const m in D.need.mats||{})p.mats[m]-=D.need.mats[m];p.food=p.food||[];p.food.push(id);lifeXp(p,'cook',6+(D.rk||0)*4);cnt(p,'cook');gainRX(p,4);
    banner('料理ができた！',D.n,dishD(D)+'（Vキーで食べる）','area');SFX.pop&&SFX.pop();burst(p.x,p.y,20,30,{c:['#ffb347','#ffffff'],s0:30,s1:120,u0:80,u1:200,l0:.4,l1:.8,add:true});return true}
  if(type==='eat'){const F=p.food||[],k=F[id];if(!k)return true;F.splice(id,1);const D=DISH[k],mul=1+lifeRank(p,'cook')*.1;p.buff={k,n:D.n,t:90*mul,buff:D.buff,v:D.v*mul,atk:(D.atk||0)*mul,def:(D.def||0)*mul,regen:D.regen||0};cnt(p,'eat');
    float(p.x,p.y,110,`${D.n}を食べた！ ${dishD(D)}`,'gold',true);SFX.coin&&SFX.coin(3);return true}
  return false}
function buffOf(p,k){const b=p&&p.buff;if(!b||!(b.t>0))return 0;let v=0;if(b.buff===k)v+=b.v;if(k==='atk')v+=b.atk||0;if(k==='def')v+=b.def||0;return v}
function buffTick(p,dt){const b=p.buff;if(!b||!(b.t>0))return;b.t-=dt;if(b.regen&&p.hp<100)p.hp=Math.min(100,p.hp+b.regen*dt*4);if(b.t<=0){p.buff=null;float(p.x,p.y,90,'料理の効果が切れた','ice',true)}}
addEventListener('keydown',e=>{if(!running||!isRPG()||e.repeat||DLG.open||(e.target&&e.target.tagName==='INPUT'))return;if(e.code==='KeyC'){openCook();e.preventDefault()}else if(e.code==='KeyV'){openEat();e.preventDefault()}});
