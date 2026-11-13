// キャラクター（KayKit マネキン CC0 ＋ KayKit アニメーション CC0）
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { buildCustomClips } from './anims.js';
import { fitModel } from './skinfit.js';

const loader = new GLTFLoader();
let base = null;
let baseHeight = 1;
export const PLAYER_H = 1.75;
const clips = {};

const ANIM_FILES = ['Rig_Medium_General', 'Rig_Medium_MovementBasic', 'Rig_Medium_CombatMelee', 'Rig_Medium_Simulation', 'Rig_Medium_MovementAdvanced'];

export async function loadCharacters(onProgress) {
  const all = ['Mannequin_Medium', ...ANIM_FILES];
  let n = 0;
  const results = await Promise.all(all.map(f => loader.loadAsync('./assets/' + f + '.glb').then(g => { onProgress && onProgress(++n / all.length); return g; })));
  base = results[0].scene;
  // 選手モデル（Tripo）を骨に取り付ける
  let fit = null;
  try {
    const pm = await loader.loadAsync('./assets/player.glb');
    fit = fitModel(base, pm.scene);
    BODY.map = fit.mesh.material.map; BODY.mat = fit.mesh.material;
    try {
      const hm = await loader.loadAsync('./assets/player_helmet.glb');
      const h = fitModel(base, hm.scene, { ref: fit, name: 'Player_Helmet' });
      BODY.hmap = h.mesh.material.map; h.mesh.visible = false;
      const hm2 = fitModel(base, hm.scene, { ref: fit, name: 'Player_HelmetM', mirror: true });
      hm2.mesh.visible = false;
    } catch (e) { }
  } catch (e) { console.warn('player model', e); }
  for (let i = 1; i < results.length; i++) for (const c of results[i].animations) {
    c.tracks = c.tracks.filter(t => !t.name.startsWith('handslot'));
    if (fit) {
      // 骨の長さは体に合わせたので、位置のアニメーションは腰だけ使う（腰は体の比率で縮める）
      c.tracks = c.tracks.filter(t => !t.name.endsWith('.scale') && (!t.name.endsWith('.position') || t.name === 'hips.position'));
      for (const t of c.tracks) if (t.name === 'hips.position') { t.values = t.values.slice(); for (let k = 0; k < t.values.length; k++) t.values[k] *= fit.hipRatio; }
    }
    clips[c.name] = c;
  }
  base.updateMatrixWorld(true);
  Object.assign(clips, buildCustomClips(base));
  // 頭の大きさ（帽子・ヘルメットを合わせるため）
  const hb = base.getObjectByName('head'), hm = base.getObjectByName('Mannequin_Medium_Head') || headPart(base);
  if (hb && hm) {
    const hp = new THREE.Vector3(); hb.getWorldPosition(hp);
    // スキンの変形後の頂点から実際の頭の大きさを測る
    const bb = new THREE.Box3(), v = new THREE.Vector3(), pos = hm.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) { hm.getVertexPosition(i, v); v.applyMatrix4(hm.matrixWorld); bb.expandByPoint(v); }
    HEAD.w = bb.max.x - bb.min.x; HEAD.d = bb.max.z - bb.min.z; HEAD.top = bb.max.y - hp.y; HEAD.cz = (bb.max.z + bb.min.z) / 2 - hp.z;
    HEAD.bb = [bb.min.toArray(), bb.max.toArray(), hp.toArray()];
    HEAD.mat = hm.material;
    HEAD.map = faceOnly(hm.material.map);
  }
  window.__HEAD = HEAD;
  squashHair(base);
  const box = new THREE.Box3().setFromObject(base);
  baseHeight = box.max.y - box.min.y;
  base.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
}

