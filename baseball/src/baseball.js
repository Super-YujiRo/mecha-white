// 野球のルールと物理（画面に依存しない・決定的）
// 座標：本塁 (0,0,0)、センター方向が -z、一塁側が +x、単位はメートル・秒
import { PITCHES } from './data.js';

export const G = 9.8;
export const BALL_R = 0.037;
export const BASE = 27.43;
export const BASES = [
  { x: 0, z: 0 },                       // 0: 本塁
  { x: 19.4, z: -19.4 },                // 1: 一塁
  { x: 0, z: -38.8 },                   // 2: 二塁
  { x: -19.4, z: -19.4 },               // 3: 三塁
];
export const RUBBER_Z = -18.44;
export const ZONE = { x0: -0.24, x1: 0.24, y0: 0.48, y1: 1.08 };
export const FENCE_H = 3.2;

export function fenceDist(phi) { return 97 + 23 * Math.cos(Math.min(1, Math.abs(phi) / (Math.PI / 4)) * Math.PI / 2) ** 0.8; }
export function sprayAngle(x, z) { return Math.atan2(x, -z); }
export function isFairAngle(x, z) { return Math.abs(sprayAngle(x, z)) <= Math.PI / 4 + 0.002; }

// ---- 乱数（同じ種なら同じ結果） ----
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function gauss(r) { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ================= 投球 =================
// パワプロのように体感を遅くする（表示の球速はそのまま）
export const PITCH_SLOW = 1;
// 投手の意図（球種・狙い）＋コントロールのブレ → 実際の投球パラメータ
export function makePitch(pitcher, type, target, seed, fatigue = 0) {
  const r = rng(seed);
  const def = PITCHES[type];
  const lv = type === 'ST' ? 0 : (pitcher.pitches[type] || 1);
  const hand = pitcher.throws === 'L' ? -1 : 1;
  const ctl = pitcher.control * (1 - fatigue * 0.35);
  const sigma = 0.018 + (100 - ctl) / 100 * 0.085;
  const end = { x: target.x + gauss(r) * sigma, y: target.y + gauss(r) * sigma * 0.85 };
  const k = type === 'ST' ? 1 : 0.5 + lv * 0.1;
  const velo = pitcher.velo * def.speed * (1 - fatigue * 0.06) * (0.985 + r() * 0.03);
  const release = { x: -0.5 * hand, y: 1.78, z: RUBBER_Z + 1.4 };
  const dist = Math.abs(release.z);
  const T = dist / (velo / 3.6 * 0.93) * PITCH_SLOW;
  return {
    type, lv, velo: Math.round(velo), hand,
    release, end, T,
    bx: def.bx * k * hand, by: def.by * k, arc: def.arc * (type === 'CU' ? 0.8 + lv * 0.05 : 1),
  };
}

// 投球の位置（t秒後）。t=T で本塁上（z=0）を通過
export function pitchPos(p, t) {
  const s = t / p.T;
  const late = Math.pow(Math.max(0, s), 1.9);
  const sx = p.end.x - p.bx, sy = p.end.y - p.by;
  return {
    x: p.release.x + (sx - p.release.x) * s + p.bx * late,
    y: p.release.y + (sy - p.release.y) * s + p.by * late + 4 * p.arc * s * (1 - s),
    z: p.release.z + (0 - p.release.z) * s,
  };
}

// パワプロの「ボールの影」：今の曲がり具合のままならゾーンのどこを通るか。
// 直球はリリース直後から正確、変化球は曲がるにつれて本当の位置へ動く
export function predictPlate(p, t) {
  const s = Math.max(0, Math.min(1, t / p.T));
  const late = Math.pow(s, 1.9);
  return { x: p.end.x - p.bx * (1 - late), y: p.end.y - p.by * (1 - late) };
}

export function inZone(pt) {
  return pt.x >= ZONE.x0 - BALL_R && pt.x <= ZONE.x1 + BALL_R && pt.y >= ZONE.y0 - BALL_R && pt.y <= ZONE.y1 + BALL_R;
}

// ================= 打撃 =================
export function cursorSize(batter, power) {
  const rx = 0.09 + batter.meet * 0.0012;
  const k = power ? 0.68 : 1;
  return { rx: rx * k, ry: rx * 0.78 * k };
}

export const SWING_LAG = 0.1;     // クリックしてからバットがゾーンに来るまで
export const TIMING_WIN = 0.17;   // 当たるタイミングの幅（±）

// swing: { ts:クリック時刻(投球開始から), cx, cy, power } / 戻り値：空振り or 打球の初速
export function judgeSwing(pitch, batter, swing, seed) {
  const r = rng(seed);
  const at = pitchPos(pitch, pitch.T);
  const { rx, ry } = cursorSize(batter, swing.power);
  const dt = swing.ts + SWING_LAG - pitch.T;
  // ボールが少しでもカーソルに掛かれば当たる
  const ox = (at.x - swing.cx) / (rx + BALL_R * 1.2);
  const oy = (at.y - swing.cy) / (ry + BALL_R * 1.2);
  const d = Math.hypot(ox, oy);
  if (Math.abs(dt) > TIMING_WIN || d > 1.0) return { miss: true, dt, d };

  const tq = Math.abs(dt) / TIMING_WIN;
  // 芯：カーソル中心のやや下で捉えると最高
  const sweet = Math.hypot(ox, oy * 0.9);
  const q = Math.max(0, 1 - Math.min(1.2, sweet) * 0.45 - tq * tq * 0.3);
  const hand = batter.bats === 'L' ? -1 : 1;

  // 端っこ・タイミングぎりぎりはファウルになりやすい
  if ((d > 0.93 || tq > 0.9) && r() < 0.4) {
    const back = r() < 0.5;
    const phi = (r() < 0.5 ? -1 : 1) * (0.9 + r() * 0.8);
    const sp = 18 + r() * 14;
    const la = back ? 30 + r() * 40 : 8 + r() * 30;
    return { foulTip: true, v: launchVec(sp, la, back ? Math.PI - phi * 0.3 : phi), q: 0.1, dt, d };
  }

  const powerK = swing.power ? 1.17 : 1;
  const ev = (110 + batter.power * 0.8) * (0.55 + 0.45 * q) * powerK * (0.97 + r() * 0.06); // km/h
  let la = 13 + oy * 30 + gauss(r) * 5;             // 打球角度（上に当てるとゴロ、下ならフライ）
  la = Math.max(-25, Math.min(68, la));
  let phi = -dt / TIMING_WIN * 0.62 * hand;          // 早い→引っ張り
  phi += -ox * 0.12 * hand + gauss(r) * 0.07;
  return { v: launchVec(ev / 3.6, la, phi), ev, la, phi, q, dt, d };
}

function launchVec(speed, laDeg, phi) {
  const la = laDeg * Math.PI / 180;
  const h = Math.cos(la) * speed;
  return { x: Math.sin(phi) * h, y: Math.sin(la) * speed, z: -Math.cos(phi) * h };
}

// ================= 打球の飛行 =================
const DRAG = 0.0042;
export function simulateBall(v0, opts = {}) {
  const dt = 1 / 120;
  const p = { x: 0, y: 0.9, z: 0.15 };
  const v = { ...v0 };
  const out = [];
  let t = 0, bounces = 0, firstBounce = null, hr = null, wallHit = false, stopped = null;
  const maxT = opts.maxT || 12;
  while (t < maxT) {
    out.push({ t, x: p.x, y: p.y, z: p.z, air: bounces === 0 });
    const sp = Math.hypot(v.x, v.y, v.z);
    const air = p.y > BALL_R + 0.001;
    if (air) {
      v.x -= DRAG * sp * v.x * dt; v.y -= (G + DRAG * sp * v.y) * dt; v.z -= DRAG * sp * v.z * dt;
    } else {
      const hs = Math.hypot(v.x, v.z);
      const dec = Math.min(hs, 5.5 * dt);
      if (hs > 0) { v.x -= v.x / hs * dec; v.z -= v.z / hs * dec; }
    }
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    if (p.y < BALL_R) {
      p.y = BALL_R;
      if (v.y < -1.2) {
        if (bounces === 0) firstBounce = { t, x: p.x, z: p.z };
        bounces++;
        v.y = -v.y * 0.42; v.x *= 0.72; v.z *= 0.72;
      } else { v.y = 0; }
    }
    // フェンス
    const dist = Math.hypot(p.x, p.z);
    const phi = sprayAngle(p.x, p.z);
    if (Math.abs(phi) <= Math.PI / 4 + 0.01 && dist >= fenceDist(phi)) {
      if (bounces === 0 && p.y > FENCE_H && !hr) { hr = { t, x: p.x, y: p.y, z: p.z }; if (opts.stopAtHr) { out.push({ t, x: p.x, y: p.y, z: p.z, air: true }); break; } }
      else if (!hr && !wallHit) {
        wallHit = true;
        const nx = p.x / dist, nz = p.z / dist;
        const vn = v.x * nx + v.z * nz;
        if (vn > 0) { v.x -= 1.5 * vn * nx; v.z -= 1.5 * vn * nz; }
        p.x = nx * (dist - 0.2); p.z = nz * (dist - 0.2);
      }
    }
    if (dist > 160) break;
    if (!air && Math.hypot(v.x, v.z) < 0.25 && Math.abs(v.y) < 0.1) { stopped = t; out.push({ t, x: p.x, y: p.y, z: p.z, air: false }); break; }
    t += dt;
  }
  return { path: out, firstBounce, hr, stopped };
}

export function sampleAt(path, t) {
  if (t <= path[0].t) return path[0];
  const last = path[path.length - 1];
  if (t >= last.t) return last;
  const i = Math.min(path.length - 2, Math.floor(t * 120));
  const a = path[i], b = path[i + 1];
  const k = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return { t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, air: a.air };
}
