// 打球が飛んだ後のプレー（守備・送球・走塁）を決定的に計算して、再生用のタイムラインを返す
import { BASE, BASES, BALL_R, simulateBall, sampleAt, isFairAngle, sprayAngle } from './baseball.js';

export const POSITIONS = {
  P: { x: 0, z: -17.6 },
  C: { x: 0, z: 1.3 },
  '1B': { x: 16, z: -25 },
  '2B': { x: 9, z: -35.5 },
  SS: { x: -9, z: -35.5 },
  '3B': { x: -16, z: -25 },
  LF: { x: -31, z: -76 },
  CF: { x: 0, z: -88 },
  RF: { x: 31, z: -76 },
};
export const POS_ORDER = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];
const INFIELD = { P: 1, C: 1, '1B': 1, '2B': 1, SS: 1, '3B': 1 };

const runSpeed = (pl) => 6.6 + pl.speed * 0.03;
const fieldSpeed = (pl) => 5.7 + pl.speed * 0.02;
const throwSpeed = (pl) => 27 + pl.arm * 0.13;
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// fielders: { pos: player }  runners: [null|player, null|player, null|player]（一塁・二塁・三塁）
export function resolvePlay(hit, ctx) {
  const { fielders, batter, runners, outs } = ctx;
  const sim = simulateBall(hit.v);
  const path = sim.path;
  const tl = { path, throws: [], movers: [], runnerPaths: [], calls: [], end: 0 };
  const res = { kind: '', outsAdd: 0, runs: 0, bases: [null, null, null], rbi: 0, hitBases: 0, foul: false, text: '' };

  // ---- ホームラン ----
  if (sim.hr) {
    const t = sim.hr.t;
    const all = [];
    const order = [[3, runners[2]], [2, runners[1]], [1, runners[0]], [0, batter]];
    let n = 0;
    for (const [b, pl] of order) {
      if (!pl) continue;
      n++;
      const spd = runSpeed(pl) * 0.7;
      tl.runnerPaths.push(runnerPath(pl, b, 4, 0.4 + (3 - b) * 0.15, spd, true));
    }
    res.kind = 'HR'; res.runs = n; res.rbi = n; res.hitBases = 4;
    res.text = n === 4 ? '満塁ホームラン！' : 'ホームラン！';
    tl.calls.push({ t: t + 0.15, text: res.text, big: true, color: '#ffd43d' });
    tl.hr = true;
    tl.end = Math.max(t + 3.4, ...tl.runnerPaths.map(r => r.end)) ;
    tl.ballEnd = t + 1.5;
    return { tl, res };
  }

  // ---- 誰がどこで捕るか ----
  const catcher = findCatch(path, fielders);
  const fb = sim.firstBounce;
  const pickT = catcher ? catcher.t : path[path.length - 1].t;
  const pick = catcher ? catcher.at : path[path.length - 1];

  // ---- ファウル判定 ----
  const caughtInAir = catcher && catcher.air;
  let fair;
  if (caughtInAir) fair = true; // ファウルフライも捕ればアウト
  else if (fb && Math.hypot(fb.x, fb.z) > 30) fair = isFairAngle(fb.x, fb.z);
  else {
    const pass = path.find(s => Math.hypot(s.x, s.z) >= 28 && s.t <= pickT);
    const ref = pass || pick;
    fair = isFairAngle(ref.x, ref.z) && ref.z < 0.5;
  }
  const outOfPlay = !catcher && !fair;
  if (!fair && !caughtInAir) {
    res.kind = 'FOUL'; res.foul = true; res.text = 'ファウル';
    tl.calls.push({ t: 0.6, text: 'ファウル', color: '#ffffff' });
    const ft = Math.min(path[path.length - 1].t, (fb ? fb.t : 2) + 0.6, 3.2);
    tl.end = ft + 0.4; tl.ballEnd = ft; tl.foul = true;
    if (catcher) tl.movers.push(mover(catcher.pos, fielders[catcher.pos], POSITIONS[catcher.pos], catcher.at, 0.25, catcher.arrive));
    void outOfPlay;
    return { tl, res };
  }

  const cf = catcher;
  tl.movers.push(mover(cf.pos, fielders[cf.pos], POSITIONS[cf.pos], cf.at, cf.react, cf.arrive, cf.dive));
  tl.catchT = pickT; tl.catcher = cf.pos; tl.dive = cf.dive;

  // ---- フライ・ライナーをノーバウンドで捕球 → アウト ----
  if (caughtInAir) {
    res.outsAdd = 1;
    const deep = Math.hypot(pick.x, pick.z);
    const label = pick.y > 3.5 || deep > 45 ? 'フライ' : 'ライナー';
    res.kind = 'FLYOUT'; res.text = (cf.dive ? 'ダイビングキャッチ！' : label + 'アウト');
    tl.calls.push({ t: pickT + 0.05, text: cf.dive ? 'ナイスキャッチ！' : 'アウト！', color: '#ff6b6b' });
    res.bases = [...runners];
    // 犠牲フライ：三塁ランナーは深い外野フライならタッチアップで生還
    if (runners[2] && outs + 1 < 3 && deep > 62) {
      const r3 = runners[2];
      const t0 = pickT + 0.05;
      const rp = runnerPath(r3, 3, 4, t0, runSpeed(r3));
      tl.runnerPaths.push(rp);
      res.bases[2] = null; res.runs = 1; res.rbi = 1; res.text = '犠牲フライ';
      tl.calls.push({ t: rp.end, text: '生還！', color: '#ffd43d' });
    }
    tl.end = Math.max(pickT + 1.6, ...tl.runnerPaths.map(r => r.end + 0.4));
    tl.ballEnd = pickT;
    return { tl, res };
  }

  // ---- ゴロ・ヒット：捕った後の送球と走塁 ----
  const fielder = fielders[cf.pos];
  const inf = INFIELD[cf.pos] && Math.hypot(pick.x, pick.z) < 48;
  const rel = pickT + (inf ? 0.42 : 0.65);
  const tspd = throwSpeed(fielder);
  const startT = [0.38, -0.35, -0.35, -0.35]; // 打者・一塁・二塁・三塁走者のスタート
  const occ = [batter, runners[0], runners[1], runners[2]];
  const forcedMin = [1, 0, 0, 0];
  if (runners[0]) forcedMin[1] = 2;
  if (runners[0] && runners[1]) forcedMin[2] = 3;
  if (runners[0] && runners[1] && runners[2]) forcedMin[3] = 4;
  const timeTo = (i, k) => {
    const pl = occ[i];
    const from = i;
    if (k <= from) return 0;
    return startT[i] + (k - from) * BASE / runSpeed(pl) + 0.22 * (k - from - 1);
  };
  const ballTo = (from, fromT, k) => { const d = dist2(from, BASES[k % 4]); return fromT + d / (tspd * (d > 45 ? 0.82 : 1)); };

  let outsNow = outs;
  const outAt = []; // 封殺
  if (inf) {
    // 一番先の封殺できる塁へ投げる（ホーム > 三塁 > 二塁 > 一塁）
    const order = [3, 2, 1, 0].filter(i => occ[i] && (i === 0 || forcedMin[i] > 0));
    let first = null;
    for (const i of order) {
      const k = i === 0 ? 1 : forcedMin[i];
      const tb = ballTo(pick, rel, k);
      if (tb + 0.05 < timeTo(i, k)) { first = { i, k, tb }; break; }
    }
    if (first) {
      outAt.push(first);
      outsNow++;
      tl.throws.push(throwSeg(pick, BASES[first.k % 4], rel, first.tb));
      tl.movers.push(coverMover(first.k, fielders, cf.pos, first.tb));
      // ゲッツー：二塁で封殺 → 一塁へ転送
      if (first.k === 2 && outsNow < 3) {
        const rel2 = first.tb + 0.4;
        const tb2 = ballTo(BASES[2], rel2, 1);
        if (tb2 + 0.05 < timeTo(0, 1)) {
          outAt.push({ i: 0, k: 1, tb: tb2 });
          outsNow++;
          tl.throws.push(throwSeg(BASES[2], BASES[1], rel2, tb2));
          tl.movers.push(coverMover(1, fielders, cf.pos, tb2));
        }
      }
    } else {
      // 一塁へ投げるが間に合わない → 内野安打
      const tb = ballTo(pick, rel, 1);
      tl.throws.push(throwSeg(pick, BASES[1], rel, tb));
      tl.movers.push(coverMover(1, fielders, cf.pos, tb));
    }
  }

  // 各ランナーの到達塁
  const dest = [0, 0, 0, 0];
  const outRunners = new Set(outAt.map(o => o.i));
  let lead = 5;
  for (let i = 3; i >= 0; i--) {
    if (!occ[i]) continue;
    if (outRunners.has(i)) { dest[i] = -1; continue; }
    let k;
    if (inf) {
      // 内野ゴロ：押し出しだけ進む（二塁走者は右方向なら三塁へ）
      k = Math.max(i, forcedMin[i]);
      if (i === 0) k = 1;
      if (i === 2 && !forcedMin[2] && pick.x > 2 && !runners[2]) k = 3;
    } else {
      k = Math.max(i + 1, forcedMin[i]);
      for (let kk = k + 1; kk <= 4; kk++) {
        if (timeTo(i, kk) + 0.3 < ballTo(pick, rel, kk)) k = kk; else break;
      }
      if (i === 0) k = Math.min(k, 3);
    }
    if (lead <= 3) k = Math.min(k, lead - 1);
    k = Math.max(k, i === 0 ? 1 : i);
    dest[i] = k; lead = k;
  }
  if (!inf) {
    // 外野からは先頭ランナーの次の塁へ返球
    const target = Math.min(4, Math.max(...dest.filter(d => d > 0)) + (dest[0] >= 3 ? 0 : 0));
    const tk = target >= 4 ? 4 : target;
    const tb = ballTo(pick, rel, tk);
    tl.throws.push(throwSeg(pick, BASES[tk % 4], rel, tb, true));
    tl.movers.push(coverMover(tk, fielders, cf.pos, tb));
  }

  // 走塁パスとスコア
  let runs = 0;
  const bases = [null, null, null];
  const threeOuts = outsNow >= 3;
  for (let i = 0; i < 4; i++) {
    if (!occ[i]) continue;
    const pl = occ[i];
    if (dest[i] === -1) {
      const o = outAt.find(x => x.i === i);
      tl.runnerPaths.push(runnerPath(pl, i, o.k, startT[i], runSpeed(pl), false, o.tb + 0.05));
      continue;
    }
    const rp = runnerPath(pl, i, dest[i], startT[i], runSpeed(pl));
    tl.runnerPaths.push(rp);
    if (dest[i] >= 4) { if (!threeOuts) runs++; }
    else if (dest[i] >= 1) bases[dest[i] - 1] = pl;
  }

  res.outsAdd = outsNow - outs;
  res.runs = runs;
  res.bases = threeOuts ? [null, null, null] : bases;
  if (outAt.length) {
    res.kind = outAt.length >= 2 ? 'DP' : 'GROUNDOUT';
    res.text = outAt.length >= 2 ? 'ゲッツー！' : 'アウト';
    res.rbi = threeOuts || outAt.length >= 2 ? 0 : runs;
    for (const o of outAt) tl.calls.push({ t: o.tb, text: outAt.length >= 2 && o === outAt[1] ? 'ゲッツー！' : 'アウト！', color: '#ff6b6b' });
  } else {
    const hb = Math.min(3, dest[0]);
    res.kind = 'HIT'; res.hitBases = hb; res.rbi = runs;
    res.text = inf ? '内野安打！' : hb === 3 ? 'スリーベース！' : hb === 2 ? 'ツーベース！' : 'ヒット！';
    const bt = tl.runnerPaths.find(r => r.player === batter);
    tl.calls.push({ t: Math.min(bt ? bt.end : pickT, pickT + 1.2), text: res.text, color: '#7dffb0' });
  }
  if (runs > 0 && res.kind !== 'DP') {
    const scorer = tl.runnerPaths.filter(r => r.to >= 4).map(r => r.end).sort((a, b) => a - b)[0];
    tl.calls.push({ t: scorer || 2, text: runs >= 2 ? runs + '点追加！' : '1点追加！', color: '#ffd43d' });
  }
  tl.ballEnd = Math.max(pickT, ...tl.throws.map(t => t.t1));
  tl.end = Math.max(tl.ballEnd + 0.8, ...tl.runnerPaths.map(r => r.end + 0.5));
  return { tl, res };
}

