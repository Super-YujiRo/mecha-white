import * as THREE from 'three';
import { TEAMS, PITCHES, rank, battingOrder } from './data.js';
import { pitchPos, predictPlate, cursorSize, ZONE, RUBBER_Z, SWING_LAG, BASES, BALL_R, rng } from './baseball.js';
import { POSITIONS, POS_ORDER } from './play.js';
import { LivePlay, ACT } from './live.js';
import { newState, currentBatter, currentPitcher, batTeam, fieldTeam, teamById, cpuPitchIntent, cpuSwing, resolvePitch, pitchFor, applyPlay, playCtx, runnersOf } from './game.js';
import { buildField, buildZone, buildCursor, buildAim, buildBat } from './field.js';
import { loadCharacters, Player3D } from './chars.js';
const BAT_CAM = { pos: [0, 1.55, 4.2], look: [0, 0.9, -18], fov: 40, fovPortrait: 62 };
import { Net } from './net.js';

// ================= 時計（?test のときはコマ送り） =================
const TEST = new URLSearchParams(location.search).has('test');
let simNow = 0;
const nowMs = () => (TEST ? simNow : performance.now());

// ================= 描画の準備 =================
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 800);
const field = buildField(scene, renderer);
const zone = buildZone(); scene.add(zone);
const cursor = buildCursor(); scene.add(cursor);
const aim = buildAim(); scene.add(aim);
// 投球の目安：ボールの今の高さ・コースをゾーンの面に映した影と、着弾点（アシスト）
function zoneMark(r0, r1, color, fill) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide }));
  ring.renderOrder = 14; g.add(ring);
  if (fill) { const c = new THREE.Mesh(new THREE.CircleGeometry(r0, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthTest: false, side: THREE.DoubleSide })); c.renderOrder = 14; g.add(c); }
  g.visible = false; scene.add(g);
  return g;
}
const trackMark = zoneMark(0.05, 0.068, 0xffffff, true);
const landPitch = zoneMark(0.045, 0.06, 0xff5a3d, false);
function setMarkOpacity(g, a) { g.children.forEach((m, i) => { m.material.opacity = a * (i ? 0.35 : 0.95); }); }
const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R * 1.5, 16, 12), ballMat);
ball.renderOrder = 20; ballMat.depthTest = false;
ball.castShadow = true;
scene.add(ball);
const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
ballShadow.rotation.x = -Math.PI / 2;
scene.add(ballShadow);
const TRAIL_N = 14;
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
trail.frustumCulled = false;
scene.add(trail);
const trailPts = [];
function pushTrail(p) {
  trailPts.push([p.x, p.y, p.z]);
  if (trailPts.length > TRAIL_N) trailPts.shift();
  const a = trailGeo.attributes.position.array;
  for (let i = 0; i < TRAIL_N; i++) { const q = trailPts[Math.min(i, trailPts.length - 1)] || [p.x, p.y, p.z]; a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }
  trailGeo.attributes.position.needsUpdate = true;
  trail.visible = true;
}
function clearTrail() { trailPts.length = 0; trail.visible = false; }
// 落下地点マーカー（パワプロの「落下点」）
const landMark = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 32), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
landMark.rotation.x = -Math.PI / 2;
landMark.visible = false;
scene.add(landMark);
// 操作している野手の足元
const activeRing = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.05, 32), new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
activeRing.rotation.x = -Math.PI / 2;
activeRing.visible = false;
scene.add(activeRing);

let S_portrait = false;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  S_portrait = w / h < 1;
  camera.fov = S_portrait ? 62 : 40;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ================= DOM =================
const $ = (id) => document.getElementById(id);
const ui = {
  hud: $('hud'), title: $('title'), loading: $('loading'), result: $('result'), netBox: $('netBox'),
  inning: $('inning'), lineHead: $('lineHead'), lineA: $('lineA'), lineB: $('lineB'),
  count: $('count'), b1: $('b1'), b2: $('b2'), b3: $('b3'),
  pName: $('pName'), pStats: $('pStats'), stamina: $('stamina').firstElementChild,
  bName: $('bName'), bStats: $('bStats'), speed: $('speed'), pitchMenu: $('pitchMenu'), help: $('help'), mode: $('swingMode'), baseKeys: $('baseKeys'),
  call: $('call'), toast: $('toast'),
};

let callTimer = 0;
function showCall(text, color = '#fff', big = false) {
  ui.call.textContent = text;
  ui.call.style.color = color;
  ui.call.classList.toggle('big', big);
  ui.call.classList.remove('show');
  void ui.call.offsetWidth;
  ui.call.classList.add('show');
  clearTimeout(callTimer);
  callTimer = setTimeout(() => ui.call.classList.remove('show'), 1300);
}
let toastTimer = 0;
function toast(text, ms = 2200) {
  ui.toast.textContent = text;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('show'), ms);
}

// ================= キャラクター =================
const SKIN = '#f2c6a0';
const people = { fielders: {}, batter: null, runners: [], catcherBat: null };
let bat = null;

function lookOf(team) { return { shirt: team.color, sleeve: team.color2, pants: team.pants, skin: SKIN }; }

function makePeople() {
  for (const pos of POS_ORDER) {
    const p = new Player3D(lookOf(TEAMS[1]));
    scene.add(p.holder);
    people.fielders[pos] = p;
  }
  people.batter = new Player3D(lookOf(TEAMS[0]));
  scene.add(people.batter.holder);
  for (let i = 0; i < 3; i++) {
    const r = new Player3D(lookOf(TEAMS[0]));
    scene.add(r.holder);
    r.holder.visible = false;
    people.runners.push(r);
  }
  bat = buildBat();
  scene.add(bat);
}

function faceTo(p, x, z) {
  const h = p.holder.position;
  p.holder.rotation.y = Math.atan2(x - h.x, z - h.z);
}

// 守備位置に戻す
function resetFielders() {
  for (const pos of POS_ORDER) {
    const p = people.fielders[pos];
    const h = POSITIONS[pos];
    p.holder.position.set(h.x, 0, h.z);
    p.holder.visible = true;
    if (pos === 'C') { p.holder.position.set(0, 0, 1.25); p.holder.rotation.y = Math.PI; p.play('Crouching', { fade: 0.2 }); p.holder.visible = false; continue; }
    if (pos === 'P') { p.holder.position.set(0, 0.25, RUBBER_Z + 0.2); p.holder.rotation.y = 0; p.play('Idle_A'); continue; }
    faceTo(p, 0, 0);
    p.play('Idle_B');
  }
}

