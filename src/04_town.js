// ================================================================ the town grows with the furnace level
const TOWN={1:{n:'野営地',d:''},2:{n:'灯りの集落',d:'道ができて、飾り電球が灯った'},3:{n:'きこりの村',d:'製材所と街灯が建った'},4:{n:'広場のある村',d:'石畳の広場とベンチができた'},5:{n:'風車の町',d:'石畳の道・風車・旗が並んだ'},6:{n:'教会の町',d:'教会の鐘が鳴る'},7:{n:'石壁の街',d:'柵が石の城壁になり、酒場ができた'},8:{n:'光の都',d:'黄金の門と、夜空に花火'}};
const TSPOTS=[[760,770],[1640,770],[780,1650],[1655,1690]];
let _roadTex=null,_cobTex=null;
function roadTex(cob){const make=(cob)=>canvasTex(128,512,(g,w,h)=>{h=h||512;g.clearRect(0,0,w,h);
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const e=Math.min(x,w-x)/(w*.5);const a=Math.min(1,e*2.6);if(a<=0)continue;let r,gg,b;
    if(cob){const cx=(x+(Math.floor(y/16)%2)*8)%16,cy=y%16;const edge=cx<2||cy<2;const v=edge?-38:Math.random()*22-8;r=158+v;gg=164+v;b=172+v}else{const v=Math.random()*30-12;r=176+v;gg=160+v*.9;b=138+v*.8;if(Math.random()<.18){r=gg=b=236}}
    g.fillStyle=`rgba(${r|0},${gg|0},${b|0},${a*(cob?.97:.85)})`;g.fillRect(x,y,2,2)}});
  if(cob)return _cobTex||(_cobTex=make(true));return _roadTex||(_roadTex=make(false))}
function makeTownStages(){const S=[];for(let i=0;i<8;i++){const g=new T.Group();g.visible=false;world.add(g);S.push(g)}
  const rv=makeRankVisuals();const mv=(src,dst,fx)=>{for(const c of [...src.children]){if(fx)fx(c);dst.add(c)}world.remove(src)};
  const roads=[[-Math.PI/2,FR+10],[0,FR+10],[Math.PI,FR+10],[Math.PI/2,380]];
  const strip=(a,len,wd,cob,y)=>{const t=roadTex(cob).clone();t.needsUpdate=true;t.wrapS=T.ClampToEdgeWrapping;t.wrapT=T.RepeatWrapping;t.repeat.set(1,len/(cob?110:200));
    const m=M_(new T.PlaneGeometry(wd,len),new T.MeshStandardMaterial({map:t,alphaTest:.45,depthWrite:false,roughness:.95}),false,true);m.rotation.set(-Math.PI/2,0,-a+Math.PI/2);const r0=100,mid=r0+len/2;m.position.set(CX+Math.cos(a)*mid,y,CY+Math.sin(a)*mid);m.renderOrder=1;return m};
  // Lv2 灯りの集落: trampled roads + string lights and gate flags
  for(const [a,r] of roads)S[1].add(strip(a,r-100,86,false,.32));mv(rv[0],S[1]);
  // Lv3 きこりの村: lamps along the roads + lumber mill
  const padNear=(x,y)=>G.pads.some(p=>Math.abs(p.x-x)<62&&Math.abs(p.y-y)<62)||Object.values(STN).some(q=>dist(q.conv.x,q.conv.y,x,y)<70||dist(q.counter.x,q.counter.y,x,y)<90);
  for(const [a,r] of roads.slice(0,3))for(let d=190,k=0;d<r-50;d+=105,k++){const sd=k%2?1:-1,x=CX+Math.cos(a)*d-Math.sin(a)*sd*62,y=CY+Math.sin(a)*d+Math.cos(a)*sd*62;if(padNear(x,y))continue;const l=makeLamp();l.position.set(x,0,y);S[2].add(l)}
  if(KK){const [x,y]=TSPOTS[0];S[2].add(kkP('lumbermill',120,x,0,y,Math.PI*.75),kkP('lumber',44,x+70,0,y+40,.4),kkP('wheelbarrow',30,x+40,0,y+80,1.2),kkP('crate',24,x-60,0,y+50,.3))}
  // Lv4 広場のある村: paved plaza + benches
  mv(rv[1],S[3]);
  // Lv5 風車の町: cobblestone roads, windmill, banners on the fence
  for(const [a,r] of roads)S[4].add(strip(a,r-100,70,true,.42));
  if(KK){const [x,y]=TSPOTS[1];S[4].add(kkP('windmill',120,x,0,y,Math.PI*.25),kkP('sack',22,x-60,0,y+60,.5),kkP('sack',22,x-44,0,y+72,1.1),kkP('barrel',22,x+60,0,y+50,0))}
  {const cols=['#e5483d','#2f7de0','#ffcf4a','#3fc157'];let i=0;for(let a=-Math.PI;a<Math.PI;a+=.2){const gap=GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<.2)||(a>SOUTH[0]-.05&&a<SOUTH[1]+.05);if(gap)continue;const x=CX+Math.cos(a)*(FR+16),y=CY+Math.sin(a)*(FR+16);const f=new T.Group();f.position.set(x,0,y);f.rotation.y=-a;
    f.add(at(cyl(1.4,1.6,74,std('#5a3a20',{map:TEX.bark}),6),0,37,0));const cl=M_(new T.PlaneGeometry(22,30),std(cols[i++%4],{side:T.DoubleSide,r:.8}),false);cl.position.set(0,58,11);cl.rotation.y=Math.PI/2;f.add(cl);f.add(at(sph(2.2,std('#ffcf4a',{m:.8,r:.3}),false,6,4),0,75,0));S[4].add(f)}}
  // Lv6 教会の町: church (moved out to the south-west corner)
  mv(rv[2],S[5],c=>{c.position.set(TSPOTS[2][0],0,TSPOTS[2][1]);c.rotation.y=-Math.PI*.25;c.scale.multiplyScalar(1.15)});
  // Lv7 石壁の街: stone wall replaces the wooden fence + tavern
  {const seg=[],pil=[];const L=64,step=L/FR;for(let a=-Math.PI;a<Math.PI-step/2;a+=step){const an=a+step/2;const gap=q=>GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(q-g),Math.cos(q-g)))<.13)||(q>SOUTH[0]&&q<SOUTH[1]);if(gap(an))continue;seg.push(an);pil.push(a);if(gap(a+step))pil.push(a+step)}
    const stone=std('#aeb6c0',{map:TEX.stone,r:.9}),cap=std('#f4f8fc',{r:.9}),o=new T.Object3D();const mk=(geo,mat,list,f)=>{const im=new T.InstancedMesh(geo,mat,list.length);im.castShadow=im.receiveShadow=true;list.forEach((a,i)=>{f(o,a);o.updateMatrix();im.setMatrixAt(i,o.matrix)});im.visible=false;world.add(im);return im};
    const wallW=mk(new T.BoxGeometry(L+2,44,14),stone,seg,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,22,CY+Math.sin(a)*FR);o.rotation.set(0,-a-Math.PI/2,0)});
    const wallC=mk(new T.BoxGeometry(L+4,4,18),cap,seg,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,46,CY+Math.sin(a)*FR);o.rotation.set(0,-a-Math.PI/2,0)});
    const tw=mk(new T.CylinderGeometry(12,14,62,8),stone,pil,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,31,CY+Math.sin(a)*FR);o.rotation.set(0,a,0)});
    const twc=mk(new T.ConeGeometry(15,18,8),std('#2f5f8f',{r:.6}),pil,(o,a)=>{o.position.set(CX+Math.cos(a)*FR,71,CY+Math.sin(a)*FR);o.rotation.set(0,a,0)});
    G.wallIM=[wallW,wallC,tw,twc]}
  if(KK){const [x,y]=TSPOTS[3];S[6].add(kkP('tavern',110,x,0,y,-Math.PI*.75),kkP('barrel',22,x-66,0,y-30,0),kkP('barrel',22,x-60,0,y-10,.6),kkP('crate',24,x-40,0,y-62,.2))}
  // Lv8 光の都: golden gate + light pillars at the landmarks
  mv(rv[3],S[7]);for(const [x,y] of TSPOTS){const b=M_(new T.CylinderGeometry(16,16,700,12,1,true),new T.MeshBasicMaterial({color:lin('#ffe38a'),transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),false);b.position.set(x,350,y);S[7].add(b)}
  for(const g of S)for(const c of g.children)c.userData.s0=c.scale.clone();
  return{list:S,lv:null}}
