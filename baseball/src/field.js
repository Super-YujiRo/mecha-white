// 球場
import * as THREE from 'three';
import { BASES, fenceDist, FENCE_H, RUBBER_Z, ZONE } from './baseball.js';

const SIZE = 280;          // 地面の一辺（m）
const PX = 4096;           // テクスチャの解像度

export function buildField(scene, renderer) {
  const g = new THREE.Group();
  scene.add(g);

  // ---- 空と光 ----
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xbfe3ff, 160, 420);
  const hemi = new THREE.HemisphereLight(0xd8f0ff, 0x5f8f3a, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.1);
  sun.position.set(-30, 60, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 200;
  sun.shadow.bias = -0.0004;
  sun.target.position.set(0, 0, -30);
  scene.add(sun, sun.target);
  g.userData.sun = sun;

  // ---- 地面（上から描いた1枚の絵） ----
  const tex = new THREE.CanvasTexture(drawFieldMap());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshLambertMaterial({ map: tex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -SIZE / 2 + 30);
  ground.receiveShadow = true;
  g.add(ground);

  // ---- ベース・プレート・マウンド ----
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let k = 1; k <= 3; k++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.38), white);
    b.position.set(BASES[k].x, 0.04, BASES[k].z);
    b.rotation.y = Math.PI / 4;
    b.castShadow = b.receiveShadow = true;
    g.add(b);
  }
  const plateShape = new THREE.Shape();
  plateShape.moveTo(-0.216, 0); plateShape.lineTo(0.216, 0); plateShape.lineTo(0.216, 0.216); plateShape.lineTo(0, 0.43); plateShape.lineTo(-0.216, 0.216); plateShape.closePath();
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(plateShape, { depth: 0.02, bevelEnabled: false }), white);
  plate.rotation.x = Math.PI / 2; plate.position.set(0, 0.022, -0.0);
  plate.receiveShadow = true;
  g.add(plate);
  const dirt = new THREE.MeshLambertMaterial({ color: 0xc98e57 });
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.8, 0.25, 40), dirt);
  mound.position.set(0, 0.12, RUBBER_Z + 0.5);
  mound.receiveShadow = true;
  g.add(mound);
  const rubber = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.03, 0.15), white);
  rubber.position.set(0, 0.26, RUBBER_Z);
  g.add(rubber);

  // ---- 外野フェンス ----
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x1f5e3b });
  const padMat = new THREE.MeshLambertMaterial({ color: 0xffc83d });
  const segs = 90;
  for (let i = 0; i < segs; i++) {
    const a0 = -Math.PI / 4 + (i / segs) * Math.PI / 2;
    const a1 = -Math.PI / 4 + ((i + 1) / segs) * Math.PI / 2;
    const p0 = { x: Math.sin(a0) * fenceDist(a0), z: -Math.cos(a0) * fenceDist(a0) };
    const p1 = { x: Math.sin(a1) * fenceDist(a1), z: -Math.cos(a1) * fenceDist(a1) };
    const len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    const w = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, FENCE_H, 0.6), wallMat);
    w.position.set((p0.x + p1.x) / 2, FENCE_H / 2, (p0.z + p1.z) / 2);
    w.rotation.y = -Math.atan2(p1.z - p0.z, p1.x - p0.x);
    w.receiveShadow = true;
    g.add(w);
    const top = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 0.18, 0.66), padMat);
    top.position.set(w.position.x, FENCE_H + 0.09, w.position.z);
    top.rotation.y = w.rotation.y;
    g.add(top);
  }
  // ポール
  for (const s of [-1, 1]) {
    const a = s * Math.PI / 4;
    const d = fenceDist(a);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 22, 10), padMat);
    pole.position.set(Math.sin(a) * d, 11, -Math.cos(a) * d);
    g.add(pole);
  }

  // ---- 観客席（すり鉢状のスタンド＋観客） ----
  buildStands(g);

  return g;
}

