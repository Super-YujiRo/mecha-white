// 打球が飛んだ後のプレー（守備・送球・走塁）をリアルタイムで動かす
// 守備側を人が操作するときは、ボールに一番近い野手（アクティブ野手）を input で動かす
import { BASE, BASES, BALL_R, simulateBall, isFairAngle } from './baseball.js';
import { POSITIONS, POS_ORDER } from './play.js';

const INFIELD = { P: 1, C: 1, '1B': 1, '2B': 1, SS: 1, '3B': 1 };
export const runSpeed = (pl) => 6.3 + pl.speed * 0.03;
export const fieldSpeed = (pl) => 6.6 + pl.speed * 0.025;
export const throwSpeed = (pl) => 21 + pl.arm * 0.1;
export const ACT = { idle: 0, run: 1, throw: 2, catch: 3, dive: 4, cheer: 5, jog: 6, crouch: 7, hide: 8, jump: 10, slide: 11, hurt: 12 };
const BP = (k) => (k % 4 === 0 ? { x: 0, z: 0 } : BASES[k % 4]);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// 走り出しの加速にかかる時間
const ACCEL_T = 0.45;
const COVER_SPOT = { 1: { x: 19.0, z: -19.9 }, 2: { x: 0.5, z: -38.2 }, 3: { x: -19.0, z: -19.9 }, 4: { x: 0, z: 0.7 } };

export class LivePlay {
  // ctx: { fielders:{pos:player}, batter:{pl,idx}, runners:[{pl,idx}|null x3], outs }
  constructor(hit, ctx, opts = {}) {
    this.t = 0;
    this.outs0 = ctx.outs; this.outs = ctx.outs;
    this.human = !!opts.human;
    this.semi = opts.semi !== false;
    this.stealOnly = !hit;
    this.injured = [];
    const sim = hit ? simulateBall(hit.v) : { path: [{ t: 0, x: 0, y: 1, z: 1.25, air: false }], hr: null, firstBounce: null };
    this.path = sim.path; this.hrInfo = sim.hr; this.fb = sim.firstBounce;
    this.calls = [];
    this.done = false; this.res = null; this.endAt = null;
    this.ball = { mode: 'flight', x: 0, y: 0.9, z: 0.15, px: 0, py: 0.9, pz: 0.15, air: true, holder: null, thr: null, touched: false };
    this.firstTouch = null;
    this.f = {};
    for (const pos of POS_ORDER) {
      const pl = ctx.fielders[pos];
      const h = pos === 'C' ? { x: 0, z: 1.25 } : pos === 'P' ? { x: 0, z: -17.6 } : { x: POSITIONS[pos].x, z: POSITIONS[pos].z };
      this.f[pos] = { pos, pl, x: h.x, z: h.z, home: h, dir: pos === 'C' ? Math.PI : Math.atan2(-h.x, -h.z), act: pos === 'C' ? ACT.crouch : ACT.idle, spd: fieldSpeed(pl), react: (pos === 'P' ? 0.45 : INFIELD[pos] ? 0.32 : 0.22) - pl.field * 0.0012, goal: null, diveT: -9, jumpT: -9, catchT: -9, wind: null, decided: false };
    }
    this.chaser = null; this.chaserAt = -1; this.active = null;
    this.pending = null; // 人の送球予約
    // 走者（0 は打者）
    this.r = [];
    const mk = (slot, p, base) => ({ slot, pl: p.pl, idx: p.idx, orig: base, seg: base, s: slot === 0 ? 0 : 0.07, goal: base, state: slot === 0 ? 'wait' : 'lead', start: slot === 0 ? 0.32 : 0, spd: runSpeed(p.pl), out: false, scored: false, scoreT: 0, forcedTo: 0, mustReturn: false, pause: 0, x: 0, z: 0, dir: 0, gone: 0, manual: false, slideT: -9, idle: false });
    this.r.push(mk(0, ctx.batter, 0));
    ctx.runners.forEach((p, i) => { if (p) this.r.push(mk(i + 1, p, i + 1)); });
    for (const R of this.r) this.placeRunner(R);
    this.thirdOut = null;
    this.batterOutFly = false;
    this.flyCaught = false;

    // ---- ファウル／フェアの判定（打球の軌道だけで決まる部分） ----
    const path = this.path;
    const fb = this.fb;
    let fair, decideT;
    if (fb && Math.hypot(fb.x, fb.z) > 30) { fair = isFairAngle(fb.x, fb.z); decideT = fb.t; }
    else {
      const pass = path.find(s => Math.hypot(s.x, s.z) >= 28);
      if (pass) { fair = isFairAngle(pass.x, pass.z) && pass.z < 0.5; decideT = pass.t; }
      else { const l = path[path.length - 1]; fair = isFairAngle(l.x, l.z) && l.z < -0.5; decideT = l.t; }
    }
    if (fb && fb.z > 0.3) { fair = false; decideT = Math.min(decideT, fb.t); }
    this.pathFair = fair; this.decideT = decideT; this.fairKnown = false;
    const far = Math.hypot((fb || path[path.length - 1]).x, (fb || path[path.length - 1]).z);
    this.toOutfield = far > 42;
    this.phi = Math.atan2((fb || path[path.length - 1]).x, -(fb || path[path.length - 1]).z);
    this.flyBall = this.catchableFly();
    this.hr = !!this.hrInfo;
    const steal = opts.steal || [];
    if (this.stealOnly) {
      // 盗塁：キャッチャーが捕った瞬間から。打者は打席のまま
      this.fairKnown = true; this.pathFair = true; this.flyBall = false; this.toOutfield = false; this.phi = 0;
      this.r[0].idle = true;
      for (const R of this.r) {
        if (R.slot === 0) continue;
        if (steal.includes(R.orig)) { R.state = 'run'; R.goal = R.orig + 1; R.manual = true; R.s = (opts.jump != null ? opts.jump : 0.4) + (R.orig === 2 ? 0.1 : 0); R.steal = true; }
        else { R.state = 'on'; R.s = 0; R.goal = R.orig; }
        this.placeRunner(R);
      }
      this.hold(this.f.C);
      this.f.C.catchT = 0;
    } else {
      this.setupRunners();
      // エンドラン：スタートを切っていた走者
      for (const R of this.r) {
        if (R.slot === 0 || !steal.includes(R.orig) || this.hr) continue;
        const j = (opts.jump != null ? opts.jump : 0.3);
        if (this.flyBall && this.outs < 2) { R.state = 'half'; R.halfS = Math.max(R.halfS || 0.42, j); R.s = j; R.mustReturn = true; }
        else { R.state = 'run'; R.goal = Math.max(R.goal, R.orig + 1); R.s = j; }
        this.placeRunner(R);
      }
    }
    this.computeForced();
  }

