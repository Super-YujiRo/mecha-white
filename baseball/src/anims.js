// 自作のアニメーション（手足の向きのキーフレーム）
import { buildClip } from './pose.js';

// 右投げの投球。t＝0 で構え、0.85秒でリリース
const PITCH = [
  { t: 0.0, pose: { upperarmr: [-0.1, -0.8, 0.5], lowerarmr: [0.35, 0.15, 0.9], upperarml: [0.1, -0.8, 0.5], lowerarml: [-0.35, 0.15, 0.9] } },
  { t: 0.38, pose: { upperlegl: [0.1, 0.25, 0.97], lowerlegl: [0, -1, 0.15], upperarmr: [-0.25, -0.4, 0.9], lowerarmr: [0.6, 0.5, 0.5], upperarml: [0.25, -0.4, 0.9], lowerarml: [-0.6, 0.5, 0.5], spine: [-8, 0, 0], _hipsY: 0.02 } },
  { t: 0.66, pose: { upperlegl: [0.75, -0.6, 0.15], lowerlegl: [0.3, -1, 0], upperlegr: [-0.35, -0.9, 0], lowerlegr: [0.15, -1, -0.25], upperarmr: [-0.95, 0.3, -0.15], lowerarmr: [-0.1, 1, 0.1], upperarml: [0.95, 0.25, 0.15], lowerarml: [0.85, 0.1, 0.4], spine: [0, 0, 6], _hipsY: -0.1 } },
  { t: 0.85, pose: { upperlegl: [0.15, -0.7, 0.7], lowerlegl: [0, -1, 0.1], upperlegr: [-0.1, -0.7, -0.6], lowerlegr: [0, -0.6, -0.8], upperarmr: [-0.35, 0.65, 0.7], lowerarmr: [-0.1, 0.3, 0.95], upperarml: [0.5, -0.6, 0.6], lowerarml: [-0.4, 0.2, 0.9], spine: [25, 0, 0], _hipsY: -0.12 } },
  { t: 1.05, pose: { upperlegl: [0.1, -0.8, 0.6], lowerlegl: [0, -1, 0], upperlegr: [-0.2, 0.15, -0.98], lowerlegr: [0, -0.7, -0.7], upperarmr: [0.45, -0.75, 0.45], lowerarmr: [0.6, -0.6, 0.4], upperarml: [0.45, -0.8, -0.2], lowerarml: [0.2, -0.5, 0.8], spine: [45, 0, 0], _hipsY: -0.14 } },
  { t: 1.6, pose: { upperlegl: [0.1, -0.9, 0.35], lowerlegl: [0, -1, 0], upperlegr: [-0.15, -0.9, -0.3], lowerlegr: [0, -1, -0.1], upperarmr: [0.2, -0.9, 0.3], lowerarmr: [0.3, -0.5, 0.8], upperarml: [0.2, -0.9, 0.1], lowerarml: [-0.1, -0.3, 0.9], spine: [15, 0, 0], _hipsY: -0.04 } },
];

// 右打者の構えとスイング（クリックから0.1秒でミート）
const STANCE = {upperlegl: [0.28, -0.95, 0.05], lowerlegl: [0.05, -1, -0.12], upperlegr: [-0.28, -0.95, 0.05], lowerlegr: [-0.05, -1, -0.12], upperarmr: [-0.8, -0.3, -0.1], lowerarmr: [0.05, 0.95, -0.15], upperarml: [-0.45, -0.4, 0.6], lowerarml: [-0.85, 0.45, 0.0], spine: [8, -22, 0], _hipsY: -0.06};
const SWING = [
  { t: 0, pose: {upperlegl: [0.38, -0.92, 0.05], lowerlegl: [0.1, -1, -0.1], upperlegr: [-0.3, -0.95, 0.05], lowerlegr: [-0.05, -1, -0.15], upperarmr: [-0.8, -0.3, -0.1], lowerarmr: [0.05, 0.95, -0.15], upperarml: [-0.45, -0.4, 0.6], lowerarml: [-0.85, 0.45, 0.0], spine: [8, -32, 0], _hipsY: -0.08} },
  { t: 0.1, pose: {upperlegl: [0.4, -0.92, 0.0], lowerlegl: [0.1, -1, 0.0], upperlegr: [-0.25, -0.92, 0.15], lowerlegr: [0.1, -1, -0.3], upperarmr: [0.15, -0.5, 0.85], lowerarmr: [0.35, -0.15, 0.92], upperarml: [0.35, -0.45, 0.8], lowerarml: [0.25, -0.2, 0.95], spine: [10, 25, 0], _hipsY: -0.09} },
  { t: 0.32, pose: {upperlegl: [0.35, -0.94, 0.0], lowerlegl: [0.05, -1, 0.0], upperlegr: [-0.15, -0.92, 0.3], lowerlegr: [0.2, -1, -0.4], upperarmr: [0.75, 0.0, 0.6], lowerarmr: [0.55, 0.7, -0.3], upperarml: [0.75, 0.1, -0.2], lowerarml: [0.15, 0.85, -0.45], spine: [6, 60, 0], _hipsY: -0.07} },
  { t: 0.9, pose: {upperlegl: [0.35, -0.94, 0.0], lowerlegl: [0.05, -1, 0.0], upperlegr: [-0.15, -0.92, 0.3], lowerlegr: [0.2, -1, -0.4], upperarmr: [0.75, 0.0, 0.6], lowerarmr: [0.55, 0.7, -0.3], upperarml: [0.75, 0.1, -0.2], lowerarml: [0.15, 0.85, -0.45], spine: [6, 60, 0], _hipsY: -0.07} },
];


