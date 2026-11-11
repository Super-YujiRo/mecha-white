// 効果音（すべてWeb Audioで合成。外部の音源は使わない）
let ctx = null, master = null, crowdGain = null, noiseBuf = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

// 最初の操作で音を有効にする（ブラウザの決まり）
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
  if (c && !crowdGain) startCrowd();
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; }
export function isMuted() { return muted; }

function noise(dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.5, attack = 0.002, decay = dur, when = 0, sweepTo = null } = {}) {
  const c = ensure(); if (!c || muted) return;
  const t = c.currentTime + when;
  const src = c.createBufferSource(); src.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t, Math.random()); src.stop(t + dur + 0.05);
}
function tone(freq, dur, { type = 'sine', gain = 0.3, attack = 0.002, when = 0, to = null } = {}) {
  const c = ensure(); if (!c || muted) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

// 打球音：芯に近いほど高く澄んだ「カキーン」
export function sfxHit(q = 0.5, power = false) {
  const k = Math.max(0, Math.min(1, q));
  noise(0.05, { type: 'highpass', freq: 2500, gain: 0.9, decay: 0.05 });
  noise(0.09, { type: 'bandpass', freq: 1800 + k * 1400, q: 3, gain: 0.7, decay: 0.09 });
  const ring = 0.12 + k * 0.45;
  for (const [f, g] of [[1650, 0.28], [2780, 0.2], [3900, 0.12], [5200, 0.06]]) tone(f * (0.92 + k * 0.12), ring, { gain: g * (0.4 + k * 0.8) });
  tone(180, 0.08, { gain: 0.35, to: 90 });
  if (power && k > 0.6) tone(900, ring * 0.9, { type: 'triangle', gain: 0.12 });
}
// かすった・ファウル
export function sfxTip() {
  noise(0.06, { type: 'bandpass', freq: 1200, q: 2, gain: 0.5, decay: 0.06 });
  tone(700, 0.06, { gain: 0.12 });
}
// キャッチャーミット「パァン」
export function sfxMitt(strong = 1) {
  noise(0.09, { type: 'bandpass', freq: 850, q: 1.2, gain: 0.8 * strong, decay: 0.09 });
  noise(0.03, { type: 'highpass', freq: 3000, gain: 0.35 * strong, decay: 0.03 });
  tone(140, 0.1, { gain: 0.4 * strong, to: 70 });
}
// 野手の捕球（小さめ）
export function sfxCatch() {
  noise(0.06, { type: 'bandpass', freq: 1100, q: 1.5, gain: 0.35, decay: 0.06 });
  tone(200, 0.06, { gain: 0.15, to: 110 });
}
// スイングの風切り音
export function sfxSwing(power = false) {
  noise(0.22, { type: 'bandpass', freq: 500, q: 0.8, gain: power ? 0.4 : 0.25, attack: 0.05, decay: 0.22, sweepTo: 2600 });
}
// 投球のリリース
export function sfxRelease() {
  noise(0.12, { type: 'bandpass', freq: 700, q: 0.7, gain: 0.12, attack: 0.03, decay: 0.12, sweepTo: 1800 });
}
// ボールが地面で跳ねる
export function sfxBounce() { tone(260, 0.05, { gain: 0.12, to: 160 }); noise(0.03, { type: 'lowpass', freq: 900, gain: 0.15 }); }
// 走者がベースを踏む・スライディング
export function sfxSlide() { noise(0.35, { type: 'lowpass', freq: 1400, q: 0.6, gain: 0.35, attack: 0.02, decay: 0.35, sweepTo: 500 }); }
// 判定などの合図
export function sfxCue(kind = 'ok') {
  if (kind === 'out') { tone(520, 0.12, { type: 'square', gain: 0.08 }); tone(390, 0.18, { type: 'square', gain: 0.08, when: 0.1 }); }
  else if (kind === 'safe') { tone(660, 0.1, { type: 'square', gain: 0.07 }); tone(880, 0.16, { type: 'square', gain: 0.07, when: 0.08 }); }
  else tone(880, 0.07, { type: 'square', gain: 0.05 });
}

// 観客：ふだんはざわざわ、いい当たりで歓声
function startCrowd() {
  const c = ensure(); if (!c) return;
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.5;
  crowdGain = c.createGain(); crowdGain.gain.value = 0.05;
  src.connect(f); f.connect(crowdGain); crowdGain.connect(master);
  src.start();
}
export function sfxCheer(level = 1, dur = 2.5) {
  const c = ensure(); if (!c || !crowdGain || muted) return;
  const t = c.currentTime, g = crowdGain.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0.05 + 0.3 * level, t + 0.25);
  g.linearRampToValueAtTime(0.05, t + dur);
  if (level > 0.7) for (let i = 0; i < 6; i++) tone(1200 + Math.random() * 900, 0.2, { type: 'triangle', gain: 0.02, when: 0.1 + i * 0.12 });
}

// 審判のコール（ブラウザの音声合成。日本語の声があるときだけ）
let jaVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  jaVoice = vs.find(v => /ja/i.test(v.lang) && /male|otoya|ichiro|keita/i.test(v.name)) || vs.find(v => /ja/i.test(v.lang)) || null;
  return jaVoice;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function umpire(text, { rate = 1.25, pitch = 0.7, vol = 0.9 } = {}) {
  if (muted || !('speechSynthesis' in window)) return;
  if (!jaVoice && !pickVoice()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = jaVoice; u.lang = 'ja-JP'; u.rate = rate; u.pitch = pitch; u.volume = vol;
    speechSynthesis.speak(u);
  } catch (e) { /* 音声が使えない環境 */ }
}