  // ---------- 攻撃側の走塁指示（E：進め　Q：戻れ） ----------
  runCmd(cmd) {
    let n = 0;
    // 先の走者から順に（追い越さないように）
    const list = this.r.filter(R => !R.out && !R.scored && !R.idle).sort((a, b) => (b.seg + b.s) - (a.seg + a.s));
    for (const R of list) {
      if (this.t < R.start) continue;
      if (cmd === 'adv') {
        if (R.mustReturn && this.flyCaught) continue;
        const lim = this.aheadLimit(R);
        if (R.state === 'on' || R.state === 'half' || R.state === 'tag') {
          const k = R.seg + 1;
          if (k > 4 || (k < 4 && k >= lim)) continue;
          R.state = 'run'; R.goal = k; R.mustReturn = false;
        } else if (R.state === 'ret') {
          if (R.seg + 1 < 4 && R.seg + 1 >= lim) continue;
          R.state = 'run'; R.goal = R.seg + 1;
        } else if (R.state === 'run') {
          const k = Math.min(4, Math.max(R.goal, R.seg + 1) + 1);
          if (k < 4 && k >= lim) continue;
          R.goal = k;
        } else continue;
        R.manual = true; n++;
      } else if (cmd === 'ret') {
        if (R.slot === 0 && R.seg === 0) { if (R.goal > 1) { R.goal = 1; R.manual = true; n++; } continue; }
        if (R.state === 'run' || R.state === 'half') {
          if (R.s > 0.02) { R.state = 'ret'; R.goal = R.seg; }
          else { R.state = 'on'; R.goal = R.seg; R.s = 0; }
          R.manual = true; n++;
        } else if (R.state === 'on') { R.manual = true; }
      }
    }
    if (n) this.call(cmd === 'adv' ? '進め！' : '戻れ！', cmd === 'adv' ? '#7dffb0' : '#7dd3ff');
    this.computeForced();
  }

