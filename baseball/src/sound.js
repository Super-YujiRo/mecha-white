// 効果音（実際に録音された音。Google Sound Library, CC BY 4.0）
let ctx = null, master = null, muted = false;
const buf = {};
const FILES = { hit: 'hit.webm', mitt: 'mitt.webm', cheer: 'cheer.webm' };

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  for (const [k, f] of Object.entries(FILES)) {
    fetch('./assets/sfx/' + f).then(r => r.arrayBuffer()).then(a => ctx.decodeAudioData(a)).then(b => { buf[k] = b; }).catch(() => {});
  }
  return ctx;
}

// 最初の操作で音を有効にする（ブラウザの決まり）
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.9; }
export function isMuted() { return muted; }

function play(name, { gain = 1, rate = 1, when = 0 } = {}) {
  const c = ensure();
  if (!c || muted || !buf[name]) return null;
  const s = c.createBufferSource(); s.buffer = buf[name]; s.playbackRate.value = rate;
  const g = c.createGain(); g.gain.value = gain;
  s.connect(g); g.connect(master);
  s.start(c.currentTime + when);
  return g;
}

// 打球音：芯で捉えるほど大きく、少し高く
export function sfxHit(q = 0.5) {
  const k = Math.max(0, Math.min(1, q));
  play('hit', { gain: 0.45 + 0.6 * k, rate: 0.9 + 0.15 * k });
}
// かすった・ファウルチップ
export function sfxTip() { play('hit', { gain: 0.3, rate: 0.8 }); }
// キャッチャーミット
export function sfxMitt(strong = 1) { play('mitt', { gain: 0.9 * strong, rate: 1 }); }
// 野手の捕球（小さめ）
export function sfxCatch() { play('mitt', { gain: 0.45, rate: 1.1 }); }
// 歓声
export function sfxCheer(level = 1) {
  if (level < 0.3) return;
  play('cheer', { gain: Math.min(1.2, 0.35 + level * 0.8) });
}
// 以下は鳴らさない（合成音はやめた）
export function sfxSwing() {}
export function sfxRelease() {}
export function sfxBounce() {}
export function sfxSlide() {}
export function sfxCue() {}
export function umpire() {}
