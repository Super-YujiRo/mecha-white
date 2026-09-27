// ================================================================ sync visuals
function sync(dt){
  const R=heatR(),f=G.fuel/100,v=G.v,two=G.players.length>1;
  // fire
  const rate=G.fuel>0?60+f*140+(G.level-1)*14:0;let n=rate*dt;
  while(n>0){if(Math.random()<n){const sp=12+f*14+G.level*2;psA.emit({x:CX+rnd(-sp,sp),y:44,z:CY+rnd(-sp,sp),vx:rnd(-8,8)+G.wind*14,vz:rnd(-8,8),vy:rnd(60,120)*(.7+f*.6),g:-20,life:rnd(.4,.9)*(.7+f*.5),max:.9,r:rnd(12,20)*(.7+f*.5+G.level*.05),a:.8,fire:true,air:true,fade:.4})}n-=1}
  if(G.fuel>0&&Math.random()<dt*(4+f*10))psA.emit({x:CX+rnd(-10,10),y:70,z:CY+rnd(-10,10),vx:rnd(-30,30)+G.wind*25,vz:rnd(-30,30),vy:rnd(80,180),g:20,life:rnd(.8,1.6),max:1.6,r:4,c:C(Math.random()<.5?'#ffd166':'#ff9a4d'),air:true});
  if(Math.random()<dt*(G.fuel>0?3:5))puff(CX+rnd(-8,8),CY+rnd(-8,8),120+f*40,{c:'#7a8491',r:18,life:2.4,a:.3,vy:40,vx:G.wind*20,grow:2.4});
  v.f.flames.forEach((fl,i)=>{const h=(G.fuel>0?(.35+f*.75+G.level*.07):0)*(1+Math.sin(G.t*(11+i*5))*.12);fl.scale.set(.6+f*.5,Math.max(.001,h),.6+f*.5);fl.visible=G.fuel>0;fl.rotation.y=G.t*(1+i)});
  v.f.light.intensity=G.fuel>0?(1.4+f*2.2)*(1+Math.sin(G.t*13)*.06)*(nightK>.3?1.6:1):0;v.f.light.distance=R*2.4+200;v.f.coals.material.emissiveIntensity=G.fuel>0?2.2:.1;
  if(v.f.plate._lv!==G.level){v.f.plate._lv=G.level;v.f.plate.userData.draw('Lv'+G.level)}v.f.plate.visible=!ADV();
  syncTown(dt);
  const fl=1+Math.sin(G.t*9)*.01;v.heat.visible=v.ring.visible=R>0;v.heat.scale.setScalar(R*fl*1.12);v.ring.scale.setScalar(R*fl);v.ring.material.color.copy(C(G.fuel<20&&Math.sin(G.t*10)>0?'#ff4d5a':DES()?'#5fc3f0':'#ffa04d'));
  v.embers.forEach((e,i)=>{const a=i/v.embers.length*TAU+G.t*.25;e.position.set(CX+Math.cos(a)*R*fl,3+Math.sin(G.t*4+i)*1.5,CY+Math.sin(a)*R*fl);e.visible=R>0;e.rotation.y=G.t*2+i});
  // players
  for(const p of G.players){const m=p.m;m.g.position.set(p.x,(p.riding?6:0)+(p.jz||0),p.y);if(p.aimDir!=null)turnTo(p,p.aimDir,dt,16);else if(p.dirT!=null)turnTo(p,p.dirT,dt);m.g.rotation.y=p.dir;
    m._armR=m._armL=false;animWalk(m,p.step,p.moving);backWeapon(p,m,!!p.shooting);armorPiece(p,m);if(isRPG()&&p.moving&&!p.riding&&!(p.down>0)){p._dust=(p._dust||0)-dt;if(p._dust<=0){p._dust=.17;burst(p.x-Math.sin(p.dir)*8,p.y-Math.cos(p.dir)*8,3,2,{c:DES()?['#e8cf9a','#d9b47a']:['#ffffff','#dfe9f2'],s0:8,s1:26,u0:12,u1:40,l0:.25,l1:.45,r0:3,r1:6})}}
    const shoot_=!!p.shooting||p.skillT>0;m.gun.visible=shoot_;if(m.clsW)for(const o of m.clsW)o.visible=shoot_;m.axe.visible=!shoot_&&!p.fishing;m.rod.visible=!!p.fishing;
    if(shoot_){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,.2);m._armR=m._armL=true;m.gun.userData.flash.visible=p.flash>0;if(!m.kk)m.gun.position.z=10-(p.flash>0?3:0)}
    else if(p.chopping){const t=clamp(p.actT/(.24*G.pm.chop),0,1);m.armR.rotation.set(-2.6+Math.sin(t*Math.PI)*2.4,0,0);m._armR=true}
    else if(p.fishing){m.armR.rotation.set(-.9+Math.sin(G.t*3)*.08,0,0);m._armR=true}
    if(m.kk){m.kkRun=true;m.kk.paused=p.down>0;m.kk.want=p.riding?'Idle':p.dash?'Dodge_Forward':(p.jz>2&&!shoot_)?'Jump_Idle':shoot_?(m.cls?m.cls.anim:'1H_Ranged_Shooting'):p.chopping?'1H_Melee_Attack_Chop':p.fishing?'Sit_Floor_Idle':null}
    m.ice.visible=!!(p.down>0)&&!p.ko&&!DES();if(m.kk&&p.down>0&&DES())m.kk.want='Sit_Floor_Idle';if(m.kk&&p.ko)m.kk.want='Sit_Floor_Idle';if(p.down>0){m.ice.rotation.y=G.t*.3;m.ice.scale.set(1,1.45,1)}
    const bath=inBath(p)&&!p.riding;if(m.kk){if(!m.bathParts){m.bathParts=[];m.model.traverse(o=>{if(o.isMesh&&/Cape|Hat|Helmet/.test(o.name)&&o.visible)m.bathParts.push(o)});m.towel=at(rbox(13,3.2,11,1.2,std('#ffffff',{r:1})),0,52,-1);m.towel.visible=false;m.g.add(m.towel)}
      if(m._bath!==bath){m._bath=bath;m.towel.visible=bath;for(const o of m.bathParts)o.visible=!bath}
      if(bath){m.g.position.y=-35;m.gun.visible=false;m.axe.visible=false;m.rod.visible=false;if(m.clsW)for(const o of m.clsW)o.visible=false}}
    p.stack.set(p.bag,-clamp(Math.hypot(p.vx,p.vy)/195,0,1)*.4);p.stack.g.position.y=10-p.bb*3;p.stack.g.visible=!bath;
    m.g.visible=p.down>0||!(p.inv>0&&Math.floor(G.t*20)%2);
    const top=58+p.stack.h*0;
    if(two)label(p.x,p.y,78,`<span class="tag" style="background:${HERO[p.id].tag}">${HERO[p.id].tagText}</span>`,'');
    {const showW=!p.down&&(!p.inHeat||p.warm<99),cold=p.warm<25;let h='';
      if(showW)h+=`<span class="wg${cold?' cold':''}${p.inHeat?' warmup':''}"><em>${cold?(DES()?'のどカラカラ':'さむい！'):p.inHeat?(DES()?'うるおい':'ぽかぽか'):TW()}</em><i class="bar wide ${cold?'':p.inHeat?'gold':'ice'}"><b style="width:${Math.max(4,Math.min(100,p.warm))}%"></b></i><strong>${Math.round(p.warm)}</strong></span>`;
      if(p.hp<100)h+=`<span class="wg hpg"><em>体力</em><i class="bar wide hp"><b style="width:${Math.max(4,Math.min(100,p.hp))}%"></b></i><strong>${Math.round(p.hp)}</strong></span>`;
      if(h)label(p.x,p.y,0,`<div style="transform:translateY(${h.includes('hpg')&&showW?40:30}px)">${h}</div>`,'')}
    if(p.bag.length>=cap(p))label(p.x,p.y,34+p.stack.h,'MAX','gold sm');
    if(p.fishing){label(p.fishing.x,p.fishing.y,70,bar(100*p.fishing.t/2.2,'blue wide'),'')}}
  // bears
  for(const b of G.bears){const m=b.m;m.g.position.set(b.x,0,b.y);const S=b.kind==='boss'?2.1:b.kind==='big'?1.35:1;
    if(b.dead){if(m.mx){beastAnim(m,b);m.g.position.y=-Math.max(0,b.deadT-1.4)*20;m.ring.visible=false;continue}const k=Math.min(1,b.deadT/.35);m.g.rotation.z=k*1.4;m.g.position.y=-k*4*S-Math.max(0,b.deadT-1.4)*20;m.ring.visible=false;continue}
    m.g.visible=!b.hide;if(b.hide){if(Math.random()<.2)puff(b.x,b.y,3,{c:DES()?'#e2b877':'#e8f2fa',r:14,life:.7,a:.7,vy:14,grow:1.6});continue}
    if(b.dirT!=null){let d=b.dirT-b.rot;d=Math.atan2(Math.sin(d),Math.cos(d));b.rot+=d*Math.min(1,dt*6)}m.g.rotation.y=b.rot;
    if(m.mx)beastAnim(m,b);const s=b.moving?Math.sin(b.step):0;m.legs.forEach((l,i)=>l.rotation.x=s*(i%2?-1:1)*(i<2?1:-1)*.6);m.head.rotation.x=b.swipe>0?-.4:Math.sin(G.t*2+b.x)*.05;
    m.fur.emissive.copy(C(b.hit>0?'#ff2020':'#000000'));m.fur.emissiveIntensity=b.hit>0?.5:0;m.brow.visible=b.state==='chase';m.ring.material.opacity=b.state==='chase'?.6+Math.sin(G.t*14)*.35:.7;
    if(b.hp<b.max||b.kind==='boss')label(b.x,b.y,68*S,bar(100*b.hp/b.max,b.kind==='boss'?'wide':''),'');
    if(b.kind==='boss')if(b.rbi!=null&&rbList()[b.rbi]){const R=rbList()[b.rbi],me=G.players[G.me]||G.players[0],ok=lifeRank(me,'hunt')>=R.rq;label(b.x,b.y,86*S,`${R.n}${ok?'':`<br><small>🔒 狩人「${LR[R.rq].n}」で攻撃が通る</small>`}`,ok?'red':'note')}else label(b.x,b.y,86*S,b.nm||(b.bt?BTN[b.bt]:'BOSS'),'red');if(b.ph==='st'||b.stn)label(b.x,b.y,104*S,'★ ピヨピヨ ★ 大ダメージ','gold');
    if(b.roar>0)label(b.x,b.y,86*S+(b.kind==='boss'?20:0),DES()?'シャーッ！':'ガオッ！','red',1,1+b.roar*.4)}
  for(const m of G.pickups){m.mesh.position.set(m.x,m.h+2+(m.h<=0?Math.sin(G.t*4+m.x)*1.5:0),m.y);m.mesh.rotation.y=m.spin+G.t*(m.h>0?6:1)}
  // workers
  for(const w of G.workers){const m=w.m;m.g.position.set(w.x,w.role==='guard'?73:0,w.y);if(w.aimDir!=null)turnTo(w,w.aimDir,dt,14);else if(w.dirT!=null)turnTo(w,w.dirT,dt);m.g.rotation.y=w.dir;m._armR=m._armL=false;animWalk(m,w.step,w.moving);w.stack.set(w.bag);
    if(w.role==='hunter'){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,0);m._armR=m._armL=true;m.tool.userData.flash.visible=w.flash>0}
    if(w.chop){m.armR.rotation.set(-2.6+Math.sin(clamp(w.t/.6,0,1)*Math.PI)*2.4,0,0);m._armR=true}
    if(w.role==='cashier'){m.armR.rotation.set(-.7+Math.sin(G.t*6)*.3,0,0);m._armR=true}
    if(m.kk)m.kk.want=(w.role==='hunter'&&w.aimDir!=null)||w.role==='guard'?'1H_Ranged_Shooting':w.chop?'1H_Melee_Attack_Chop':w.role==='cashier'?'Interact':(w.role==='fisher'&&w.hole&&!w.moving)?'Sit_Floor_Idle':null;
    if(w.role==='guard'){m.armR.rotation.set(-1.3,0,0);m.armL.rotation.set(-1.1,0,0);m._armR=m._armL=true;if(m.tool&&m.tool.userData.flash)m.tool.userData.flash.visible=w.flash>0}
    if(w.role==='fisher'&&w.hole&&!w.moving&&w.hole.user===w){m.armR.rotation.set(-.9,0,0);m._armR=true;label(w.hole.x,w.hole.y,64,bar(100*w.hole.t/2.2,'blue'),'')}
    if(w.frozen&&!w.ice){w.ice=M_(geo('ice',()=>new T.IcosahedronGeometry(22,0)),new T.MeshStandardMaterial({color:lin('#bfe9ff'),transparent:true,opacity:.62,roughness:.08,metalness:.1,flatShading:true}),false);w.ice.scale.set(1,1.35,1);w.ice.position.y=24;m.g.add(w.ice)}
    if(w.ice)w.ice.visible=!!w.frozen&&!DES();if(m.kk){if(w.frozen&&!DES())m.kk.paused=true;else m.kk.paused=false;if(w.frozen&&DES())m.kk.want='Sit_Floor_Idle';if(w.hurt>0)m.kk.want='Sit_Floor_Idle'}
    if(w.frozen)label(w.x,w.y,82,`<b>${DES()?'倒れた！':'凍えた！'}</b><br><small>${DES()?'そばに立つと助け起こせる':'そばに立つと溶ける'}</small><br>${bar(100*Math.min(1,w.warm/40),'gold wide')}`,'ice');else if(w.hurt>0)label(w.x,w.y,70,'<b>けが</b>','red');else if(w.shelter&&w.goWarm)label(w.x,w.y,70,'<small>吹雪で休憩中</small>','ice');else if(w.warm!=null&&w.warm<99&&['hunter','lumber','fisher','stoker'].includes(w.role))label(w.x,w.y,70,bar(w.warm,w.warm<50?'':'ice'),'')}
  // survivors
  for(const s of G.surv){const m=s.m;const warmPose=s.arrived&&!s.frozen&&s.warm>55;if(warmPose)s.dirT=Math.atan2(CX-s.x,CY-s.y);if(s.dirT!=null&&!s.frozen)turnTo(s,s.dirT,dt,6);m.g.rotation.y=s.dir;
    tintCold(m,s.frozen?1:1-Math.min(1,s.warm/100*1.5));const shiv=!s.frozen&&s.warm<40?Math.sin(G.t*55+s.x)*1.4*(1-s.warm/40):0;m.g.position.set(s.x+shiv,s.happy>0?Math.abs(Math.sin(s.happy*9))*7:0,s.y);
    m._armL=m._armR=false;if(!s.frozen)animWalk(m,s.step,s.moving);
    if(warmPose){m.armL.rotation.set(-1.4+Math.sin(G.t*2+s.x)*.15,0,0);m.armR.rotation.set(-1.4+Math.sin(G.t*2+s.x+1)*.15,0,0);m._armL=m._armR=true}
    if(m.kk){m.kk.paused=s.frozen;m.kk.want=s.happy>0?'Cheer':null}
    else if(!s.moving&&!s.frozen){m.armL.rotation.set(-.5,0,.9);m.armR.rotation.set(-.5,0,-.9);m._armL=m._armR=true}
    s.ice.visible=s.frozen&&!DES();if(s.frozen&&DES()&&s.m.kk){s.m.kk.paused=false;s.m.kk.want='Sit_Floor_Idle'}if(s.frozen){const k=easeOutBack(s.freezeAnim);s.ice.scale.set(k,1.35*k,k);s.ice.rotation.y=G.t*.2;label(s.x,s.y,72,bar(100*Math.min(1,s.warm/35),'gold'),'')}
    else if(s.warm<60)label(s.x,s.y,58,(s.warm<25?`<span class="alert">!</span>`:bar(s.warm,'ice'))+`<span class="lb ice sm" style="position:static;display:block;margin-top:2px">${s.arrived?'火がない…':'寒い…'}</span>`,'');
    if(s.happy>0&&!s.frozen)label(s.x,s.y,68,'♥','red',Math.min(1,s.happy))}
  // customers
  for(const c of G.customers){const m=c.m;m.g.scale.setScalar(.95*easeOutBack(Math.min(1,c.fade||1)));m.g.position.set(c.x+(c.angry>0?Math.sin(G.t*50)*1.2:0),c.happy>0?Math.abs(Math.sin(c.happy*9))*6:0,c.y);if(c.dirT!=null)turnTo(c,c.dirT,dt);m.g.rotation.y=c.dir;m._armR=false;
    if(c.hold.visible){m.armR.rotation.set(-1.2,0,0);m._armR=true}animWalk(m,c.step,c.moving);if(m.kk&&c.happy>0)m.kk.want='Cheer';
    if(c.happy>0)label(c.x,c.y,66,'♥','red',Math.min(1,c.happy));if(c.angry>0)label(c.x,c.y,68,'ムカッ','red sm');
    if(c.state==='queue'&&c.wait>c.patience*.4){const k=1-c.wait/c.patience;label(c.x,c.y,60,k<.25?'<span class="alert">!</span>':`<span class="clock" style="--p:${100*k|0};--c:${k<.5?'#ff8a5a':'#ffd166'}"></span>`,'')}}
  // stations
  for(const id in G.stations){const st=G.stations[id],d=st.def;
    if(!st.open)continue;if(st.unlockT!=null&&st.unlockT<=1){const k=easeOutBack(Math.min(1,st.unlockT));st.parts.forEach(o=>{o.visible=true;o.scale.setScalar(Math.max(.01,k))});if(st.sign)st.sign.visible=false}
    st.inStack.set(st.q);st.shelfStack.fill(d.out,Math.min(st.shelf,40));st.pileStack.fill('cash',Math.min(220,Math.ceil(st.pile/5)));
    const cooking=st.q.length>0&&!st.frozen;st.conv.on.visible=cooking&&st.cookT<.5*d.time;st.conv.done.visible=cooking&&!st.conv.on.visible;st.conv.coal.material.emissiveIntensity=st.frozen?0:cooking?2.2:.8;
    st.ice.visible=st.frozen&&!DES();if(st.frozen&&!DES()){st.ice.material.opacity=.45+Math.sin(G.t*3)*.08;label(d.conv.x,d.conv.y,90,'凍結中！ 熱が届いてない','warnbox')}
    st.ct.lamp.material.emissive.copy(C(st.staffed?'#6be07a':'#ff6b6b'));if(st.ct.price._p!==price(id)){st.ct.price._p=price(id);st.ct.price.userData.draw(`$${price(id)}`)}
    if(st.pile>0)label(d.pile.x,d.pile.y,30+st.pileStack.h,`$${st.pile|0}`,'cash');
    if(st.shelf===0&&!st.frozen)label(d.counter.x-50,d.counter.y,50,'在庫なし','red sm');
    if(!st.cashier&&!st.staffed&&st.queue.length&&st.shelf>0)label(d.stand.x,d.stand.y,60,'ここに立って販売','note');
    if(cooking)label(d.conv.x,d.conv.y,70,bar(100*st.cookT/(d.time*Math.pow(.74,G.lv['cook_'+id])*G.pm.cook),'gold'),'')}
  // pads
  for(const pad of G.pads){const vis=(!pad.zone||G.zones[pad.zone])&&pad.vis()&&!padBlocked(pad);if(vis&&!pad.shown){pad.shown=true;pad.rise=0;pad.mesh.g.visible=true}if(!vis&&pad.shown){pad.shown=false;pad.mesh.g.visible=false}
    if(!pad.shown)continue;if(pad.personal){const q=meP(),mine=q&&pad.costP(q)!=null;if(pad.mesh.g.visible!==mine)pad.mesh.g.visible=mine;if(!mine)continue}pad.rise=Math.min(1,pad.rise+dt*2);const on=G.onPads&&G.onPads.has(pad);const req=pad.req?pad.req():(pad.pop&&!idleSurvivors().length?'生存者を待っています':null);
    if(pad.personal){const q=meP();pad.paid=q?(pad.pp[q.id]||0):0}pad.mesh.draw(pad.cost(),pad.paid,pad.lvText(),on,req,mixLeft(pad));pad.mesh.mesh.scale.setScalar(easeOutBack(pad.rise)*(1+pad.pulse*.3+(on?.06:0)));{const mm=pad.mesh.mesh,rz=isRPG()?CAMS.cur:YAW;if(mm.rotation.z!==rz)mm.rotation.set(-Math.PI/2,0,rz)}pad.mesh.icon.position.y=56+Math.sin(G.t*2.4+pad.x)*4;pad.mesh.icon.rotation.y=G.t*1.2+pad.y;pad.mesh.icon.scale.setScalar(easeOutBack(pad.rise))}
  // zones
  for(const z of ZONES){if(z.fogT>=0&&z.fogT<1){z.fogT=Math.min(1,z.fogT+dt*.7);z.fog.material.opacity=.93*(1-z.fogT);z.fog.scale.y=Math.max(.01,1-z.fogT);z.sign.material.opacity=1-z.fogT;if(z.fogT>=1){z.fog.visible=false;z.sign.visible=false}}
    if(!G.zones[z.id]){z.sign.quaternion.copy(camera.quaternion);z.sign.position.y=130+Math.sin(G.t*1.5)*4}}
  // holes
  for(const h of G.holes){h.fish.visible=h.jump>0;if(h.jump>0){const k=1-h.jump/.6;h.fish.position.set(h.x+k*20,4+Math.sin(k*Math.PI)*55,h.y-k*10);h.fish.rotation.set(0,0,Math.sin(k*20)*.6)}}
  // spa
  if(G.zones.D){const s=G.spaV,on=G.spa.fuel>0;s.water.material.emissiveIntensity=on?.45+Math.sin(G.t*2)*.08:.05;s.bFire.material.emissiveIntensity=on?2.4:0;const n=on?Math.min(9,3+G.lv.spa*2):1;s.guests.forEach((g,i)=>{g.visible=i<n;g.position.y=5+Math.sin(G.t*1.4+i)*.8});
    G.spaStack.fill('cash',Math.min(220,Math.ceil(G.spa.pile/5)));if(G.spa.pile>1)label(SPA.pile.x,SPA.pile.y,30+G.spaStack.h,`$${G.spa.pile|0}`,'cash');
    label(SPA.boiler.x,SPA.boiler.y,90,on?bar(G.spa.fuel,'gold'):'<span class="lb warnbox" style="position:static">'+(DES()?'薪でポンプを動かす（動くとまわりが涼しい）':'薪を入れて沸かす（沸くとまわりが暖かい）')+'</span>','');if(on)label(SPA.x,SPA.y,150,'♨ ここも暖かい','gold sm')}
  {const mp=G.pads.find(q=>q.id==='monument');if(mp)mp.name=goalOf(YR()).n}
  if(G.monument||(YR()>1&&!monPadOn())){G.monPop=Math.min(1,(G.monPop||0)+dt*.8);G.monV.visible=true;G.monV.scale.setScalar(easeOutBack(G.monPop)*(1+(YR()-(G.monument?1:2))*.3));G.monV.userData.flame.scale.set(1,1+Math.sin(G.t*9)*.15,1)}
  for(const h of G.hauls){h.m.position.set(h.x,h.carried?10+Math.abs(Math.sin(G.t*9))*4:0,h.y);h.m.rotation.y=h.carried?Math.sin(G.t*4)*.15:0;if(!h.carried)label(h.x,h.y,64,G.players.length>1?'巨大肉：2人で運ぶ':'巨大肉','gold sm')}
  for(const p of G.players)if(p.buddy&&!p.inHeat&&p.id===0){const o=G.players[1];if(o)label((p.x+o.x)/2,(p.y+o.y)/2,70,'♥ 寄り添い中（体温が下がりにくい）','red sm')}
  G.woodStack.fill('log',ADV()?0:Math.min(40,G.woodpile));if(!ADV())label(WOOD.x,WOOD.y,30+G.woodStack.h,G.woodpile>0?`薪置き場 ${G.woodpile}本（自動でかまど強化へ）`:'薪置き場：火が満タンの時の薪がたまる','note');
  syncChests();
  for(const f of G.floats){const age=f.max-f.life,sc=age<.25?easeOutBack(age/.25):1;label(f.x,f.y,f.h+age*30,f.txt,f.cls,Math.min(1,f.life*2),sc)}
}