  // ---------- 走者 ----------
  placeRunner(R) {
    const a = BP(R.seg), b = BP(R.seg + 1);
    R.x = a.x + (b.x - a.x) * R.s; R.z = a.z + (b.z - a.z) * R.s;
  }
  setupRunners() {
    if (this.hr) {
      for (const R of this.r) { R.goal = 4; R.state = 'jog'; R.start = Math.min(0.6, this.hrInfo.t * 0.3) + (3 - R.orig) * 0.1; R.spd *= 0.85; }
      return;
    }
    const outsLt2 = this.outs < 2;
    for (const R of this.r) {
      if (R.slot === 0) { R.goal = 1; continue; }
      if (this.flyBall && outsLt2) {
        const deep = this.fb ? Math.hypot(this.fb.x, this.fb.z) : 0;
        if (R.orig === 3 && deep > 52) { R.state = 'tag'; R.goal = 3; R.s = 0; }
        else { R.state = 'half'; R.goal = R.orig + 1; R.halfS = 0.42; R.mustReturn = true; }
      } else {
        R.state = 'run'; R.goal = R.orig + 1; // 押し出しかどうかは computeForced で。非強制は下で判断
      }
    }
    // ゴロ・ライナー：押し出しでない走者は状況で
    if (!(this.flyBall && outsLt2)) {
      let chain = true;
      for (let b = 1; b <= 3; b++) {
        const R = this.r.find(x => x.orig === b);
        if (!R) { chain = false; continue; }
        const forced = chain;
        if (!forced && !this.flyBall) {
          let go = this.toOutfield;
          if (b === 2 && this.phi > 0.12) go = true;
          if (this.outs === 2) go = true;
          if (!go) { R.state = 'ret'; R.goal = b; }
        }
      }
    }
  }
  computeForced() {
    if (this.stealOnly) { for (const R of this.r) R.forcedTo = 0; return; }
    let chain = !this.flyCaught;
    const bat = this.r[0];
    bat.forcedTo = chain && !bat.out && bat.seg < 1 ? 1 : 0;
    if (bat.out) chain = false;
    for (let b = 1; b <= 3; b++) {
      const R = this.r.find(x => x.orig === b);
      if (!R) { chain = false; continue; }
      if (R.out || R.scored) { R.forcedTo = 0; chain = false; continue; }
      if (R.mustReturn && this.flyCaught) { R.forcedTo = R.seg >= R.orig && R.s <= 0.001 && R.state === 'on' ? 0 : R.orig; continue; }
      R.forcedTo = chain && R.seg < b + 1 ? b + 1 : 0;
      if (!chain) R.forcedTo = 0;
    }
  }
  runnerTimeTo(R, k) {
    const wait = Math.max(0, R.start - this.t) + R.pause;
    if (R.state === 'ret' || (R.mustReturn && this.flyCaught)) return wait + R.s * BASE / R.spd;
    const rem = (1 - R.s) * BASE + Math.max(0, k - R.seg - 1) * BASE;
    return wait + rem / R.spd + Math.max(0, k - R.seg - 1) * 0.2;
  }
  onBase(R) { return R.s <= 0.02 || R.s >= 0.98; }
  aheadLimit(R) {
    let ahead = null;
    for (const o of this.r) {
      if (o === R || o.out || o.scored) continue;
      if (o.orig > R.orig && (!ahead || o.orig < ahead.orig)) ahead = o;
    }
    if (!ahead) return 5;
    return ahead.state === 'on' ? ahead.seg : Math.max(ahead.goal, ahead.seg);
  }
  shouldAdvance(R, margin) {
    const k = R.seg + 1;
    if (k > 4) return false;
    if (k >= this.aheadLimit(R) && k < 4) return false;
    if (R.slot === 0 && k === 4) margin += 0.8;
    const bt = this.ballTimeTo(k);
    const rt = this.runnerTimeTo({ ...R, state: 'run', s: 0, start: 0, pause: 0 }, k);
    return rt + margin < bt;
  }
  ballTimeTo(k) {
    const b = this.ball, pt = BP(k);
    if (b.mode === 'held') {
      const F = b.holder;
      const rel = F.wind ? Math.max(0, F.wind.at - this.t) : 0.45;
      return rel + dist(F, pt) / throwSpeed(F.pl);
    }
    if (b.mode === 'thrown') {
      const th = b.thr;
      return Math.max(0, th.t1 - this.t) + (dist(th.to, pt) < 1 ? 0 : 0.5 + dist(th.to, pt) / 27);
    }
    // 飛んでいる・転がっている
    let best = 99;
    for (const pos of POS_ORDER) {
      const it = this.intercept(this.f[pos]);
      if (it.T - this.t < best) best = it.T - this.t + 0.55 + dist(it, pt) / 26;
    }
    return best;
  }

  // ---------- 打球の予測 ----------
  catchableFly() {
    const path = this.path;
    for (let i = 0; i < path.length; i += 3) {
      const s = path[i];
      if (!s.air) break;
      if (s.y > 2.4 || s.t < 0.3) continue;
      for (const pos of POS_ORDER) {
        if (pos === 'C') continue;
        const F = this.f[pos];
        if (F.react + Math.max(0, Math.hypot(s.x - F.x, s.z - F.z) - 0.9) / F.spd <= s.t) return true;
      }
    }
    return false;
  }
  intercept(F) {
    const b = this.ball;
    const delay = Math.max(0, F.react - this.t);
    if (b.mode === 'loose') return { T: this.t + delay + Math.max(0, dist(F, b) - 0.6) / F.spd, x: b.x, z: b.z, air: false };
    if (b.mode !== 'flight') return { T: 99, x: b.x, z: b.z };
    const path = this.path;
    const i0 = Math.max(0, Math.floor(this.t * 120));
    for (let i = i0; i < path.length; i += 3) {
      const s = path[i];
      const reachH = s.air ? 2.4 : 1.1;
      if (s.y > reachH) continue;
      const reach = s.air ? 0.8 : 0.55;
      const dd = Math.max(0, Math.hypot(s.x - F.x, s.z - F.z) - reach);
      const need = delay + dd / F.spd + (dd > 0.5 ? ACCEL_T * 0.5 : 0);
      if (need <= s.t - this.t) return { T: s.t, x: s.x, z: s.z, air: s.air };
    }
    const l = path[path.length - 1];
    const tt = Math.max(l.t, this.t + delay + Math.max(0, Math.hypot(l.x - F.x, l.z - F.z) - 0.6) / F.spd);
    return { T: tt, x: l.x, z: l.z, air: false, late: true };
  }
  eligible(pos, it) {
    if (pos === 'C') return Math.hypot(it.x, it.z) < 22 && (it.air ? it.T > 0.9 : true);
    if (pos === 'P') return Math.hypot(it.x - 0, it.z + 17.6) < 9;
    return true;
  }
  pickChaser() {
    let best = null, bestT = 1e9, cur = null;
    for (const pos of POS_ORDER) {
      const it = this.intercept(this.f[pos]);
      if (!this.eligible(pos, it)) continue;
      if (pos === this.chaser) cur = it;
      if (it.T < bestT) { bestT = it.T; best = pos; }
    }
    if (this.chaser && cur && best !== this.chaser && cur.T < bestT + (this.human ? 0.6 : 0.25)) return this.chaser;
    return best;
  }

