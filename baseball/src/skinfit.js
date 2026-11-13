// Tripoで作った選手モデルを、マネキンの骨（KayKitのアニメーションが動く骨）に合わせて取り付ける
import * as THREE from 'three';

// 骨の位置を体の形から決め、各頂点がどの骨について動くかを計算する
export function fitModel(base, model, opt = {}) {
  base.updateMatrixWorld(true);
  const bones = {};
  base.traverse(o => { if (o.isBone) bones[o.name] = o; });
  const old = base.getObjectByName('Mannequin_Medium_Body');
  const skeleton = old.skeleton;

  // モデルの頂点をまとめる（Tポーズ、足元が0、正面が+z）
  model.updateMatrixWorld(true);
  const parts = [];
  model.traverse(o => { if (o.isMesh) parts.push(o); });
  const src = parts[0];
  const geo = src.geometry.clone();
  geo.applyMatrix4(src.matrixWorld);
  if (opt.rotY) geo.rotateY(opt.rotY);
  geo.computeBoundingBox();
  let bb = geo.boundingBox;
  const hBase = 2.0;
  const sc = hBase / (bb.max.y - bb.min.y);
  geo.translate(-(bb.max.x + bb.min.x) / 2, -bb.min.y, -(bb.max.z + bb.min.z) / 2);
  geo.scale(sc, sc, sc);
  geo.computeBoundingBox(); bb = geo.boundingBox;
  const P = geo.attributes.position, n = P.count, H = bb.max.y;

  // 体の目印を測る
  const L = measure(P, H, bb);
  window.__fitL = L;

  // 骨を動かす（ワールド座標で置いてからローカルに直す）
  const W = {
    hips: [0, L.hipY, 0], spine: [0, L.hipY + (L.armY - L.hipY) * 0.35, 0], chest: [0, L.hipY + (L.armY - L.hipY) * 0.8, 0], head: [0, L.neckY, 0],
    upperarml: [L.shX, L.armY, 0], lowerarml: [L.shX + (L.handX - L.shX) * 0.45, L.armY, 0], wristl: [L.shX + (L.handX - L.shX) * 0.78, L.armY, 0], handl: [L.handX - 0.02, L.armY, 0],
    upperlegl: [L.legX, L.hipY - 0.04, 0], lowerlegl: [L.legX, L.hipY * 0.55, 0], footl: [L.legX, L.ankleY, 0], toesl: [L.legX, 0.03, L.toeZ],
  };
  for (const k of Object.keys(W)) if (k.endsWith('l') && k !== 'hips') { const v = W[k]; W[k.slice(0, -1) + 'r'] = [-v[0], v[1], v[2]]; }
  const order = ['hips', 'spine', 'chest', 'head', 'upperarml', 'lowerarml', 'wristl', 'handl', 'upperarmr', 'lowerarmr', 'wristr', 'handr', 'upperlegl', 'lowerlegl', 'footl', 'toesl', 'upperlegr', 'lowerlegr', 'footr', 'toesr'];
  const oldHipY = bones.hips.getWorldPosition(new THREE.Vector3()).y;
  for (const k of order) {
    const b = bones[k]; if (!b) continue;
    const v = new THREE.Vector3(...W[k]);
    b.parent.updateMatrixWorld(true);
    b.position.copy(b.parent.worldToLocal(v));
    b.updateMatrixWorld(true);
  }
  base.updateMatrixWorld(true);
  skeleton.calculateInverses();

  // 骨ごとの線分（頂点に近い骨を選ぶため）
  const wp = (k) => bones[k].getWorldPosition(new THREE.Vector3());
  const top = new THREE.Vector3(0, H, 0);
  const segs = [
    ['hips', wp('hips'), wp('spine')], ['spine', wp('spine'), wp('chest')], ['chest', wp('chest'), wp('head')],
  ];
  for (const s of ['l', 'r']) {
    segs.push(['upperarm' + s, wp('upperarm' + s), wp('lowerarm' + s)], ['lowerarm' + s, wp('lowerarm' + s), wp('wrist' + s)], ['hand' + s, wp('wrist' + s), wp('hand' + s).add(new THREE.Vector3(s === 'l' ? 0.1 : -0.1, 0, 0))]);
    segs.push(['upperleg' + s, wp('upperleg' + s), wp('lowerleg' + s)], ['lowerleg' + s, wp('lowerleg' + s), wp('foot' + s)], ['foot' + s, wp('foot' + s), wp('toes' + s)]);
  }
  const idx = {}; skeleton.bones.forEach((b, i) => { idx[b.name] = i; });
  const ji = new Uint16Array(n * 4), jw = new Float32Array(n * 4);
  const v = new THREE.Vector3(), t = new THREE.Vector3(), ab = new THREE.Vector3();
  const segD = (p, a, b) => { ab.subVectors(b, a); const u = Math.max(0, Math.min(1, t.subVectors(p, a).dot(ab) / ab.lengthSq())); return t.copy(a).addScaledVector(ab, u).distanceTo(p); };
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(P, i);
    let cand;
    if (v.y > L.neckY + 0.03) cand = [['head', 1]];
    else if (v.y > L.neckY - 0.03 && Math.abs(v.x) < L.shX * 0.8) cand = [['head', 0.6], ['chest', 0.4]];
    else {
      const side = v.x >= 0 ? 'l' : 'r';
      const ok = (name) => {
        if (/arm|hand/.test(name)) return Math.abs(v.x) > L.shX - 0.06 && v.y > L.armY - 0.3 && name.endsWith(side);
        if (/leg|foot/.test(name)) return v.y < L.hipY + 0.05 && name.endsWith(side);
        return true;
      };
      const ds = [];
      for (const [name, a, b] of segs) if (ok(name)) ds.push([name, segD(v, a, b)]);
      ds.sort((x, y) => x[1] - y[1]);
      const a = ds[0], b = ds[1];
      if (!b) cand = [[a[0], 1]];
      else {
        const wa = 1 / Math.pow(a[1] + 0.01, 4), wb = 1 / Math.pow(b[1] + 0.01, 4);
        let k = wb / (wa + wb);
        // 遠い方は弱く（関節まわりだけ混ぜる）
        k = Math.max(0, (k - 0.15) / 0.85) * 0.5;
        cand = [[a[0], 1 - k], [b[0], k]];
      }
    }
    for (let j = 0; j < 4; j++) { const c = cand[j]; ji[i * 4 + j] = c ? idx[c[0]] : 0; jw[i * 4 + j] = c ? c[1] : 0; }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(ji, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(jw, 4));

  const mat = src.material;
  const sm = new THREE.SkinnedMesh(geo, mat);
  sm.name = 'Player_Body';
  // マネキンの体は外す
  const rm = [];
  base.traverse(o => { if (o.isMesh && o.name.startsWith('Mannequin')) rm.push(o); });
  const parent = old.parent;
  for (const o of rm) o.parent.remove(o);
  parent.add(sm);
  sm.bind(skeleton, new THREE.Matrix4());
  return { mesh: sm, hipRatio: L.hipY / oldHipY, L };
}