function setBatterStance(player) {
  const b = people.batter;
  const left = player.bats === 'L';
  b.holder.visible = true;
  b.holder.position.set(left ? 1.0 : -1.0, 0, -0.1);
  b.holder.rotation.y = left ? -Math.PI / 2 : Math.PI / 2;
  b.play('Melee_2H_Idle', { fade: 0.2 });
  bat.visible = true;
  S.swingStart = null;
}

function applyTeamsLook(s) {
  const bt = teamById(s.teamIds[batTeam(s)]);
  const ft = teamById(s.teamIds[fieldTeam(s)]);
  for (const pos of POS_ORDER) people.fielders[pos].setLook(lookOf(ft));
  people.batter.setLook(lookOf(bt));
  for (const r of people.runners) r.setLook(lookOf(bt));
}

function placeRunners(s) {
  for (let i = 0; i < 3; i++) {
    const r = people.runners[i];
    if (s.bases[i] == null) { r.holder.visible = false; continue; }
    const b = BASES[i + 1];
    r.holder.visible = true;
    // 少しリード
    const nb = BASES[(i + 2) % 4];
    const dx = nb.x - b.x, dz = nb.z - b.z, L = Math.hypot(dx, dz);
    r.holder.position.set(b.x + dx / L * 2.2, 0, b.z + dz / L * 2.2);
    faceTo(r, 0, 0);
    r.play('Idle_A');
  }
}

// ================= 試合のセッション =================
const S = {
  mode: null,          // 'cpu' | 'host' | 'guest'
  ctrl: ['me', 'cpu'], // 各チームを誰が操作するか
  lv: 1,
  state: null,
  phase: 'idle',       // aim | windup | flight | result | play | change | over
  pitch: null, pitchId: 0, seed2: 0,
  t0: 0,               // 投球のリリース時刻（performance.now）
  windupAt: 0,
  decision: undefined, // undefined: まだ / null: 見送り / swing
  swingShownAt: -1,
  pitchType: 'ST',
  cursor: { x: 0, y: 0.78 },
  powerMode: false,     // false: ミート打ち / true: 強振
  live: null,
  aim: { x: 0, y: 0.78 },
  play: null,          // 再生中のプレー
  waitUntil: 0,
  nextAction: null,
  net: null,
  meTeam: 0,
};

const isHost = () => S.mode !== 'guest';
const myCtrl = (team) => S.ctrl[team];
const iBat = () => S.state && myCtrl(batTeam(S.state)) === 'me';
const iPitch = () => S.state && myCtrl(fieldTeam(S.state)) === 'me';
function send(m) { if (S.net) S.net.send(m); }

function startMatch(mode, opts = {}) {
  S.mode = mode;
  if (!TEST) S.autoField = $('optField').value === '1';
  S.assist = $('optAssist').value; // '0' なし / 'lock' ロックオン / '1' 着弾点
  S.lv = opts.lv ?? 1;
  const innings = opts.innings || 3;
  if (mode === 'cpu') S.ctrl = ['me', 'cpu'];
  if (mode === 'host') S.ctrl = ['me', 'remote'];
  if (mode === 'guest') S.ctrl = ['remote', 'me'];
  if (isHost()) {
    S.state = newState({ innings });
    send({ t: 'start', s: S.state });
  }
  ui.title.classList.add('hidden');
  ui.result.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  if (S.state) beginAtBat(true);
}

function beginAtBat(first) {
  const s = S.state;
  S.phase = 'aim';
  S.pitch = null;
  S.decision = undefined;
  S.play = null;
  S.live = null;
  S.swingShownAt = -1;
  S.stealShow = false;
  if (S.stealDecl && S.stealDecl.id <= S.pitchId) S.stealDecl = null;
  activeRing.visible = false;
  applyTeamsLook(s);
  resetFielders();
  setBatterStance(currentBatter(s).player);
  placeRunners(s);
  ball.visible = false; ballShadow.visible = false; ball.scale.setScalar(1); ballShadow.scale.setScalar(1);
  clearTrail(); landMark.visible = false;
  ui.speed.classList.remove('show');
  // 球種の選択を初期化
  const pit = currentPitcher(s);
  if (!pit.pitches[S.pitchType] && S.pitchType !== 'ST') S.pitchType = 'ST';
  updateHud();
  if (first) showCall(s.top ? `${s.inning}回表` : `${s.inning}回裏`, '#fff');
  if (isHost()) {
    send({ t: 'state', s, phase: 'aim' });
    if (myCtrl(fieldTeam(s)) === 'cpu') {
      S.waitUntil = nowMs() + 1100;
      S.nextAction = () => doPitch(cpuPitchIntent(s, Math.floor(Math.random() * 1e9), S.lv));
    }
  }
}

// ---- 投球 ----
function doPitch(intent) {
  const s = S.state;
  const seed = Math.floor(Math.random() * 1e9);
  const pitch = pitchFor(s, intent, seed);
  S.pitchId++;
  const seed2 = Math.floor(Math.random() * 1e9);
  send({ t: 'pitch', id: S.pitchId, pitch, seed2 });
  startPitch(pitch, S.pitchId, seed2);
}

function startPitch(pitch, id, seed2) {
  S.pitch = pitch; S.pitchId = id; S.seed2 = seed2;
  S.phase = 'windup';
  S.windupAt = nowMs();
  S.t0 = S.windupAt + 850;
  S.decision = undefined;
  S.swingShownAt = -1;
  const p = people.fielders.P;
  p.play('Throw', { loop: false, restart: true, speed: 1.15 });
  aim.visible = false;
  updatePitchMenu();
  // CPUの打者
  if (isHost() && myCtrl(batTeam(S.state)) === 'cpu') {
    S.decision = cpuSwing(S.state, pitch, currentBatter(S.state).player, seed2, S.lv);
    S.cpuSwingPending = !!S.decision;
    // CPUの盗塁：足の速い一塁走者がたまに走る
    const s = S.state, r1 = runnersOf(s)[0];
    if (r1 && s.bases[1] == null && s.outs < 2 && r1.speed >= 60 && Math.random() < (r1.speed - 50) / 50 * 0.18) { S.stealDecl = { id, jump: 0.41 }; S.stealShow = true; }
  }
}

function localSwing(power) {
  if (!S.pitch || !iBat() || S.decision !== undefined) return;
  if (S.phase !== 'flight' && S.phase !== 'windup') return;
  const ts = (nowMs() - S.t0) / 1000;
  if (ts < -0.1) return;
  const sw = { ts, cx: S.cursor.x, cy: S.cursor.y, power: power == null ? S.powerMode : !!power };
  S.decision = sw;
  showSwing(ts);
  if (!isHost()) send({ t: 'swing', id: S.pitchId, sw });
}