function setWall(k){if(!G.wallIM)return;const on=k>0;for(const m of G.wallIM){m.visible=on;m.scale.y=Math.max(.001,k)}for(const m of G.fenceIM||[]){if(m.userData.hid)continue;m.scale.y=Math.max(.001,1-k);m.visible=k<1}}
function syncStages(dt){const TS=G.townS;if(!TS)return;const L=clamp(G.level||1,1,8);
  if(TS.lv==null){TS.lv=L;TS.list.forEach((g,i)=>g.visible=i<L);setWall(L>=7?1:0);for(const m of G.fenceIM||[])if(!m.visible&&L<7)m.userData.hid=1;return}
  if(L>TS.lv){for(let i=TS.lv;i<L;i++){const g=TS.list[i];g.visible=true;g.userData.t=0;for(const c of g.children){c.userData.dl=.7+dist(c.position.x,c.position.z,CX,CY)/800;c.scale.setScalar(.001)}}
    if(TS.lv<7&&L>=7)TS.wallT=0;TS.lv=L;townFx(L)}
  for(const g of TS.list){const u=g.userData;if(!g.visible||u.t==null||u.t>4)continue;u.t+=dt;for(const c of g.children){const q=c.userData,k=clamp((u.t-q.dl)/.5,0,1),e=k<=0?.001:Math.max(.001,easeOutBack(k));c.scale.set(q.s0.x*e,q.s0.y*e,q.s0.z*e);
      if(k>0&&!q.pf){q.pf=1;if(Math.random()<.5)burst(c.position.x,c.position.z,10,6,{c:['#ffffff','#ffd23f','#dff3ff'],s0:30,s1:110,u0:60,u1:160,l0:.4,l1:.8,r0:3,r1:6})}}}
  if(TS.wallT!=null&&TS.wallT<1){TS.wallT=Math.min(1,TS.wallT+dt*.45);setWall(TS.wallT<.3?0:(TS.wallT-.3)/.7);if(TS.wallT>.3&&Math.random()<dt*20){const a=rnd(-Math.PI,Math.PI);puff(CX+Math.cos(a)*FR,CY+Math.sin(a)*FR,10,{c:'#c9d3dd',r:14,life:1.2,a:.6,vy:30,grow:2})}}}
function townFx(L){const t=TOWN[L];if(!t)return;G.camPan={x:CX,y:CY+40,t:0,z:.4,d:4.2};SFX.area();G.shake=Math.max(G.shake||0,8);
  setTimeout(()=>{if(running)burst(CX,CY,80,60,{c:['#ffd23f','#ffffff','#ff8ad8','#9fe0ff'],s0:120,s1:380,u0:260,u1:520,l0:.9,l1:1.6,add:true,r0:6,r1:12})},500);
  setTimeout(()=>{if(running)float(CX,CY,170,`町のすがた「${t.n}」`,'gold',true)},900)}

function makeRankVisuals(){const out=[];
  // 村: string lights + gate flags
  const r1=new T.Group();const pairs=[[[1030,1400],[1240,1400]],[[1240,1400],[1450,1400]],[[1030,1700],[1450,1700]],[[800,1400],[1030,1400]]];const bc=['#ffd166','#ff8ad8','#7fe3ff','#8ff08f'];
  for(const [[x0,y0],[x1,y1]] of pairs){const n=Math.round(dist(x0,y0,x1,y1)/18);for(let i=1;i<n;i++){const k=i/n;r1.add(at(sph(2.4,glow(bc[i%4],2.6),false,6,4),lerp(x0,x1,k),62-Math.sin(k*Math.PI)*16,lerp(y0,y1,k)))}}
  for(const a of GATE_ANG)for(const sd of [-1,1]){const aa=a+sd*.13,x=CX+Math.cos(aa)*FR,y=CY+Math.sin(aa)*FR;r1.add(at(cyl(1.4,1.4,40,std('#c9a24a',{m:.8,r:.3}),6),x,100,y));r1.add(at(rot(box(1,14,22,std(sd<0?'#e5483d':'#2f7de0',{side:T.DoubleSide}),false),0,a,0),x,112,y+0))}
  out.push(r1);
  // 町: paved plaza around the furnace + benches
  const r2=new T.Group();const pave=M_(new T.RingGeometry(78,158,48),std('#9aa4b0',{map:TEX.stone,r:.85}),false,true);pave.rotation.x=-Math.PI/2;pave.position.set(CX,.5,CY);r2.add(pave);
  const edge=M_(new T.RingGeometry(156,162,64),std('#c9a24a',{m:.6,r:.4}),false);edge.rotation.x=-Math.PI/2;edge.position.set(CX,.7,CY);r2.add(edge);
  for(let i=0;i<6;i++){if(i===1)continue;const a=i/6*TAU+.5,x=CX+Math.cos(a)*140,y=CY+Math.sin(a)*140;const b=new T.Group();b.add(at(box(30,3,10,std('#a8743f',{map:TEX.wood})),0,9,0));b.add(at(box(30,10,2,std('#a8743f',{map:TEX.wood})),0,15,-5));for(const sx of [-12,12])b.add(at(box(2,9,8,std('#3a3f48')),sx,4.5,0));b.position.set(x,0,y);b.rotation.y=Math.atan2(CX-x,CY-y);r2.add(b)}
  out.push(r2);
  // 街: clock tower
  const r3=new T.Group();const ct=new T.Group();ct.position.set(895,0,1470);const stone=std('#b8c0ca',{map:TEX.stone});ct.add(at(rbox(44,110,44,3,stone),0,55,0));ct.add(at(rbox(52,8,52,2,std('#8b96a3')),0,114,0));
  ct.add(at(rot(cone(38,46,std('#2f5f8f',{r:.6}),4),0,Math.PI/4,0),0,141,0));ct.add(at(cone(4,16,std('#ffcf4a',{m:.85,r:.25}),6),0,170,0));
  for(const [rx,ry,z] of [[0,0,22.6],[0,Math.PI/2,22.6],[0,Math.PI,22.6],[0,-Math.PI/2,22.6]]){const f=new T.Group();f.rotation.y=ry;const face=at(cyl(13,13,1.5,glow('#fff4d0',1.2),24,false),0,90,z);face.rotation.x=Math.PI/2;f.add(face);f.add(at(box(1.6,9,1,std('#16283a'),false),0,93,z+1.2));f.add(at(box(7,1.6,1,std('#16283a'),false),3,90,z+1.2));ct.add(f)}
  bake(ct);inkOutline(ct);ct.add(blob(40));if(KK){const ch=kkProp('church',92);ch.position.set(895,0,1470);ch.rotation.y=Math.PI*.25;r3.add(ch)}else r3.add(ct);out.push(r3);
  // 都: golden gate over the market
  const r4=new T.Group();const gold=std('#ffcf4a',{m:.85,r:.25,e:'#a86a00',ei:.25});const gx=CX,gy=CY-FR;for(const sx of [-72,72]){r4.add(at(cyl(8,10,120,gold,12),gx+sx,60,gy));r4.add(at(sph(12,gold,true,12,10),gx+sx,126,gy))}
  r4.add(at(box(160,12,12,gold),gx,114,gy));const sign=makeTextPlate('めちゃホワイト',130,24,'#5b4636','#ffe38a',.6);sign.position.set(gx,96,gy+7);r4.add(sign);
  for(let i=0;i<8;i++)r4.add(at(sph(3,glow(bc[i%4],2.8),false,6,4),gx-70+i*20,106,gy+7));out.push(r4);
  for(const o of out){o.visible=false;world.add(o)}return out}
function makeHusky(){const g=new T.Group(),fur=std('#8d97a3',{r:.9}),white=std('#f4f6f8',{r:.9}),dark=std('#1a2433');
  const body=new T.Group();body.add(at(scl(sph(7,fur,true,10,8),1,.85,1.6),0,11,0));body.add(at(scl(sph(5.4,white,true,10,8),1,.7,1.3),0,8.6,1));g.add(body);
  const head=new T.Group();head.position.set(0,16,10);head.add(sph(5,fur,true,10,8));head.add(at(scl(sph(3.4,white,true,8,6),1,.8,1.2),0,-1.4,3.6));head.add(at(sph(1.1,dark,false,6,4),0,-.4,7.6));
  for(const sx of [-1,1]){head.add(at(rot(cone(1.9,5,fur,4),0,0,sx*-.2),sx*2.8,5.2,-.4));head.add(at(sph(.9,std('#6fb8ff',{e:'#6fb8ff',ei:.6}),false,6,4),sx*2,1.2,4.2))}g.add(head);
  const tail=at(rot(cone(2.2,9,fur,6),-.9,0,0),0,15,-10);g.add(tail);
  const legs=[[-3.5,5],[3.5,5],[-3.5,-6],[3.5,-6]].map(([x,z])=>{const l=at(new T.Group(),x,8,z);l.add(at(cyl(1.5,1.3,9,white,6),0,-4,0));g.add(l);return l});inkOutline(g);return{g,legs,head,tail}}