  // ---------- 守備の分担 ----------
  covers() {
    const ch = this.ball.mode === 'held' ? this.ball.holder.pos : this.chaser;
    const c = {};
    c[1] = ch === '1B' ? (ch === 'P' ? '2B' : 'P') : '1B';
    if (ch === '2B') c[2] = 'SS';
    else if (ch === 'SS') c[2] = '2B';
    else c[2] = this.phi < 0 ? '2B' : 'SS';
    c[3] = ch === '3B' ? (c[2] === 'SS' ? 'P' : 'SS') : '3B';
    c[4] = ch === 'C' ? 'P' : 'C';
    if (c[1] === '2B' && c[2] === '2B') c[2] = 'SS';
    return c;
  }

  // ---------- 1コマ進める ----------
  // input: { move:{x,z}|null, throwTo:k|null, dive:bool }
  step(dt, input = {}) {
    if (this.done) return;
    this.t += dt;
    const t = this.t;
    if (this.hr) return this.stepHR(dt);
    const b = this.ball;
    if (input.run) this.runCmd(input.run);

    // ボール
    b.px = b.x; b.py = b.y; b.pz = b.z;
    if (b.mode === 'flight') {
      const i = Math.min(this.path.length - 1, Math.floor(t * 120));
      const a = this.path[i], c = this.path[Math.min(this.path.length - 1, i + 1)];
      const k = Math.max(0, Math.min(1, (t - a.t) * 120));
      b.x = a.x + (c.x - a.x) * k; b.y = a.y + (c.y - a.y) * k; b.z = a.z + (c.z - a.z) * k;
      b.air = a.air;
      if (i >= this.path.length - 1) { b.mode = 'loose'; b.y = BALL_R; }
      if (!this.fairKnown && t >= this.decideT && !b.touched) {
        this.fairKnown = true;
        if (!this.pathFair) return this.finishFoul();
      }
      if (this.flyBall && !b.air && !this.landed) { this.landed = true; this.onLanded(); }
    } else if (b.mode === 'thrown') {
      const th = b.thr;
      const k = Math.min(1, (t - th.t0) / (th.t1 - th.t0));
      b.x = th.from.x + (th.to.x - th.from.x) * k; b.z = th.from.z + (th.to.z - th.from.z) * k;
      b.y = th.from.y + (th.to.y - th.from.y) * k + 4 * th.h * k * (1 - k);
      if (k >= 1) this.throwArrive();
    } else if (b.mode === 'held') {
      const F = b.holder;
      b.x = F.x + Math.sin(F.dir) * 0.3; b.z = F.z + Math.cos(F.dir) * 0.3; b.y = 1.15;
      if (F.wind && t >= F.wind.at) this.release(F);
    }

    // 追う野手
    if ((b.mode === 'flight' || b.mode === 'loose') && t - this.chaserAt > 0.15) { this.chaser = this.pickChaser(); this.chaserAt = t; }
    // 操作する野手
    if (this.human) {
      if (b.mode === 'held') this.active = b.holder.pos;
      else if (b.mode === 'thrown') this.active = b.thr.recv || this.active;
      else this.active = this.chaser;
    } else this.active = this.chaser;

    const cov = this.covers();
    const coverOf = {};
    for (const k in cov) coverOf[cov[k]] = +k;

    // 野手を動かす
    for (const pos of POS_ORDER) {
      const F = this.f[pos];
      if (F.act === ACT.dive && t - F.diveT < 0.75) {
        if (t - F.diveT < 0.3) { F.x += Math.sin(F.dir) * 5.5 * dt; F.z += Math.cos(F.dir) * 5.5 * dt; }
        continue;
      }
      if (F.wind) { F.act = ACT.throw; continue; }
      let goal = null, speed = F.spd;
      const isHuman = this.human && pos === this.active;
      if (isHuman) {
        const mv = input.move;
        if (mv && (mv.x || mv.z)) { goal = { x: F.x + mv.x * 5, z: F.z + mv.z * 5 }; }
        if (input.dive && b.mode !== 'held') { this.dive(F); continue; }
        if (input.jump && b.mode !== 'held') this.jump(F);
        if (!goal && b.mode === 'thrown' && coverOf[pos]) goal = COVER_SPOT[coverOf[pos]];
        // セミオート：方向キーを押していない間はボールへ自動で向かう
        if (!goal && this.semi && (b.mode === 'flight' || b.mode === 'loose') && t >= F.react) { const it = this.intercept(F); goal = { x: it.x, z: it.z }; this.aiDive(F); }
      } else if (b.mode === 'held' && b.holder === F) {
        goal = F.goal;
      } else if (pos === this.chaser && (b.mode === 'flight' || b.mode === 'loose')) {
        if (t >= F.react) { const it = this.intercept(F); goal = { x: it.x, z: it.z }; this.aiDive(F); }
      } else if (coverOf[pos]) {
        if (t >= F.react + 0.1) goal = COVER_SPOT[coverOf[pos]];
      } else if (pos === 'C' || pos === 'P') {
        goal = null;
      } else if (!INFIELD[pos] && (b.mode === 'flight' || b.mode === 'loose') && this.toOutfield && t >= F.react) {
        // バックアップ：ボールの方へ少し
        const it = this.intercept(this.f[this.chaser] || F);
        const dx = it.x - F.home.x, dz = it.z - F.home.z, L = Math.hypot(dx, dz);
        if (L < 40) { goal = { x: it.x - dx / Math.max(1, L) * 9, z: it.z - dz / Math.max(1, L) * 9 }; speed *= 0.7; }
      }
      if (F.act === ACT.dive) F.act = ACT.idle;
      if (goal) {
        const dx = goal.x - F.x, dz = goal.z - F.z, L = Math.hypot(dx, dz);
        const stopR = isHuman ? 0.05 : 0.15;
        if (L > stopR) {
          // 動き出しは遅く、だんだん速く
          if (F.act !== ACT.run) F.runT = t;
          const acc = Math.min(1, 0.35 + (t - (F.runT || 0)) / ACCEL_T * 0.65);
          const st = Math.min(L, speed * acc * dt);
          F.x += dx / L * st; F.z += dz / L * st;
          F.dir = Math.atan2(dx, dz);
          F.act = ACT.run;
        } else this.faceBall(F);
      } else this.faceBall(F);
      if (t - F.jumpT < 0.6) F.act = ACT.jump;
      if (t - F.catchT < 0.35) F.act = ACT.catch;
      if (pos === 'C' && t < 0.25 && !isHuman && !this.stealOnly) F.act = ACT.crouch;
    }

    // 捕球
    if (b.mode === 'flight' || b.mode === 'loose') this.tryCatch();

    // 人の送球
    if (this.human && input.throwTo) this.pending = input.throwTo;
    if (this.human && this.pending && b.mode === 'held' && b.holder.pos === this.active && !b.holder.wind) {
      const k = this.pending; this.pending = null;
      this.startThrow(b.holder, k);
    }
    // AIの送球判断
    if (b.mode === 'held' && !b.holder.wind && !(this.human && b.holder.pos === this.active)) {
      const F = b.holder;
      if (!F.decided && t - F.catchT > 0.12) { F.decided = true; this.aiDecide(F); }
    }

    // 走者
    this.stepRunners(dt);
    // アウト判定（封殺・タッチ）
    if (b.mode === 'held') this.checkOuts(b.holder);

    // 終了判定
    this.checkEnd();
  }

