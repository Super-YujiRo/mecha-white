import * as THREE from 'three';

// 手応えの演出：画面の揺れ・一瞬の停止・ズーム・火花と土ぼこり
// 揺れは「トラウマ値」の2乗で効かせる（弱い当たりはほぼ揺れず、芯を食うとドンと揺れる）
export const TIERS = {
  small: { trauma: 0.14, stop: 0, kick: 0 },
  medium: { trauma: 0.38, stop: 50, kick: 0.8 },
  large: { trauma: 0.8, stop: 115, kick: 2.6 },
};

const KEY = 'hb_shake';
function roundTex() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
function loadStrength() { try { const v = localStorage.getItem(KEY); return v == null ? 1 : +v; } catch (e) { return 1; } }

export class Feel {
  constructor(scene, tex) {
    this.trauma = 0; this.t = 0; this.kickV = 0;
    this.strength = loadStrength();
    this.parts = [];
    tex = tex || roundTex();
    for (let i = 0; i < 72; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      s.visible = false; s.renderOrder = 21;
      s.userData = { v: new THREE.Vector3(), life: 0, max: 1, size: 1, grow: 0, g: 0, drag: 0, a: 1 };
      scene.add(s); this.parts.push(s);
    }
    this.next = 0;
  }
  toggle() {
    this.strength = this.strength > 0 ? 0 : 1;
    try { localStorage.setItem(KEY, String(this.strength)); } catch (e) {}
    if (!this.strength) this.trauma = 0;
    return this.strength > 0;
  }
  addTrauma(a) { if (this.strength) this.trauma = Math.min(1, this.trauma + a); }
  kick(deg) { if (this.strength) this.kickV = Math.max(this.kickV, deg); }
  // 1か所からまとめて出す
  emit(pos, n, o) {
    for (let i = 0; i < n; i++) {
      const s = this.parts[this.next]; this.next = (this.next + 1) % this.parts.length;
      const u = s.userData;
      s.position.set(pos.x, pos.y, pos.z);
      const d = new THREE.Vector3().randomDirection();
      if (o.up) d.y = Math.abs(d.y) * o.up;
      if (o.dir) d.add(o.dir).normalize();
      u.v.copy(d).multiplyScalar(o.speed * (0.45 + Math.random() * 0.55));
      u.life = 0; u.max = o.life * (0.7 + Math.random() * 0.5);
      u.size = o.size * (0.7 + Math.random() * 0.6); u.grow = o.grow || 0;
      u.g = o.g || 0; u.drag = o.drag || 0; u.a = o.alpha || 1;
      s.material.color.set(o.color);
      s.material.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending;
      s.material.depthTest = !o.add;
      s.scale.setScalar(u.size);
      s.visible = true;
    }
  }
  sparks(pos, n, power = 1) {
    this.emit(pos, n, { speed: 3 + 5 * power, life: 0.28, size: 0.07, g: 4, drag: 3, color: 0xfff1b8, add: true });
  }
  dust(pos, n, size = 0.6) {
    this.emit({ x: pos.x, y: 0.15, z: pos.z }, n, { speed: 1.6, up: 0.4, life: 0.75, size, grow: 1.6, drag: 3.5, color: 0xcfb08a, alpha: 0.6 });
  }
  // dt は実時間（ヒットストップ中も揺れは収まっていく）
  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.25);
    this.kickV = Math.max(0, this.kickV - dt * 9);
    this.t += dt;
    for (const s of this.parts) {
      if (!s.visible) continue;
      const u = s.userData;
      u.life += dt;
      if (u.life >= u.max) { s.visible = false; continue; }
      u.v.y -= u.g * dt;
      u.v.multiplyScalar(Math.max(0, 1 - u.drag * dt));
      s.position.addScaledVector(u.v, dt);
      const k = u.life / u.max;
      s.scale.setScalar(u.size * (1 + u.grow * k));
      s.material.opacity = u.a * (1 - k) * (1 - k);
    }
  }
  // lookAt の後に呼ぶ：向きを少しだけ揺らす（毎フレームのランダムではなく、なめらかな揺れ）
  apply(camera) {
    const s = this.trauma * this.trauma * this.strength;
    if (s <= 0) return;
    const t = this.t * 30;
    camera.rotateY(0.022 * s * Math.sin(t * 1.7));
    camera.rotateX(0.016 * s * Math.sin(t * 2.3 + 1));
    camera.rotateZ(0.03 * s * Math.sin(t * 1.1 + 2));
  }
}