function buildStands(g) {
  const steps = [];   // {x,y,z,ry,w,d}
  const crowd = [];
  const addStep = (x, y, z, ry, w, d) => steps.push({ x, y, z, ry, w, d });
  // 外野スタンド
  const a0 = -Math.PI / 4 - 0.02, a1 = Math.PI / 4 + 0.02;
  const segs = Math.ceil((a1 - a0) / 0.02);
  for (let t = 0; t < 14; t++) {
    for (let i = 0; i < segs; i++) {
      const a = a0 + (i + 0.5) / segs * (a1 - a0);
      const d = fenceDist(Math.max(-Math.PI / 4, Math.min(Math.PI / 4, a))) + 3 + t * 1.6;
      const y = FENCE_H + 0.5 + t * 0.95;
      addStep(Math.sin(a) * d, y - 0.47, -Math.cos(a) * d, -a, d * (a1 - a0) / segs + 0.1, 1.6);
      crowd.push({ x: Math.sin(a) * d, y: y + 0.38, z: -Math.cos(a) * d, a: -a });
    }
  }
  // 一塁側・三塁側（ファウルラインと平行）
  for (const side of [-1, 1]) {
    const lx = side * Math.SQRT1_2, lz = -Math.SQRT1_2;
    const nx = side * Math.SQRT1_2, nz = Math.SQRT1_2;
    const ry = Math.atan2(nz, nx) * 0 + (side > 0 ? Math.PI / 4 : -Math.PI / 4);
    for (let t = 0; t < 12; t++) {
      for (let i = 0; i < 46; i++) {
        const along = -6 + i * 2.1;
        const off = 17 + t * 1.6;
        const x = lx * along + nx * off, z = lz * along + nz * off;
        if (Math.hypot(x, z) > fenceDist(side * Math.PI / 4) + 6) continue;
        const y = 1.2 + t * 0.95;
        addStep(x, y - 0.47, z, ry, 2.15, 1.6);
        for (let k = 0; k < 3; k++) crowd.push({ x: x + lx * (k - 1) * 0.65, y: y + 0.38, z: z + lz * (k - 1) * 0.65, a: ry + Math.PI });
      }
    }
  }
  // バックネット裏
  for (let t = 0; t < 10; t++) {
    for (let i = 0; i < 30; i++) {
      const a = Math.PI + (-0.85 + i / 29 * 1.7);
      const d = 16 + t * 1.6;
      const x = Math.sin(a) * d, z = -Math.cos(a) * d;
      const y = 1.4 + t * 0.95;
      addStep(x, y - 0.47, z, -a, d * 0.06 + 0.1, 1.6);
      crowd.push({ x, y: y + 0.38, z, a: -a });
    }
  }
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const stepMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.95, 1), new THREE.MeshLambertMaterial({ color: 0x3d5a80 }), steps.length);
  steps.forEach((s, i) => { q.setFromAxisAngle(up, s.ry); m.compose(new THREE.Vector3(s.x, s.y, s.z), q, new THREE.Vector3(s.w, 1, s.d)); stepMesh.setMatrixAt(i, m); });
  stepMesh.instanceMatrix.needsUpdate = true;
  stepMesh.receiveShadow = true;
  g.add(stepMesh);
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.75, 0.45), new THREE.MeshLambertMaterial({ color: 0xffffff }), crowd.length);
  const col = new THREE.Color();
  const palette = [0xffd166, 0xef476f, 0x118ab2, 0x06d6a0, 0xffffff, 0xff9f1c, 0x1d6fd8, 0xf4a261, 0x8ecae6, 0xe63946];
  crowd.forEach((c, i) => {
    q.setFromAxisAngle(up, c.a);
    m.compose(new THREE.Vector3(c.x, c.y, c.z), q, new THREE.Vector3(1, 0.9 + ((i * 37) % 7) / 20, 1));
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, col.setHex(palette[((i * 2654435761) >>> 0) % palette.length]));
  });
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
  g.userData.crowd = inst;
  g.userData.crowdBase = crowd;
}

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#3f8de0'); gr.addColorStop(0.55, '#8cc8ff'); gr.addColorStop(1, '#e6f4ff');
  x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 上から見た球場マップ（芝の刈り目・内野の土・ライン）
