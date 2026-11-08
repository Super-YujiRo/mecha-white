// キャラクター（KayKit マネキン CC0 ＋ KayKit アニメーション CC0）
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

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
  for (let i = 1; i < results.length; i++) for (const c of results[i].animations) {
    c.tracks = c.tracks.filter(t => !t.name.startsWith('handslot'));
    clips[c.name] = c;
  }
  base.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(base);
  baseHeight = box.max.y - box.min.y;
  base.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
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
  }

  setLook(look) {
    this.look = look;
    this.root.traverse(o => {
      if (!o.isMesh || !o.name.startsWith('Mannequin')) return;
      const n = o.name;
      let c = look.shirt;
      if (n.includes('Head')) c = look.skin;
      else if (n.includes('Leg')) c = look.pants;
      else if (n.includes('Arm')) c = look.sleeve || look.shirt;
      o.material = mat(c);
    });
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