function showSwing(ts) {
  S.swingStart = nowMs();
  const b = people.batter;
  const len = b.clipLength('Melee_2H_Attack_Slice');
  b.play('Melee_2H_Attack_Slice', { loop: false, restart: true, speed: (len * 0.42) / SWING_LAG, fade: 0.05 });
  S.swingShownAt = ts;
}

// ---- 1球の結果（ホスト） ----
function resolveNow() {
  const pre = S.state;
  const decision = S.decision || null;
  const { state, out } = resolvePitch(pre, S.pitch, decision, S.seed2);
  // 盗塁（スタートを切った走者）
  if (S.stealDecl && S.stealDecl.id === S.pitchId) {
    const bases = stealBases(pre);
    const walked = out.kind === 'HBP' || out.call === 'フォアボール';
    if (bases.length && !walked && !state.change && !state.over) out.steal = { bases, jump: S.stealDecl.jump };
    else if (bases.length && out.kind === 'CONTACT') out.steal = { bases, jump: S.stealDecl.jump };
  }
  S.stealDecl = null;
  send({ t: 'result', id: S.pitchId, pre, decision, out, state });
  playResult(pre, decision, out, state);
}

// 盗塁できる走者（先の塁が空いているか、前の走者も走る）
function stealBases(s) {
  const b = s.bases, list = [];
  for (let k = 3; k >= 1; k--) {
    if (b[k - 1] == null) continue;
    if (k === 3) continue; // ホームスチールはなし
    if (b[k] == null || list.includes(k + 1)) list.push(k);
  }
  return list;
}
function declareSteal() {
  if (!iBat() || !S.state || S.decision) return;
  if (S.phase !== 'aim' && S.phase !== 'windup' && S.phase !== 'flight') return;
  if (S.stealDecl || !stealBases(S.state).length) return;
  // スタートが早いほど大きくリードできる
  let jump = 0.41;
  if (S.phase === 'flight') { const f = Math.min(1, (nowMs() - S.t0) / 1000 / S.pitch.T); jump = 0.41 - 0.3 * f; }
  const id = S.phase === 'aim' ? S.pitchId + 1 : S.pitchId;
  S.stealDecl = { id, jump };
  if (!isHost()) send({ t: 'steal', id, jump });
  showCall('盗塁！', '#7dffb0');
  placeRunnersLead(true);
}
function placeRunnersLead(on) { S.stealShow = on; }

function playResult(pre, decision, out, next) {
  (window.__log = window.__log || []).push({ kind: out.kind, call: out.call, dec: decision, hit: out.hit && { ev: out.hit.ev, la: out.hit.la, q: out.hit.q, phi: out.hit.phi } });
  S.phase = 'result';
  S.nextState = next;
  const t = nowMs();
  showSpeed();
  if (out.kind === 'CONTACT') {
    startLive(pre, out.hit, next, out.steal);
    hitFx(out.hit);
    return;
  }
  if (out.kind === 'HBP') {
    people.batter.play('Hit_A', { loop: false, restart: true });
    if (out.injury) setTimeout(() => toast(out.injury + ' がケガ… 能力が下がります', 2600), 700);
  }
  showCall(out.call, out.kind === 'BALL' ? '#7dd3ff' : out.kind === 'K' ? '#ff6b6b' : out.kind === 'HBP' ? '#ff9f43' : '#ffe066', out.kind === 'K');
  if (out.steal) {
    // 投球のあと、キャッチャーからの送球で盗塁のプレー
    setTimeout(() => { if (S.phase === 'result' && S.nextState === next) startLive(next, null, next, out.steal); }, 250);
    return;
  }
  S.waitUntil = t + (out.kind === 'K' || out.call === 'フォアボール' ? 1500 : 1000);
  S.nextAction = () => finishPitch();
}

// ---- 打球が飛んだ後のプレー ----
// 守備側を操作している人（CPUならホスト）の画面でプレーを動かし、相手には様子を送る
function startLive(pre, hit, mid, steal) {
  const fc = myCtrl(fieldTeam(pre));
  const auth = fc === 'me' || (fc === 'cpu' && isHost());
  const human = fc === 'me' && !S.autoField;
  const runner = myCtrl(batTeam(pre)) === 'me';
  S.phase = 'play';
  S.stealShow = false;
  const opts = { human, steal: steal ? steal.bases : [], jump: steal ? steal.jump : null };
  S.live = { pre, mid, auth, human, runner, stealOnly: !hit, sim: auth ? new LivePlay(hit, playCtx(pre), opts) : null, view: null, prev: null, start: nowMs(), sentAt: 0, ended: false, runKey: null };
  ui.speed.classList.remove('show');
  bat.visible = true;
  if (human) toast(hit ? '守備：WASDで移動　1〜4で送球　スペース：ダイブ　F：ジャンプ' : '盗塁！ 2キーで二塁へ送球（3：三塁）', 3500);
  else if (runner && (hit || steal)) toast('走塁：E 進め　Q 戻れ', 2500);
  updateHelp();
  updateMode();
}

function liveInput() {
  const L = S.live;
  const run = L.runKey; L.runKey = null;
  if (!L.human) return run ? { run } : {};
  // カメラの向きに合わせた移動
  let fx = camLook.x - camPos.x, fz = camLook.z - camPos.z;
  const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
  const rx = -fz, rz = fx;
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) { mx += fx; mz += fz; }
  if (keys.KeyS || keys.ArrowDown) { mx -= fx; mz -= fz; }
  if (keys.KeyD || keys.ArrowRight) { mx += rx; mz += rz; }
  if (keys.KeyA || keys.ArrowLeft) { mx -= rx; mz -= rz; }
  const ml = Math.hypot(mx, mz);
  const inp = { move: ml ? { x: mx / ml, z: mz / ml } : null, throwTo: L.throwKey || null, dive: !!L.diveKey, jump: !!L.jumpKey, run };
  L.throwKey = null; L.diveKey = false; L.jumpKey = false;
  return inp;
}

function runCommand(cmd) {
  const L = S.live;
  if (!L || L.ended) return;
  if (L.auth) L.runKey = cmd;
  else send({ t: 'runCmd', id: S.pitchId, cmd });
}

function updateLive(now, dt) {
  const L = S.live;
  if (L.auth) {
    const sim = L.sim;
    if (!sim.done) sim.step(dt, liveInput());
    L.view = sim.view();
    const calls = sim.calls.splice(0);
    for (const c of calls) showCall(c.text, c.color, c.big);
    if (S.net && (now - L.sentAt > 50 || sim.done || calls.length)) { L.sentAt = now; send({ t: 'snap', id: S.pitchId, v: L.view, c: calls }); }
    if (sim.done && !L.ended) {
      L.ended = true;
      if (isHost()) finishLive(sim.res);
      else send({ t: 'playEnd', id: S.pitchId, res: sim.res });
    }
  }
  if (L.view) renderView(L.view, dt);
}

