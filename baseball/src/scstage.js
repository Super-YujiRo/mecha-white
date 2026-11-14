// サクセスの3D舞台：学校のグラウンドで、自分の選手が練習する様子を見せる
import * as THREE from 'three';
import { Player3D } from './chars.js';
import { buildBat } from './field.js';
import { sfxHit, sfxMitt, sfxCatch, sfxCheer } from './sound.js';

const SKIN = '#f2c6a0';
export const SCHOOL_LOOK = { shirt: '#2a4d9b', sleeve: '#ffffff', pants: '#f4f1ea', skin: SKIN, cap: '#1d2f66', brim: '#1d2f66' };
const BAT_K = 1.3;

const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
const ease = (k) => k * k * (3 - 2 * k);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
    this.camFrom = null; this.camTo = this.shot('home');
    this.speed = 1;
    this.tags = [];
    this.fx = [];
    this.build();
    this.running = false;
    this.last = performance.now();
  }

  // ---------- 舞台 ----------
  build() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight(0xdfefff, 0x6b5a3a, 1.25);
    s.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(6, 12, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0005;
    s.add(sun, sun.target);
    // 空
    this.sky = document.createElement('canvas'); this.sky.width = 4; this.sky.height = 256;
    this.skyTex = new THREE.CanvasTexture(this.sky); this.skyTex.colorSpace = THREE.SRGBColorSpace;
    s.background = this.skyTex;
    s.fog = new THREE.Fog(0xcfe6ff, 40, 150);
    // 地面：芝生と土
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ map: stripes('#58a443', '#4f9a3c', 24), color: 0xffffff }));
    grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true;
    grass.material.map.repeat.set(12, 12); grass.material.map.wrapS = grass.material.map.wrapT = THREE.RepeatWrapping;
    s.add(grass);
    const dirt = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.MeshLambertMaterial({ map: noise('#c98d5a', 18) }));
    dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.01; dirt.receiveShadow = true;
    s.add(dirt);
    // ネット（後ろの防球ネット）
    const netTex = grid();
    const net = new THREE.Mesh(new THREE.PlaneGeometry(36, 9), new THREE.MeshBasicMaterial({ map: netTex, transparent: true, depthWrite: false }));
    net.position.set(0, 4.5, -16); s.add(net);
    for (let x = -18; x <= 18; x += 6) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9.4, 8), new THREE.MeshLambertMaterial({ color: 0x6c7a86 })); p.position.set(x, 4.7, -16); s.add(p); }
    // 校舎
    const bld = new THREE.Mesh(new THREE.BoxGeometry(60, 14, 10), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshLambertMaterial(i === 4 ? { map: windows() } : { color: 0xe9e2d2 })));
    bld.position.set(-6, 7, -48); s.add(bld);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(61, 0.8, 11), new THREE.MeshLambertMaterial({ color: 0x9aa4ad }));
    roof.position.set(-6, 14.3, -48); s.add(roof);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ map: clockTex() }));
    clock.position.set(-6, 11.2, -42.9); s.add(clock);
    // 木
    this.trees = [];
    const trunkM = new THREE.MeshLambertMaterial({ color: 0x7a5636 });
    this.leafM = new THREE.MeshLambertMaterial({ color: 0x3f8f3a });
    for (let i = 0; i < 16; i++) {
      const x = -44 + i * 6 + Math.sin(i * 3.1) * 2, z = -30 - Math.cos(i * 1.7) * 3;
      const g = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 8), trunkM); tr.position.y = 1.5;
      const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), this.leafM); lf.position.y = 4.3; lf.scale.set(1, 0.9, 1);
      g.add(tr, lf); g.position.set(x, 0, z); s.add(g); this.trees.push(lf);
    }
    // 打撃用の球、守備用の球
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    this.ball.castShadow = true; this.ball.visible = false; s.add(this.ball);
    this.bat = buildBat(); this.bat.scale.setScalar(BAT_K); this.bat.visible = false; s.add(this.bat);
    // 花びら・雨・紙吹雪
    this.parts = makeParticles(); s.add(this.parts.points);
    this.season('spring');
  }

  season(kind) {
    this.kind = kind;
    const C = {
      spring: ['#7cc0ff', '#d9efff', 0xcfe6ff, 0x3f8f3a, 1.9],
      clear: ['#4fa6ff', '#d4ecff', 0xcfe6ff, 0x3a8f36, 2.0],
      rain: ['#7f8c99', '#c6cdd4', 0xb8c0c8, 0x37733a, 1.0],
      summer: ['#2f8cff', '#bfe5ff', 0xd2ecff, 0x2f8a2f, 2.3],
      evening: ['#ff9a5c', '#ffd9a8', 0xffd0a0, 0x3a6f34, 1.4],
      night: ['#0c1834', '#2c3f6b', 0x1c2b4d, 0x24452a, 0.5],
    }[kind] || [];
    const g = this.sky.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, C[0]); gr.addColorStop(0.65, C[1]); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    this.skyTex.needsUpdate = true;
    this.scene.fog.color.set(C[2]);
    this.leafM.color.set(C[3]);
    this.sun.intensity = C[4];
    this.sun.color.set(kind === 'evening' ? 0xffc28a : 0xffffff);
    this.hemi.intensity = kind === 'night' ? 0.6 : 1.25;
    this.parts.mode(kind === 'spring' ? 'petal' : kind === 'rain' ? 'rain' : 'none');
  }
  confetti(on = true) { this.parts.mode(on ? 'confetti' : (this.kind === 'spring' ? 'petal' : this.kind === 'rain' ? 'rain' : 'none')); }

  // ---------- 人 ----------
  setMe(o) {
    if (!this.me) { this.me = new Player3D(SCHOOL_LOOK); this.scene.add(this.me.holder); this.me.holder.traverse(m => { if (m.isMesh) m.castShadow = true; }); }
    this.left = o.hand === 'L';
    this.pitcher = o.kind === 'P';
    this.me.setGear('cap');
    this.reset();
  }
  mate(id) {
    if (!this.mates) this.mates = {};
    if (!this.mates[id]) { const p = new Player3D(SCHOOL_LOOK); p.setGear('cap'); this.scene.add(p.holder); p.holder.visible = false; this.mates[id] = p; }
    return this.mates[id];
  }
  hideMates() { for (const k in this.mates || {}) this.mates[k].holder.visible = false; this.tags = []; this.onTags && this.onTags([]); }
  showMate(id, x, z, ry, anim = 'Idle_A', name) {
    const p = this.mate(id);
    p.holder.visible = true; p.holder.position.set(x, 0, z); p.holder.rotation.y = ry;
    p.setGear('cap', { glove: false });
    p.play(anim, { fade: 0.2 });
    if (name) { this.tags.push({ p, name }); this.onTags && this.onTags(this.tags); }
    return p;
  }
  reset() {
    const m = this.me; if (!m) return;
    m.holder.position.set(0, 0, 0); m.holder.rotation.set(0, 0, 0); m.holder.visible = true;
    m.setGear('cap');
    m.play('Idle_A', { fade: 0.25 });
    this.bat.visible = false; this.ball.visible = false; this.batSwing = null;
    this.hideMates();
    this.anim = null;
    this.goShot('home');
  }

  // ---------- カメラ ----------
  shot(name) {
    const S = {
      home: [[1.8, 1.6, 7.2], [0, 1.0, 0]],
      talk: [[1.4, 1.6, 7.0], [0, 1.05, 0]],
      bat: [[4.6, 1.4, 3.6], [0, 1.0, -0.6]],
      low: [[3.6, 1.0, 4.0], [0, 0.4, -0.8]],
      run: [[0, 1.2, 6.5], [0, 0.9, 0]],
      throw: [[-3.4, 1.6, 4.4], [0.5, 1.2, -3]],
      pitch: [[4.2, 1.7, 4.4], [0, 1.0, -3]],
      catch: [[-0.6, 1.4, 6.2], [0, 0.7, -1]],
      sleep: [[2.2, 2.0, 4.0], [0, 0.3, 0]],
      wide: [[0, 2.4, 10.5], [0, 1.0, -0.6]],
      atbat: [[0.6, 1.5, 5], [0, 1.0, -2]],
      mound: [[1.6, 2.7, 5.2], [0, 1.0, -12]],
      sky: [[3, 2.2, 5], [0, 6, -20]],
      done: [[1.2, 1.4, 5.6], [0, 1.0, 0]],
    }[name] || [[1.6, 1.35, 4.6], [0, 0.95, 0]];
    return { p: new THREE.Vector3(...S[0]), t: new THREE.Vector3(...S[1]) };
  }
  goShot(name, dur = 0.6) {
    const to = typeof name === 'string' ? this.shot(name) : name;
    const cur = { p: this.cam.position.clone(), t: this.lookAt ? this.lookAt.clone() : to.t.clone() };
    this.camFrom = cur; this.camTo = to; this.camK = 0; this.camDur = dur;
  }

  // ---------- ループ ----------
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = () => { if (!this.running) return; requestAnimationFrame(loop); this.tick(); };
    loop();
  }
  stop() { this.running = false; }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    if (this.canvas.width !== Math.floor(w * this.r.getPixelRatio()) || this.canvas.height !== Math.floor(h * this.r.getPixelRatio())) {
      this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    }
  }
  tick() {
    const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000) * this.speed;
    this.last = now; this.t = (this.t || 0) + dt;
    this.resize();
    if (this.camTo) {
      if (this.camFrom) { this.camK = Math.min(1, this.camK + dt / this.camDur); const k = ease(this.camK); this.cam.position.lerpVectors(this.camFrom.p, this.camTo.p, k); this.lookAt = new THREE.Vector3().lerpVectors(this.camFrom.t, this.camTo.t, k); if (this.camK >= 1) this.camFrom = null; }
      else { this.cam.position.copy(this.camTo.p); this.lookAt = this.camTo.t.clone(); }
      // 少しだけゆらす（止まって見えないように）
      const sw = Math.sin(this.t * 0.5) * 0.06;
      this.cam.position.x += sw;
      this.cam.lookAt(this.lookAt);
      this.cam.position.x -= sw;
    }
    for (const f of this.fx.slice()) f(dt);
    if (this.anim) this.anim(dt);
    if (this.me) { this.me.update(dt); this.me.holder.updateMatrixWorld(true); }
    for (const k in this.mates || {}) if (this.mates[k].holder.visible) this.mates[k].update(dt);
    this.updateBat();
    this.parts.update(dt, this.cam);
    this.r.render(this.scene, this.cam);
    if (this.onTags && this.tags.length) this.onTags(this.tags.map(({ p, name }) => { _v.setFromMatrixPosition(p.holder.matrixWorld); _v.y += 2.0; _v.project(this.cam); return { name, x: (_v.x + 1) / 2, y: (1 - _v.y) / 2 }; }));
    if (this.onHead && this.me) { _v.setFromMatrixPosition(this.me.holder.matrixWorld); _v.y += 1.9; _v.project(this.cam); this.onHead((_v.x + 1) / 2, (1 - _v.y) / 2); }
  }
  headPos() {
    if (!this.me) return { x: 0.5, y: 0.3 };
    _v.setFromMatrixPosition(this.me.holder.matrixWorld); _v.y += 1.9; _v.project(this.cam);
    return { x: (_v.x + 1) / 2, y: (1 - _v.y) / 2 };
  }

  // バット：手の位置から、振りの角度で向きを決める（試合の打者と同じ考え方）
  updateBat() {
    if (!this.bat.visible || !this.me) return;
    const left = this.left;
    let th = 95, el = 50;
    const w = this.t;
    if (this.batSwing == null) { th += Math.sin(w * 2.6) * 7; el += Math.sin(w * 2.6 + 1.2) * 5; }
    else {
      const st = this.t - this.batSwing, L = 0.1;
      if (st <= L) { const e1 = (st / L) ** 2; th = 95 - 95 * e1; el = 50 - 57 * e1; }
      else if (st <= L + 0.22) { const k2 = (st - L) / 0.22; th = -170 * (1 - (1 - k2) * (1 - k2)); el = -7 + 45 * k2; }
      else { const k = Math.min(1, (st - L - 0.22) / 0.9); th = -170 + 265 * ease(k); el = 38 + 12 * ease(k); }
    }
    const t = th * Math.PI / 180, e = el * Math.PI / 180;
    const f = new THREE.Vector3(0, 0, 1), c = new THREE.Vector3(left ? 1 : -1, 0, 0);
    _d.copy(f).multiplyScalar(Math.cos(t)).addScaledVector(c, Math.sin(t)).multiplyScalar(Math.cos(e)).addScaledVector(_up, Math.sin(e)).normalize();
    _d.applyQuaternion(this.me.holder.quaternion);
    const hand = (left ? this.me.handL : this.me.handR) || this.me.root;
    hand.getWorldPosition(_v);
    this.bat.position.copy(_v).addScaledVector(_d, -0.08);
    _q.setFromUnitVectors(_up, _d);
    this.bat.quaternion.copy(_q);
  }

  // 球を飛ばす（放物線）
  flyBall(from, vel, dur, onEnd) {
    const b = this.ball; b.visible = true; b.position.copy(from);
    const v = vel.clone(); let t = 0;
    const prev = this.anim;
    const step = (dt) => {
      t += dt; v.y -= 9.8 * dt; b.position.addScaledVector(v, dt);
      if (b.position.y < 0.05) { b.position.y = 0.05; v.y = -v.y * 0.4; v.x *= 0.7; v.z *= 0.7; }
      if (t >= dur) { b.visible = false; this.fx = this.fx.filter(x => x !== step); onEnd && onEnd(); }
    };
    this.fx.push(step);
    return prev;
  }

  // ---------- 練習・試合の動き（終わると解決する） ----------
  async act(kind, o = {}) {
    const id = this.actId = (this.actId || 0) + 1;
    try { await this._act(kind, o, id); } catch (e) { if (e !== 'cancel') console.warn(e); }
  }
  async _act(kind, o, id) {
    const m = this.me; if (!m) return;
    this.reset(); this.fx = [];
    const T = async (ms) => { await wait(ms / this.speed); if (id !== this.actId) throw 'cancel'; };
    const R = this.left ? 'L' : 'R';
    const mates = o.mates || [];
    const runFx = () => {};
    switch (kind) {
      case 'bat': {
        m.holder.rotation.y = this.left ? -Math.PI / 2 : Math.PI / 2;
        m.setGear('helmet', { flapLeft: !this.left });
        m.play('Stance' + R, { fade: 0.2 }); this.bat.visible = true;
        if (mates[0]) this.showMate(mates[0].id, -2.6, -1.8, 0.5, 'Cheering', mates[0].name);
        this.goShot('bat', 0.5);
        for (let i = 0; i < 3; i++) {
          await T(i ? 650 : 900);
          m.play('Swing' + R, { loop: false, restart: true, fade: 0.05 }); this.batSwing = this.t;
          await T(100);
          sfxHit(0.55 + Math.random() * 0.4);
          m.holder.updateMatrixWorld(true);
          const hp = this.bat.position.clone().addScaledVector(_d, BAT_K * 0.6);
          this.flyBall(hp, new THREE.Vector3((this.left ? -1 : 1) * (8 + Math.random() * 4), 5 + Math.random() * 4, -14 - Math.random() * 6), 1.6);
          await T(700);
          this.batSwing = null; m.play('Stance' + R, { fade: 0.25 });
        }
        await T(400);
        break;
      }
      case 'pow': {
        m.holder.rotation.y = Math.PI / 2;
        m.play('Push_Ups', { fade: 0.3 });
        if (mates[0]) this.showMate(mates[0].id, 0.2, -1.8, Math.PI / 2, 'Sit_Ups', mates[0].name);
        this.goShot('low', 0.6);
        await T(2600);
        break;
      }
      case 'run': case 'sta': {
        m.holder.rotation.y = Math.PI / 2;
        m.play('Running_A', { speed: 1.2 });
        const mt = mates[0] ? this.showMate(mates[0].id, -9.2, -1.2, Math.PI / 2, 'Running_A', mates[0].name) : null;
        let x = -8;
        const cam = { p: new THREE.Vector3(), t: new THREE.Vector3() };
        this.anim = (dt) => {
          runFx(dt); x += dt * 5.2; m.holder.position.x = x; if (mt) mt.holder.position.x = x - 1.4 - Math.sin(this.t * 2) * 0.3;
          cam.p.set(x * 0.6 + 0.5, 1.5, 8); cam.t.set(x * 0.85, 0.9, 0); this.camTo = cam; this.camFrom = null;
        };
        await T(3000);
        break;
      }
      case 'arm': {
        m.holder.rotation.y = Math.PI;
        m.setGear('cap', { glove: true, gloveLeft: !this.left });
        if (mates[0]) this.showMate(mates[0].id, 1.6, -0.6, Math.PI, 'Waving', mates[0].name);
        this.goShot('throw', 0.5);
        for (let i = 0; i < 2; i++) {
          await T(500);
          m.play('FThrow', { loop: false, restart: true, fade: 0.08 });
          await T(330);
          const hand = (this.left ? m.handL : m.handR) || m.root; hand.getWorldPosition(_v);
          this.flyBall(_v.clone(), new THREE.Vector3(0, 6.5, -24), 1.5);
          await T(1000);
          m.play('Idle_A', { fade: 0.3 });
        }
        break;
      }
      case 'def': {
        m.setGear('cap', { glove: true, gloveLeft: !this.left });
        m.play('Ready', { fade: 0.2 });
        if (mates[0]) this.showMate(mates[0].id, -1.8, -6, 0, 'Idle_A', mates[0].name);
        this.goShot('catch', 0.5);
        for (let i = 0; i < 2; i++) {
          await T(500);
          const dir = i ? -1 : 1;
          this.flyBall(new THREE.Vector3(-1.5, 0.4, -8), new THREE.Vector3(1.5 + dir * 1.3, 1.2, 8.2), 1.0);
          await T(500);
          m.holder.rotation.y = dir * 0.9;
          m.play('Dodge_Forward', { loop: false, restart: true, fade: 0.1, speed: 1.3 });
          await T(450); sfxCatch(); this.ball.visible = false;
          await T(500);
          m.holder.rotation.y = 0; m.holder.position.set(0, 0, 0); m.play('Ready', { fade: 0.3 });
        }
        await T(300);
        break;
      }
      case 'velo': case 'ctl': case 'brk': {
        m.holder.rotation.y = Math.PI;
        m.setGear('cap', { glove: true, gloveLeft: !this.left });
        const c = this.showMate(mates[0] ? mates[0].id : '_c', 0, -11, 0, 'Crouching', mates[0] ? mates[0].name : null);
        c.setGear('cap', { glove: true });
        this.goShot('pitch', 0.5);
        for (let i = 0; i < 2; i++) {
          await T(400);
          m.play('Pitch' + R, { loop: false, restart: true, fade: 0.08 });
          await T(1000);
          const hand = (this.left ? m.handL : m.handR) || m.root; hand.getWorldPosition(_v);
          const curve = kind === 'brk' ? (i ? 1 : -1) * 3 : 0;
          const v = new THREE.Vector3(-curve * 0.3, 1.2, -1).normalize();
          const b = this.ball; b.visible = true; b.position.copy(_v);
          const from = _v.clone(), to = new THREE.Vector3(0, 0.6, -10.6); let t = 0; const D = kind === 'velo' ? 0.38 : 0.5;
          await new Promise(res => {
            const step = (dt) => { t += dt; const k = Math.min(1, t / D); b.position.lerpVectors(from, to, k); b.position.x += Math.sin(k * Math.PI) * 0 + curve * 0.25 * k * k; b.position.y += Math.sin(k * Math.PI) * 0.15; if (k >= 1) { this.fx = this.fx.filter(x => x !== step); b.visible = false; res(); } };
            this.fx.push(step);
          });
          sfxMitt(kind === 'velo' ? 1.1 : 0.85);
          void v;
          await T(500);
          m.play('Idle_A', { fade: 0.3 });
        }
        break;
      }
      case 'rest': {
        m.play('Lie_Down', { loop: false, fade: 0.3 });
        this.goShot('sleep', 0.8);
        await T(1300); m.play('Lie_Idle', { fade: 0.3 });
        await T(1500);
        break;
      }
      case 'play': {
        m.holder.rotation.y = 0.6;
        m.play('Cheering', { fade: 0.2 });
        this.showMate('mame', 1.3, -0.3, -0.7, 'Waving', '豆田');
        this.goShot('talk', 0.5);
        await T(2400);
        break;
      }
      case 'hurt': {
        m.play('Running_A');
        m.holder.rotation.y = Math.PI / 2;
        await T(500);
        m.play('Hit_B', { loop: false, restart: true, fade: 0.1 });
        await T(500);
        m.play('Sit_Floor_Down', { loop: false, fade: 0.2 });
        this.goShot('low', 0.6);
        await T(1000); m.play('Sit_Floor_Idle', { fade: 0.3 });
        await T(900);
        break;
      }
      case 'talk': {
        this.goShot('talk', 0.6);
        const xs = [1.4, -1.4];
        mates.forEach((q, i) => this.showMate(q.id, xs[i] || 2, -0.6, i ? 0.6 : -0.6, q.anim || 'Idle_A', q.name));
        m.holder.rotation.y = mates.length ? 0.4 : 0;
        m.play(o.anim || 'Idle_A', { fade: 0.25 });
        return; // 話の間はそのまま
      }
      case 'cheer': {
        m.play('Cheering', { fade: 0.2 });
        mates.forEach((q, i) => this.showMate(q.id, (i % 2 ? -1 : 1) * (1.4 + Math.floor(i / 2) * 1.2), -0.6 - Math.floor(i / 2) * 0.8, 0, 'Cheering', q.name));
        this.goShot('wide', 0.8);
        return;
      }
      case 'sad': {
        m.play('Sit_Floor_Down', { loop: false, fade: 0.3 });
        mates.forEach((q, i) => this.showMate(q.id, (i % 2 ? -1 : 1) * 1.5, -0.8, 0, 'Idle_B', q.name));
        this.goShot('talk', 0.8);
        await T(1000); m.play('Sit_Floor_Idle', { fade: 0.3 });
        return;
      }
      case 'done': {
        m.play('Cheering', { fade: 0.2 });
        this.goShot('done', 0.8);
        let a = 0;
        this.anim = (dt) => { runFx(dt); a += dt * 0.6; m.holder.rotation.y = Math.sin(a) * 0.5; };
        return;
      }
      case 'atbat': {
        // 試合の打席：投手の球がきて、振る
        m.holder.rotation.y = this.left ? -Math.PI / 2 : Math.PI / 2;
        m.holder.position.set(this.left ? 0.9 : -0.9, 0, 0);
        m.setGear('helmet', { flapLeft: !this.left });
        m.play('Stance' + R, { fade: 0.2 }); this.bat.visible = true;
        const p = this.showMate('_op', 0, -18.4, 0, 'Idle_A');
        p.setLook({ ...SCHOOL_LOOK, shirt: o.oppColor || '#c0392b', cap: o.oppColor || '#c0392b', brim: o.oppColor || '#c0392b' });
        p.setGear('cap', { glove: true });
        this.goShot({ p: new THREE.Vector3(1.9, 1.7, 4.8), t: new THREE.Vector3(-0.3, 1.0, -8) }, 0.5);
        await T(700);
        p.play('PitchR', { loop: false, restart: true, fade: 0.08 });
        await T(1000);
        const b = this.ball; b.visible = true;
        const from = new THREE.Vector3(-0.4, 1.9, -17.4), to = new THREE.Vector3(0, 0.8, 0.2);
        let t = 0; const D = 0.55, res = o.res || 'out';
        const swing = res !== 'look';
        let swung = false, hit = false;
        await new Promise(done => {
          const step = (dt) => {
            t += dt;
            if (!hit) { const k = Math.min(1.25, t / D); b.position.lerpVectors(from, to, k); b.position.y += Math.sin(Math.min(1, k) * Math.PI) * 0.25; }
            if (swing && !swung && t > D - 0.1) { swung = true; m.play('Swing' + R, { loop: false, restart: true, fade: 0.04 }); this.batSwing = this.t; }
            if (!hit && t >= D) {
              if (res === 'hr' || res === 'hit' || res === 'double' || res === 'out') {
                hit = true; sfxHit(res === 'hr' ? 1 : res === 'out' ? 0.4 : 0.7);
                const v = { hr: [8, 22, -36], double: [-10, 10, -30], hit: [6, 5, -26], out: [-2, 16, -12] }[res];
                this.fx = this.fx.filter(x => x !== step); b.visible = false;
                this.flyBall(b.position.clone(), new THREE.Vector3(...v), 2.2);
                // 打球を追う
                const cam = { p: new THREE.Vector3(3.2, 2.4, 6.5), t: new THREE.Vector3(v[0] * 0.4, res === 'hr' ? 9 : 4, -20) };
                this.goShot(cam, 0.9);
                done();
              } else if (t >= D + 0.15) { this.fx = this.fx.filter(x => x !== step); b.visible = false; sfxMitt(1); done(); }
            }
          };
          this.fx.push(step);
        });
        if (res === 'hr') sfxCheer(1);
        else if (res === 'hit' || res === 'double') sfxCheer(0.6);
        await T(1300);
        break;
      }
      case 'mound': {
        m.holder.rotation.y = Math.PI;
        m.holder.position.set(0, 0, 0);
        m.setGear('cap', { glove: true, gloveLeft: !this.left });
        const bt = this.showMate('_op', -0.9, -18.4, Math.PI / 2, 'StanceR');
        bt.setLook({ ...SCHOOL_LOOK, shirt: o.oppColor || '#c0392b', cap: o.oppColor || '#c0392b', brim: o.oppColor || '#c0392b' });
        bt.setGear('helmet');
        this.goShot('mound', 0.5);
        await T(500);
        m.play('Pitch' + R, { loop: false, restart: true, fade: 0.08 });
        await T(1000);
        const hand = (this.left ? m.handL : m.handR) || m.root; hand.getWorldPosition(_v);
        const b = this.ball; b.visible = true;
        const from = _v.clone(), to = new THREE.Vector3(0, 0.7, -18.6); let t = 0; const D = 0.5, res = o.res || 'k';
        await new Promise(done => {
          let sw = false;
          const step = (dt) => {
            t += dt; const k = Math.min(1, t / D); b.position.lerpVectors(from, to, k);
            if (!sw && t > D - 0.1) { sw = true; bt.play('SwingR', { loop: false, restart: true, fade: 0.04 }); }
            if (k >= 1) {
              this.fx = this.fx.filter(x => x !== step); b.visible = false;
              if (res === 'hit') { sfxHit(0.8); this.flyBall(to.clone(), new THREE.Vector3(5, 6, 22), 1.6); } else sfxMitt(1.1);
              done();
            }
          };
          this.fx.push(step);
        });
        if (res === 'k') m.play('Cheering', { fade: 0.2 });
        await T(1200);
        break;
      }
    }
  }
}