  faceBall(F) {
    const b = this.ball;
    F.dir = Math.atan2(b.x - F.x, b.z - F.z);
    if (F.act !== ACT.crouch || this.t > 0.25) F.act = ACT.idle;
  }
  dive(F) {
    if (this.t - F.diveT < 1) return;
    const b = this.ball;
    F.dir = Math.atan2(b.x - F.x, b.z - F.z);
    F.diveT = this.t; F.act = ACT.dive;
  }
  jump(F) {
    if (this.t - F.jumpT < 0.9) return;
    F.jumpT = this.t;
  }
  aiDive(F) {
    const b = this.ball;
    // 頭の上を抜ける打球はジャンプ
    if (b.mode === 'flight' && b.air && b.y > 2.3 && b.y < 3.5 && Math.hypot(b.x - F.x, b.z - F.z) < 1.6) this.jump(F);
    if (b.mode !== 'flight' || !b.air || this.t - F.diveT < 1.2) return;
    const d = Math.hypot(b.x - F.x, b.z - F.z);
    if (d < 3.2 && d > 1.2 && b.y < 2.0 && b.y > 0.3) {
      // 間に合わないときだけ飛ぶ
      const it = this.intercept(F);
      if (it.late || it.T - this.t > 0.45) this.dive(F);
    }
  }

  tryCatch() {
    const b = this.ball, t = this.t;
    if (t < 0.12) return;
    let got = null, gd = 1e9;
    for (const pos of POS_ORDER) {
      const F = this.f[pos];
      if (F.wind) continue;
      const diving = F.act === ACT.dive && t - F.diveT < 0.45;
      if (F.act === ACT.dive && !diving) continue;
      if (pos === 'C' && b.mode === 'flight' && t < 0.7) continue;
      const jumping = t - F.jumpT > 0.08 && t - F.jumpT < 0.55;
      const reachH = b.mode === 'flight' && b.air ? (pos === 'P' ? 1.9 : 2.5) + (jumping ? 1.1 : 0) : 1.25;
      if (b.y > reachH) continue;
      const reach = (b.mode === 'flight' && b.air ? 0.7 : 0.45) + F.pl.field * 0.003 + (diving ? 1.1 : 0) + (this.human && pos === this.active ? 0.45 : 0);
      // 前のコマからの線分との距離（速いゴロのすり抜け防止）
      const ax = b.px, az = b.pz, bx = b.x, bz = b.z;
      const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
      const u = L2 > 1e-9 ? Math.max(0, Math.min(1, ((F.x - ax) * vx + (F.z - az) * vz) / L2)) : 1;
      const d = Math.hypot(ax + vx * u - F.x, az + vz * u - F.z);
      if (d <= reach && d < gd) { gd = d; got = F; }
    }
    if (!got) return;
    const wasAir = b.mode === 'flight' && b.air;
    if (!b.touched) {
      b.touched = true;
      this.firstTouch = { pos: got.pos, x: b.x, z: b.z, air: wasAir };
      if (!wasAir && !this.fairKnown) {
        this.fairKnown = true;
        const fair = isFairAngle(b.x, b.z) && b.z < 0.3;
        if (!fair) return this.finishFoul();
      }
    }
    this.hold(got);
    if (wasAir && !this.flyCaught) {
      this.flyCaught = true;
      this.batterOutFly = true;
      this.makeOut(this.r[0], 'fly');
      if (got.act === ACT.dive || t - got.jumpT < 0.6) this.call('ナイスキャッチ！', '#ffd43d');
      this.onFlyCaught();
    }
  }
  hold(F) {
    const b = this.ball;
    b.mode = 'held'; b.holder = F; b.thr = null;
    F.catchT = this.t; F.decided = false; F.goal = null;
    if (F.act !== ACT.dive) F.act = ACT.catch;
  }