const HEAD = { w: 0.5, d: 0.45, top: 0.45, cz: 0 };
const BODY = { map: null, mat: null };
// 帽子をかぶる体は、帽子からはみ出す髪を帽子の内側に収める
function squashHair(base) {
  const m = base.getObjectByName('Player_Body'), hb = base.getObjectByName('head');
  if (!m || !hb || !HEAD.w) return;
  const hp = hb.getWorldPosition(new THREE.Vector3());
  const r = Math.max(HEAD.w, HEAD.d) * 0.53;
  const a = HEAD.w / 2 * 0.98, b = r * 0.85, c = HEAD.d / 2 * 1.08;
  const cy = hp.y + HEAD.top - r * 0.85, cz = hp.z + HEAD.cz;
  const rim = cy + b * Math.cos(Math.PI * 0.44);
  const P = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
  const hi = m.skeleton.bones.indexOf(hb);
  for (let i = 0; i < P.count; i++) {
    if (si.getX(i) !== hi || sw.getX(i) < 0.5) continue;
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (y < rim - 0.1) continue;
    const dx = x / a, dy = Math.max(0, y - cy) / b, dz = (z - cz) / c;
    const e = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // 帽子の縁より上はしっかり、縁の少し下はゆるく内側へ
    const lim = y >= rim ? 0.93 : 0.93 + (rim - y) / 0.1 * 0.12;
    if (e <= lim) continue;
    const k = lim / e;
    P.setXYZ(i, x * k, y >= cy ? cy + (y - cy) * k : y, cz + (z - cz) * k);
  }
  P.needsUpdate = true;
  m.geometry.computeVertexNormals();
}
// 頭の大きさを測るために、取り付けたモデルの頭の部分だけを見る
function headPart(base) {
  const m = base.getObjectByName('Player_Body'), hb = base.getObjectByName('head');
  if (!m || !hb) return null;
  const hi = m.skeleton.bones.indexOf(hb), si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
  return { geometry: { attributes: { position: { count: m.geometry.attributes.position.count } } }, matrixWorld: m.matrixWorld, material: m.material,
    getVertexPosition(i, v) { m.getVertexPosition(i, v); if (!(si.getX(i) === hi && sw.getX(i) > 0.9)) v.set(0, hb.getWorldPosition(new THREE.Vector3()).y, 0).applyMatrix4(m.matrixWorld.clone().invert()); return v; } };
}
// 青い部分（帽子・ライン・ベルト・ソックス・靴）をチームの色に塗り替えたテクスチャ
const recolorCache = new Map();
function recolored(tex, color, tag = '') {
  if (!tex || !tex.image) return tex;
  const key = tag + color;
  if (recolorCache.has(key)) return recolorCache.get(key);
  let out = tex;
  try {
    const img = tex.image, c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    const tc = new THREE.Color(color);
    const tr = tc.r * 255, tg = tc.g * 255, tb = tc.b * 255;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dd = mx - mn;
      if (dd < 30 || mx === 0) continue;
      let h = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6; if (h < 0) h += 1;
      const s = dd / mx;
      if (h < 0.55 || h > 0.75 || s < 0.25) continue;
      // 青の明るさ（陰影）を保って色を置き換える
      const k = Math.min(1.25, mx / 190);
      const w = Math.min(1, (s - 0.25) / 0.2);
      a[i] = r + (Math.min(255, tr * k) - r) * w; a[i + 1] = gg + (Math.min(255, tg * k) - gg) * w; a[i + 2] = b + (Math.min(255, tb * k) - b) * w;
    }
    g.putImageData(d, 0, 0);
    out = new THREE.CanvasTexture(c);
    out.flipY = tex.flipY; out.colorSpace = tex.colorSpace; out.wrapS = tex.wrapS; out.wrapT = tex.wrapT;
  } catch (e) { }
  recolorCache.set(key, out);
  return out;
}
// 頭のテクスチャから色つきの模様を消して、顔の線（暗い部分）だけ残す
function faceOnly(tex) {
  if (!tex || !tex.image) return tex;
  try {
    const img = tex.image, c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx < 70) continue; // 目・口の線
      const v = Math.min(255, 200 + (r + gg + b) / 3 * 0.2);
      a[i] = a[i + 1] = a[i + 2] = mx - mn > 40 ? 235 : v;
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.flipY = tex.flipY; t.colorSpace = tex.colorSpace; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
    return t;
  } catch (e) { return tex; }
}
const matCache = new Map();
function mat(color) {
  const key = color;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: toonRamp() }));
  return matCache.get(key);
}
let ramp = null;
function toonRamp() {
  if (ramp) return ramp;
  const d = new Uint8Array([90, 170, 235, 255]);
  ramp = new THREE.DataTexture(d, 4, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

// look: { shirt, pants, skin, sleeve }
export class Player3D {
  constructor(look) {
    this.root = SkeletonUtils.clone(base);
    this.holder = new THREE.Group();
    this.holder.add(this.root);
    this.root.scale.setScalar(PLAYER_H / baseHeight);
    this.scale = PLAYER_H / baseHeight;
    this.setLook(look);
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = {};
    this.cur = null;
    this.handR = this.root.getObjectByName('handr') || this.root.getObjectByName('wristr');
    this.handL = this.root.getObjectByName('handl') || this.root.getObjectByName('wristl');
    this.gear = {};
    this.buildGear();
    this.setGear('cap');
  }

  // 帽子・ヘルメット・グラブ
  buildGear() {
    const head = this.root.getObjectByName('head');
    if (!head) return;
    const r = Math.max(HEAD.w, HEAD.d) * 0.53;
    const mk = (helmet) => {
      const g = new THREE.Group();
      const crown = new THREE.Mesh(new THREE.SphereGeometry(r * (helmet ? 1.06 : 1), 28, 14, 0, Math.PI * 2, 0, Math.PI * (helmet ? 0.5 : 0.44)), mat('#ffffff'));
      crown.scale.set(HEAD.w / (2 * r) * (helmet ? 1.0 : 0.98), helmet ? 0.95 : 0.85, HEAD.d / (2 * r) * (helmet ? 1.1 : 1.08));
      crown.position.set(0, HEAD.top - r * (helmet ? 0.95 : 0.85), HEAD.cz);
      g.add(crown);
      const brimG = new THREE.CircleGeometry(r * (helmet ? 0.55 : 0.7), 24, 0, Math.PI);
      const brim = new THREE.Mesh(brimG, mat('#ffffff'));
      brim.material = brim.material.clone(); brim.material.side = THREE.DoubleSide;
      brim.rotation.x = -Math.PI / 2 + 0.22; brim.rotation.z = Math.PI;
      brim.scale.set(HEAD.w / (2 * r) * 0.9, 1, 0.9);
      brim.position.set(0, crown.position.y + 0.005, HEAD.cz + HEAD.d * 0.42);
      g.add(brim);
      if (helmet) {
        const flap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.24, 12, 8), mat('#ffffff'));
        flap.scale.set(0.35, 1, 1);
        flap.position.set(HEAD.w * 0.55, crown.position.y - r * 0.4, HEAD.cz);
        g.add(flap);
        g.userData.flap = flap;
      }
      for (const m of g.children) m.castShadow = true;
      g.userData.crown = crown; g.userData.brim = brim;
      g.visible = false;
      head.add(g);
      return g;
    };
    this.gear.cap = mk(false);
    this.gear.helmet = mk(true);
    // グラブ（利き手と反対の手）
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat('#8a5a2b'));
    glove.scale.set(1.1, 1.3, 0.7);
    glove.castShadow = true;
    glove.visible = false;
    this.gloveMesh = glove;
    this.applyGearColor();
  }
  setGear(kind, { glove = false, gloveLeft = true, flapLeft = true } = {}) {
    const hb = this.root.getObjectByName('Player_Helmet'), hm = this.root.getObjectByName('Player_HelmetM'), cb = this.root.getObjectByName('Player_Body');
    const useH = !!(hb && kind === 'helmet');
    if (hb && cb) { hb.visible = useH && (flapLeft || !hm); cb.visible = !useH; if (hm) hm.visible = useH && !flapLeft; }
    if (this.gear.cap) this.gear.cap.visible = kind === 'cap';
    if (this.gear.helmet) { this.gear.helmet.visible = kind === 'helmet' && !useH; const f = this.gear.helmet.userData.flap; if (f) f.position.x = Math.abs(f.position.x) * (flapLeft ? 1 : -1); }
    if (this.gloveMesh) {
      const hand = gloveLeft ? this.handL : this.handR;
      if (glove && hand && this.gloveMesh.parent !== hand) hand.add(this.gloveMesh);
      this.gloveMesh.visible = !!glove;
      // 手のひらの先あたりに
      this.gloveMesh.position.set(0, 0.06, 0.02);
    }
  }
  applyGearColor() {
    const L = this.look || {};
    const cap = L.cap || L.sleeve || L.shirt || '#223366', brim = L.brim || L.shirt || cap;
    for (const k of ['cap', 'helmet']) {
      const g = this.gear[k]; if (!g) continue;
      g.userData.crown.material = mat(cap);
      const bm = mat(brim).clone(); bm.side = THREE.DoubleSide; g.userData.brim.material = bm;
      if (g.userData.flap) g.userData.flap.material = mat(cap);
    }
  }

  setLook(look) {
    this.look = look;
    this.root.traverse(o => {
      if (o.isMesh && o.name === 'Player_Body' && BODY.map) {
        const key = 'body' + look.shirt;
        if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ map: recolored(BODY.map, look.shirt), gradientMap: toonRamp() }));
        o.material = matCache.get(key);
      }
      if (o.isMesh && (o.name === 'Player_Helmet' || o.name === 'Player_HelmetM') && BODY.hmap) {
        const key = 'helm' + look.shirt;
        if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ map: recolored(BODY.hmap, look.shirt, 'h'), gradientMap: toonRamp() }));
        o.material = matCache.get(key);
      }
      if (!o.isMesh || !o.name.startsWith('Mannequin')) return;
      const n = o.name;
      let c = look.shirt;
      if (n.includes('Head')) {
        // 顔の模様（テクスチャ）は残して、肌の色をのせる
        const key = 'head' + look.skin;
        if (!matCache.has(key)) { const m = new THREE.MeshToonMaterial({ map: HEAD.map || (HEAD.mat && HEAD.mat.map), color: new THREE.Color(look.skin), gradientMap: toonRamp() }); matCache.set(key, m); }
        o.material = matCache.get(key);
        return;
      }
      else if (n.includes('Leg')) c = look.pants;
      else if (n.includes('Arm')) c = look.sleeve || look.shirt;
      o.material = mat(c);
    });
    if (this.gear) this.applyGearColor();
  }

  play(name, { loop = true, fade = 0.15, speed = 1, restart = false, clamp = true } = {}) {
    const clip = clips[name];
    if (!clip) return;
    let a = this.actions[name];
    if (!a) { a = this.actions[name] = this.mixer.clipAction(clip); }
    if (this.cur === a && !restart) { a.timeScale = speed; return; }
    a.reset();
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    a.clampWhenFinished = clamp;
    a.timeScale = speed;
    a.enabled = true;
    if (this.cur && this.cur !== a) { a.crossFadeFrom(this.cur, fade, false); }
    a.play();
    this.cur = a;
    this.curName = name;
  }

  clipLength(name) { return clips[name] ? clips[name].duration : 1; }

  update(dt) { this.mixer.update(dt); }
}

export function hasClip(n) { return !!clips[n]; }