function finishLive(res) {
  // ホスト：結果を状態に反映して相手に送る
  const next = applyPlay(S.live.mid, res);
  send({ t: 'playDone', id: S.pitchId, res, state: next });
  afterLive(res, next);
}
function afterLive(res, next) {
  S.nextState = next;
  if (S.live) S.live.ended = true;
  S.waitUntil = nowMs() + (res.kind === 'FOUL' ? 700 : 1300);
  S.nextAction = () => finishPitch();
}

const ANIM = { [ACT.idle]: 'Idle_A', [ACT.run]: 'Running_A', [ACT.throw]: 'Throw', [ACT.catch]: 'Melee_Block', [ACT.dive]: 'Dodge_Forward', [ACT.cheer]: 'Cheering', [ACT.jog]: 'Running_A', [ACT.crouch]: 'Crouching', [ACT.jump]: 'Jump_Full_Short', [ACT.slide]: 'Sit_Floor_Down', [ACT.hurt]: 'Hit_B' };
function animFor(p, act) {
  const name = ANIM[act] || 'Idle_A';
  if (act === ACT.throw) p.play(name, { loop: false, speed: 1.5 });
  else if (act === ACT.jump) p.play(name, { loop: false, speed: 1.6 });
  else if (act === ACT.slide) p.play(name, { loop: false, speed: 2.2, fade: 0.06 });
  else if (act === ACT.hurt) p.play(name, { loop: false });
  else if (act === ACT.catch || act === ACT.dive) p.play(name, { loop: false, speed: 1.3 });
  else if (act === ACT.run) p.play(name, { speed: 1.25 });
  else if (act === ACT.jog) p.play(name, { speed: 0.85 });
  else p.play(name);
}
function renderView(v, dt) {
  const L = S.live;
  const k = L.auth ? 1 : 1 - Math.exp(-dt * 18);
  // ボール
  const bv = v.b;
  ball.visible = !!bv[3];
  const bp = ball.position;
  if (k === 1) bp.set(bv[0], bv[1], bv[2]); else bp.lerp(new THREE.Vector3(bv[0], bv[1], bv[2]), k);
  const far = camera.position.distanceTo(bp);
  ball.scale.setScalar(Math.max(1, far / 9));
  ballShadow.visible = ball.visible;
  ballShadow.position.set(bp.x, 0.02, bp.z);
  ballShadow.scale.setScalar(Math.max(1, far / 12));
  if (bv[4] && bp.y > 0.3) pushTrail(bp); else clearTrail();
  L.ballPos = { x: bp.x, y: bp.y, z: bp.z };
  if (v.lm) { landMark.visible = true; landMark.position.set(v.lm[0], 0.05, v.lm[1]); landMark.scale.setScalar(1 + 0.15 * Math.sin(nowMs() / 80)); }
  else landMark.visible = false;
  // 野手
  POS_ORDER.forEach((pos, i) => {
    const f = people.fielders[pos], d = v.f[i];
    f.holder.visible = Math.hypot(d[0] - camera.position.x, d[1] - camera.position.z) > 3;
    const hp = f.holder.position;
    if (k === 1) hp.set(d[0], pos === 'P' && Math.hypot(d[0], d[1] + 17.6) < 2.6 ? 0.2 : 0, d[1]);
    else { hp.x += (d[0] - hp.x) * k; hp.z += (d[1] - hp.z) * k; hp.y = pos === 'P' && Math.hypot(d[0], d[1] + 17.6) < 2.6 ? 0.2 : 0; }
    f.holder.rotation.y = d[2];
    animFor(f, d[3]);
  });
  if (v.a) {
    const af = people.fielders[v.a].holder.position;
    activeRing.visible = true; activeRing.position.set(af.x, 0.04, af.z);
    L.activePos = { x: af.x, z: af.z };
  } else { activeRing.visible = false; L.activePos = null; }
  L.holder = v.h;
  // 走者（0 は打者）
  for (const d of v.r) {
    const actor = d[0] === 0 ? people.batter : people.runners[d[0] - 1];
    if (!actor) continue;
    if (d[4] === 9) continue; // 打者はまだ打席
    if (d[0] === 0) { bat.visible = false; actor.holder.scale.setScalar(1); }
    if (d[4] === ACT.hide) { actor.holder.visible = false; continue; }
    actor.holder.visible = true;
    const hp = actor.holder.position;
    if (k === 1) hp.set(d[1], 0, d[2]); else { hp.x += (d[1] - hp.x) * k; hp.z += (d[2] - hp.z) * k; }
    actor.holder.rotation.y = d[3];
    animFor(actor, d[4]);
  }
}

function showSpeed() {
  if (!S.pitch) return;
  ui.speed.innerHTML = `<span class="ty">${PITCHES[S.pitch.type].name}</span>${S.pitch.velo}<small>km/h</small>`;
  ui.speed.classList.add('show');
}

function finishPitch() {
  const next = S.nextState;
  const changed = next.change;
  delete next.change;
  S.state = next;
  if (next.over) { endMatch(); return; }
  if (changed) {
    S.phase = 'change';
    showCall('チェンジ', '#fff');
    S.waitUntil = nowMs() + 1500;
    S.nextAction = () => { if (isHost()) beginAtBat(true); else waitForHost(); };
    updateHud();
    return;
  }
  if (isHost()) beginAtBat(false); else waitForHost();
}

function waitForHost() {
  // ゲストはホストから次の打席の状態が来るまで待つ
  S.phase = S.pendingAim ? 'aim' : 'wait';
  if (S.pendingAim) { const st = S.pendingAim; S.pendingAim = null; S.state = st; beginAtBat(false); }
}

function hitFx(h) {
  if (!h || h.foulTip) return;
  const q = h.q || 0;
  if (q > 0.85 && h.ev > 150) shake = 0.35; else if (q > 0.6) shake = 0.15;
}

