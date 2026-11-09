// 試合の進行（ホストが権威を持つ）。画面は main.js、通信は net.js
import { TEAMS, PITCHES, battingOrder } from './data.js';
import { makePitch, judgeSwing, inZone, rng, gauss, SWING_LAG, ZONE } from './baseball.js';

export function newState(opts) {
  const teams = opts.teams || [TEAMS[0], TEAMS[1]];
  return {
    innings: opts.innings || 3,
    inning: 1, top: true, outs: 0, balls: 0, strikes: 0,
    score: [0, 0],
    line: [[], []],
    order: [0, 0],
    bases: [null, null, null],     // 打順の番号
    teamIds: teams.map(t => t.id),
    fatigue: [0, 0],
    pitches: [0, 0],
    stats: [{ h: 0, hr: 0, k: 0 }, { h: 0, hr: 0, k: 0 }],
    phase: 'aim',
    over: false,
    pitchId: 0,
    seq: 0,
    lastText: '',
  };
}

export const teamById = (id) => TEAMS.find(t => t.id === id);
export const batTeam = (s) => (s.top ? 0 : 1);
export const fieldTeam = (s) => (s.top ? 1 : 0);
export function currentBatter(s) {
  const tb = batTeam(s);
  const order = battingOrder(teamById(s.teamIds[tb]));
  return { idx: s.order[tb], player: order[s.order[tb]] };
}
export function currentPitcher(s) { return teamById(s.teamIds[fieldTeam(s)]).pitcher; }
export function fieldersOf(s) {
  const t = teamById(s.teamIds[fieldTeam(s)]);
  const f = {};
  for (const p of t.lineup) f[p.pos] = p;
  f.P = { ...t.pitcher, speed: 50, arm: 72, field: 60 };
  return f;
}
export function runnersOf(s) {
  const order = battingOrder(teamById(s.teamIds[batTeam(s)]));
  return s.bases.map(i => (i == null ? null : order[i]));
}

// ===== CPU =====
export function cpuPitchIntent(s, seed, lv) {
  const r = rng(seed);
  const pit = currentPitcher(s);
  const types = Object.keys(pit.pitches);
  const weights = types.map(t => (t === 'ST' ? 1.6 : 0.6 + (pit.pitches[t] || 1) * 0.12));
  let x = r() * weights.reduce((a, b) => a + b, 0), type = types[0];
  for (let i = 0; i < types.length; i++) { x -= weights[i]; if (x <= 0) { type = types[i]; break; } }
  const ahead = s.strikes > s.balls;
  const behind = s.balls >= 3 || s.balls > s.strikes + 1;
  const edge = behind ? 0.7 : ahead ? 1.5 : 1.2;
  const cx = (ZONE.x0 + ZONE.x1) / 2, cy = (ZONE.y0 + ZONE.y1) / 2;
  const hw = (ZONE.x1 - ZONE.x0) / 2, hh = (ZONE.y1 - ZONE.y0) / 2;
  const target = {
    x: cx + (r() * 2 - 1) * hw * edge * (0.9 + lv * 0.05),
    y: cy + (r() * 2 - 1) * hh * edge * (0.9 + lv * 0.05),
  };
  if (type === 'FK' || type === 'SK' || type === 'CH') target.y = Math.min(target.y, cy - hh * 0.2);
  return { type, target };
}

export function cpuSwing(s, pitch, batter, seed, lv) {
  const r = rng(seed ^ 0x9e3779b9);
  const end = pitch.end;
  const zoneIn = inZone(end);
  const pSwing = zoneIn ? [0.62, 0.72, 0.8][lv] + (s.strikes === 2 ? 0.15 : 0) : [0.32, 0.24, 0.16][lv] + (s.strikes === 2 ? 0.12 : 0);
  if (s.balls === 3 && s.strikes < 2 && !zoneIn && r() < 0.5) return null;
  if (r() > pSwing) return null;
  // 変化球は読み違えやすい
  const breaking = pitch.type !== 'ST';
  const posErr = [0.085, 0.06, 0.042][lv] * (breaking ? 1.25 : 1);
  const timeErr = [0.08, 0.058, 0.042][lv] * (breaking ? 1.2 : 1);
  return {
    ts: pitch.T - SWING_LAG + gauss(r) * timeErr,
    cx: end.x + gauss(r) * posErr,
    cy: end.y + gauss(r) * posErr * 0.8,
    power: batter.power >= 70 && s.balls > s.strikes && r() < 0.5,
  };
}