// ---- the town grows: furnace, shops, towers, traps and houses change with progress
function tierPop(o,lv,list,dt){if(o._lv!==lv){if(o._lv!=null&&lv>o._lv){o._pop=0;const p=o._pos;if(p){burst(p.x,p.y,40,24,{c:['#ffd23f','#ffffff','#9fe0ff'],s0:60,s1:200,u0:150,u1:320,l0:.6,l1:1,add:true,r0:5,r1:9});SFX.build()}}o._lv=lv;list.forEach((t,i)=>t.visible=i<lv)}
  if(o._pop!=null&&o._pop<1){o._pop=Math.min(1,o._pop+dt*1.6);const t=list[Math.max(0,lv-1)];if(t)t.scale.setScalar(Math.max(.01,easeOutBack(o._pop)))}}
function shopTier(id){const n=G.lv['cook_'+id]+G.lv['price_'+id];return n>=(id==='steak'?5:4)?2:n>=2?1:0}
function syncRescue(dt){const R=G.rescue;let V=G.rescueV;
  if(V&&(!R||V.id!==R.id)){world.remove(V.g);G.rescueV=V=null}
  if(!R)return;
  if(!V){const g=new T.Group();g.position.set(R.x,0,R.y);const beam=M_(new T.CylinderGeometry(7,7,520,10,1,true),new T.MeshBasicMaterial({color:lin('#ff5a3a'),transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide}),false);beam.position.y=260;g.add(beam);
    const ring=M_(new T.RingGeometry(52,60,40),new T.MeshBasicMaterial({color:lin('#ffd23f'),transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.y=1;g.add(ring);
    g.add(at(rot(box(40,6,14,std('#8a5a30',{map:TEX.wood})),0,.4,.3),30,8,-18));const people=[];for(let i=0;i<R.n;i++){const a=i/R.n*TAU;const v=makeVillager(PALS[(R.id+i)%PALS.length],{noShadow:true});v.g.position.set(Math.cos(a)*20,0,Math.sin(a)*20);v.g.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a));g.add(v.g);people.push(v)}
    world.add(g);G.rescueV=V={id:R.id,g,beam,ring,people}}
  V.beam.material.opacity=R.state==='wait'?.35+Math.sin(G.t*6)*.2:.1;V.ring.scale.setScalar(1+Math.sin(G.t*5)*.06);V.ring.visible=R.state==='wait';
  const k=R.state==='fail'?1:R.state==='done'?0:(R.kind==='hot'&&R.hotDone?.2:1-R.t/R.max);const vis=R.kind==='sled'?R.left:R.n;V.people.forEach((v,i)=>{tintCold(v,Math.min(1,k*1.1));v.g.visible=R.state!=='done'&&i<vis;v.g.position.x+=R.state==='wait'?Math.sin(G.t*50+i)*.25*k:0});
  if(R.state==='wait'){const need=R.kind==='hot'?(R.hotDone?'温まった！そばに立て':'お湯が必要（かまどでくむ）'):R.kind==='sled'?`犬ぞりで運べ ${R.saved}/${R.n}`:R.kind==='bears'?(R.gb>0?`オオカミを倒せ 残り${R.gb}`:'そばに立て'):'そばに立て';
    label(R.x,R.y,120,`<span style="display:block;font-size:13px">SOS 遭難者${R.n}人${R.spec?`・${SPECN[R.spec]}`:''}</span><span style="display:block;font-size:12px;color:#ffe07a">${need}</span>${Math.ceil(R.t)}秒`+(R.hold>0?bar(100*R.hold/1.2,'gold'):''),'red big',1,1+(R.t<10?Math.abs(Math.sin(G.t*6))*.15:0))}
  for(const p of G.players)if(p.kettle>0){label(p.x,p.y,100,`♨ お湯 ${Math.ceil(p.kettle)}秒`,'gold sm');if(Math.random()<dt*8)puff(p.x,p.y,40,{r:4,life:.8,a:.6,vy:30,grow:2})}}
function syncSleds(dt){while(G.sledV.length<G.sleds.length){const v=makeSledMesh();world.add(v.g);G.sledV.push(v);burst(G.sleds[G.sledV.length-1].x,G.sleds[G.sledV.length-1].y,30,30,{c:['#ffd23f','#ffffff'],s0:60,s1:200,u0:120,u1:300,l0:.6,l1:1,add:true})}
  G.sleds.forEach((q,i)=>{const v=G.sledV[i],p=q.rider!=null?G.players[q.rider]:null;if(!v.st){v.st=new Stack(v.g,'pile');v.st.g.position.set(0,10,-26);v.st.g.scale.setScalar(.8)}v.st.set(p?[]:(q.cargo||[]));v.pas.g.visible=!!q.pass;if(p){v.g.position.set(p.x,0,p.y);v.g.rotation.y=p.dir;const run=Math.hypot(p.vx||0,p.vy||0)>30;v.dogs.forEach((d,j)=>{d.legs.forEach((l,k)=>l.rotation.x=run?Math.sin(G.t*18+j+k*1.6)*.8:0);d.tail.rotation.z=Math.sin(G.t*10+j)*.4;d.g.position.y=run?Math.abs(Math.sin(G.t*18+j))*2:0});
      if(run&&Math.random()<dt*14)puff(p.x-Math.sin(p.dir)*20,p.y-Math.cos(p.dir)*20,3,{r:8,life:.6,a:.8,vy:14,grow:1.2})}
    else{v.g.position.set(q.x,0,q.y);v.dogs.forEach((d,j)=>{d.legs.forEach(l=>l.rotation.x=0);d.tail.rotation.z=Math.sin(G.t*6+j)*.5;d.head.rotation.y=Math.sin(G.t*.7+j)*.4});const me=G.players[G.me]||G.players[0];if(me&&dist(me.x,me.y,q.x,q.y)<220)label(q.x,q.y,60,'乗る：犬ぞり','gold sm')}});}
function syncTown(dt){syncRescue(dt);syncSleds(dt);const v=G.v;v.f._pos={x:CX,y:CY};const ft=G.level>=7?3:G.level>=5?2:G.level>=3?1:0;tierPop(v.f,ft,v.f.tiers,dt);if(ft>=3)v.f.tiers[2].rotation.y=G.t*.5;
  for(const id in G.stations){const st=G.stations[id];if(!st.open)continue;st.ct._pos={x:st.def.counter.x,y:st.def.counter.y};tierPop(st.ct,shopTier(id),st.ct.tiers,dt)}
  for(const tw of TOWERS){const m=G.towerV[tw.id],lv=G.lv['tw_'+tw.id];m.g.visible=lv>0;m._pos={x:tw.mx,y:tw.my};tierPop(m,lv,m.tiers,dt)}
  G.trapV.forEach((m,i)=>{m.visible=G.lv.trap>0;m.scale.setScalar(.8+G.lv.trap*.12);if(!m.visible)return;const a=GATE_ANG[i],gx=CX+Math.cos(a)*FR,gy=CY+Math.sin(a)*FR;
    const foe=G.bears.some(b=>!b.dead&&!b.hide&&dist(b.x,b.y,gx,gy)<78),U=m.userData;const was=U.up>.5;U.up=foe?Math.min(1,U.up+dt*9):Math.max(0,U.up-dt*1.6);
    if(foe&&!was&&U.up>.5){SFX.chop&&SFX.chop();burst(gx,gy,8,4,{c:['#d9d0c0','#ffffff'],s0:30,s1:90,u0:60,u1:140,l0:.25,l1:.5,r0:3,r1:6})}U.sp.position.y=-22+22*(foe?easeOutBack(U.up):U.up);U.sp.visible=U.up>0})
  const pop=G.surv.filter(s=>!s.frozen).length+G.workers.length;
  const rk=G.rank||0;syncStages(dt);
  if((G.level||1)>=8&&isNight()&&Math.random()<dt*1.2){const x=rnd(900,1500),y=rnd(900,1500),c=['#ffd23f','#ff8ad8','#7fe3ff','#8ff08f'][Math.floor(rnd(0,4))];burst(x,y,rnd(260,380),40,{c:[c,'#ffffff'],s0:80,s1:200,u0:-40,u1:60,g:60,l0:.8,l1:1.4,add:true,r0:5,r1:9});if(Math.random()<.5)tone(rnd(300,500),.15,'triangle',.02,-.5)}
  for(const [hi,h] of G.houses.entries()){const lv=houseLv(hi);h._pos={x:h.x,y:h.y};tierPop(h,lv,[h.tent,h.cab,h.man],dt);if(lv===3){h.tent.visible=h.cab.visible=false}if(lv===2){h.tent.visible=false;if(Math.random()<dt*1.5){const a=h.g.rotation.y;puff(h.x+Math.cos(a)*17-Math.sin(a)*8*0,h.y-Math.sin(a)*17,72,{c:'#c9d3dd',r:6,life:1.8,a:.5,vy:26,vx:G.wind*14,grow:2.2})}}}}
// ================================================================ guide arrow
const guide=(()=>{const g=new T.Group();const gm=glow('#ffd23f',1.2);const arrow=grp(at(rot(cone(10,18,gm,4,false),Math.PI,0,0),0,0,0),at(box(8,14,8,gm,false),0,15,0));
  const ring=rot(M_(new T.RingGeometry(22,28,32),basic('#ffd23f',{transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false),-Math.PI/2,0,0);g.add(arrow,ring);scene.add(g);
  const chev=[0,1,2].map(()=>{const m=M_(new T.ShapeGeometry(new T.Shape([new T.Vector2(-9,-4),new T.Vector2(0,7),new T.Vector2(9,-4),new T.Vector2(0,0)])),basic('#ffd23f',{transparent:true,side:T.DoubleSide,depthWrite:false}),false);m.rotation.x=-Math.PI/2;scene.add(m);return m});
  return{set(tg,p,t){const show=!!tg&&running;g.visible=show;chev.forEach(c=>c.visible=false);if(!show)return;g.position.set(tg.x,0,tg.y);arrow.position.y=(tg.h||60)+Math.abs(Math.sin(t*4))*12;arrow.rotation.y=t*2;ring.scale.setScalar(1+Math.sin(t*5)*.1);
    const d=dist(p.x,p.y,tg.x,tg.y);if(d>110){const a=Math.atan2(tg.x-p.x,tg.y-p.y);chev.forEach((c,i)=>{c.visible=true;const k=30+i*15+((t*40)%15);c.position.set(p.x+Math.sin(a)*k,1.5,p.y+Math.cos(a)*k);c.rotation.set(-Math.PI/2,0,-a+Math.PI);c.material.opacity=.9-i*.25})}}}})();

// ================================================================ camera & frame
const cam={x:CX,y:CY+80,z:1};let nightK=0;
function updateCam(dt,snap){const ps=NET.mode==='solo'?G.players:[G.players[G.me]||G.players[0]];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,cx=0,cy=0;
  for(const p of ps){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);cx+=p.x/ps.length;cy+=p.y/ps.length}
  let z=1;if(ps.length>1)z=clamp(Math.min(1,700/(Math.hypot(x1-x0,y1-y0)+300)),.5,1);
  if(G.camPan&&G.camPan.t<(G.camPan.d||2.2)){const D=G.camPan.d||2.2;G.camPan.t+=dt;const k=G.camPan.t<.5?G.camPan.t/.5:G.camPan.t>D-.5?Math.max(0,1-(G.camPan.t-(D-.5))/.5):1;cx=lerp(cx,G.camPan.x,k*.85);cy=lerp(cy,G.camPan.y,k*.85);z=lerp(z,G.camPan.z||.62,k)}
  cam.z=snap?z:lerp(cam.z,z,Math.min(1,dt*3));if(snap){cam.x=cx;cam.y=cy}else{cam.x=lerp(cam.x,cx,Math.min(1,dt*6));cam.y=lerp(cam.y,cy,Math.min(1,dt*6))}}
function hideIdleFx(dt){secretFx(dt||.016);roadFx();caravanFx();const me=G.players[G.me]||G.players[0];if(me&&G.sleds){if(me.riding)label(me.x,me.y,120,'<small>Fキーで降りる</small>','');else{const q=G.sleds.find(q=>q.rider==null&&dist(me.x,me.y,q.x,q.y)<90);if(q)label(q.x,q.y,50,'<b>Fキーで乗る</b>','gold')}}}
// ---- the equipped weapon rides on the character's back (story mode)
function wpnModel(id){const it=ITEMS[id];if(!it)return null;const n=it.n;const key=/弓/.test(n)?'Bow_Wooden':/斧/.test(n)?'Axe':/ハンマー|槌/.test(n)?'Hammer_Small':/ナックル/.test(n)?null:/杖|槍/.test(n)?'staff':'Sword';if(!key)return null;
  let src=key==='staff'?(KK&&KK.kit&&KK.kit.staff):(KK&&KK.prop&&KK.prop[key]&&KK.prop[key].scene);if(!src)return null;const o=src.clone(true);
  const em=/氷|霜|青/.test(n)?'#4fb8ff':/星|太陽|覇者|王|黄金/.test(n)?'#ffb020':/精霊/.test(n)?'#5fe07a':/毒/.test(n)?'#b04fff':null;
  o.traverse(q=>{if(q.isMesh){q.material=q.material.clone();q.castShadow=true;if(em){q.material.emissive=lin(em);q.material.emissiveIntensity=.35}}});
  const b=new T.Box3().setFromObject(o),sz=new T.Vector3();b.getSize(sz);const L=Math.max(sz.x,sz.y,sz.z)||1;o.scale.multiplyScalar((/大/.test(n)?50:40)/L);
  const w=new T.Group();w.add(o);b.setFromObject(w);const c=new T.Vector3();b.getCenter(c);o.position.sub(c);const r=new T.Group();r.add(w);w.rotation.set(0,0,key==='Bow_Wooden'?.35:2.5);return r}
function backWeapon(p,m,busy){if(!m.back)return;const id=isRPG()&&p.eq?p.eq.w:null;if(m._wid!==id){m._wid=id;if(m.backW){m.back.remove(m.backW);m.backW=null}if(id){m.backW=wpnModel(id);if(m.backW){m.backW.position.set(0,10,-4);m.back.add(m.backW)}}}if(m.backW)m.backW.visible=!busy}
const monPadOn=()=>{const mp=G.pads.find(q=>q.id==='monument');return !!(mp&&mp.shown)};
function monBar(){if(G.raid&&G.raid.on&&G.raid.final&&G.monMax&&G.monV&&G.monV.visible)label(G.monV.position.x,G.monV.position.z,170,bar(100*Math.max(0,G.monHP)/G.monMax,'red'),'')}
function frozenFx(){for(const v of G.surv)if(v.frozen&&v.m&&v.m.g.visible)label(v.x,v.y,82,`<b>${DES()?'倒れた町人':'凍えた町人'}</b><br><small>${DES()?'そばに立つと助け起こせる':'そばに立つと溶ける'}</small><br>${bar(100*Math.min(1,v.warm/35),'gold wide')}`,'ice')}
function hideIdle(){let shown=0;for(const v of G.surv){const idle=v.arrived&&!v.frozen;const vis=!idle||shown++<5;if(v.m&&v.m.g.visible!==vis)v.m.g.visible=vis}}
function frame(dt){hideIdle();monBar();frozenFx();vigFx();hideIdleFx(dt);
  const phase=(G.t%G.DAY)/G.DAY,nk=phase>.72?Math.min(1,(phase-.72)/.06):phase<.04?1-phase/.04:0;nightK=lerp(nightK,nk*(running?1:0)+(G.wave?.2:0),Math.min(1,dt*2));
  const K=Math.min(1,nightK);const dz=DES();scene.fog.color.copy(dz?FOG_DES:FOG_DAY).lerp(FOG_NIGHT,K);sky.material.uniforms.top.value.copy(lin(dz?'#5aa3e6':'#6fa9d8')).lerp(lin('#0b1530'),K);sky.material.uniforms.mid.value.copy(lin(dz?'#f2d6a4':'#bcd0e2')).lerp(lin('#1b2a44'),K);sky.material.uniforms.bot.value.copy(lin(dz?'#f5ddb0':'#c9d7e4')).lerp(lin('#24344f'),K);
  {const wt=G.wx&&G.wx.type,k=wt?Math.min(1,G.wx.t/2,(G.wx.max-G.wx.t)/2+.001):0;$('wxFx').style.opacity=running&&wt==='blizzard'?.85*k:0;
    if(wt==='aurora'){const a=Math.sin(G.t*.8)*.5+.5;sky.material.uniforms.top.value.lerp(lin(a>.5?'#2fd49a':'#7a5cff'),.55*k);sky.material.uniforms.mid.value.lerp(lin('#1d5a6a'),.35*k)}
    if(wt==='clear'){sky.material.uniforms.top.value.lerp(lin('#3f95e8'),.6*k)}}
  hemi.intensity=(.55-K*.37)*(G.wx&&G.wx.type==='clear'?1.25:1);sun.intensity=(1.0-K*.72)*(G.wx&&G.wx.type==='clear'?1.3:1);sun.color.copy(K>.4?lin('#9fb8ff'):lin('#fff0dc'));
  {const mp=G.players[G.me]||G.players[0];$('coldFx').style.opacity=running?Math.max(G.wave?.45:0,(mp.down>0?1:(mp.warm<50?(1-mp.warm/50):0))*.95):0}
  const hurt=Math.max(...G.players.map(p=>p.hurt));cv.style.filter=hurt>0?`sepia(${hurt}) saturate(${1+hurt*4}) hue-rotate(-30deg)`:'';
  const rpgCam=isRPG()&&running;
  {const ty=rpgCam?CAMS.yaw:YAW,tp=rpgCam?CAMS.pitch:PITCH;let dy=ty-CAMS.cur;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const k=Math.min(1,dt*10);CAMS.cur+=dy*k;CAMS.curP=lerp(CAMS.curP,tp,k);camDir.set(Math.sin(CAMS.cur)*Math.cos(CAMS.curP),Math.sin(CAMS.curP),Math.cos(CAMS.cur)*Math.cos(CAMS.curP))}
  const D=(rpgCam?150*CAMS.zoom/TANH*(1+Math.max(0,CAMS.curP-.6)*.5):Math.max(390/(2*TANH*camera.aspect),560/(2*TANH)))/cam.z,LY=rpgCam?28:0;
  const shx=(Math.random()-.5)*G.shake,shy=(Math.random()-.5)*G.shake,tx=cam.x+shx,tz=cam.y+shy;
  camera.position.set(tx+camDir.x*D,LY+camDir.y*D,tz+camDir.z*D);camera.lookAt(tx,LY,tz);camera.updateMatrixWorld();{const bz=G.wx&&G.wx.type==='blizzard';scene.fog.near=D*(bz?.55:1.5);scene.fog.far=D*(bz?1.6:4.2)}
  sun.position.set(tx-380,760,tz+240);sun.target.position.set(tx,0,tz);
  const scale=PR*H/(2*TANH);psN.update(dt,scale);psA.update(dt,scale);snow.update(dt,cam.x,cam.y,G.wind+(wxIs('blizzard')?2.2:0),(G.story&&G.story.ch>=5)?.04:wxIs('blizzard')?1:wxIs('clear')?.08:Math.min(1,.35+G.day*.08+(G.wave?.5:0)),scale);sparkle.uniforms.uT.value=G.t;sparkle.uniforms.uS.value=scale;
  sync(dt);
  const gp=G.players[G.me]||G.players[0];const coldT=gp&&!gp.inHeat&&!gp.down&&gp.warm<35?{x:CX,y:CY,h:130}:null;
  {const el=$('sosArrow'),R=G.rescue;if(running&&R&&R.state==='wait'){pv.set(R.x,60,R.y).project(camera);let sx=(pv.x+1)/2*W,sy=(1-pv.y)/2*H;const behind=pv.z>1;if(behind){sx=W-sx;sy=H-sy}
    const top=150,m=44,mx=86,on=!behind&&sx>m&&sx<W-m&&sy>top&&sy<H-90;if(on)el.hidden=true;else{el.hidden=false;const cx=W/2,cy=(top+H-90)/2;let dx=sx-cx,dy=sy-cy;const k=Math.min((W/2-mx)/Math.abs(dx||1e-3),((H-90-top)/2)/Math.abs(dy||1e-3));const ex=cx+dx*Math.min(1,k),ey=cy+dy*Math.min(1,k);
      const d=Math.round(dist(gp.x,gp.y,R.x,R.y)/10);el.style.transform=`translate(${ex|0}px,${ey|0}px) translate(-50%,-50%)`;el.firstChild.style.transform=`rotate(${Math.atan2(dy,dx)+Math.PI/2}rad)`;$('sosTxt').textContent=`SOS ${Math.ceil(R.t)}秒・${d}m`}}else el.hidden=true}
  {const _gt=running?(coldT||(G.fuel<25&&!G.raid.on?(has(gp,DES()?'water':'log')?{x:CX,y:CY,h:110}:(DES()?freeHole(gp):nearestTree(gp))):null)||rescueT(gp)||storyT(gp)||(MISSIONS[G.mission]?MISSIONS[G.mission].tg(gp):flow(gp))):null;G._gt=_gt;guide.set(_gt,gp,G.t)}
  storyVis();warnFx();driftFx();fireFx();npcFx();rankFx();caveFx();pzFx();heart4Fx();advFx();occFx();survDesertFx();extrasFx();rebuildFx();cullWorld();if(composer)composer.render();else renderer.render(scene,camera);endLabels();
  joys.forEach((j,i)=>{const el=$('joy'+i);if(!j.on){el.hidden=true;return}el.hidden=false;el.style.left=j.ox+'px';el.style.top=j.oy+'px';const dx=j.x-j.ox,dy=j.y-j.oy,m=Math.hypot(dx,dy),k=m>50?50/m:1;el.firstChild.style.transform=`translate(${dx*k}px,${dy*k}px)`;el.firstChild.style.background=nPlayers===2?HERO[i].tag:'#fff'});
}
// ================================================================ HUD
function vigFx(){const el=$('vig');if(!el)return;const me=G.players[G.me]||G.players[0];let c='';if(running&&me){if(!me.inHeat&&me.warm<30&&!me.down)c=DES()?'heat':'frost';else if(G.raid&&G.raid.on)c='raid';else if(G.fuel<15)c='dim'}if(el._c!==c){el._c=c;el.className=c}}
function hudInit(){const fn=$('hFurnN');if(fn)fn.textContent=DES()?'井戸':'かまど';const ft=$('hFuelTxt');if(ft)ft.textContent=DES()?'水位':'燃料';const fz=$('hFrzN');if(fz)fz.textContent=DES()?'倒れた町人':'凍った町人';$('hBody').innerHTML=[G.players[G.me]||G.players[0]].map(p=>`<div class="bodyt" id="bt${p.id}"><i id="bti${p.id}"></i><span><span id="btt${p.id}">体温</span></span></div>`).join('');$('bottom').innerHTML=`<div class="pill" id="lvBox"><span class="lvb">Lv <span id="hPlv">1</span></span><span class="xpb"><i id="hXp"></i></span></div>`+G.players.map(p=>`<div class="pill pc" id="pc${p.id}">${G.players.length>1?`<span class="tg" style="background:${HERO[p.id].tag}">${HERO[p.id].tagText}</span>`:''}<svg class="icon" viewBox="0 0 26 22"><path d="M4 8h18l-2 12H6z" fill="#c98a4b"/><path d="M4 8h18" stroke="#8a5a30" stroke-width="2.4" stroke-linecap="round"/><path d="M8 8c0-5 10-5 10 0" fill="none" stroke="#8a5a30" stroke-width="2"/><path d="M7 12h12M7.5 16h11" stroke="#a8743f" stroke-width="1.4"/></svg><span class="num sm" id="pcv${p.id}"></span><span class="hpb"><i id="hp${p.id}"></i></span></div>`).join('')}
function hud(){lifeHud();qlogHud();trackerHud();mapHud();G.cashShow+=(G.cash-G.cashShow)*.2;if(Math.abs(G.cash-G.cashShow)<1)G.cashShow=G.cash;$('hCash').textContent=Math.round(G.cashShow).toLocaleString();
  $('hDay').textContent=G.day;$('hTemp').textContent=tempC()+'℃';$('hDayIco').textContent=isNight()?'☾':'☀';$('hDayBox').classList.toggle('night',isNight());
  $('hLv').textContent=G.level;$('hFuel').style.width=G.fuel+'%';$('hFuelBar').classList.toggle('low',G.fuel<20);$('hFuelTxt').textContent=DES()?(G.fuel<20?'水がない！':'水位'):G.wave?'大寒波！':G.fuel<20?'燃料がない！':'燃料';
  const idle=idleSurvivors().length;$('hIdle').textContent=popNow();$('hPop').textContent=houseCap();$('hPopBox').classList.toggle('warn',popNow()>=houseCap());$('hFrz').textContent=G.frozen;$('hFrzBox').classList.toggle('warn',G.frozen>=3);
  const r=Math.round(G.rep);$('hRep').textContent='★'.repeat(r)+'☆'.repeat(5-r);$('hRepBox').classList.toggle('warn',G.rep<=1.5);
  {const R=G.rescue,on=!!R&&R.state==='wait';$('hSos').hidden=!on;if(on)$('hSosN').textContent=Math.ceil(R.t)}
  {const key=G.mods?G.mods[0].id+G.mods[1].id+'|'+(G.secFound||0)+'|'+DM().n:'';if(G.mods&&$('hModTxt')._m!==key){$('hModTxt')._m=key;$('hModTxt').innerHTML=`${DM().n}<br>◎${G.mods[0].t}<br>✕${G.mods[1].t}<br>ひみつ ${G.secFound||0}/${G.secrets?G.secrets.length:0}`}}
  {const rk=G.rank||0,nx=RANKS[rk+1];$('hRank').textContent=nx?`${RANKS[rk].n}・次${nx.p}人`:RANKS[rk].n}
  {const w=G.wx&&G.wx.type?WXS.find(q=>q.id===G.wx.type):null;$('hWx').hidden=!w;if(w){$('hWxN').textContent=w.ic+' '+w.n;$('hWxT').textContent=Math.ceil(G.wx.t)}}
  $('hRaid').hidden=!G.raid.on;if(G.raid.on)$('hRaidN').textContent=G.raid.left;
  $('hPlv').textContent=G.plv;$('hXp').style.width=(100*G.xp/xpNeed())+'%';
  for(const p of G.players){$('pcv'+p.id).textContent=`${p.bag.length}/${cap(p)}`;$('pc'+p.id).classList.toggle('full',p.bag.length>=cap(p));$('hp'+p.id).style.width=p.hp+'%';if(!$('bti'+p.id))continue;$('bti'+p.id).style.width=p.warm+'%';$('bt'+p.id).classList.toggle('cold',p.warm<30&&!p.down);$('bt'+p.id).classList.toggle('warm',!!p.inHeat&&p.warm<99);const tw=TW();$('btt'+p.id).textContent=(p.down?(DES()?'干からびた…':'こごえた…'):p.buddy&&!p.inHeat?`${tw} ${p.warm|0}% ♥寄り添い`:p.warm<30?`${tw} ${p.warm|0}% あぶない！`:p.inHeat?(p.warm<99?`${tw} ${p.warm|0}% 回復中`:(DES()?'水分 100% うるおい':'体温 100% ぽかぽか')):`${tw} ${p.warm|0}% 下がり中`)}
  if(storyHud()){}else if(G.mission<MISSIONS.length){const m=MISSIONS[G.mission],[c,g]=m.f();$('mN').textContent=`${G.mission+1}/${MISSIONS.length}`;$('mT').textContent=desTxt(m.t);$('mP').textContent=`${Math.min(c,g)}/${g}`}
  else{const g=goalOf(YR());$('mN').textContent=G.story&&CH[G.story.ch]?CH[G.story.ch].n:`${YR()}年目`;$('mT').textContent=desTxt(`${g.n}を建てろ（かまどLv${g.lv}・町人${g.pop}人）`);$('mP').textContent=`$${g.c.toLocaleString()}`}}