// ---------- テクスチャ ----------
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function stripes(a, b, n) { return cv(64, 64, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; g.fillRect(0, 0, w, h / 2); }); }
function noise(c, k) {
  return cv(256, 256, (g, w, h) => {
    g.fillStyle = c; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,240,220' : '90,50,20'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    // 白線（ホームのまわり）
    g.strokeStyle = 'rgba(255,255,255,.0)';
    void k;
  });
}
function grid() {
  return cv(512, 128, (g, w, h) => {
    g.strokeStyle = 'rgba(40,60,70,.55)'; g.lineWidth = 1;
    for (let x = 0; x <= w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
}
function windows() {
  return cv(512, 128, (g, w, h) => {
    g.fillStyle = '#e9e2d2'; g.fillRect(0, 0, w, h);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 20; i++) {
      g.fillStyle = '#9cc3dc'; g.fillRect(8 + i * 25, 14 + f * 38, 18, 22);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(8 + i * 25, 14 + f * 38, 18, 4);
    }
    g.fillStyle = '#cfc6b2'; for (let f = 0; f < 3; f++) g.fillRect(0, 40 + f * 38, w, 3);
  });
}
function clockTex() {
  return cv(128, 128, (g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.strokeStyle = '#333'; g.lineWidth = 6; g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke();
  });
}

// 花びら・雨・紙吹雪
function makeParticles() {
  const N = 260;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dot = cv(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 2, 16, 16, 15); r.addColorStop(0, '#fff'); r.addColorStop(0.6, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.ellipse(16, 16, 15, 9, 0.6, 0, 7); g.fill(); });
  const mat = new THREE.PointsMaterial({ size: 0.09, map: dot, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  let m = 'none';
  const seed = (i, top) => {
    pos[i * 3] = (Math.random() - 0.5) * 20; pos[i * 3 + 1] = top ? 6 + Math.random() * 4 : Math.random() * 8; pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    const c = new THREE.Color();
    if (m === 'petal') c.setHSL(0.95, 0.7, 0.86 + Math.random() * 0.08);
    else if (m === 'rain') c.setRGB(0.75, 0.82, 0.92);
    else c.setHSL(Math.random(), 0.85, 0.6);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    vel[i * 3] = (Math.random() - 0.3) * (m === 'rain' ? 0.2 : 0.8); vel[i * 3 + 1] = m === 'rain' ? -12 - Math.random() * 4 : -0.6 - Math.random() * 0.8; vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  };
  return {
    points,
    mode(k) {
      m = k; points.visible = k !== 'none';
      mat.size = k === 'rain' ? 0.06 : k === 'confetti' ? 0.16 : 0.13;
      for (let i = 0; i < N; i++) seed(i, false);
      geo.attributes.color.needsUpdate = true;
    },
    update(dt) {
      if (m === 'none') return;
      for (let i = 0; i < N; i++) {
        pos[i * 3] += (vel[i * 3] + (m === 'rain' ? 0 : Math.sin(performance.now() / 700 + i) * 0.4)) * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < 0) seed(i, true);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}