function makeSledMesh(){const pv_=makeVillager(PALS[3],{noShadow:true});const g=new T.Group(),wood=std('#a8743f',{map:TEX.wood}),red=std('#e5483d',{r:.6});
  for(const sx of [-9,9]){g.add(at(box(2.4,2,44,std('#3a3f48',{m:.6,r:.4})),sx,1,0));g.add(at(rot(box(2.4,2,8,std('#3a3f48',{m:.6,r:.4})),-.8,0,0),sx,3.4,24))}
  g.add(at(box(22,3,34,wood),0,5,-2));for(const sx of [-10,10])g.add(at(box(2,8,30,red),sx,10,-2));g.add(at(box(22,14,2,red),0,12,-18));
  const dogs=[makeHusky(),makeHusky()];dogs.forEach((d,i)=>{d.g.position.set(i?9:-9,0,40);g.add(d.g)});g.add(at(box(1,1,26,std('#d9b77a'),false),0,10,30));inkOutline(g);g.add(blob(40));pv_.g.position.set(0,6,-10);pv_.g.scale.setScalar(.8);pv_.g.visible=false;g.add(pv_.g);g.scale.setScalar(1.35);return{g,dogs,pas:pv_}}
function makeHaul(big){const g=new T.Group(),wood=std('#8a5a30',{map:TEX.wood});for(const s_ of [-1,1])g.add(at(rbox(6,4,78,2,std('#5a3a20')),s_*20,2,0));g.add(at(rbox(48,5,62,2,wood),0,7,0));
  const meat=itemMesh('meat');meat.scale.setScalar(big>1?4.4:3.4);meat.position.y=20;g.add(meat);g.add(at(rot(tor(20,1.6,std('#d9b77a'),false,6,20),Math.PI/2,0,0),0,22,0));g.add(blob(44));return g}
function makeHeli(){const g=new T.Group();g.add(at(scl(sph(26,std('#e8452f',{r:.4,m:.3}),true,18,12),1.6,1,1),0,30,0));g.add(at(scl(sph(18,std('#bfe6ff',{r:.1,m:.5,t:true,op:.8}),false,14,10),1,.8,1),22,34,0));
  g.add(at(box(70,6,6,'#e8452f'),-56,34,0));g.add(at(box(6,20,4,'#ffffff'),-90,40,0));const rotor=at(new T.Group(),0,58,0);rotor.add(box(160,1.6,6,'#2b3440'),rot(box(160,1.6,6,'#2b3440'),0,Math.PI/2,0));g.add(rotor,at(cyl(2,2,10,'#2b3440',6),0,52,0));
  for(const s of [-1,1])g.add(at(box(70,3,3,'#2b3440'),0,4,s*16));g.userData.rotor=rotor;return g}

// ================================================================ world layout
const ZONES=[
  {id:'B',pop:6,name:'氷の湖',sub:'魚はかまどLv3の材料にも・焼き魚屋台',rect:[1720,620,2360,1780],cost:400,lv:2,pad:{x:1580,y:1070},col:'#2f8fd6'},
  {id:'C',pop:10,name:'奥地の森',sub:'毛皮はかまどLv4の材料にも・ボスも出る',rect:[40,620,680,1780],cost:1600,lv:3,pad:{x:820,y:1070},col:'#5a7a3a'},
  {id:'D',pop:14,name:'温泉郷',sub:'沸かすとまわりが暖かい第2のかまどに（放置でも稼ぐ）',rect:[660,1820,1740,2370],cost:4000,lv:4,pad:{x:1235,y:1760},col:'#c24f7a'}];
const HUNT_A=[260,100,2140,690];for(const z of ZONES)z.o={name:z.name,sub:z.sub};
const DZN={B:{name:'塩の湖',sub:'塩の結晶がたくさん・キャラバンが高く買う'},C:{name:'岩の渓谷',sub:'大サソリの巣・甲殻がとれる'},D:{name:'オアシス',sub:'泉のまわりは涼しく、放っておいても稼ぐ'}};
function zoneNames(){for(const z of ZONES){const n=DES()?DZN[z.id]:z.o;z.name=n.name;z.sub=n.sub}}
const GATE_ANG=[-Math.PI/2,0,Math.PI];const SOUTH=[.64,2.5];
const STN={
  steak:{conv:{x:1110,y:1310},counter:{x:1090,y:1452},lane:1138,pile:{x:1172,y:1452},stand:{x:1138,y:1414},in:'meat',out:'steak',time:1.3,base:7,step:3,zone:null,name:'肉屋',c1:'#e5483d',c2:'#fff4ea',maker:makeGrill},
  fish:{conv:{x:1312,y:1368},counter:{x:1300,y:1452},lane:1348,pile:{x:1382,y:1452},stand:{x:1348,y:1414},in:'fish',out:'grfish',time:1.6,base:28,step:10,zone:'B',name:'焼き魚',c1:'#2f8fd6',c2:'#f4fbff',maker:makeFishGrill},
  coat:{conv:{x:1432,y:1348},counter:{x:1500,y:1452},lane:1548,pile:{x:1582,y:1452},stand:{x:1548,y:1414},in:'fur',out:'coat',time:2.4,base:90,step:30,zone:'C',name:'コート',c1:'#8a3fb0',c2:'#fbf2ff',maker:makeTailor}};
const SPA={x:1200,y:2070,pile:{x:1030,y:1960},boiler:{x:1390,y:2030}};
const HOLES=[[1950,980],[2080,1060],[1980,1200],[2130,1260],[2000,1400],[2100,1500]];
const ORES=[];
const MON={x:1185,y:872};const ROAD={x:2215,y:190};const WOOD={x:1070,y:1090};
function inZone(x,y,r){for(const z of ZONES){const [x0,y0,x1,y1]=z.rect;if(x>x0-(r||0)&&x<x1+(r||0)&&y>y0-(r||0)&&y<y1+(r||0))return z}return null}
function zoneOpen(id){return !id||G.zones[id]}

// ================================================================ game state
let G=null,running=false,world=null,forest=null;
function float(x,y,h,txt,cls,big,local){if(!local&&NET.mode==='host'&&NET.outF.length<10)NET.outF.push([x|0,y|0,h|0,String(txt),cls||'',big?1:0]);G.floats.push({x,y,h,txt,cls:(cls||'')+(big?' big':''),life:big?1.6:1.1,max:big?1.6:1.1})}
function flyItem(kind,sx,sy,sh,tx,ty,th,land,sp){const m=itemMesh(kind);world.add(m);G.flying.push({m,sx,sy,sh,tx,ty,th,t:0,sp:sp||2.8,land,rot:rnd(0,TAU)})}
const SLED_CAP=25,cap=p=>15+G.pm.cap+((p&&p.lv)?p.lv.bag:0)*6+(p&&p.riding?SLED_CAP:0)+eqv(p,'cap');
const heatBase=()=>(150+G.level*50)*((G&&G.stele>=3)?1.2:1);
const desTxt=s=>DES()?String(s).replace(/かまど/g,'井戸').replace(/凍っ/g,'倒れ').replace(/薪をくべ/g,'水を注ぎ'):s;
const heatR=()=>G.fuel>0?heatBase()*(.7+.3*G.fuel/100)*(1+(G.rank||0)*.04):0;
const isNight=()=>((G.t%G.DAY)/G.DAY)>.72;
const MODS_B=[{id:'forest',t:'豊かな森',d:'木を切るのが速く、薪がよく燃える',ap:m=>{m.chop=.7;m.wood=2}},{id:'herd',t:'オオカミの当たり年',d:'オオカミが多く、肉が1個多く落ちる',ap:m=>{m.bears=1.4;m.meat=1}},
  {id:'spring',t:'温かい土地',d:'みんな体温が下がりにくい',ap:m=>{m.cold*=.8}},{id:'boom',t:'好景気',d:'売値が3割高い',ap:m=>{m.price=1.3}},{id:'crowd',t:'人が集まる町',d:'生存者がよく来て、SOSの人数が多い',ap:m=>{m.surv=.65;m.sos=1}}];
const MODS_C=[{id:'frost',t:'極寒の年',d:'寒さが1.3倍、気温-8℃',ap:m=>{m.cold*=1.3;m.temp=-8}},{id:'fierce',t:'凶暴なオオカミ',d:'夜の襲撃のオオカミが1.5倍',ap:m=>{m.raid=1.5}},{id:'storm',t:'吹雪の地',d:'大寒波が2日おきに来る',ap:m=>{m.wave=2}},
  {id:'scarce',t:'やせた森',d:'木が少ない',ap:m=>{m.trees=.55}},{id:'cheap',t:'不景気',d:'売値が2割安い',ap:m=>{m.price=.8}},{id:'lonely',t:'さびれた土地',d:'生存者があまり来ない',ap:m=>{m.surv=1.5}}];