function drawFieldMap() {
  const c = document.createElement('canvas');
  c.width = c.height = PX;
  const x = c.getContext('2d');
  const k = PX / SIZE;
  // 世界座標 → キャンバス座標（地面中心は z = -SIZE/2+30）
  const cx = (wx) => (wx + SIZE / 2) * k;
  const cz = (wz) => (wz - (-SIZE / 2 + 30) + SIZE / 2) * k;
  const P = (wx, wz) => [cx(wx), cz(wz)];

  // ファウルゾーンの芝
  x.fillStyle = '#4f9a3c'; x.fillRect(0, 0, PX, PX);
  // フェア地域：刈り目のある芝
  x.save();
  x.beginPath();
  x.moveTo(...P(0, 0));
  for (let i = 0; i <= 90; i++) {
    const a = -Math.PI / 4 + i / 90 * Math.PI / 2;
    const d = fenceDist(a) + 1;
    x.lineTo(...P(Math.sin(a) * d, -Math.cos(a) * d));
  }
  x.closePath();
  x.clip();
  for (let i = -30; i < 30; i++) {
    x.fillStyle = i % 2 ? '#5fb547' : '#56a840';
    x.save();
    x.translate(...P(0, 0));
    x.rotate(Math.PI / 4);
    x.fillRect(i * 8 * k, -200 * k, 8 * k, 400 * k);
    x.restore();
  }
  x.restore();
  // 外野フェンス前の土（ウォーニングトラック）
  x.lineWidth = 4.5 * k; x.strokeStyle = '#b98252';
  x.beginPath();
  for (let i = 0; i <= 90; i++) {
    const a = -Math.PI / 4 + i / 90 * Math.PI / 2;
    const d = fenceDist(a) - 2.2;
    const [px, pz] = P(Math.sin(a) * d, -Math.cos(a) * d);
    if (i === 0) x.moveTo(px, pz); else x.lineTo(px, pz);
  }
  x.stroke();

  const dirt = '#c98e57';
  // 内野の土（扇形）
  x.fillStyle = dirt;
  x.beginPath();
  x.moveTo(...P(0, 0));
  const R = 29;
  for (let i = 0; i <= 40; i++) {
    const a = -Math.PI / 4 - 0.05 + i / 40 * (Math.PI / 2 + 0.1);
    x.lineTo(...P(Math.sin(a) * R * 1.0 + 0, -Math.cos(a) * R - 9.5));
  }
  x.closePath();
  x.fill();
  // 内野の芝（ダイヤモンドの内側）
  x.fillStyle = '#5bb045';
  x.beginPath();
  const ins = 1.4;
  x.moveTo(...P(0, -ins * 1.6));
  x.lineTo(...P(19.4 - ins * 1.8, -19.4));
  x.lineTo(...P(0, -38.8 + ins * 1.8));
  x.lineTo(...P(-19.4 + ins * 1.8, -19.4));
  x.closePath();
  x.fill();
  // ホーム周りの土
  x.fillStyle = dirt;
  x.beginPath(); x.arc(...P(0, 0), 4 * k, 0, Math.PI * 2); x.fill();
  // マウンド
  x.beginPath(); x.arc(...P(0, RUBBER_Z + 0.5), 2.9 * k, 0, Math.PI * 2); x.fill();
  // ベース周りの土
  for (const b of [BASES[1], BASES[2], BASES[3]]) { x.beginPath(); x.arc(...P(b.x, b.z), 2.2 * k, 0, Math.PI * 2); x.fill(); }

  // ライン
  x.strokeStyle = '#ffffff'; x.lineWidth = 0.1 * k; x.lineCap = 'round';
  for (const s of [-1, 1]) {
    const d = fenceDist(s * Math.PI / 4);
    x.beginPath(); x.moveTo(...P(0, 0)); x.lineTo(...P(s * d * Math.SQRT1_2, -d * Math.SQRT1_2)); x.stroke();
  }
  // バッターボックス
  x.lineWidth = 0.08 * k;
  for (const s of [-1, 1]) {
    x.strokeRect(cx(s * 0.95 - 0.6), cz(-0.9), 1.2 * k, 1.8 * k);
  }
  // キャッチャーボックス
  x.beginPath(); x.moveTo(cx(-0.55), cz(0.9)); x.lineTo(cx(-0.55), cz(3)); x.lineTo(cx(0.55), cz(3)); x.lineTo(cx(0.55), cz(0.9)); x.stroke();
  // ネクストバッターズサークル
  for (const s of [-1, 1]) { x.beginPath(); x.arc(cx(s * 9), cz(7), 0.8 * k, 0, Math.PI * 2); x.stroke(); }
  return c;
}

// ---- ストライクゾーン（9分割の枠） ----
export function buildZone() {
  const g = new THREE.Group();
  const w = ZONE.x1 - ZONE.x0, h = ZONE.y1 - ZONE.y0;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthTest: false });
  const pts = [];
  for (let i = 0; i <= 3; i++) {
    const xx = ZONE.x0 + w * i / 3, yy = ZONE.y0 + h * i / 3;
    pts.push(new THREE.Vector3(xx, ZONE.y0, 0), new THREE.Vector3(xx, ZONE.y1, 0));
    pts.push(new THREE.Vector3(ZONE.x0, yy, 0), new THREE.Vector3(ZONE.x1, yy, 0));
  }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  lines.renderOrder = 10;
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthTest: false }));
  fill.position.set((ZONE.x0 + ZONE.x1) / 2, (ZONE.y0 + ZONE.y1) / 2, 0);
  fill.renderOrder = 9;
  g.add(fill, lines);
  return g;
}

// ミートカーソル（楕円＋芯）
export function buildCursor() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffd43d, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }));
  const fill = new THREE.Mesh(new THREE.CircleGeometry(0.86, 48), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.22, depthTest: false, side: THREE.DoubleSide }));
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide }));
  core.position.y = -0.3;
  ring.renderOrder = fill.renderOrder = core.renderOrder = 12;
  g.add(fill, ring, core);
  g.userData = { ring, fill, core };
  return g;
}

// 投手のねらいマーカー
export function buildAim() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.06, 32), new THREE.MeshBasicMaterial({ color: 0x5ad1ff, depthTest: false, transparent: true }));
  const cross = new THREE.Mesh(new THREE.CircleGeometry(0.015, 16), new THREE.MeshBasicMaterial({ color: 0x5ad1ff, depthTest: false, transparent: true }));
  ring.renderOrder = cross.renderOrder = 13;
  g.add(ring, cross);
  return g;
}

// バット（簡易）
export function buildBat() {
  const pts = [];
  const prof = [[0, 0.016], [0.02, 0.018], [0.03, 0.013], [0.28, 0.014], [0.5, 0.022], [0.72, 0.032], [0.84, 0.033], [0.86, 0.025], [0.865, 0]];
  for (const [y, r] of prof) pts.push(new THREE.Vector2(r, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), new THREE.MeshToonMaterial({ color: 0xd9a066 }));
  m.castShadow = true;
  return m;
}