  onFlyCaught() {
    for (const R of this.r) {
      if (R.slot === 0 || R.out) continue;
      if (R.state === 'tag') {
        // タッチアップ
        R.state = 'on'; R.mustReturn = false;
        const bt = this.ballTimeTo(4);
        const rt = BASE / R.spd + 0.15;
        if (this.outs < 3 && rt + 0.15 < bt) { R.state = 'run'; R.goal = 4; R.start = this.t + 0.15; }
      } else if (R.s > 0.001 || R.seg > R.orig) {
        R.state = 'ret'; R.goal = R.orig; R.mustReturn = true;
      } else R.state = 'on';
    }
    this.computeForced();
  }
  onLanded() {
    // フライが落ちた：止まっていた走者も走る
    for (const R of this.r) {
      if (R.slot === 0 || R.out) continue;
      R.mustReturn = false;
      if (R.state === 'half' || R.state === 'tag' || R.state === 'lead') { R.state = 'run'; R.goal = R.seg + 1; }
    }
    this.computeForced();
  }

  release(F) {
    const b = this.ball, w = F.wind;
    F.wind = null; F.act = ACT.throw;
    const to = { x: COVER_SPOT[w.k].x, y: 1.25, z: COVER_SPOT[w.k].z };
    const from = { x: F.x, y: 1.7, z: F.z };
    const d = dist(from, to);
    const sp = throwSpeed(F.pl) * (d > 45 ? 0.86 : 1);
    b.mode = 'thrown';
    b.thr = { from, to, t0: this.t, t1: this.t + Math.max(0.15, d / sp), h: Math.min(6, d * (d > 45 ? 0.055 : 0.025)), k: w.k, recv: this.covers()[w.k], from_pos: F.pos };
    b.holder = null;
  }
  startThrow(F, k) {
    if (dist(F, BP(k)) < 1.4) return; // もう塁の上にいる
    F.wind = { k, at: this.t + (INFIELD[F.pos] && Math.hypot(F.x, F.z) < 45 ? 0.3 : 0.5) };
    F.dir = Math.atan2(BP(k).x - F.x, BP(k).z - F.z);
    F.act = ACT.throw;
  }
  throwArrive() {
    const b = this.ball, th = b.thr;
    let got = null, gd = 2.2;
    for (const pos of POS_ORDER) {
      if (pos === th.from_pos) continue;
      const F = this.f[pos];
      const d = Math.hypot(F.x - th.to.x, F.z - th.to.z);
      if (d < gd) { gd = d; got = F; }
    }
    b.x = th.to.x; b.z = th.to.z;
    if (got) { this.hold(got); got.dir = Math.atan2(-got.x, -got.z); }
    else { b.mode = 'loose'; b.y = BALL_R; b.thr = null; this.chaser = null; this.chaserAt = -1; }
  }

  aiDecide(F) {
    // 1) 投げてアウトにできる走者（先の塁を優先）
    let best = null;
    for (const R of this.r) {
      if (R.out || R.scored || R.idle || R.state === 'on' && R.forcedTo === 0) continue;
      let k;
      if (R.forcedTo) k = R.forcedTo;
      else if (R.state === 'ret') k = R.orig;
      else if (R.state === 'run' || R.state === 'wait') k = R.seg + 1;
      else continue;
      if (k > 4) continue;
      const rt = this.runnerTimeTo(R, k);
      const near = dist(F, BP(k));
      const tag = R.forcedTo ? 0.05 : 0.3;
      // 自分で塁を踏む方が早い
      const runT = Math.max(0, near - 0.8) / F.spd;
      if (near < 9 && runT + 0.1 < rt && (!best || k > best.k)) { best = { k, run: true }; continue; }
      const bt = (INFIELD[F.pos] ? 0.3 : 0.5) + near / (throwSpeed(F.pl) * (near > 45 ? 0.86 : 1));
      if (bt + tag < rt && (!best || k > best.k)) best = { k, run: false };
    }
    if (best) {
      if (best.run) F.goal = COVER_SPOT[best.k];
      else this.startThrow(F, best.k);
      return;
    }
    // 2) 外野からは内野へ返球
    if (Math.hypot(F.x, F.z) > 40) {
      let lead = 2;
      for (const R of this.r) if (!R.out && !R.scored && (R.state === 'run' || R.state === 'wait')) lead = Math.max(lead, Math.min(4, R.seg + 1));
      this.startThrow(F, lead);
    }
  }