// どの野手が一番早く捕れるか
function findCatch(path, fielders) {
  let best = null;
  for (let i = 0; i < path.length; i += 2) {
    const s = path[i];
    if (s.t < 0.22) continue;
    const reachH = s.air ? 2.5 : 1.2;
    if (s.y > reachH + 0.6) continue;
    for (const pos of POS_ORDER) {
      const pl = fielders[pos];
      if (!pl) continue;
      if (pos === 'C' && !(s.air && s.t > 1.2 && Math.hypot(s.x, s.z) < 25)) continue;
      if (pos === 'P' && s.t > 2.5) continue;
      const home = POSITIONS[pos];
      const react = (INFIELD[pos] ? 0.3 : 0.55) + (s.air ? 0.05 : 0);
      const spd = fieldSpeed(pl);
      const d = Math.hypot(s.x - home.x, s.z - home.z);
      if (pos === 'P' && d > 2.2) continue;
      const reach = s.air ? 0.8 : 0.55;
      const need = react + 0.3 + Math.max(0, d - reach) / spd;
      const diveReach = 0.7 + pl.field * 0.008;
      const needDive = react + 0.3 + Math.max(0, d - reach - diveReach) / spd;
      let ok = need <= s.t && s.y <= reachH;
      let dive = false;
      if (!ok && s.air && s.y <= 1.6 && needDive <= s.t && s.t > 0.6) { ok = true; dive = true; }
      if (!ok) continue;
      if (!best || s.t < best.t - 1e-6) {
        best = { pos, t: s.t, at: { x: s.x, y: s.y, z: s.z }, air: s.air, react, arrive: Math.min(s.t, need), dive };
      }
    }
    if (best) break;
  }
  if (!best) {
    // 止まったボールに一番早く着く野手
    const s = path[path.length - 1];
    for (const pos of POS_ORDER) {
      const pl = fielders[pos];
      if (!pl || pos === 'C' || pos === 'P') continue;
      const home = POSITIONS[pos];
      const need = 0.6 + Math.hypot(s.x - home.x, s.z - home.z) / fieldSpeed(pl);
      const t = Math.max(s.t, need);
      if (!best || t < best.t) best = { pos, t, at: { x: s.x, y: BALL_R, z: s.z }, air: false, react: 0.5, arrive: need, dive: false };
    }
  }
  return best;
}