// ================= バット（スイングに合わせて動かす） =================
const _v = new THREE.Vector3(), _f = new THREE.Vector3(), _c = new THREE.Vector3(0, 0, 1), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
function updateBat(now) {
  if (!bat || !bat.visible || !people.batter) return;
  const b = people.batter;
  const left = b.holder.position.x > 0;
  _f.set(left ? -1 : 1, 0, 0);
  let th = 70, el = 55;
  if (S.swingStart != null) {
    const st = (now - S.swingStart) / 1000;
    const k1 = Math.min(1, st / SWING_LAG);
    const e1 = k1 * k1;
    if (st <= SWING_LAG) { th = 70 - 70 * e1; el = 55 - 62 * e1; }
    else { const k2 = Math.min(1, (st - SWING_LAG) / 0.22); th = -170 * (1 - (1 - k2) * (1 - k2)); el = -7 + 45 * k2; }
  }
  const t = th * Math.PI / 180, e = el * Math.PI / 180;
  _d.copy(_f).multiplyScalar(Math.cos(t)).addScaledVector(_c, Math.sin(t)).multiplyScalar(Math.cos(e)).addScaledVector(_up, Math.sin(e)).normalize();
  const hand = b.handR || b.root;
  hand.getWorldPosition(_v);
  bat.position.copy(_v).addScaledVector(_d, -0.06);
  _q.setFromUnitVectors(_up, _d);
  bat.quaternion.copy(_q);
}

// ================= 入力 =================
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse = new THREE.Vector2(0, 0);
const keys = {};
let mouseOnCanvas = false;
let mouseDirty = false;

canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  mouseOnCanvas = true;
  mouseDirty = true;
  pointerToPlate();
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
  if (!S.state) return;
  if (S.phase === 'aim' && iPitch()) { if (e.button === 0) throwLocal(); return; }
  if (S.phase === 'play') return;
  if (iBat()) { if (e.button === 2) toggleMode(); else if (e.button === 0) localSwing(); }
});
canvas.addEventListener('wheel', (e) => { if (S.phase === 'aim' && iPitch()) cyclePitch(e.deltaY > 0 ? 1 : -1); });
canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
  pointerToPlate();
  if (S.phase === 'aim' && iPitch()) throwLocal(); else if (iBat()) { if (e.touches.length > 1) toggleMode(); else localSwing(); }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
  pointerToPlate();
  e.preventDefault();
}, { passive: false });

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!S.state) return;
  if (S.phase === 'aim' && iPitch()) {
    const n = parseInt(e.key, 10);
    const list = pitchList();
    if (n >= 1 && n <= list.length) { S.pitchType = list[n - 1]; updatePitchMenu(); }
    if (e.code === 'KeyQ') cyclePitch(-1);
    if (e.code === 'KeyE') cyclePitch(1);
    if (e.code === 'Space' || e.code === 'Enter') throwLocal();
  } else if (S.phase === 'play' && S.live && S.live.runner) {
    if (e.code === 'KeyE') runCommand('adv');
    if (e.code === 'KeyQ') runCommand('ret');
  } else if (S.phase === 'play' && S.live && S.live.human) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) S.live.throwKey = n;
    if (e.code === 'Digit0' || e.code === 'Numpad0') S.live.throwKey = 4;
    if (e.code === 'Space') { S.live.diveKey = true; e.preventDefault(); }
    if (e.code === 'KeyF') S.live.jumpKey = true;
  } else if (iBat()) {
    if (e.code === 'Space' || e.code === 'Enter') { localSwing(); e.preventDefault(); }
    if (e.code === 'KeyT') declareSteal();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyR') toggleMode();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function pointerToPlate() {
  raycaster.setFromCamera(mouse, camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) return;
  const x = Math.max(-0.62, Math.min(0.62, hit.x));
  const y = Math.max(0.2, Math.min(1.45, hit.y));
  if (iBat()) { S.cursor.x = x; S.cursor.y = y; }
  if (iPitch()) { S.aim.x = x; S.aim.y = y; }
}

function toggleMode() {
  if (!iBat() || S.decision) return;
  S.powerMode = !S.powerMode;
  updateMode();
}
function updateMode() {
  const on = iBat() && S.state && S.phase !== 'play' && S.phase !== 'change' && S.phase !== 'over';
  ui.mode.classList.toggle('hidden', !on);
  ui.mode.classList.toggle('power', S.powerMode);
  ui.mode.innerHTML = S.powerMode ? '強振' : 'ミート';
}

function keyMove(dt) {
  if (S.phase === 'play') return;
  const sp = 1.9 * dt;
  let dx = 0, dy = 0;
  if (keys.KeyA || keys.ArrowLeft) dx -= sp;
  if (keys.KeyD || keys.ArrowRight) dx += sp;
  if (keys.KeyW || keys.ArrowUp) dy += sp;
  if (keys.KeyS || keys.ArrowDown) dy -= sp;
  if (!dx && !dy) return;
  const t = iBat() ? S.cursor : iPitch() ? S.aim : null;
  if (!t) return;
  t.x = Math.max(-0.62, Math.min(0.62, t.x + dx));
  t.y = Math.max(0.2, Math.min(1.45, t.y + dy));
}

function pitchList() {
  const pit = currentPitcher(S.state);
  return ['ST', ...Object.keys(pit.pitches).filter(k => k !== 'ST')];
}
function cyclePitch(d) {
  const list = pitchList();
  const i = list.indexOf(S.pitchType);
  S.pitchType = list[(i + d + list.length) % list.length];
  updatePitchMenu();
}
function throwLocal() {
  if (S.phase !== 'aim' || !iPitch()) return;
  const intent = { type: S.pitchType, target: { x: S.aim.x, y: S.aim.y } };
  S.phase = 'sent';
  if (isHost()) doPitch(intent);
  else send({ t: 'pitchIntent', intent });
}