  checkOuts(F) {
    if (F.wind && this.t >= F.wind.at - 0.05) return;
    for (const R of this.r) {
      if (R.out || R.scored || R.idle) continue;
      // 封殺（ボールを持って塁を踏む）
      if (R.forcedTo) {
        const k = R.forcedTo;
        if (dist(F, BP(k)) < 1.15) {
          const reached = R.state !== 'ret' ? (R.seg >= k) : (R.seg === k && R.s <= 0.01);
          if (!reached) { this.makeOut(R, 'force'); continue; }
        }
      }
      // タッチ
      if (!this.onBase(R) && dist(F, R) < 1.0 && this.t > R.start) {
        // 滑り込んでのクロスプレーはまれにケガ
        if (this.t - R.slideT < 0.8 && Math.random() < 0.04) this.hurt(R);
        this.makeOut(R, 'tag');
      }
    }
  }
  hurt(R) {
    if (this.injured.includes(R.idx)) return;
    this.injured.push(R.idx);
    R.hurtT = this.t;
    this.call(R.pl.name + ' 負傷…', '#ff9f43');
  }
  makeOut(R, how) {
    if (R.out) return;
    R.out = true; R.gone = this.t;
    this.outs++;
    if (how !== 'fly') this.call(this.outs >= this.outs0 + 2 && this.outs < 3 ? 'ゲッツー！' : 'アウト！', '#ff6b6b');
    else this.call(this.firstTouch && this.firstTouch.air ? 'アウト！' : 'アウト！', '#ff6b6b');
    if (this.outs >= 3 && !this.thirdOut) this.thirdOut = { t: this.t, force: how === 'force' || (R.slot === 0 && how !== 'fly' && R.seg < 1) };
    if (this.ball.mode === 'held') { const F = this.ball.holder; F.decided = false; F.catchT = this.t; F.goal = null; }
    this.computeForced();
  }

  stepRunners(dt) {
    const t = this.t;
    for (const R of this.r) {
      if (R.out || R.scored) { R.act = R.hurtT != null && t - R.hurtT < 2 ? ACT.hurt : ACT.idle; continue; }
      if (R.idle) { R.act = 9; continue; }
      if (t < R.start) { R.act = R.slot === 0 ? 9 : ACT.idle; continue; }
      if (R.state === 'wait') { R.state = 'run'; R.seg = 0; R.s = 0; }
      if (R.pause > 0) { R.pause -= dt; R.act = ACT.run; continue; }
      const st = R.state;
      if (st === 'lead') { R.state = R.forcedTo ? 'run' : 'ret'; if (R.state === 'run') R.goal = R.seg + 1; else R.goal = R.orig; }
      if (R.state === 'run' || R.state === 'jog' || R.state === 'half') {
        R.s += R.spd * dt / BASE;
        R.act = R.state === 'jog' ? ACT.jog : ACT.run;
        // 止まる塁の手前でクロスプレーになりそうならスライディング
        if (R.state === 'run' && R.goal <= R.seg + 1 && R.s > 0.88 && R.slideT < 0 && (R.steal || this.closePlay(R.seg + 1))) {
          R.slideT = t;
          if (R.slot !== 0 || R.seg + 1 !== 1) this.call('スライディング！', '#ffe066');
        }
        if (R.slideT >= 0 && t - R.slideT < 0.7) R.act = ACT.slide;
        if (R.state === 'half' && R.seg === R.orig && R.s >= R.halfS) { R.s = R.halfS; R.act = ACT.idle; }
        if (R.s >= 1) {
          R.seg++; R.s = 0;
          this.arrive(R);
          if (R.slideT >= 0 && t - R.slideT > 0.7) R.slideT = -9;
        }
      } else if (R.state === 'ret') {
        R.s -= R.spd * dt / BASE;
        R.act = ACT.run;
        if (R.s <= 0) { R.s = 0; R.state = 'on'; R.mustReturn = false; this.computeForced(); }
      } else {
        R.act = R.slideT >= 0 && t - R.slideT < 0.9 ? ACT.slide : ACT.idle;
        // 止まっている走者：大きなチャンスなら次の塁へ
        if (R.state === 'on' && !R.manual && R.seg < 4 && !(this.flyBall && this.ball.mode === 'flight' && this.outs < 2) && (this.ball.mode !== 'held' || dist(this.ball.holder, BP(R.seg + 1)) > 30) && (t * 10 | 0) % 3 === 0) {
          if (this.shouldAdvance(R, 1.1)) { R.state = 'run'; R.goal = R.seg + 1; }
        }
      }
      this.placeRunner(R);
      const a = BP(R.seg), c = BP(R.seg + 1);
      R.dir = R.state === 'ret' ? Math.atan2(a.x - c.x, a.z - c.z) : Math.atan2(c.x - a.x, c.z - a.z);
    }
  }
  arrive(R) {
    const k = R.seg;
    if (k >= 4) {
      R.scored = true; R.scoreT = this.t; R.gone = this.t;
      if (!this.thirdOut) this.call('ホームイン！', '#ffd43d');
      this.computeForced();
      return;
    }
    if (R.forcedTo === k) R.forcedTo = 0;
    if (R.state === 'jog') return;
    if (R.state === 'half') return;
    let go = k < R.goal;
    if (!go && !R.manual) go = this.shouldAdvance(R, this.outs === 2 ? 0.15 : 0.4);
    if (R.steal && !go) this.call('セーフ！', '#7dffb0');
    if (go && k < 4) { R.goal = Math.max(R.goal, k + 1); R.pause = 0.12; R.state = 'run'; }
    else { R.state = 'on'; R.goal = k; }
    this.computeForced();
  }

  // その塁でクロスプレーになりそうか
  closePlay(k) {
    const b = this.ball, p = BP(k);
    if (b.mode === 'thrown') return dist(b.thr.to, p) < 3;
    if (b.mode === 'held') return dist(b.holder, p) < 8;
    return false;
  }

  checkEnd() {
    const t = this.t;
    if (this.endAt != null) { if (t >= this.endAt) this.finish(); return; }
    if (this.outs >= 3) { this.endAt = t + 1.0; return; }
    const b = this.ball;
    const settled = this.r.every(R => R.out || R.scored || R.idle || (R.state === 'on' && R.s === 0));
    if (b.mode === 'held' && !b.holder.wind && settled) {
      if (this.settleT == null) this.settleT = t;
      if (t - this.settleT > (this.human && b.holder.pos === this.active ? 1.4 : 0.7)) this.endAt = t + 0.3;
    } else this.settleT = null;
    if (t > 30) this.endAt = t;
  }