function mover(pos, player, from, to, t0, t1, dive) {
  return { pos, from: { x: from.x, z: from.z }, to: { x: to.x, z: to.z }, t0, t1: Math.max(t0 + 0.05, t1), dive: !!dive };
}

function coverMover(k, fielders, exclude, tArrive) {
  const who = k === 1 ? ['1B', '2B', 'P'] : k === 2 ? ['SS', '2B'] : k === 3 ? ['3B', 'SS'] : ['C'];
  const pos = who.find(p => p !== exclude) || who[0];
  const b = BASES[k % 4];
  const target = k === 4 || k === 0 ? { x: 0, z: 0.6 } : { x: b.x, z: b.z };
  return { pos, from: { ...POSITIONS[pos] }, to: target, t0: 0.3, t1: Math.max(0.6, tArrive - 0.4), cover: true };
}

function throwSeg(from, to, t0, t1, relay) {
  const d = Math.hypot(to.x - from.x, to.z - from.z);
  return { from: { x: from.x, y: 1.6, z: from.z }, to: { x: to.x, y: 1.3, z: to.z }, t0, t1, h: Math.min(6, d * (relay ? 0.07 : 0.035)) };
}

// 塁を順番に回るパス
function runnerPath(player, fromBase, toBase, t0, spd, jog, outT) {
  const pts = [{ x: BASES[fromBase].x, z: BASES[fromBase].z, t: t0 }];
  let t = t0;
  const last = Math.min(4, toBase);
  for (let k = fromBase + 1; k <= last; k++) {
    const b = BASES[k % 4];
    t += BASE / spd + (k < last ? 0.22 : 0);
    pts.push({ x: b.x, z: b.z, t });
  }
  if (outT != null) {
    // アウトになった走者は塁の手前で止まる
    const lastP = pts[pts.length - 1], prev = pts[pts.length - 2];
    const k = Math.min(1, (outT - prev.t) / (lastP.t - prev.t));
    lastP.x = prev.x + (lastP.x - prev.x) * Math.min(0.92, k);
    lastP.z = prev.z + (lastP.z - prev.z) * Math.min(0.92, k);
    lastP.t = Math.min(lastP.t, outT);
  }
  return { player, from: fromBase, to: outT != null ? -1 : toBase, pts, end: pts[pts.length - 1].t, jog: !!jog, out: outT != null };
}

export function posAt(pathPts, t) {
  if (t <= pathPts[0].t) return pathPts[0];
  for (let i = 1; i < pathPts.length; i++) {
    const a = pathPts[i - 1], b = pathPts[i];
    if (t <= b.t) { const k = (t - a.t) / Math.max(1e-6, b.t - a.t); return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, moving: true, dir: Math.atan2(b.x - a.x, b.z - a.z) }; }
  }
  const l = pathPts[pathPts.length - 1];
  return { x: l.x, z: l.z, moving: false };
}

export function throwPos(seg, t) {
  const k = Math.max(0, Math.min(1, (t - seg.t0) / Math.max(1e-6, seg.t1 - seg.t0)));
  return { x: seg.from.x + (seg.to.x - seg.from.x) * k, y: seg.from.y + (seg.to.y - seg.from.y) * k + 4 * seg.h * k * (1 - k), z: seg.from.z + (seg.to.z - seg.from.z) * k };
}

export { sampleAt, BALL_R, sprayAngle };