const DIFFS=[{n:'ふつう',cold:1,burn:1,raid:1,hp:1,up:1,atk:1,price:1,sh:1},{n:'きびしい',cold:1.4,burn:1.35,raid:1.75,hp:1.6,up:1.5,atk:1.35,price:.9,sh:1.8},{n:'地獄',cold:1.85,burn:1.7,raid:2.6,hp:2.4,up:2.1,atk:1.8,price:.78,sh:3}];
const altCh=(h,g)=>g&&g!==h?g:(h==='Knight'?'Rogue_Hooded':'Knight');
window.SNOWU={value:1};const BIOS=[{id:'snow',n:'雪原の町',cold:1,burn:1,raid:1,hp:1,up:1,atk:1,price:1,sh:1},{id:'desert',n:'砂漠の町',cold:1.3,burn:1.25,raid:1.4,hp:1.4,up:1.3,atk:1.25,price:.92,sh:1.6}];
function calcDM(){const d=DIFFS[(G&&G.diff)||0],b=BIOS[(G&&G.biome)||0];const o={n:d.n+(b.id!=='snow'?'・'+b.n:'')};for(const k of ['cold','burn','raid','hp','up','atk','price','sh'])o[k]=d[k]*b[k];return o}
const DM=()=>(G&&G._dm)||(G?(G._dm=calcDM()):DIFFS[0]);const DES=()=>CUR_BIO===1;const TW=()=>DES()?'水分':'体温';
const DNAME={meat:'干し肉',log:'木材',water:'水',salt:'塩',fur:'甲殻',fish:'魚',coal:'石炭'};
const WXD={blizzard:{n:'砂嵐',ic:'🌪',d:'まわりが見えない・のどの渇き1.4倍'},snap:{n:'熱波',ic:'🔥',d:'渇き1.9倍・井戸の水が早く減る'},clear:{n:'涼しい風',ic:'🍃',d:'渇き半分'},aurora:{n:'満天の星',ic:'✦',d:'町の税が2倍・経験値1.5倍'}};const WXN=w=>DES()?Object.assign({},w,WXD[w.id]):w;
const DHOLES=[[760,560],[1180,470],[1620,540],[2010,420]];const CAR_STOP={x:1200,y:1480};const YR=()=>(G&&G.year)||1;
const GOALS=[{n:'町のシンボル像',c:9000,lv:5,pop:18},{n:'氷の大灯台',c:18000,lv:6,pop:24},{n:'オーロラの塔',c:30000,lv:7,pop:30}];
const goalOf=y=>GOALS[y-1]||{n:`${y}年目の記念碑`,c:30000+14000*(y-3),lv:8,pop:Math.min(40,30+3*(y-3))};
const waveDayN=d=>d>=3&&d%(G.mod?G.mod.wave:3)===0;
const inBath=p=>!!(G.zones.D&&((p.x-SPA.x)/92)**2+((p.y-SPA.y)/62)**2<1);
const spaWarm=(x,y)=>!!(G.zones.D&&G.spa.fuel>0&&dist(x,y,SPA.x,SPA.y)<280);
const RANKS=[{n:'集落',p:0},{n:'村',p:8},{n:'町',p:14},{n:'街',p:20},{n:'都',p:28}];
const rankOf=n=>RANKS.reduce((a,r,i)=>n>=r.p?i:a,0);
const popNow=()=>G.surv.filter(s=>!s.frozen).length+G.workers.length;
const HCAP=[0,3,6,10],HNAME=['','テント','小屋','宿屋'],HCOST=[[100,380,1100],[140,450,1250],[180,520,1400],[220,600,1600],[260,700,1800]];
const houseLv=i=>G.lv['house_'+i]||0,nextHouse=()=>{for(let l=0;l<3;l++)for(let i=0;i<HOUSES.length;i++)if(houseLv(i)===l)return i;return -1},houseCap=()=>Math.max(REB()?2:6,G.baseCap||6)+HOUSES.reduce((a,_,i)=>a+HCAP[houseLv(i)],0),houseFull=()=>popNow()>=houseCap();
const tempC=()=>DES()?Math.round((isNight()?6:43)+(G.wx&&G.wx.type==='snap'?6:0)+Math.min(8,G.day*.5)):Math.round((G.mod?G.mod.temp:0)-(G.wx&&G.wx.type==='snap'?15:G.wx&&G.wx.type==='clear'?-8:0)-12-G.day*2.5-(isNight()?10:0)-(G.wave?15:0));
const price=id=>Math.round((STN[id].base+STN[id].step*G.lv['price_'+id]+G.pm.price*(id==='steak'?1:id==='fish'?2.5:6))*(G.mod?G.mod.price:1)*(G&&G._dm?G._dm.price:1));
const logFuel=()=>9+G.level*1.2+G.pm.wood+(G.mod?G.mod.wood:0);
const WXS=[{id:'blizzard',n:'猛吹雪',ic:'🌨',d:'まわりが見えない・寒さ1.4倍',cool:1.4},{id:'snap',n:'急な冷え込み',ic:'❄',d:'寒さ1.9倍・燃料の減りも速い',cool:1.9},{id:'clear',n:'晴れ間',ic:'☀',d:'寒さ半分・お客さんが増える',cool:.5},{id:'aurora',n:'オーロラの夜',ic:'✦',d:'町の税が2倍・経験値1.5倍',cool:1}];
const wxIs=id=>G.wx&&G.wx.type===id;
const coolMul=()=>DM().cold*(1+(YR()-1)*.18)*(DES()?(isNight()?.4:1.9):(isNight()?1.5:1))*(G.wave?2.2:1)*(G.wx&&G.wx.type?WXS.find(w=>w.id===G.wx.type).cool:1);
function mult(){return (1+Math.min(2,Math.floor(G.combo/5)*.25))*(G.feverT>0?2:1)}