  call(text, color = '#fff', big = false) { this.calls.push({ text, color, big, t: this.t }); }

  finishFoul() {
    this.call('ファウル', '#ffffff');
    this.res = { kind: 'FOUL', foul: true, outsAdd: 0, runs: 0, bases: null, hitBases: 0, text: 'ファウル' };
    this.done = true;
  }

  stepHR(dt) {
    const t = this.t, b = this.ball;
    const i = Math.min(this.path.length - 1, Math.floor(t * 120));
    const p = this.path[i];
    if (t < this.hrInfo.t + 1.2) { b.x = p.x; b.y = p.y; b.z = p.z; b.mode = 'flight'; }
    else b.mode = 'gone';
    if (!this.hrCalled && t >= this.hrInfo.t) { this.hrCalled = true; this.call(this.r.length === 4 ? '満塁ホームラン！' : 'ホームラン！', '#ffd43d', true); }
    for (const pos of POS_ORDER) { const F = this.f[pos]; F.act = pos === 'C' && t < 0.3 ? ACT.crouch : ACT.idle; F.dir = Math.atan2(b.x - F.x, b.z - F.z); }
    let all = true;
    for (const R of this.r) {
      if (R.scored) continue;
      all = false;
      if (t < R.start) { R.act = R.slot === 0 ? 9 : ACT.idle; continue; }
      if (R.slot === 0 && R.state !== 'jog') R.state = 'jog';
      R.s += R.spd * dt / BASE; R.act = ACT.jog;
      if (R.s >= 1) { R.seg++; R.s = 0; if (R.seg >= 4) { R.scored = true; R.scoreT = t; R.gone = t; } }
      this.placeRunner(R);
      const a = BP(R.seg), c = BP(R.seg + 1);
      R.dir = Math.atan2(c.x - a.x, c.z - a.z);
    }
    if ((all && t > this.hrInfo.t + 2) || t > this.hrInfo.t + 4.5) {
      const n = this.r.length;
      this.res = { kind: 'HR', outsAdd: 0, runs: n, bases: [null, null, null], hitBases: 4, text: n === 4 ? '満塁ホームラン！' : 'ホームラン！' };
      this.done = true;
    }
  }

  finish() {
    const third = this.thirdOut;
    let runs = 0;
    for (const R of this.r) if (R.scored && !(third && (third.force || R.scoreT > third.t))) runs++;
    const bases = [null, null, null];
    if (this.outs < 3) for (const R of this.r) if (!R.out && !R.scored && !R.idle && R.seg >= 1 && R.seg <= 3) bases[R.seg - 1] = R.idx;
    const outsAdd = Math.min(3, this.outs) - this.outs0;
    const bat = this.r[0];
    let kind, text, hitBases = 0;
    if (this.stealOnly) {
      kind = 'STEAL'; text = outsAdd ? '盗塁失敗' : '盗塁成功！';
      this.res = { kind, outsAdd, runs, bases, hitBases: 0, text, injured: this.injured };
      this.done = true;
      return;
    }
    if (this.batterOutFly) { kind = 'FLYOUT'; text = 'フライアウト'; if (runs > 0) text = '犠牲フライ'; }
    else if (outsAdd >= 2) { kind = 'DP'; text = 'ゲッツー'; }
    else if (outsAdd === 1 && bat.out) { kind = 'GROUNDOUT'; text = 'アウト'; }
    else if (outsAdd >= 1) { kind = 'FC'; text = 'フィルダースチョイス'; }
    else {
      kind = 'HIT';
      hitBases = bat.scored ? 4 : bat.seg;
      const inf = this.firstTouch && INFIELD[this.firstTouch.pos] && Math.hypot(this.firstTouch.x, this.firstTouch.z) < 40;
      text = hitBases >= 4 ? 'ランニングホームラン！' : hitBases === 3 ? 'スリーベース！' : hitBases === 2 ? 'ツーベース！' : inf ? '内野安打！' : 'ヒット！';
      this.call(text, '#7dffb0', hitBases >= 3);
    }
    if (runs > 0 && kind !== 'HIT') { /* 得点はホームインのコールで表示済み */ }
    this.res = { kind, outsAdd, runs, bases, hitBases, text, injured: this.injured };
    this.done = true;
  }

  // ---------- 描画用 ----------
  view() {
    const b = this.ball;
    const lm = (b.mode === 'flight' && b.air && b.y > 2 && this.fb && !this.hr) ? [this.fb.x, this.fb.z] : null;
    return {
      t: this.t,
      b: [b.x, b.y, b.z, b.mode === 'gone' ? 0 : 1, b.mode === 'flight' ? 1 : 0],
      f: POS_ORDER.map(p => { const F = this.f[p]; return [F.x, F.z, F.dir, F.act]; }),
      r: this.r.map(R => [R.slot, R.x, R.z, R.dir, R.out || R.scored ? (this.t - R.gone > 1.2 ? ACT.hide : R.scored ? (this.hr ? ACT.cheer : ACT.idle) : ACT.idle) : R.act]),
      a: this.human ? this.active : null,
      h: b.mode === 'held' ? b.holder.pos : null,
      lm,
    };
  }
}