// 野手：構え・捕球・送球（右投げ）
const READY = {upperlegl: [0.35, -0.88, 0.25], lowerlegl: [0.05, -1, -0.25], upperlegr: [-0.35, -0.88, 0.25], lowerlegr: [-0.05, -1, -0.25], upperarml: [0.25, -0.75, 0.55], lowerarml: [0.0, -0.85, 0.5], upperarmr: [-0.25, -0.75, 0.55], lowerarmr: [0.0, -0.85, 0.5], spine: [22, 0, 0], _hipsY: -0.13};
const CATCH = {upperlegl: [0.2, -0.95, 0.15], lowerlegl: [0, -1, -0.1], upperlegr: [-0.2, -0.95, 0.1], lowerlegr: [0, -1, -0.1], upperarml: [0.25, 0.15, 0.95], lowerarml: [-0.1, 0.75, 0.65], upperarmr: [-0.15, -0.1, 0.95], lowerarmr: [0.35, 0.55, 0.75], spine: [5, 0, 0], _hipsY: -0.04};
const FTHROW = [
  { t: 0, pose: {upperlegl: [0.3, -0.85, 0.4], lowerlegl: [0, -1, 0], upperlegr: [-0.15, -0.9, -0.35], lowerlegr: [0, -0.9, -0.4], upperarmr: [-0.9, 0.35, -0.25], lowerarmr: [-0.1, 1, 0.1], upperarml: [0.8, 0.2, 0.55], lowerarml: [0.6, 0.1, 0.8], spine: [0, -35, 0], _hipsY: -0.06} },
  { t: 0.2, pose: {upperlegl: [0.2, -0.8, 0.55], lowerlegl: [0, -1, 0.1], upperlegr: [-0.1, -0.75, -0.6], lowerlegr: [0, -0.6, -0.8], upperarmr: [-0.25, 0.6, 0.75], lowerarmr: [0, 0.3, 0.95], upperarml: [0.5, -0.6, 0.5], lowerarml: [-0.3, 0.1, 0.95], spine: [20, 20, 0], _hipsY: -0.08} },
  { t: 0.4, pose: {upperlegl: [0.15, -0.85, 0.5], lowerlegl: [0, -1, 0], upperlegr: [-0.1, -0.4, -0.9], lowerlegr: [0, -0.6, -0.8], upperarmr: [0.45, -0.75, 0.45], lowerarmr: [0.6, -0.6, 0.4], upperarml: [0.45, -0.8, -0.1], lowerarml: [0.2, -0.5, 0.8], spine: [35, 25, 0], _hipsY: -0.1} },
  { t: 0.7, pose: {upperlegl: [0.15, -0.85, 0.5], lowerlegl: [0, -1, 0], upperlegr: [-0.1, -0.4, -0.9], lowerlegr: [0, -0.6, -0.8], upperarmr: [0.45, -0.75, 0.45], lowerarmr: [0.6, -0.6, 0.4], upperarml: [0.45, -0.8, -0.1], lowerarml: [0.2, -0.5, 0.8], spine: [35, 25, 0], _hipsY: -0.1} },
];