// ================= HUD =================
function updateHud() {
  const s = S.state;
  if (!s) return;
  const tA = teamById(s.teamIds[0]), tB = teamById(s.teamIds[1]);
  ui.inning.textContent = `${s.inning}回${s.top ? '表' : '裏'}`;
  const n = Math.max(s.innings, s.inning);
  let head = '<th></th>';
  for (let i = 1; i <= n; i++) head += `<th>${i}</th>`;
  head += '<th>計</th>';
  ui.lineHead.innerHTML = head;
  const row = (ti, team) => {
    let h = `<td class="team" style="color:${team.color}">${team.short}</td>`;
    for (let i = 0; i < n; i++) {
      const v = s.line[ti][i];
      const now = i === s.inning - 1 && ((ti === 0) === s.top);
      h += `<td class="${now ? 'now' : ''}">${v == null ? (now ? '0' : '') : v}</td>`;
    }
    return h + `<td class="tot">${s.score[ti]}</td>`;
  };
  ui.lineA.innerHTML = row(0, tA);
  ui.lineB.innerHTML = row(1, tB);
  const rows = ui.count.querySelectorAll('.row');
  const set = (r, v) => rows[r].querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < v));
  set(0, s.balls); set(1, s.strikes); set(2, s.outs);
  ui.b1.classList.toggle('on', s.bases[0] != null);
  ui.b2.classList.toggle('on', s.bases[1] != null);
  ui.b3.classList.toggle('on', s.bases[2] != null);

  const pit = currentPitcher(s);
  ui.pName.textContent = pit.name + (pit.throws === 'L' ? '（左）' : '（右）');
  const pl = Object.keys(pit.pitches).filter(k => k !== 'ST').map(k => `${PITCHES[k].short}${pit.pitches[k]}`).join(' ');
  ui.pStats.innerHTML = `<span>球速<b>${pit.velo}</b></span><span>コン<b class="${rank(pit.control)}">${rank(pit.control)}</b></span><span>スタ<b class="${rank(pit.stamina)}">${rank(pit.stamina)}</b></span><span>${pl}</span>`;
  ui.stamina.style.width = Math.round((1 - s.fatigue[fieldTeam(s)]) * 100) + '%';
  const { idx, player: b } = currentBatter(s);
  ui.bName.innerHTML = `${idx + 1}番 ${b.name}` + (b.injured ? ' <span class="hurt">ケガ</span>' : '');
  ui.bStats.innerHTML = ['meet', 'power', 'speed'].map((k, i) => `<span>${['ミート', 'パワー', '走力'][i]}<b class="${rank(b[k])}">${rank(b[k])}</b></span>`).join('') + `<span>${b.bats === 'L' ? '左打' : '右打'}</span>`;
  updatePitchMenu();
  updateHelp();
  updateMode();
}

function updatePitchMenu() {
  if (!S.state || S.phase !== 'aim' || !iPitch()) { ui.pitchMenu.innerHTML = ''; return; }
  const pit = currentPitcher(S.state);
  ui.pitchMenu.innerHTML = pitchList().map((k, i) =>
    `<div class="p ${k === S.pitchType ? 'sel' : ''}"><span class="k">${i + 1}</span>${PITCHES[k].name}${k === 'ST' ? '' : `<span class="lv">${pit.pitches[k]}</span>`}</div>`).join('');
}

function updateHelp() {
  const s = S.state;
  if (!s) return;
  if (S.phase === 'play' && S.live && S.live.runner) ui.help.innerHTML = '<b>走塁</b>　<b>E</b>：全員 次の塁へ進め　<b>Q</b>：全員 戻れ';
  else if (S.phase === 'play' && S.live && S.live.human) ui.help.innerHTML = '<b>守備</b>　<b>WASD</b>：移動（青い輪の選手）　<b>スペース</b>：ダイブ　<b>F</b>：ジャンプ<br><b>1</b>：一塁　<b>2</b>：二塁　<b>3</b>：三塁　<b>4</b>：本塁へ送球';
  else if (iPitch()) ui.help.innerHTML = '<b>投球</b>　マウス：コースをねらう<br><b>1〜' + pitchList().length + ' / ホイール</b>：球種　<b>左クリック</b>：投げる';
  else if (iBat()) ui.help.innerHTML = '<b>打撃</b>　マウス：カーソル　<b>左クリック/スペース</b>：振る<br><b>右クリック/Shift</b>：ミート⇔強振 切り替え<br><b>白い丸</b>：ボールが来る位置（変化球は曲がりに合わせて動く）<br><b>T</b>：盗塁　打ったあと <b>E</b>：進め　<b>Q</b>：戻れ<br>芯（カーソルの真ん中）の<b>上で打つとフライ・下で打つとゴロ</b>　WASD/矢印キーでも動かせます';
  else ui.help.innerHTML = '観戦中';
}

// ================= カメラ =================
let shake = 0;
const camPos = new THREE.Vector3(...BAT_CAM.pos);
const camLook = new THREE.Vector3(...BAT_CAM.look);
function updateCamera(dt, now) {
  if (S.freezeCam) return;
  let tp, tl;
  if (S.phase === 'play' && S.live && S.live.view) {
    const L = S.live;
    const b = L.ballPos || { x: 0, y: 1, z: 0 };
    const t = (now - L.start) / 1000;
    // ボールと操作中の野手が両方見える位置
    const a = L.activePos;
    let cx = b.x, cz = b.z;
    if (a) { cx = (b.x + a.x) / 2; cz = (b.z + a.z) / 2; }
    const spread = a ? Math.hypot(b.x - a.x, b.z - a.z) : 0;
    const d = Math.hypot(cx, cz);
    let ux = 0, uz = -1;
    if (d > 6) { ux = cx / d; uz = cz / d; }
    if (t < 0.25) { tp = new THREE.Vector3(...BAT_CAM.pos); tl = new THREE.Vector3(b.x, b.y, b.z); }
    else {
      const back = 15 + spread * 0.7 + Math.min(14, b.y * 0.4);
      tp = new THREE.Vector3(cx - ux * back, 8 + spread * 0.35 + b.y * 0.45, cz - uz * back);
      if (tp.z > 16) tp.z = 16;
      tl = new THREE.Vector3(cx, Math.max(0.5, b.y * 0.6), cz);
    }
  } else {
    tp = new THREE.Vector3(...BAT_CAM.pos);
    tl = new THREE.Vector3(...BAT_CAM.look);
  }
  const k = 1 - Math.exp(-dt * (S.phase === 'play' ? 4.5 : 6));
  const fv = S.phase === 'play' ? (S_portrait ? 62 : 40) : (S_portrait ? BAT_CAM.fovPortrait : BAT_CAM.fov);
  if (Math.abs(camera.fov - fv) > 0.01) { camera.fov += (fv - camera.fov) * k; camera.updateProjectionMatrix(); }
  camPos.lerp(tp, k);
  camLook.lerp(tl, k);
  camera.position.copy(camPos);
  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.2;
    camera.position.y += (Math.random() - 0.5) * shake * 0.2;
    shake = Math.max(0, shake - dt * 1.4);
  }
  camera.lookAt(camLook);
}

// ================= メインループ =================
let last = nowMs();
function frame() {
  requestAnimationFrame(frame);
  if (TEST) simNow += 1000 / 60;
  const now = nowMs();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.state) step(now, dt);
  for (const pos in people.fielders) people.fielders[pos].update(dt);
  if (people.batter) { people.batter.update(dt); people.batter.holder.updateMatrixWorld(true); updateBat(nowMs()); }
  for (const r of people.runners) r.update(dt);
  updateCamera(dt, now);
  renderer.render(scene, camera);
}

