// ================================================================ background music: small procedural tracks per place (WebAudio, no files)
// each track: tempo, root note, a scale, an 8th-note melody (scale degrees, null = rest), a bass line, and an optional drum
const TRK={
  town:{bpm:92,root:67,sc:[0,2,4,7,9,12,14,16],mel:[4,null,3,2,1,null,2,null, 3,null,4,5,4,null,null,null, 2,null,1,0,1,null,3,null, 2,null,null,null,null,null,null,null],bass:[0,null,null,null,4,null,null,null,5,null,null,null,3,null,null,null],mw:'triangle',bw:'sine',chord:[0,4,7],vol:.9},
  night:{bpm:66,root:57,sc:[0,2,3,5,7,8,10,12,14,15],mel:[4,null,null,3,2,null,null,null, 0,null,2,null,3,null,null,null, 4,null,5,null,4,null,2,null, 3,null,null,null,null,null,null,null],bass:[0,null,null,null,null,null,null,null,5,null,null,null,null,null,null,null],mw:'sine',bw:'sine',chord:[0,3,7],vol:.8},
  desert:{bpm:104,root:62,sc:[0,1,4,5,7,8,10,12,13,16],mel:[4,3,2,1,2,null,null,null, 4,5,4,3,2,1,0,null, 1,null,2,3,4,null,6,5, 4,null,null,3,2,null,null,null],bass:[0,null,0,null,4,null,0,null,0,null,0,null,3,null,1,null],mw:'sawtooth',bw:'triangle',drum:'dar',chord:[0,4,7],vol:.75},
  dungeon:{bpm:60,root:50,sc:[0,1,3,5,7,8,10,12,13,15],mel:[7,null,null,null,null,null,6,null, null,null,null,null,4,null,null,null, 5,null,null,null,null,null,3,null, null,null,null,null,null,null,null,null],bass:[0,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null],mw:'sine',bw:'sawtooth',chord:[0,3,6],vol:.85},
  boss:{bpm:148,root:52,sc:[0,2,3,5,7,8,10,12,14,15],mel:[7,null,7,6,7,null,4,null, 5,null,4,3,2,null,4,null, 7,null,7,8,9,null,7,null, 6,5,4,3,4,null,null,null],bass:[0,0,7,0,0,0,5,0,3,3,10,3,5,5,7,5],mw:'square',bw:'sawtooth',drum:'rock',chord:[0,3,7],vol:.7}};
const BGM={cur:null,step:0,next:0,g:null,base:.085};
function bgmArea(){if(!running)return 'town';const me=G.players[G.me]||G.players[0];if(!me)return 'town';
  if((G.raid&&G.raid.on&&G.raid.final)||G.bears.some(b=>!b.dead&&(b.king||b.nm||(b.kind==='boss'&&b.bt))&&dist(b.x,b.y,me.x,me.y)<650))return 'boss';
  if(isRPG()&&(dgAt(me.x,me.y)||inAby(me.x)))return 'dungeon';if(DES())return 'desert';return isNight()?'night':'town'}
function bgmNote(midi,t,d,type,v){const o=actx.createOscillator(),g=actx.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);
  if(type==='sawtooth'||type==='square'){const f=actx.createBiquadFilter();f.type='lowpass';f.frequency.value=type==='square'?1600:1100;o.connect(f);f.connect(g)}else o.connect(g);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(BGM.g);o.start(t);o.stop(t+d+.05)}
function bgmDrum(kind,t,v){const len=kind==='kick'?.18:.08,b=actx.createBuffer(1,Math.floor(actx.sampleRate*len),actx.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<a.length;i++){const k=1-i/a.length;a[i]=kind==='kick'?Math.sin(i/actx.sampleRate*TAU*(60+90*k))*k*k:(Math.random()*2-1)*k*k}
  const s=actx.createBufferSource();s.buffer=b;const g=actx.createGain();g.gain.value=v;s.connect(g);g.connect(BGM.g);s.start(t)}
function bgmTick(){if(!actx)return;if(!BGM.g){BGM.g=actx.createGain();BGM.g.gain.value=0;BGM.g.connect(actx.destination)}
  const now=actx.currentTime,want=muted?null:bgmArea();
  if(want!==BGM.cur){BGM.g.gain.cancelScheduledValues(now);BGM.g.gain.setTargetAtTime(0,now,.25);if(!BGM.sw||BGM.sw!==want){BGM.sw=want;BGM.swAt=now+.9}if(now>=BGM.swAt){BGM.cur=want;BGM.step=0;BGM.next=now+.05}return}
  if(!BGM.cur)return;const T=TRK[BGM.cur];if(BGM.next<now-.25)BGM.next=now+.05;BGM.g.gain.setTargetAtTime(BGM.base*T.vol,now,.4);const e8=60/T.bpm/2;
  while(BGM.next<now+.3){const i=BGM.step,t=BGM.next,m=T.mel[i%T.mel.length],bs=T.bass[i%T.bass.length];const deg=k=>T.root+T.sc[((k%T.sc.length)+T.sc.length)%T.sc.length]+12*Math.floor(k/T.sc.length);
    if(m!=null)bgmNote(deg(m)+12,t,e8*(T.bpm<80?3.2:1.8),T.mw,T.mw==='square'?.10:T.mw==='sawtooth'?.14:.2);
    if(bs!=null)bgmNote(T.root-12+bs,t,e8*(T.bpm<80?6:1.6),T.bw,.22);
    if(i%16===0)for(const c of T.chord)bgmNote(T.root+c,t,e8*15,'sine',.06);
    if(T.drum==='dar'){if(i%4===0)bgmDrum('kick',t,.35);if(i%4===2||i%8===7)bgmDrum('hat',t,.12)}
    if(T.drum==='rock'){if(i%4===0)bgmDrum('kick',t,.5);if(i%4===2)bgmDrum('hat',t,.25);bgmDrum('hat',t,.05)}
    BGM.step++;BGM.next+=e8}}