// バントの構え（右打者）：投手の方へ体を向け、両手を前に出してバットを寝かせる
const BUNT = {upperlegl: [0.32, -0.92, 0.15], lowerlegl: [0.05, -1, -0.2], upperlegr: [-0.3, -0.92, 0.1], lowerlegr: [-0.05, -1, -0.2], upperarmr: [0.45, -0.35, 0.6], lowerarmr: [0.85, 0.05, 0.4], upperarml: [0.55, -0.35, 0.65], lowerarml: [0.7, 0.2, 0.65], spine: [12, 45, 0], _hipsY: -0.12};

// 足から滑り込むスライディング
const SLIDE_P = {upperlegr: [0.05, -0.25, 1], lowerlegr: [0, -0.12, 1], upperlegl: [0.15, -0.3, 0.94], lowerlegl: [0.05, -0.35, -0.94], upperarml: [0.55, 0.55, -0.4], lowerarml: [0.2, 0.95, 0.1], upperarmr: [-0.55, 0.55, -0.4], lowerarmr: [-0.2, 0.95, 0.1], spine: [-48, 0, 0], head: [20, 0, 0], _hipsY: -0.25};
const SLIDE = [
  { t: 0, pose: {upperlegl: [0.1, -0.7, 0.7], lowerlegl: [0, -1, -0.3], upperlegr: [-0.1, -0.9, -0.3], lowerlegr: [0, -0.7, -0.7], upperarml: [0.3, -0.6, -0.6], lowerarml: [0.2, 0.2, 0.95], upperarmr: [-0.3, -0.6, 0.6], lowerarmr: [-0.2, 0.2, 0.95], spine: [15, 0, 0], _hipsY: -0.04} },
  { t: 0.16, pose: SLIDE_P },
  { t: 1.4, pose: SLIDE_P },
];

// 体の向き（投げる腕と反対の肩をホームへ）。main.js が投手の向きに使う
export const PITCH_TURN = [[0, -90], [0.38, -92], [0.66, -78], [0.85, -10], [1.05, 8], [1.6, 0]];

// 左右反転（左投げ用）
function mirror(keys) {
  const sw = (n) => n.replace(/l$/, '#').replace(/r$/, 'l').replace(/#$/, 'r');
  return keys.map(k => {
    const p = {};
    for (const [n, v] of Object.entries(k.pose)) {
      if (n === '_hipsY') { p[n] = v; continue; }
      if (n === 'spine' || n === 'chest' || n === 'head') { p[n] = [v[0], -v[1], -v[2]]; continue; }
      p[sw(n)] = [-v[0], v[1], v[2]];
    }
    return { t: k.t, pose: p };
  });
}

export function buildCustomClips(base) {
  const st = [{ t: 0, pose: STANCE }, { t: 1, pose: STANCE }];
  return {
    PitchR: buildClip('PitchR', base, PITCH), PitchL: buildClip('PitchL', base, mirror(PITCH)),
    StanceR: buildClip('StanceR', base, st), StanceL: buildClip('StanceL', base, mirror(st)),
    SwingR: buildClip('SwingR', base, SWING), SwingL: buildClip('SwingL', base, mirror(SWING)),
    Ready: buildClip('Ready', base, [{ t: 0, pose: READY }, { t: 1, pose: READY }]),
    CatchUp: buildClip('CatchUp', base, [{ t: 0, pose: CATCH }, { t: 0.4, pose: CATCH }]),
    FThrow: buildClip('FThrow', base, FTHROW),
    Slide: buildClip('Slide', base, SLIDE),
    BuntR: buildClip('BuntR', base, [{ t: 0, pose: BUNT }, { t: 1, pose: BUNT }]), BuntL: buildClip('BuntL', base, mirror([{ t: 0, pose: BUNT }, { t: 1, pose: BUNT }])),
  };
}
export function turnAt(t, left) {
  const K = PITCH_TURN;
  let v = K[K.length - 1][1];
  for (let i = 0; i < K.length - 1; i++) {
    if (t >= K[i][0] && t <= K[i + 1][0]) { const k = (t - K[i][0]) / (K[i + 1][0] - K[i][0]); const e = k * k * (3 - 2 * k); v = K[i][1] + (K[i + 1][1] - K[i][1]) * e; break; }
  }
  if (t < 0) v = K[0][1];
  return (left ? -v : v) * Math.PI / 180;
}