// ===== 1球の判定 → 新しい状態 =====
// decision: null（見送り） or swing
export function resolvePitch(s, pitch, decision, seed) {
  const n = structuredClone(s);
  const bt = batTeam(n);
  const ft = fieldTeam(n);
  const { player: batter } = currentBatter(n);
  const out = { kind: '', text: '', call: '', hit: null, ctx: null, playRes: null, swung: !!decision };
  n.pitches[ft]++;
  n.fatigue[ft] = Math.min(1, n.fatigue[ft] + 1 / (currentPitcher(n).stamina * 1.25));

  if (!decision) {
    if (inZone(pitch.end)) { out.kind = 'STRIKE'; out.call = 'ストライク！'; addStrike(n, out, true); }
    else { out.kind = 'BALL'; out.call = 'ボール'; n.balls++; if (n.balls >= 4) { out.call = 'フォアボール'; walk(n); } }
    return { state: n, out };
  }
  const h = judgeSwing(pitch, batter, decision, seed);
  if (h.miss) { out.kind = 'MISS'; out.call = '空振り！'; addStrike(n, out, false); return { state: n, out }; }

  // 打球：この先は live.js でプレーを動かし、applyPlay で状態に反映する
  out.kind = 'CONTACT';
  out.hit = h;
  return { state: n, out };
}

// プレーの結果 res を状態に反映
export function applyPlay(s, res) {
  const n = structuredClone(s);
  if (res.kind === 'FOUL') { if (n.strikes < 2) n.strikes++; return n; }
  const bt = batTeam(n);
  n.outs += res.outsAdd;
  n.bases = res.bases ? res.bases.slice() : [null, null, null];
  addRuns(n, res.runs);
  if (res.kind === 'HIT' || res.kind === 'HR') n.stats[bt].h++;
  if (res.kind === 'HR') n.stats[bt].hr++;
  nextBatter(n);
  checkHalf(n);
  return n;
}

// 打球の場面（live.js 用）
export function playCtx(s) {
  const order = battingOrder(teamById(s.teamIds[batTeam(s)]));
  const { idx, player } = currentBatter(s);
  return {
    fielders: fieldersOf(s),
    batter: { pl: player, idx },
    runners: s.bases.map(i => (i == null ? null : { pl: order[i], idx: i })),
    outs: s.outs,
  };
}

function addStrike(n, out, looking) {
  n.strikes++;
  if (n.strikes >= 3) {
    out.call = looking ? '見逃し三振！' : '三振！';
    out.kind = 'K';
    n.stats[fieldTeam(n)].k++;
    n.outs++;
    nextBatter(n);
    checkHalf(n);
  }
}

function walk(n) {
  const b = n.bases;
  const { idx } = currentBatter(n);
  if (b[0] != null) {
    if (b[1] != null) {
      if (b[2] != null) addRuns(n, 1);
      b[2] = b[1];
    }
    b[1] = b[0];
  }
  b[0] = idx;
  nextBatter(n);
}

function nextBatter(n) {
  const bt = batTeam(n);
  n.order[bt] = (n.order[bt] + 1) % 9;
  n.balls = 0; n.strikes = 0;
}

function addRuns(n, r) {
  if (!r) return;
  const bt = batTeam(n);
  n.score[bt] += r;
  const i = n.inning - 1;
  n.line[bt][i] = (n.line[bt][i] || 0) + r;
  // サヨナラ
  if (!n.top && n.inning >= n.innings && n.score[1] > n.score[0]) { n.over = true; n.walkoff = true; }
}

function checkHalf(n) {
  if (n.over) return;
  if (n.outs < 3) return;
  const bt = batTeam(n);
  const i = n.inning - 1;
  n.line[bt][i] = n.line[bt][i] || 0;
  n.outs = 0; n.balls = 0; n.strikes = 0; n.bases = [null, null, null];
  n.change = true;
  if (n.top) {
    if (n.inning >= n.innings && n.score[1] > n.score[0]) { n.over = true; return; }
    n.top = false;
  } else {
    if (n.inning >= n.innings && n.score[0] !== n.score[1]) { n.over = true; return; }
    if (n.inning >= n.innings + 3) { n.over = true; n.draw = true; return; }
    n.top = true; n.inning++;
  }
}

export function pitchFor(s, intent, seed) {
  const ft = fieldTeam(s);
  const pit = currentPitcher(s);
  const type = PITCHES[intent.type] && (intent.type === 'ST' || pit.pitches[intent.type] != null) ? intent.type : 'ST';
  return makePitch(pit, type, intent.target, seed, s.fatigue[ft]);
}
