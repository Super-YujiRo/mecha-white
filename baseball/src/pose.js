// 手足の「向き」でポーズを作り、アニメーションにする
// 体の向き：x＝左、y＝上、z＝前（キャラが向いている方）
import * as THREE from 'three';

const ORDER = ['spine', 'chest', 'head',
  'upperarml', 'lowerarml', 'upperarmr', 'lowerarmr',
  'upperlegl', 'lowerlegl', 'upperlegr', 'lowerlegr'];
const D = Math.PI / 180;
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _w = new THREE.Quaternion();
const _ry = new THREE.Vector3();

// bones: 名前→Bone（モデルの回転はなし）。spec：{ spine:[x,y,z]度, upperarmr:[dx,dy,dz]向き, _hipsY: 数値 }
export function solvePose(bones, spec, rest) {
  for (const [n, b] of Object.entries(bones)) { b.quaternion.copy(rest[n].q); b.position.copy(rest[n].p); }
  if (spec._hipsY) bones.hips.position.y += spec._hipsY;
  bones.hips.parent.updateMatrixWorld(true);
  for (const n of ORDER) {
    const b = bones[n], s = spec[n];
    if (!b || !s) continue;
    if (n === 'spine' || n === 'chest' || n === 'head') {
      b.quaternion.multiply(_q.setFromEuler(new THREE.Euler(s[0] * D, s[1] * D, s[2] * D, 'XYZ')));
    } else {
      // この骨の+Y（手足の伸びる向き）を、指定の向きにそろえる
      b.parent.getWorldQuaternion(_p);
      b.getWorldQuaternion(_w);
      _ry.set(0, 1, 0).applyQuaternion(_w).normalize();
      _v.set(s[0], s[1], s[2]).normalize();
      _q.setFromUnitVectors(_ry, _v);
      _w.premultiply(_q);
      b.quaternion.copy(_p.invert().multiply(_w));
    }
    b.updateMatrixWorld(true);
  }
  const out = {};
  for (const [n, b] of Object.entries(bones)) out[n] = b.quaternion.clone();
  out._hipsP = bones.hips.position.clone();
  return out;
}

// keys: [{ t, pose }]。手足の骨のクォータニオンと腰の高さのアニメーションを作る
export function buildClip(name, base, keys) {
  const bones = {};
  base.traverse(o => { if (o.isBone) bones[o.name] = o; });
  const rest = {};
  for (const [n, b] of Object.entries(bones)) rest[n] = { q: b.quaternion.clone(), p: b.position.clone() };
  const frames = keys.map(k => ({ t: k.t, q: solvePose(bones, k.pose, rest) }));
  // 元に戻す
  for (const [n, b] of Object.entries(bones)) { b.quaternion.copy(rest[n].q); b.position.copy(rest[n].p); }
  const times = frames.map(f => f.t);
  const tracks = [];
  for (const n of Object.keys(bones)) {
    if (n === 'root') continue;
    const vals = [];
    for (const f of frames) vals.push(...f.q[n].toArray());
    tracks.push(new THREE.QuaternionKeyframeTrack(n + '.quaternion', times, vals));
  }
  const hv = [];
  for (const f of frames) hv.push(...f.q._hipsP.toArray());
  tracks.push(new THREE.VectorKeyframeTrack('hips.position', times, hv));
  return new THREE.AnimationClip(name, times[times.length - 1], tracks);
}