function step(now, dt) {
  if (mouseDirty && S.phase !== 'play') { pointerToPlate(); if (camPos.distanceTo(new THREE.Vector3(...BAT_CAM.pos)) < 0.05) mouseDirty = false; }
  keyMove(dt);
  const s = S.state;
  // カーソル・ねらい
  const showCursor = iBat() && (S.phase === 'aim' || S.phase === 'windup' || S.phase === 'flight' || S.phase === 'sent');
  cursor.visible = showCursor;
  zone.visible = S.phase !== 'play' && S.phase !== 'change' && S.phase !== 'over';
  if (showCursor) {
    const pw = S.decision ? S.decision.power : S.powerMode;
    const { rx, ry } = cursorSize(currentBatter(s).player, pw);
    cursor.position.set(S.cursor.x, S.cursor.y, 0.02);
    cursor.scale.set(rx, ry, 1);
    cursor.userData.ring.material.color.set(pw ? 0xff4a3d : 0xffd43d);
    cursor.userData.fill.material.color.set(pw ? 0xff7a6a : 0xffe27a);
    cursor.userData.line.material.color.set(pw ? 0xff4a3d : 0xffd43d);
    cursor.userData.ring.material.opacity = S.decision ? 0.4 : 0.95;
  }
  aim.visible = iPitch() && S.phase === 'aim';
  if (S.autoPitch && aim.visible && !S.autoPitchAt) S.autoPitchAt = now + 400;
  if (S.autoPitchAt && now >= S.autoPitchAt) { S.autoPitchAt = 0; if (S.phase === 'aim' && iPitch()) { S.aim.x = (Math.random() - 0.5) * 0.5; S.aim.y = 0.55 + Math.random() * 0.5; throwLocal(); } }
  if (aim.visible) aim.position.set(S.aim.x, S.aim.y, 0.03);

  ballMat.depthTest = S.phase === 'play';
  // 盗塁でスタートを切った走者
  if (S.stealShow && (S.phase === 'windup' || S.phase === 'flight' || S.phase === 'result')) {
    const el = Math.max(0, (now - (S.windupAt || now)) / 1000);
    for (const k of stealBases(s)) {
      const r = people.runners[k - 1], a = BASES[k], b = BASES[k + 1] || BASES[0];
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
      const d = Math.min(L * 0.38, 2.2 + el * 7.5);
      r.holder.position.set(a.x + dx / L * d, 0, a.z + dz / L * d);
      r.holder.rotation.y = Math.atan2(dx, dz);
      r.play('Running_A', { speed: 1.25 });
    }
  }
  // 投球中のボール
  if (S.phase === 'windup' || S.phase === 'flight') {
    const t = (now - S.t0) / 1000;
    if (t >= 0) {
      if (S.phase === 'windup') S.phase = 'flight';
      const p = S.pitch;
      let pos;
      if (t <= p.T) pos = pitchPos(p, t);
      else {
        // キャッチャーミットへ
        const e = pitchPos(p, p.T);
        const k = Math.min(1, (t - p.T) / 0.08);
        pos = { x: e.x, y: e.y - 0.05 * k, z: 1.0 * k };
      }
      ball.visible = t <= p.T + 0.02;
      ball.position.set(pos.x, pos.y, pos.z);
      ball.scale.setScalar(Math.max(1.6, camera.position.distanceTo(ball.position) / 7));
      ballShadow.visible = ball.visible;
      ballShadow.position.set(pos.x, 0.02, pos.z);
      // 目安マーカー
      const sk = Math.max(0, Math.min(1, t / p.T));
      trackMark.visible = iBat() && t <= p.T;
      if (trackMark.visible) {
        const pr = predictPlate(p, t);
        trackMark.position.set(pr.x, pr.y, 0.03);
        setMarkOpacity(trackMark, 0.85);
      }
      if (S.assist === '1' && iBat() && t <= p.T + 0.2) {
        const e = pitchPos(p, p.T);
        landPitch.visible = true;
        landPitch.position.set(e.x, e.y, 0.03);
        setMarkOpacity(landPitch, Math.min(1, 0.5 + sk * 3));
      } else landPitch.visible = false;
      // ロックオン：カーソルがボールの来る場所へ少しずつ寄る（パワプロのアシスト）
      if (S.assist === 'lock' && iBat() && S.decision === undefined && t > 0 && t <= p.T) {
        const e = pitchPos(p, p.T);
        const k = 1 - Math.exp(-dt * 2.2);
        S.cursor.x += (e.x - S.cursor.x) * k;
        S.cursor.y += (e.y - S.cursor.y) * k;
      }
      // テスト用：自動で芯を打つ
      if (S.autoSwing && iBat() && S.decision === undefined && t >= p.T - SWING_LAG - 0.004) {
        const e = pitchPos(p, p.T); S.cursor.x = e.x; S.cursor.y = e.y - 0.04; localSwing(S.autoSwing === 'power');
      }
      // CPUの打者のスイング表示
      if (S.cpuSwingPending && S.decision && t >= S.decision.ts) { S.cpuSwingPending = false; showSwing(S.decision.ts); }
      // 判定タイミング
      if (isHost()) {
        const remoteBatter = myCtrl(batTeam(s)) === 'remote';
        if (S.decision === undefined && !remoteBatter && t > p.T + 0.25) S.decision = null;
        const ready = S.decision !== undefined && (S.decision ? t >= Math.max(S.decision.ts + SWING_LAG, 0) : t > p.T + 0.25);
        if (ready) resolveNow();
        if (remoteBatter && S.decision === undefined && t > p.T + 4) S.decision = null;
      } else if (iBat() && S.decision === undefined && t > p.T + 0.25) {
        S.decision = null;
        send({ t: 'take', id: S.pitchId });
      }
    }
  } else if (S.phase !== 'play' && S.phase !== 'result') {
    ui.speed.classList.remove('show');
  }
  if (S.phase !== 'flight') { trackMark.visible = false; if (S.phase !== 'result') landPitch.visible = false; }
  if (S.phase === 'play') landPitch.visible = false;
  if (S.phase === 'play' && S.live) updateLive(now, dt);
  else activeRing.visible = false;

  if (S.nextAction && now >= S.waitUntil) {
    const f = S.nextAction;
    S.nextAction = null;
    f();
  }
}