let CUR_BIO=0;
function newGame(np,opts){opts=opts||{};plog('newGame players='+np+' '+JSON.stringify(opts).slice(0,120));CUR_BIO=opts.biome||0;zoneNames();let RS=(opts.seed||((Math.random()*1e9)|0))|0;const SEED0=RS;const srng=()=>{RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const sr=(a,b)=>a+srng()*(b-a);
  if(world){scene.remove(world)}if(forest)forest.dispose();psN.clear();psA.clear();
  world=new T.Group();scene.add(world);world.add(makeGround(),makeMountains());
  G={rank:0,year:1,biome:opts.biome||0,diff:opts.diff||0,charOf:opts.chars||[meta.pick||'Rogue_Hooded','Knight'],t:0,DAY:75,day:1,wave:false,waveWarned:0,players:[],floats:[],flying:[],shake:0,paused:false,mission:0,missionCd:0,endless:false,newAch:[],achT:0,wind:0,
    combo:0,comboT:0,fever:0,feverT:0,chests:[],luck:0,plv:1,xp:0,pendingLv:0,perkCount:{},cashShow:0,
    cash:0,earned:0,rep:3,fuel:100,woodpile:0,level:1,zones:{},bears:[],pickups:[],surv:[],workers:[],customers:[],trees:[],ores:[],holes:[],pads:[],
    stations:{},sleds:[],wx:{type:null,t:0,max:0},wxDay:0,wxAt:0,spa:{on:false,lv:0,fuel:0,pile:0,t:0},monument:false,rescue:null,hauls:[],raid:{on:false,total:0,left:0,spawn:0,spawnT:0,kills:0,night:0,warn:0},raidWins:0,metaGiven:0,
    lv:{bag:0,gun:0,price_steak:0,price_fish:0,price_coat:0,cook_steak:0,cook_fish:0,cook_coat:0,spa:0,tw_N:0,tw_E:0,tw_W:0,trap:0},
    pm:{rate:1,dmg:0,cap:0,speed:1,price:0,cook:1,magnet:0,wood:0,burn:1,cold:1,chop:1,thaw:1,tower:1},
    stats:{bears:0,grilled:0,sold:0,soldFish:0,soldCoat:0,chopped:0,fed:0,fish:0,fur:0,boss:0,thawed:0,haul:0,raidKills:0},
    bearT:0,survT:4,bossT:90,sparkT:0,nid:0,me:0};G.seed=SEED0;
  {let ms=(RS^0x5bd1e995)|0;const mr=()=>{ms=ms+0x6D2B79F5|0;let t=Math.imul(ms^ms>>>15,1|ms);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const bo=MODS_B[Math.floor(mr()*MODS_B.length)];let cu=MODS_C[Math.floor(mr()*MODS_C.length)];if(bo.id==='crowd'&&cu.id==='lonely')cu=MODS_C[0];
    G.mod={price:1,bears:1,meat:0,surv:1,raid:1,wave:3,temp:0,cold:1,chop:1,wood:0,trees:1,sos:0};bo.ap(G.mod);cu.ap(G.mod);G.mods=[bo,cu]}
  G.cash+=mlv('cash')*40;G.pm.cap+=mlv('bag')*3;G.pm.cold*=1-mlv('warm')*.08;G.pm.wood+=mlv('wood');G.pm.tower=1+mlv('tower')*.2;G.pm.dmg+=mlv('gun')*.15;G.pm.speed*=1+mlv('boots')*.05;G.pm.burn*=1-mlv('kiln')*.06;G.mod.price*=1+mlv('trade')*.06;if(mlv('watch'))G.lv.tw_N=1;
  // fence (instanced posts around the ring, gaps at gates and the southern market)
  const posts=[];for(let i=0;i<220;i++){const a=i/220*TAU-Math.PI;const an=Math.atan2(Math.sin(a),Math.cos(a));if(GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(an-g),Math.cos(an-g)))<.12))continue;if(an>SOUTH[0]&&an<SOUTH[1])continue;posts.push([CX+Math.cos(an)*FR,CY+Math.sin(an)*FR,rnd(40,48)])}
  const pI=new T.InstancedMesh(new T.CylinderGeometry(7,7.6,1,8),std('#9a6a3a',{map:TEX.bark}),posts.length),tI=new T.InstancedMesh(new T.ConeGeometry(7,11,8),std('#8a5a30'),posts.length),cI=new T.InstancedMesh(new T.SphereGeometry(6.5,8,5,0,TAU,0,Math.PI/2),std('#f7fbff',{r:.9}),posts.length);
  pI.castShadow=tI.castShadow=true;const o=new T.Object3D();
  const bulbN=Math.ceil(posts.length/3),bI=new T.InstancedMesh(new T.SphereGeometry(2.2,8,6),glow('#ffffff',2.6),bulbN);let bi=0;const bc=[lin('#ffd166'),lin('#ff8ad8'),lin('#7fe3ff'),lin('#8ff08f')];
  posts.forEach(([x,y,h],i)=>{o.rotation.set(0,0,0);o.position.set(x,h/2,y);o.scale.set(1,h,1);o.updateMatrix();pI.setMatrixAt(i,o.matrix);o.position.set(x,h+5.5,y);o.scale.set(1,1,1);o.updateMatrix();tI.setMatrixAt(i,o.matrix);o.position.set(x,h+7,y);o.scale.set(1,.6,1);o.updateMatrix();cI.setMatrixAt(i,o.matrix);
    if(i%3===0&&bi<bulbN){o.position.set(x,h-4,y);o.scale.set(1,1,1);o.updateMatrix();bI.setMatrixAt(bi,o.matrix);bI.setColorAt(bi,bc[bi%4]);bi++}});
  world.add(pI,tI,cI,bI);G.fenceIM=[pI,tI,cI,bI];
  if(KK&&KK.kit.h_fence){pI.visible=tI.visible=cI.visible=bI.visible=false;const seg=[],pil=[];const L=58,step=L/FR;
    for(let a=-Math.PI;a<Math.PI-step/2;a+=step){const an=a+step/2;const gap=q=>GATE_ANG.some(g=>Math.abs(Math.atan2(Math.sin(q-g),Math.cos(q-g)))<.13)||(q>SOUTH[0]&&q<SOUTH[1]);if(gap(an))continue;seg.push([CX+Math.cos(an)*FR,CY+Math.sin(an)*FR,-an-Math.PI/2]);pil.push([CX+Math.cos(a)*FR,CY+Math.sin(a)*FR,-a]);if(gap(a+step))pil.push([CX+Math.cos(a+step)*FR,CY+Math.sin(a+step)*FR,-a])}
    G.fenceIM=DES()?adobeWall(seg,pil,L):[...kkInst('h_fence',L,seg),...kkInst('h_fence_p',L*.125*1.3,pil)]}
  for(const a of GATE_ANG){for(const s of [-1,1]){const aa=a+s*.13;if(KK&&KK.kit.d_pillar)world.add(kkP('d_pillar',22,CX+Math.cos(aa)*FR,0,CY+Math.sin(aa)*FR,-aa));else world.add(at(cyl(9,9,80,std('#7a4a2a',{map:TEX.bark}),10),CX+Math.cos(aa)*FR,40,CY+Math.sin(aa)*FR))}}
  // lamps around the plaza
  for(const [x,y] of [[1030,1400],[1240,1400],[1450,1400],[1030,1700],[1450,1700],[1600,1600],[800,1400]]){const l=makeLamp();l.position.set(x,0,y);world.add(l)}
  // furnace
  const f=DES()?makeWell():makeFurnace();f.g.position.set(CX,0,CY);world.add(f.g);
  const heat=M_(new T.CircleGeometry(1,64),new T.MeshBasicMaterial({map:DES()?radialTex('rgba(120,200,240,.38)','rgba(90,170,230,0)'):radialTex('rgba(255,170,90,.42)','rgba(255,130,60,0)'),transparent:true,depthWrite:false}),false);heat.rotation.x=-Math.PI/2;heat.position.set(CX,.8,CY);heat.renderOrder=1;world.add(heat);
  const ring=M_(new T.RingGeometry(.985,1,128),new T.MeshBasicMaterial({color:lin('#ffa04d'),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),false);ring.rotation.x=-Math.PI/2;ring.position.set(CX,1.1,CY);world.add(ring);
  const embers=[];for(let i=0;i<30;i++){const e=M_(geo('emb',()=>new T.OctahedronGeometry(3.4,0)),glow(DES()?'#7fd4ff':'#ffb347',2.2),false);world.add(e);embers.push(e)}
  G.v={f,heat,ring,embers};
  // stations
  for(const id in STN){const s=STN[id];const conv=s.maker();conv.g.position.set(s.conv.x,0,s.conv.y);conv.g.rotation.y=Math.PI*.12;world.add(conv.g);
    const ct=makeCounter({name:s.name,c1:s.c1,c2:s.c2,w:150});ct.g.position.set(s.counter.x,0,s.counter.y);world.add(ct.g);
    const pileG=new T.Group();pileG.position.set(s.pile.x,0,s.pile.y);pileG.add(at(cyl(26,28,1.2,std('#2fb14a',{r:.6}),20,false),0,.6,0));world.add(pileG);
    const st={id,def:s,conv,ct,q:[],shelf:0,pile:0,cookT:0,serveT:0,queue:[],inStack:new Stack(conv.g,'col'),shelfStack:new Stack(ct.g,'col'),pileStack:new Stack(pileG,'pile'),cashier:null,frozen:false,custT:rnd(1,3),open:!s.zone,ice:null};
    st.inStack.g.position.set(-56,0,10);st.shelfStack.g.position.set(-50,28,2);
    const ice=M_(new T.BoxGeometry(96,64,52),std('#cdeefc',{t:true,op:.55,r:.1,m:.1}),false);ice.position.set(0,30,0);ice.visible=false;conv.g.add(ice);st.ice=ice;
    st.parts=[conv.g,ct.g,pileG];if(!st.open){st.parts.forEach(o=>o.visible=false);const sg=makeTextPlate(`${s.name}：${ZONES.find(z=>z.id===s.zone).name}で解放`,120,22,'rgba(255,250,240,.88)','#8a7058',.5);sg.rotation.set(-Math.PI/2,0,YAW);sg.position.set(s.counter.x,1.5,s.counter.y-20);world.add(sg);st.sign=sg}
    if(DES()){st.open=false;st.parts.forEach(o=>o.visible=false);if(st.sign)st.sign.visible=false}
    G.stations[id]=st}
  if(KK){for(let i=0;i<16;i++){const a=i/16*TAU+.2,r=1650+(i%3)*180;const m=kkProp(i%4===3?'hill':'mountain',420+(i%3)*120);m.position.set(CX+Math.cos(a)*r,-6,CY+Math.sin(a)*r);m.rotation.y=i*1.7;world.add(m)}
    for(let i=0;i<14;i++){const x=sr(120,WORLD-120),y=sr(120,WORLD-120);if(dist(x,y,CX,CY)<FR+140||inZone(x,y))continue;const rk=['rock1','rock2','rock3'][i%3];const m=KK.nat&&KK.nat[rk]?(()=>{const g=new T.Group(),o=KK.nat[rk].clone(true);o.scale.setScalar(sr(34,60)/(KK.natH[rk]||1));g.add(o);return g})():kkProp(i%2?'rockA':'rockC',sr(40,70));m.position.set(x,0,y);m.rotation.y=sr(0,TAU);world.add(m)}}
  // decor: bushes, grass tufts, dead trees and pebbles (instanced, no collision)
  G.decor=[];if(KK&&KK.nat&&KK.nat.bush){const o3=new T.Object3D();for(const [k,n,s0,s1] of (DES()?[['dead',34,80,120],['peb',260,12,24]]:[['bush',160,34,60],['grass',420,26,44],['dead',12,90,130],['peb',140,10,20]])){const src=KK.nat[k];if(!src)continue;src.updateMatrixWorld(true);const H=KK.natH[k]||1;const list=[];
      let g2=0;while(list.length<n&&g2++<n*20){const x=sr(40,WORLD-40),y=sr(40,WORLD-40);const d=dist(x,y,CX,CY);if(d<FR+(k==='dead'?140:60))continue;if(x>900&&x<1700&&y>1580&&y<1840)continue;if(dist(x,y,SPA.x,SPA.y)<260)continue;if(!DES()&&TSPOTS.some(q=>dist(x,y,q[0],q[1])<130))continue;if(dgBlock(x,y)||desertClear(x,y,40))continue;if(dist(x,y,MON.x,MON.y)<170)continue;list.push([x,y,sr(s0,s1)/H,sr(0,TAU)])}
      const byC=new Map();for(const it of list){const key=chunkKey(it[0],it[1]);if(!byC.has(key))byC.set(key,[]);byC.get(key).push(it)}
      for(const [key,cl] of byC){const box=chunkBox(key,k==='dead'?200:90);src.traverse(o=>{if(!o.isMesh)return;const im=new T.InstancedMesh(o.geometry,o.material,cl.length);im.frustumCulled=false;im.castShadow=k==='bush'||k==='dead';im.receiveShadow=true;im.userData.n=cl.length;im.userData.box=box;im.count=Math.floor(cl.length*QL[GQ.tier].decor*(k==='dead'&&GQ.tier<2?0:1));im.visible=im.count>0;G.decor.push(im);
        cl.forEach(([x,y,sc,r],i)=>{o3.position.set(x,0,y);o3.rotation.set(0,r,0);o3.scale.setScalar(sc);o3.updateMatrix();const m4=new T.Matrix4().multiplyMatrices(o3.matrix,o.matrixWorld);im.setMatrixAt(i,m4)});world.add(im)})}}}
  // watchtowers, gate traps and house slots (they appear as the town grows)
  G.towerV={};for(const tw of TOWERS){const m=makeTower();m.g.position.set(tw.mx,0,tw.my);m.g.visible=false;m.lv=0;m.pop=1;world.add(m.g);G.towerV[tw.id]=m}
  G.trapV=GATE_ANG.map(a=>{const m=makeTrap();m.position.set(CX+Math.cos(a)*FR,0,CY+Math.sin(a)*FR);m.visible=false;world.add(m);return m});
  G.rankV=makeRankVisuals();G.rankO={};
  G.houses=HOUSES.map(([x,y],i)=>{const tent=KK?kkProp('tent',54):makeTent(i),cab=DES()?makeAdobe({x:0,y:0,w:62,d:50,h:42,a:0,c:['#e3c093','#d9b07e','#e8caa0','#cfa06c','#e3c093'][i],aw:i%2===0}):KK?kkProp(['home_A_red','home_B_blue','home_A_blue','home_B_red','home_A_red'][i],66):makeHouse(i),man=DES()?makeAdobe({x:0,y:0,w:92,d:70,h:64,a:0,c:'#e8caa0',aw:true}):KK?kkProp('tavern',80):makeManor(i);man.visible=false;const g=grp(tent,cab,man);g.position.set(x,0,y);g.rotation.y=Math.atan2(CX-x,CY-y);tent.visible=cab.visible=false;world.add(g);return{x,y,g,tent,cab,man,lv:0,pop:1,need:[7,10,13,17,21][i]}});
  // zone fog curtains
  for(const z of ZONES){const [x0,y0,x1,y1]=z.rect;const fogM=makeFogMat(x0,y0,x1,y1,DES()?'#f1d7a6':'#f4f8fc');fogM.opacity=.93;
    const m=M_(new T.BoxGeometry(x1-x0,110,y1-y0),fogM,false);m.position.set((x0+x1)/2,55,(y0+y1)/2);m.renderOrder=3;world.add(m);
    const sign=makeTextPlate(`${z.name}`,140,40,'#fffaf0','#5b4636',.55);sign.position.set(z.pad.x,120,z.pad.y);sign.userData.bb=true;world.add(sign);
    G.zones[z.id]=false;z.fog=m;z.sign=sign;z.fogT=-1}
  // trees
  let guard=0;const trees=[];
  while(trees.length<Math.round(360*G.mod.trees)&&guard++<30000){const x=sr(60,WORLD-60),y=sr(60,WORLD-60);const d=dist(x,y,CX,CY);if(d<FR+70)continue;if(dist(x,y,ABY_GATE.x,ABY_GATE.y)<110)continue;if(x>900&&x<1700&&y>1580&&y<1840)continue;
    if(!DES()&&dist(x,y,2020,1210)<470&&x>1720)continue;if(DES()&&DHOLES.some(h=>dist(h[0],h[1],x,y)<110))continue;if(dist(x,y,ROAD.x,ROAD.y)<230)continue;if(dist(x,y,SPA.x,SPA.y)<260)continue;if(Math.abs(x-CX)<60&&y<CY)continue;if(!DES()&&TSPOTS.some(q=>dist(x,y,q[0],q[1])<150))continue;if(dgBlock(x,y)||desertClear(x,y,40))continue;if(dist(x,y,MON.x,MON.y)<170)continue;if(Math.abs(y-CY)<60&&(x<CX||x>CX))continue;
    if(trees.some(t=>dist(t.x,t.y,x,y)<54))continue;trees.push({x,y,s:sr(.85,1.25),ry:sr(0,TAU),hp:4,alive:true,regrow:0,shake:0,fall:0,fallDir:0,grow:1,zone:(inZone(x,y)||{}).id||null})}
  G.trees=trees;forest=new Forest(trees);makeSecrets(trees,sr);makeRoad();applyBiome();
  // ores (zone C? no — rocky outcrops in the east of the north field feed coal)
  // fishing holes (zone B)
  if(!DES()){const m=makeHole();m.scale.setScalar(1.5);m.position.set(BIGHOLE.x,0,BIGHOLE.y);world.add(m);const fish=itemMesh('fish');fish.visible=false;world.add(fish);G.holes.push({x:BIGHOLE.x,y:BIGHOLE.y,m,fish,t:0,user:null,jump:0,rq:2})}
  for(const [x,y] of (DES()?DHOLES:HOLES)){const m=makeHole();m.position.set(x,0,y);world.add(m);const fish=itemMesh(DES()?'water':'fish');fish.visible=false;world.add(fish);G.holes.push({x,y,m,fish,t:0,user:null,jump:0})}
  // spa
  const spa=DES()?makeOasis():makeSpa();spa.g.position.set(SPA.x,0,SPA.y);world.add(spa.g);G.spaV=spa;const spaPile=new T.Group();spaPile.position.set(SPA.pile.x,0,SPA.pile.y);world.add(spaPile);G.spaStack=new Stack(spaPile,'pile');
  const wp=new T.Group();wp.position.set(WOOD.x,0,WOOD.y);wp.add(at(rbox(60,4,40,2,std('#6e4524',{map:TEX.wood})),0,2,0));world.add(wp);G.woodStack=new Stack(wp,'pair');G.woodStack.g.position.y=4;
  // monument placeholder plinth
  const mon=makeMonument();mon.position.set(MON.x,0,MON.y);mon.visible=false;world.add(mon);G.monV=mon;
  // players
  for(let i=0;i<np;i++)addPlayer(i);G.me=opts.guest?1:0;G.guest=!!opts.guest;if(opts.guest)G.players[0].remote=true;
  // pads
  buildPads();
  G.townS=DES()?null:makeTownStages();
  G.sledV=[];
  if(!opts.guest&&mlv('sled'))G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});
  G.baseCap=Math.max(6,5+mlv('folk')+1);
  if(!opts.guest){for(let i=0;i<5+mlv('folk');i++)spawnSurvivor(true);for(let i=0;i<6;i++)spawnBear('A',true)}
  return G;
}
function addPlayer(i){const p={lv:{gun:0,bag:0},life:{},id:i,x:CX-30+i*60,y:CY+110,vx:0,vy:0,dir:Math.PI*.8,step:0,moving:false,bag:[],warm:100,hp:100,breath:rnd(0,1),bb:0,actT:0,depT:0,padT:0,cashT:0,flash:0,chopping:null,shooting:null,fishing:null,hurt:0,inv:0};
  p.m=makeHero(HERO[i]);p.stack=new Stack(p.m.back,'col');world.add(p.m.g);G.players[i]=p;return p}