function measure(P, H, bb) {
  const n = P.count, v = new THREE.Vector3();
  const maxX = Math.max(bb.max.x, -bb.min.x);
  // 腕の高さ：外側にある頂点の平均の高さ
  let s = 0, c = 0;
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); if (Math.abs(v.x) > maxX * 0.75) { s += v.y; c++; } }
  const armY = s / c;
  // 高さごとの横幅（腕を除くため外側0.45までで見る）
  const bins = 100, wid = new Float32Array(bins), widAll = new Float32Array(bins), cen = new Float32Array(bins).fill(9);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(P, i);
    const b = Math.min(bins - 1, Math.floor(v.y / H * bins));
    const ax = Math.abs(v.x);
    widAll[b] = Math.max(widAll[b], ax);
    if (ax < maxX * 0.5) wid[b] = Math.max(wid[b], ax);
    if (ax < 0.025) cen[b] = Math.min(cen[b], v.y);
  }
  // 股：真ん中の列でいちばん低い頂点（足の間は空いている）
  let crotch = 9;
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); if (Math.abs(v.x) < 0.03 && v.y > H * 0.05 && v.y < armY) crotch = Math.min(crotch, v.y); }
  // 腕の下の胴の幅
  const bA = Math.floor(armY / H * bins);
  let torso = 0;
  for (let b = Math.floor(bA * 0.7); b < bA - 7; b++) torso = Math.max(torso, wid[b]);
  // 首：腕より上で、幅がいちばん細いところ
  let neckB = bA + 2, mn = 9;
  for (let b = bA + 1; b < Math.min(bins, bA + 14); b++) if (wid[b] > 0 && wid[b] < mn) { mn = wid[b]; neckB = b; }
  const neckY = (neckB + 0.5) / bins * H;
  // 脚の中心
  let ls = 0, lc = 0, toeZ = 0;
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); if (v.y < crotch * 0.7 && v.y > crotch * 0.3) { ls += Math.abs(v.x); lc++; } if (v.y < 0.08) toeZ = Math.max(toeZ, v.z); }
  return { H, armY, handX: maxX, shX: torso * 0.95, hipY: crotch + 0.06, neckY, legX: ls / lc, ankleY: Math.min(0.2, crotch * 0.45), toeZ: toeZ * 0.7, torso, crotch, prof: Array.from(wid).map(x => +x.toFixed(2)) };
}