// ================= 試合終了 =================
function endMatch() {
  S.phase = 'over';
  const s = S.state;
  updateHud();
  const tA = teamById(s.teamIds[0]), tB = teamById(s.teamIds[1]);
  let msg;
  const mine = S.mode === 'guest' ? 1 : 0;
  if (s.draw || s.score[0] === s.score[1]) msg = '引き分け';
  else msg = (s.score[mine] > s.score[1 - mine]) ? '勝利！' : '負け…';
  if (s.walkoff) showCall('サヨナラ！', '#ffd43d', true);
  setTimeout(() => {
    ui.result.innerHTML = `<div class="big">${msg}</div>
      <div class="score"><span style="color:${tA.color}">${tA.short} ${s.score[0]}</span>-<span style="color:${tB.color}">${s.score[1]} ${tB.short}</span></div>
      <div>安打 ${s.stats[0].h} - ${s.stats[1].h}　本塁打 ${s.stats[0].hr} - ${s.stats[1].hr}</div>
      <button id="again">${S.mode === 'guest' ? 'タイトルへ' : 'もう一度'}</button>`;
    ui.result.classList.remove('hidden');
    $('again').onclick = () => { if (S.mode === 'cpu') startMatch('cpu', { innings: s.innings, lv: S.lv }); else location.reload(); };
  }, s.walkoff ? 2200 : 1200);
}

// ================= 通信 =================
function onNet(m) {
  switch (m.t) {
    case 'start':
      if (!isHost()) { S.state = m.s; ui.netBox.classList.add('hidden'); startMatch('guest'); }
      break;
    case 'state':
      if (!isHost()) {
        if (S.phase === 'result' || S.phase === 'play' || S.phase === 'change') S.pendingAim = m.s;
        else { S.state = m.s; beginAtBat(false); }
      }
      break;
    case 'pitch':
      if (!isHost()) startPitch(m.pitch, m.id, m.seed2);
      break;
    case 'result':
      if (!isHost()) {
        if (m.decision && !(iBat())) showSwing(m.decision.ts);
        playResult(m.pre, m.decision, m.out, m.state);
      }
      break;
    case 'snap':
      if (S.live && !S.live.auth && m.id === S.pitchId) {
        S.live.view = m.v;
        for (const c of m.c || []) showCall(c.text, c.color, c.big);
      }
      break;
    case 'playEnd':
      if (isHost() && S.live && !S.live.ended && m.id === S.pitchId) finishLive(m.res);
      break;
    case 'playDone':
      if (!isHost() && m.id === S.pitchId) afterLive(m.res, m.state);
      break;
    case 'pitchIntent':
      if (isHost() && S.phase === 'aim' && myCtrl(fieldTeam(S.state)) === 'remote') doPitch(m.intent);
      break;
    case 'swing':
      if (isHost() && m.id === S.pitchId && S.decision === undefined) { S.decision = m.sw; showSwing(m.sw.ts); }
      break;
    case 'steal':
      if (isHost() && myCtrl(batTeam(S.state)) === 'remote') S.stealDecl = { id: m.id, jump: m.jump };
      break;
    case 'runCmd':
      if (S.live && S.live.auth && !S.live.ended && m.id === S.pitchId) S.live.runKey = m.cmd;
      break;
    case 'take':
      if (isHost() && m.id === S.pitchId && S.decision === undefined) S.decision = null;
      break;
  }
}

function setupNet(role, code) {
  const net = new Net();
  S.net = net;
  net.onMessage = onNet;
  net.onError = (e) => { ui.netBox.innerHTML = `<div>${e}</div><button class="sub" id="netBack">もどる</button>`; $('netBack').onclick = () => { net.close(); S.net = null; ui.netBox.classList.add('hidden'); ui.title.classList.remove('net'); }; };
  net.onClose = () => { if (S.state && !S.state.over) toast('相手との通信が切れました', 5000); };
  if (role === 'host') {
    net.onOpen = () => { toast('友達が入りました！'); startMatch('host', { innings: +$('optInn').value }); };
    net.host(code);
  } else {
    S.mode = 'guest';
    net.onOpen = () => { ui.netBox.innerHTML = '<div>つながりました！ホストの開始を待っています…</div>'; };
    net.join(code);
  }
}

// ================= タイトル =================
function showTitle() {
  ui.loading.classList.add('hidden');
  ui.title.classList.remove('hidden');
  ui.title.querySelectorAll('.menu button').forEach(b => {
    b.onclick = () => {
      const act = b.dataset.act;
      if (act === 'cpu') startMatch('cpu', { innings: +$('optInn').value, lv: +$('optLv').value });
      if (act === 'host') {
        const code = Net.makeCode();
        ui.title.classList.add('net');
        ui.netBox.classList.remove('hidden');
        ui.netBox.innerHTML = `<div>友達にこのコードを教えてね</div><div class="code">${code}</div><div class="note">友達は「友達の試合に参加」からコードを入力します。<br>あなたは先攻（${TEAMS[0].name}）です</div><button class="sub" id="netBack">やめる</button>`;
        $('netBack').onclick = () => { S.net && S.net.close(); S.net = null; ui.netBox.classList.add('hidden'); ui.title.classList.remove('net'); };
        setupNet('host', code);
      }
      if (act === 'join') {
        ui.title.classList.add('net');
        ui.netBox.classList.remove('hidden');
        ui.netBox.innerHTML = `<div>友達のコードを入力</div><input id="codeIn" maxlength="5" autocomplete="off"><button id="joinGo">参加する</button><div class="note">あなたは後攻（${TEAMS[1].name}）です</div><button class="sub" id="netBack">もどる</button>`;
        const inp = $('codeIn');
        inp.focus();
        const go = () => { const c = inp.value.trim().toUpperCase(); if (c.length < 5) return; ui.netBox.innerHTML = '<div>つないでいます…</div>'; setupNet('guest', c); };
        $('joinGo').onclick = go;
        inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
        $('netBack').onclick = () => { ui.netBox.classList.add('hidden'); ui.title.classList.remove('net'); };
      }
    };
  });
}

// ================= 起動 =================
async function boot() {
  const lt = $('loadText');
  await loadCharacters((p) => { lt.textContent = `読み込み中… ${Math.round(p * 100)}%`; });
  makePeople();
  applyTeamsLook(newState({}));
  resetFielders();
  setBatterStance(TEAMS[0].lineup[0]);
  cursor.visible = false; aim.visible = false;
  requestAnimationFrame(frame);
  if ('ontouchstart' in window) $('optField').value = '1';
  showTitle();
  // テスト用：?auto=cpu で即開始
  const q = new URLSearchParams(location.search);
  if (q.get('auto') === 'cpu') startMatch('cpu', { innings: +(q.get('inn') || 1), lv: 1 });
  window.__S = S; window.__now = nowMs; window.__dbg = { beginAtBat, doPitch, people, camera, bat: () => bat, endMatch, applyPlay };
}
boot().catch((e) => { $('loadText').textContent = '読み込みに失敗しました：' + e.message; console.error(e); });

void battingOrder; void rng; void SWING_LAG;