// ================================================================ pads
const meP=()=>G.players[G.me]||G.players[0];
function persPad(d){d.personal=true;d.pp={};d.cost=()=>{const q=meP();return q?d.costP(q):null};d.lvText=()=>{const q=meP();return q?d.lvP(q):''};return padDef(d)}
function padDef(d){d.paid=0;d.pulse=0;d.shown=false;d.rise=0;return d}
function buildPads(){
  const P=[];
  const need=(pad)=>pad.pop?1:0;
  P.push(padDef({id:'furnace',mp:{fish:0,fur:0},mix:()=>{const sm=G.players.length>1?1:.85,t=[[0,0],[0,0],[8,0],[10,6],[12,10],[15,12],[18,15],[20,20]][G.level]||[0,0];return{fish:Math.round(t[0]*sm),fur:Math.round(t[1]*sm)}},x:1200,y:1020,name:'かまど強化',k:'炉',pay:'log',vis:()=>G.level<8,cost:()=>Math.round([12,20,30,45,60,80,100][G.level-1]*(G.players.length>1?1:.85)),lvText:()=>`Lv${G.level}→${G.level+1}`,buy:()=>{G.level++;G.waveFx=0;G.fuel=Math.min(100,G.fuel+30);banner('かまど強化！ 町が育った',`Lv${G.level}「${(TOWN[G.level]||TOWN[8]).n}」`,`${DES()?'':(TOWN[G.level]||TOWN[8]).d+'・'}熱の範囲が広がった${G.level===2?'・氷の湖を解放できる':G.level===3?'・奥地の森を解放できる':G.level===4?'・温泉郷を解放できる':''}`);G.shake=10}}));
  P.push(padDef({id:'hunter',x:990,y:1110,name:'猟師',k:'猟',pay:'cash',pop:true,vis:()=>G.workers.filter(w=>w.role==='hunter').length<5,cost:()=>[60,140,260,420,600][G.workers.filter(w=>w.role==='hunter').length],lvText:()=>`${G.workers.filter(w=>w.role==='hunter').length}人`,buy:(pad)=>hire('hunter',pad)}));
  P.push(padDef({id:'lumber',x:990,y:1220,name:'木こり',k:'斧',pay:'cash',pop:true,vis:()=>G.workers.filter(w=>w.role==='lumber').length<4,cost:()=>[40,100,200,340][G.workers.filter(w=>w.role==='lumber').length],lvText:()=>`${G.workers.filter(w=>w.role==='lumber').length}人`,buy:(pad)=>hire('lumber',pad)}));
  P.push(padDef({id:'price_steak',x:990,y:1330,name:'肉の値上げ',k:'値',pay:'cash',vis:()=>G.lv.price_steak<3,cost:()=>[60,150,300][G.lv.price_steak],lvText:()=>`$${price('steak')}`,buy:()=>{G.lv.price_steak++;toast(`肉 1個 $${price('steak')}`,'cash')}}));
  P.push(persPad({id:'gun',x:1410,y:1110,name:'武器（自分用）',k:'武',pay:'cash',vis:()=>G.players.some(q=>q.lv.gun<6),costP:q=>q.lv.gun<6?[40,100,200,380,600,900][q.lv.gun]:null,lvP:q=>q.lv.gun<6?`Lv${q.lv.gun+1}`:'MAX',buyP:q=>{q.lv.gun++;float(q.x,q.y,80,`武器 Lv${q.lv.gun+1}！`,'gold',true)}}));
  P.push(persPad({id:'bag',x:1410,y:1220,name:'背負いかご（自分用）',k:'籠',pay:'cash',vis:()=>G.players.some(q=>q.lv.bag<5),costP:q=>q.lv.bag<5?[30,80,160,300,500][q.lv.bag]:null,lvP:q=>q.lv.bag<5?`${cap(q)+6}個`:'MAX',buyP:q=>{q.lv.bag++;float(q.x,q.y,80,`${cap(q)}個まで運べる`,'gold',true)}}));
  P.push(padDef({id:'house',x:850,y:1420,name:'家を建てる',k:'家',pay:'cash',vis:()=>nextHouse()>=0,
    req:()=>{const i=nextHouse();return i>=0&&houseLv(i)===2&&G.rank<2?'「町」になると宿屋を建てられる':null},cost:()=>{const i=nextHouse();return HCOST[i][houseLv(i)]},lvText:()=>{const i=nextHouse(),l=houseLv(i);return `${HNAME[l+1]}（住める人 +${HCAP[l+1]-HCAP[l]}）`},
    buy:()=>{const i=nextHouse();G.lv['house_'+i]=houseLv(i)+1;const h=G.houses[i];float(h.x,h.y,90,HNAME[houseLv(i)]+'が建った！','gold',false,true);toast(`${HNAME[houseLv(i)]}が建った！ 住める人数 ${houseCap()}人`,'cash');SFX.build()}}));
for(const tw of TOWERS)P.push(padDef({id:'tw_'+tw.id,x:tw.x,y:tw.y,name:`見張り台(${tw.n})`,k:'塔',pay:'cash',vis:()=>G.lv['tw_'+tw.id]<3,cost:()=>[80,240,600][G.lv['tw_'+tw.id]],lvText:()=>`Lv${G.lv['tw_'+tw.id]+1}`,buy:()=>{G.lv['tw_'+tw.id]++;toast(`見張り台(${tw.n}) Lv${G.lv['tw_'+tw.id]}！ 襲ってくるオオカミを自動で撃つ`,'cash')}}));
  P.push(padDef({id:'guard',x:JOBPAD.guard.x,y:JOBPAD.guard.y,name:'見張り番',k:'番',pay:'cash',pop:true,vis:()=>{const b=TOWERS.filter(t=>G.lv['tw_'+t.id]>0).length;return b>0&&wc('guard')<b*2},cost:()=>[60,90,130,180,240,300][wc('guard')]||300,lvText:()=>`${wc('guard')}人`,
    buy:(pad)=>{const built=TOWERS.filter(t=>G.lv['tw_'+t.id]>0);const tw=built.reduce((a,t)=>guardsAt(t.id)<guardsAt(a.id)?t:a);if(!hire('guard',pad))return false;const w=G.workers[G.workers.length-1];w.tw=tw.id;w.slot=guardsAt(tw.id)-1;toast(`見張り台(${tw.n})に見張り番！ 射撃が強くなる`,'cash')}}));
  P.push(padDef({id:'split',x:JOBPAD.split.x,y:JOBPAD.split.y,name:'薪割り',k:'割',pay:'cash',pop:true,vis:()=>wc('splitter')<3,cost:()=>[50,100,160][wc('splitter')],lvText:()=>`${wc('splitter')}人`,
    buy:(pad)=>{if(!hire('splitter',pad))return false;const w=G.workers[G.workers.length-1];w.slot=wc('splitter')-1;toast('薪割り係が薪置き場に薪をためてくれる','cash')}}));
  P.push(padDef({id:'sled',x:1500,y:1265,name:'犬ぞり',k:'犬',pay:'cash',vis:()=>G.sleds.length<Math.max(1,G.players.length),cost:()=>[220,320][G.sleds.length]||320,lvText:()=>'',buy:()=>{G.sleds.push({id:++G.nid,x:1500,y:1300,rider:null});banner('犬ぞり','ハスキーが仲間に！','乗ると速く走れて寒さに強い。柵の中に戻ると降りる','area');SFX.rare()}}));
  P.push(padDef({id:'trap',x:1300,y:1000,name:'門のトゲ罠',k:'罠',pay:'cash',vis:()=>G.lv.trap<3,cost:()=>[120,350,800][G.lv.trap],lvText:()=>`Lv${G.lv.trap+1}`,buy:()=>{G.lv.trap++;toast(`3つの門にトゲ罠 Lv${G.lv.trap}！ 通るオオカミが遅くなりダメージ`,'cash')}}));
  P.push(padDef({id:'cook_steak',x:1025,y:1545,name:'グリル',k:'焼',pay:'cash',vis:()=>G.lv.cook_steak<4,cost:()=>[40,90,180,320][G.lv.cook_steak],lvText:()=>`Lv${G.lv.cook_steak+1}`,buy:()=>{G.lv.cook_steak++;toast('グリルが速くなった','cash')}}));
  P.push(padDef({id:'cashier_steak',x:1025,y:1655,name:'肉屋のレジ係',k:'レ',pay:'cash',pop:true,vis:()=>!G.stations.steak.cashier,cost:()=>80,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'steak')}));
  // zone B
  P.push(padDef({id:'cook_fish',x:1235,y:1545,name:'焼き魚台',k:'焼',pay:'cash',zone:'B',vis:()=>G.lv.cook_fish<3,cost:()=>[120,260,500][G.lv.cook_fish],lvText:()=>`Lv${G.lv.cook_fish+1}`,buy:()=>{G.lv.cook_fish++;toast('焼き魚が速くなった','cash')}}));
  P.push(padDef({id:'cashier_fish',x:1235,y:1655,name:'魚屋のレジ係',k:'レ',pay:'cash',pop:true,zone:'B',vis:()=>!G.stations.fish.cashier,cost:()=>200,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'fish')}));
  P.push(padDef({id:'fisher',x:1580,y:1070,name:'釣り人',k:'釣',pay:'cash',pop:true,zone:'B',vis:()=>G.workers.filter(w=>w.role==='fisher').length<4,cost:()=>[120,260,480,700][G.workers.filter(w=>w.role==='fisher').length],lvText:()=>`${G.workers.filter(w=>w.role==='fisher').length}人`,buy:(pad)=>hire('fisher',pad)}));
  P.push(padDef({id:'price_fish',x:1440,y:1545,name:'魚の値上げ',k:'値',pay:'cash',zone:'B',vis:()=>G.lv.price_fish<2,cost:()=>[150,350][G.lv.price_fish],lvText:()=>`$${price('fish')}`,buy:()=>{G.lv.price_fish++;toast(`焼き魚 1本 $${price('fish')}`,'cash')}}));
  // zone C
  P.push(padDef({id:'cook_coat',x:820,y:1070,name:'仕立て台',k:'縫',pay:'cash',zone:'C',vis:()=>G.lv.cook_coat<3,cost:()=>[300,700,1200][G.lv.cook_coat],lvText:()=>`Lv${G.lv.cook_coat+1}`,buy:()=>{G.lv.cook_coat++;toast('コートを縫うのが速くなった','cash')}}));
  P.push(padDef({id:'cashier_coat',x:1440,y:1655,name:'コート屋のレジ係',k:'レ',pay:'cash',pop:true,zone:'C',vis:()=>!G.stations.coat.cashier,cost:()=>500,lvText:()=>'',buy:(pad)=>hire('cashier',pad,'coat')}));
  P.push(padDef({id:'price_coat',x:1640,y:1300,name:'コートの値上げ',k:'値',pay:'cash',zone:'C',vis:()=>G.lv.price_coat<2,cost:()=>[400,900][G.lv.price_coat],lvText:()=>`$${price('coat')}`,buy:()=>{G.lv.price_coat++;toast(`コート 1着 $${price('coat')}`,'cash')}}));
  // zone D
  P.push(padDef({id:'spa',x:1235,y:1760,name:'温泉',k:'湯',pay:'cash',zone:'D',vis:()=>G.lv.spa<3,cost:()=>[800,1600,3000][G.lv.spa],lvText:()=>`Lv${G.lv.spa+1}`,buy:()=>{G.lv.spa++;toast(`温泉 Lv${G.lv.spa+1}！ 客が増えた`,'cash')}}));
  P.push(padDef({id:'stoker',x:1480,y:1900,name:'風呂焚き',k:'焚',pay:'cash',pop:true,zone:'D',vis:()=>G.workers.filter(w=>w.role==='stoker').length<2,cost:()=>[600,1200][G.workers.filter(w=>w.role==='stoker').length],lvText:()=>`${G.workers.filter(w=>w.role==='stoker').length}人`,buy:(pad)=>hire('stoker',pad)}));
  // zone unlocks
  for(const z of ZONES)P.push(padDef({id:'zone_'+z.id,x:z.pad.x,y:z.pad.y,name:z.name+'を解放',k:'開',pay:'cash',big:true,vis:()=>!G.zones[z.id],lvNeed:z.lv,popNeed:z.pop,req:()=>G.level<z.lv?`かまどLv${z.lv}が必要`:popNow()<z.pop?`町人${z.pop}人が必要（いま${popNow()}人）`:null,cost:()=>z.cost,lvText:()=>'',buy:()=>unlockZone(z)}));
  // monument
  P.push(padDef({id:'monument',x:MON.x,y:MON.y,name:'町のシンボル像',k:'像',pay:'cash',big:true,vis:()=>!G.monument&&G.zones.D&&!(G.story&&G.story.ch===2&&G.story.step<5)&&!(G.story&&G.story.ch>=3),lvNeed:5,popNeed:18,req:()=>{const g=goalOf(YR());return G.level<g.lv?`かまどLv${g.lv}が必要`:popNow()<g.pop?`町人${g.pop}人が必要（いま${popNow()}人）`:null},cost:()=>goalOf(YR()).c,lvText:()=>'',buy:()=>{G.monument=true;G.monV.visible=true;G.monV.scale.setScalar(.01);G.monPop=0;SFX.area();banner('完成！',goalOf(YR()).n,'…その夜、オオカミの大群が押し寄せてくる。最後の夜を守りきれ！','area');G.shake=14;G.finalPending=true;const ph=(G.t%G.DAY)/G.DAY;if(ph<.66)G.t+=(.66-ph)*G.DAY;else if(ph>.72){G.t=Math.ceil(G.t/G.DAY)*G.DAY+.66*G.DAY;G.raid.night=0}}}));
  for(const p of P){p.mesh=makePadMesh(p);world.add(p.mesh.g)}
  for(const pd of P){if(pd.personal||pd.pay!=='cash')continue;const c0=pd.cost;pd.cost=()=>{const v=c0();return v!=null&&!isRPG()&&snowy()?Math.round(v*.8):v}}
  G.pads=P;makeBench();if(DES())for(const pd of P){if(/^(cook_|cashier_|price_)/.test(pd.id))pd.vis=()=>false;if(pd.id==='fisher'){pd.zone=null;pd.name='水くみ係'}}
}
function makePadMesh(pad){
  const S=pad.big?128:92,c=document.createElement('canvas');c.width=c.height=256;const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;
  const mesh=M_(new T.PlaneGeometry(S,S),new T.MeshBasicMaterial({map:tex,alphaTest:.35,depthWrite:false,depthTest:false}),false);mesh.rotation.set(-Math.PI/2,0,YAW);mesh.position.set(pad.x,1.2,pad.y);mesh.renderOrder=5;
  const icon=new T.Group();icon.position.set(pad.x,56,pad.y);const money=pad.pay==='cash';
  const coin=M_(geo('coin',()=>new T.CylinderGeometry(16,16,5,28)),std(pad.big?'#f7c948':money?'#8ac66a':'#f0a15a',{m:.2,r:.45,e:pad.big?'#d19a1c':money?'#3f7a2c':'#b8661e',ei:.2}));coin.rotation.x=Math.PI/2;icon.add(coin);
  const face_=makeTextPlate(pad.k,26,26,'none','#ffffff');face_.position.z=2.8;icon.add(face_);
  const g=grp(mesh,icon);g.visible=false;
  const draw=(cost,paid,lvText,on,req,extra)=>{const key=`${cost}|${paid}|${lvText}|${on}|${req}|${extra}`;if(pad._key===key)return;pad._key=key;
    const x=c.getContext('2d');x.clearRect(0,0,256,256);const F='"M PLUS Rounded 1c","Zen Maru Gothic",sans-serif';
    // soft cream tile with a stitched border (cozy-game style)
    x.fillStyle=req?'rgba(236,226,208,.72)':on?'rgba(255,250,240,.97)':'rgba(255,250,240,.86)';rr(x,16,16,224,224,46);x.fill();
    x.lineWidth=6;x.strokeStyle=req?'#cdbd9f':pad.big?'#f7c948':money?'#8ac66a':'#f0a15a';x.setLineDash([16,12]);rr(x,30,30,196,196,36);x.stroke();x.setLineDash([]);
    if(cost!=null&&paid>0){x.lineWidth=14;x.lineCap='round';x.strokeStyle='rgba(91,70,54,.12)';x.beginPath();x.arc(128,128,86,0,TAU);x.stroke();x.strokeStyle=money?'#6ab04c':'#f0a15a';x.beginPath();x.arc(128,128,86,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,paid/cost));x.stroke()}
    x.textAlign='center';x.textBaseline='middle';
    const t=money?`$${(cost-paid).toLocaleString()}`:cost-paid>0?`薪 ${cost-paid}`:'OK';x.font=`900 ${pad.big?50:46}px ${F}`;x.fillStyle=req?'#a8927a':money?'#3f8a3a':'#b8661e';x.fillText(t,128,114,210);
    x.font=`900 23px ${F}`;x.fillStyle='#5b4636';x.fillText(desTxt(`${pad.name}${lvText?' '+lvText:''}`),128,166,200);
    const chip=(txt,bg,fg)=>{x.font=`900 20px ${F}`;const w=Math.min(206,x.measureText(txt).width+26);x.fillStyle=bg;rr(x,128-w/2,48,w,32,16);x.fill();x.fillStyle=fg;x.fillText(txt,128,65,196)};
    if(req)chip(req,'#f0826a','#fff');else if(extra)chip('+'+extra,'#6fb7e6','#fff');else if(pad.pop)chip('町の人1人','#8ac66a','#fff');
    tex.needsUpdate=true};
  return{g,mesh,icon,draw}
}
function unlockZone(z){G.zones[z.id]=true;z.fogT=0;SFX.area();banner('新エリア解放！',z.name,z.sub,'area');G.shake=12;G.camPan={x:(z.rect[0]+z.rect[2])/2,y:(z.rect[1]+z.rect[3])/2,t:0};
  for(const id in G.stations){const st=G.stations[id];if(st.def.zone===z.id&&!DES()){st.open=true;st.unlockT=0}}
  if(z.id==='C'){G.bossT=40;for(let i=0;i<4;i++)spawnBear('C',true)}
  if(z.id==='D'){G.spa.on=true;G.spa.fuel=40}
  burst(z.pad.x,z.pad.y,20,60,{c:['#ffd23f','#ffffff','#9fe0ff','#ff8ad8'],s0:80,s1:300,u0:200,u1:450,l0:.9,l1:1.5,add:true,r0:6,r1:12})}

