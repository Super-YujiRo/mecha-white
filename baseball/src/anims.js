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
  return { PitchR: buildClip('PitchR', base, PITCH), PitchL: buildClip('PitchL', base, mirror(PITCH)) };
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
