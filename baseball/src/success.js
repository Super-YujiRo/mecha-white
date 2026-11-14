// サクセス（お試し版）：1年夏までの12ターンで選手を育てる
import { PITCHES, rank } from './data.js';

const SAVE_KEY = 'hakkyu_success_players';
const TURNS = [
  '4月 前半', '4月 後半', '5月 前半', '5月 後半', '6月 前半', '練習試合',
  '6月 後半', '7月 前半', '7月 中旬', '7月 後半', '夏の大会', '夏の大会 決勝',
];
const PT = { str: '筋力', agi: '敏捷', tec: '技術', brk: '変化球', mnd: '精神' };
const MOODS = ['絶不調', '不調', '普通', '好調', '絶好調'];
const MOOD_K = [0.6, 0.8, 1, 1.2, 1.4];
const MATES = [
  { id: 'haruka', name: '春野 灯', role: 'マネージャー', face: '#ff8fb1' },
  { id: 'goda', name: '剛田 鉄平', role: '3年 キャプテン', face: '#ff9f43' },
  { id: 'kuro', name: '黒崎 迅', role: '同級生 ライバル', face: '#5f6c86' },
  { id: 'kantoku', name: '鬼頭 監督', role: '監督', face: '#7a5c3e' },
  { id: 'mame', name: '豆田 一', role: '同級生', face: '#3ee07a' },
];
const FIELD_TR = [
  { id: 'bat', name: '打撃', pts: { tec: 10, str: 5 }, hp: 16, mate: 'kuro' },
  { id: 'pow', name: '筋力', pts: { str: 13 }, hp: 20, mate: 'goda' },
  { id: 'run', name: '走塁', pts: { agi: 12, mnd: 3 }, hp: 16, mate: 'mame' },
  { id: 'arm', name: '肩力', pts: { str: 7, agi: 6 }, hp: 15, mate: 'goda' },
  { id: 'def', name: '守備', pts: { tec: 7, agi: 6 }, hp: 14, mate: 'mame' },
];
const PITCH_TR = [
  { id: 'velo', name: '球速', pts: { str: 13 }, hp: 20, mate: 'goda' },
  { id: 'ctl', name: 'コントロール', pts: { tec: 11, mnd: 3 }, hp: 14, mate: 'kuro' },
  { id: 'sta', name: 'スタミナ', pts: { str: 6, mnd: 7 }, hp: 18, mate: 'mame' },
  { id: 'brk', name: '変化球', pts: { brk: 12, tec: 3 }, hp: 15, mate: 'kuro' },
  { id: 'def', name: '守備', pts: { tec: 6, agi: 6 }, hp: 13, mate: 'mame' },
];

let S = null, root = null, onExit = null;

export function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; }
}
function savePlayers(list) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) { } }
export function setInTeam(id) {
  const list = loadPlayers(), t = list.find(q => q.id === id);
  if (!t) return list;
  const on = !t.inTeam;
  // 投手は1人、野手は同じ守備位置で1人まで
  if (on) for (const p of list) if (p !== t && p.kind === t.kind && (t.kind === 'P' || p.pos === t.pos)) p.inTeam = false;
  t.inTeam = on;
  savePlayers(list);
  return list;
}

// 自分のチームに、サクセスで作った選手を入れる（CPU対戦用）
export function applyMyPlayers(team) {
  const list = loadPlayers().filter(p => p.inTeam);
  const t = structuredClone(team);
  for (const p of list) {
    if (p.kind === 'P') {
      t.pitcher = { name: p.name, velo: p.velo, control: p.control, stamina: p.stamina, throws: p.hand, pitches: { ST: 0, ...p.pitches } };
    } else {
      const i = Math.max(0, t.lineup.findIndex(x => x.pos === p.pos));
      t.lineup[i] = { name: p.name, pos: p.pos, meet: p.meet, power: p.power, speed: p.speed, arm: p.arm, field: p.field, bats: p.hand };
    }
  }
  return t;
}

export function openSuccess(el, exit) {
  root = el; onExit = exit;
  root.classList.remove('hidden');
  renderStart();
}

function h(html) { root.innerHTML = `<div class="sc-box">${html}</div>`; }
const $ = (id) => root.querySelector('#' + id);

// ---------- はじめ ----------
function renderStart() {
  const saved = loadPlayers();
  h(`<div class="sc-title">サクセス <small>お試し版・1年夏まで</small></div>
    <div class="sc-row"><label>名前 <input id="scName" maxlength="8" value="${['山田 太郎', '佐藤 大輝', '鈴木 颯太', '高橋 蒼'][Math.floor(Math.random() * 4)]}"></label></div>
    <div class="sc-row">
      <label><input type="radio" name="kind" value="F" checked> 野手</label>
      <label><input type="radio" name="kind" value="P"> 投手</label>
      <label>利き手 <select id="scHand"><option value="R">右</option><option value="L">左</option></select></label>
      <label id="scPosL">守備位置 <select id="scPos">${['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].map(p => `<option>${p}</option>`).join('')}</select></label>
    </div>
    <div class="sc-btns"><button id="scGo" class="primary">入学する</button><button id="scBack">もどる</button></div>
    ${saved.length ? `<div class="sc-sub">作った選手（「チームに入れる」とCPU対戦で自分のチームに入ります）</div><div class="sc-list">${saved.map(p => `<div class="sc-card ${p.inTeam ? 'on' : ''}"><b>${p.name}</b> <span>${p.kind === 'P' ? '投手' : p.pos}</span> <em>${p.kind === 'P' ? `${p.velo}km ${rank(p.control)}/${rank(p.stamina)}` : `${rank(p.meet)}${rank(p.power)}${rank(p.speed)}${rank(p.arm)}${rank(p.field)}`}</em><button data-id="${p.id}">${p.inTeam ? 'チームから外す' : 'チームに入れる'}</button></div>`).join('')}</div>` : ''}`);
  const sync = () => { $('scPosL').style.display = root.querySelector('input[name=kind]:checked').value === 'F' ? '' : 'none'; };
  root.querySelectorAll('input[name=kind]').forEach(r => (r.onchange = sync));
  $('scBack').onclick = () => { root.classList.add('hidden'); onExit && onExit(); };
  $('scGo').onclick = () => {
    const kind = root.querySelector('input[name=kind]:checked').value;
    start({ name: ($('scName').value || '名無し').slice(0, 8), kind, hand: $('scHand').value, pos: $('scPos').value });
  };
  root.querySelectorAll('.sc-card button').forEach(b => (b.onclick = () => { setInTeam(b.dataset.id); renderStart(); }));
}

function start(o) {
  S = {
    ...o, turn: 0, hp: 100, mood: 2, pts: { str: 0, agi: 0, tec: 0, brk: 0, mnd: 0 },
    st: o.kind === 'P' ? { velo: 128, control: 40, stamina: 40, field: 40, pitches: {} } : { meet: 40, power: 40, speed: 45, arm: 45, field: 40 },
    like: Object.fromEntries(MATES.map(m => [m.id, 0])), log: [], hurt: 0, wins: 0,
  };
  story(['入学式の日。', `「${S.name}です！ よろしくお願いします！」`, '鬼頭監督「声だけは一人前だな。夏までに使える選手になってみせろ」'], renderTurn);
}

// ---------- 話（イベント） ----------
function story(lines, next, choices) {
  let i = 0;
  const show = () => {
    const last = i >= lines.length - 1;
    h(`<div class="sc-head">${head()}</div><div class="sc-story">${lines.slice(0, i + 1).map(l => `<p>${l}</p>`).join('')}</div>
      <div class="sc-btns">${last && choices ? choices.map((c, k) => `<button data-k="${k}">${c.t}</button>`).join('') : `<button id="scNext" class="primary">▶</button>`}</div>`);
    if (last && choices) root.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => choices[+b.dataset.k].f()));
    else $('scNext').onclick = () => { if (last) next(); else { i++; show(); } };
  };
  show();
}
function head() {
  if (!S) return '';
  const t = TURNS[Math.min(S.turn, TURNS.length - 1)];
  return `<span class="sc-date">${t}</span><span class="sc-hp">体力<i><b style="width:${S.hp}%;background:${S.hp < 30 ? '#ff4d4d' : S.hp < 60 ? '#ffc83d' : '#3ee07a'}"></b></i></span><span class="sc-mood m${S.mood}">${MOODS[S.mood]}</span>`;
}
function ptsHtml() {
  return `<div class="sc-pts">${Object.entries(PT).filter(([k]) => S.kind === 'P' || k !== 'brk').map(([k, n]) => `<span>${n}<b>${S.pts[k]}</b></span>`).join('')}</div>`;
}
function statsHtml() {
  const st = S.st;
  if (S.kind === 'P') return `<div class="sc-stats"><span>球速<b>${st.velo}km</b></span><span>コントロール<b class="rk ${rank(st.control)}">${rank(st.control)}</b>${st.control}</span><span>スタミナ<b class="rk ${rank(st.stamina)}">${rank(st.stamina)}</b>${st.stamina}</span><span>守備<b class="rk ${rank(st.field)}">${rank(st.field)}</b>${st.field}</span><span>変化球<b>${Object.entries(st.pitches).map(([k, v]) => PITCHES[k].short + v).join(' ') || 'なし'}</b></span></div>`;
  return `<div class="sc-stats">${[['meet', 'ミート'], ['power', 'パワー'], ['speed', '走力'], ['arm', '肩力'], ['field', '守備']].map(([k, n]) => `<span>${n}<b class="rk ${rank(st[k])}">${rank(st[k])}</b>${st[k]}</span>`).join('')}</div>`;
}

// ---------- ターン ----------
function renderTurn() {
  if (S.turn === 5) return game('練習試合', 1, () => { S.turn++; renderTurn(); });
  if (S.turn === 10) return tournament();
  const tr = S.kind === 'P' ? PITCH_TR : FIELD_TR;
  // その週に一緒に練習する仲間（ボーナス）
  if (!S.mates || S.matesTurn !== S.turn) { S.mates = {}; for (const t of tr) if (Math.random() < 0.45) S.mates[t.id] = t.mate; S.matesTurn = S.turn; }
  h(`<div class="sc-head">${head()}</div>${statsHtml()}${ptsHtml()}
    <div class="sc-sub">今週の練習</div>
    <div class="sc-train">${tr.map(t => { const m = S.mates[t.id] && MATES.find(x => x.id === S.mates[t.id]); return `<button data-t="${t.id}"><b>${t.name}</b><small>${Object.entries(t.pts).map(([k, v]) => PT[k] + '+' + Math.round(v * gainK(t))).join(' ')}</small>${m ? `<i style="background:${m.face}">${m.name.slice(0, 2)}</i>` : ''}</button>`; }).join('')}
      <button data-t="rest" class="alt"><b>休む</b><small>体力 回復</small></button><button data-t="play" class="alt"><b>遊ぶ</b><small>やる気 アップ</small></button></div>
    <div class="sc-btns"><button id="scUp">能力アップ</button></div>
    ${S.hp < 30 ? '<div class="sc-warn">体力が少ないとケガをしやすい！</div>' : ''}`);
  root.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => doTrain(b.dataset.t)));
  $('scUp').onclick = () => upgrade(renderTurn);
}
function gainK(t) { return MOOD_K[S.mood] * (S.mates && S.mates[t.id] ? 1.35 : 1); }

function doTrain(id) {
  const lines = [];
  if (id === 'rest') { S.hp = Math.min(100, S.hp + 55); lines.push('しっかり休んだ。', '体力が回復した！'); }
  else if (id === 'play') { S.hp = Math.min(100, S.hp + 15); S.mood = Math.min(4, S.mood + 1); lines.push('豆田と河原でキャッチボールをして遊んだ。', `やる気が上がった！（${MOODS[S.mood]}）`); }
  else {
    const t = (S.kind === 'P' ? PITCH_TR : FIELD_TR).find(x => x.id === id);
    // ケガ：体力が少ないと起こりやすい
    if (S.hp < 30 && Math.random() < (30 - S.hp) / 45 + 0.1) {
      S.hp = Math.max(0, S.hp - 10); S.mood = Math.max(0, S.mood - 1);
      lines.push(`${t.name}練習中に足をひねってしまった……`, 'ケガをした。今週の練習は休むことに……', `やる気が下がった（${MOODS[S.mood]}）`);
    } else {
      const k = gainK(t), got = [];
      for (const [p, v] of Object.entries(t.pts)) { const g = Math.round(v * k * (0.9 + Math.random() * 0.2)); S.pts[p] += g; got.push(`${PT[p]}+${g}`); }
      S.hp = Math.max(0, S.hp - t.hp);
      const m = S.mates[t.id] && MATES.find(x => x.id === S.mates[t.id]);
      if (m) { S.like[m.id] += 10; lines.push(`${m.name}と一緒に${t.name}練習！`); } else lines.push(`${t.name}の練習をした。`);
      lines.push(got.join('　'));
    }
  }
  S.turn++;
  story(lines, () => maybeEvent(renderTurn));
}

// ---------- ランダムイベント（オリジナルの仲間） ----------
const EVENTS = [
  () => ({ lines: ['マネージャーの春野がスポーツドリンクを差し入れてくれた。', '春野「無理しすぎないでね。……見てるから」'], f: () => { S.hp = Math.min(100, S.hp + 20); S.like.haruka += 10; return '体力が回復した！'; } }),
  () => ({ lines: ['キャプテンの剛田に呼び止められた。', '剛田「おい、筋トレ付き合え。根性見せてみろ！」'], choices: [
    { t: '付き合う', r: () => { S.pts.str += 14; S.hp = Math.max(0, S.hp - 15); S.like.goda += 10; return '筋力+14　体力が減った'; } },
    { t: '今日はやめておく', r: () => { S.mood = Math.max(0, S.mood - 1); return `剛田「そうか……」やる気が下がった（${MOODS[S.mood]}）`; } }] }),
  () => ({ lines: ['ライバルの黒崎が、一人で居残り練習をしている。', '黒崎「……何見てんだ。お前には負けねえよ」'], f: () => { S.pts.mnd += 8; S.pts.tec += 6; S.like.kuro += 10; return '負けていられない！ 精神+8　技術+6'; } }),
  () => ({ lines: ['鬼頭監督「お前、最近いい顔になってきたな」'], f: () => { S.mood = Math.min(4, S.mood + 1); return `やる気が上がった！（${MOODS[S.mood]}）`; } }),
  () => ({ lines: ['豆田「なあ、帰りにラーメン食べてかない？」'], choices: [
    { t: '行く', r: () => { S.hp = Math.min(100, S.hp + 10); S.mood = Math.min(4, S.mood + 1); return `楽しかった！ やる気が上がった（${MOODS[S.mood]}）`; } },
    { t: '自主練する', r: () => { S.pts.agi += 7; S.pts.tec += 5; S.hp = Math.max(0, S.hp - 8); return '敏捷+7　技術+5'; } }] }),
  () => ({ lines: ['夜、素振りをしていると何かをつかんだ気がした。'], f: () => { const k = S.kind === 'P' ? 'brk' : 'tec'; S.pts[k] += 10; return `${PT[k]}+10`; } }),
  () => ({ lines: ['寝坊して朝練に遅れてしまった……', '鬼頭監督「グラウンド10周だ！」'], f: () => { S.hp = Math.max(0, S.hp - 10); S.pts.agi += 4; return '体力が減った　敏捷+4'; } }),
];
function maybeEvent(next) {
  if (S.turn >= TURNS.length || Math.random() > 0.5) return next();
  const e = EVENTS[Math.floor(Math.random() * EVENTS.length)]();
  if (e.choices) story(e.lines, null, e.choices.map(c => ({ t: c.t, f: () => story([c.r()], next) })));
  else story(e.lines, () => story([e.f()], next));
}

// ---------- 能力アップ（経験点を使う） ----------
function costOf(key, v) {
  const step = 2 + Math.max(0, Math.floor((v - 30) / 10)) * 2; // 上がるほど高くなる
  const mix = {
    meet: { tec: 1, str: 0.5 }, power: { str: 1, tec: 0.5 }, speed: { agi: 1 }, arm: { str: 0.6, agi: 0.6 }, field: { tec: 0.6, agi: 0.6 },
    velo: { str: 2 }, control: { tec: 1, mnd: 0.4 }, stamina: { str: 0.6, mnd: 0.8 },
  }[key];
  const c = {};
  for (const [p, m] of Object.entries(mix)) c[p] = Math.ceil(step * m);
  return c;
}
const canPay = (c) => Object.entries(c).every(([p, v]) => S.pts[p] >= v);
const pay = (c) => { for (const [p, v] of Object.entries(c)) S.pts[p] -= v; };
function upgrade(back) {
  const keys = S.kind === 'P' ? [['velo', '球速', 160], ['control', 'コントロール', 99], ['stamina', 'スタミナ', 99], ['field', '守備', 99]] : [['meet', 'ミート', 99], ['power', 'パワー', 99], ['speed', '走力', 99], ['arm', '肩力', 99], ['field', '守備', 99]];
  const rows = keys.map(([k, n, max]) => {
    const v = S.st[k], c = costOf(k, k === 'velo' ? 30 + (v - 128) * 2.5 : v);
    return `<div class="sc-up"><span>${n}</span><b>${k === 'velo' ? v + 'km' : `<i class="rk ${rank(v)}">${rank(v)}</i>${v}`}</b><small>${Object.entries(c).map(([p, x]) => PT[p] + x).join(' ')}</small><button data-k="${k}" ${v >= max || !canPay(c) ? 'disabled' : ''}>+1</button></div>`;
  });
  let brk = '';
  if (S.kind === 'P') {
    const own = Object.keys(S.st.pitches);
    brk = `<div class="sc-sub">変化球</div>${own.map(k => { const lv = S.st.pitches[k], c = { brk: 12 + lv * 8 }; return `<div class="sc-up"><span>${PITCHES[k].name}</span><b>${lv}</b><small>変化球${c.brk}</small><button data-p="${k}" ${lv >= 7 || !canPay(c) ? 'disabled' : ''}>+1</button></div>`; }).join('')}
      ${own.length < 3 ? `<div class="sc-up"><span>新しい球種</span><select id="scNewP">${Object.keys(PITCHES).filter(k => k !== 'ST' && !own.includes(k)).map(k => `<option value="${k}">${PITCHES[k].name}</option>`).join('')}</select><small>変化球25</small><button id="scLearn" ${S.pts.brk < 25 ? 'disabled' : ''}>覚える</button></div>` : ''}`;
  }
  h(`<div class="sc-head">${head()}</div>${ptsHtml()}<div class="sc-sub">能力アップ</div>${rows.join('')}${brk}<div class="sc-btns"><button id="scDone" class="primary">もどる</button></div>`);
  root.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => { const k = b.dataset.k, v = S.st[k], c = costOf(k, k === 'velo' ? 30 + (v - 128) * 2.5 : v); if (canPay(c)) { pay(c); S.st[k]++; } upgrade(back); }));
  root.querySelectorAll('[data-p]').forEach(b => (b.onclick = () => { const k = b.dataset.p, c = { brk: 12 + S.st.pitches[k] * 8 }; if (canPay(c)) { pay(c); S.st.pitches[k]++; } upgrade(back); }));
  if ($('scLearn')) $('scLearn').onclick = () => { if (S.pts.brk >= 25) { S.pts.brk -= 25; S.st.pitches[$('scNewP').value] = 1; } upgrade(back); };
  $('scDone').onclick = back;
}

// ---------- 試合（結果だけ、見どころを文章で） ----------
function power() {
  const st = S.st;
  return S.kind === 'P' ? ((st.velo - 120) * 1.6 + st.control + st.stamina * 0.6 + Object.values(st.pitches).reduce((a, b) => a + b * 4, 0)) / 3.2 : (st.meet * 1.2 + st.power + st.speed * 0.5 + st.field * 0.4) / 3.1;
}
function game(title, oppLv, next) {
  const me = power(), lines = [`${title}！ 相手は${['緑ヶ丘高校', '港南工業', '白鷺学園', '帝王実業'][oppLv] || '強豪校'}。`];
  let score = 0, got = 0;
  if (S.kind === 'F') {
    let hits = 0;
    for (let i = 0; i < 4; i++) {
      const p = 0.18 + (S.st.meet - 40) * 0.006 + MOOD_K[S.mood] * 0.05 - oppLv * 0.03;
      const r = Math.random();
      if (r < p * 0.25 * (S.st.power / 60)) { lines.push(`第${i + 1}打席：ホームラン！！`); score += 4; hits++; }
      else if (r < p) { lines.push(`第${i + 1}打席：${Math.random() < 0.3 ? 'ツーベース' : 'ヒット'}！`); score += 2; hits++; }
      else lines.push(`第${i + 1}打席：${['三振', 'セカンドゴロ', 'センターフライ', 'ショートゴロ'][Math.floor(Math.random() * 4)]}`);
    }
    got = 8 + score * 4;
    lines.push(`今日は${hits}安打。`);
  } else {
    const er = Math.max(0, Math.round((3.5 - (me - 40) * 0.06 + oppLv * 0.7) * (0.5 + Math.random())));
    const inn = Math.min(9, Math.round(4 + S.st.stamina / 18));
    lines.push(`${inn}回を投げて${er}失点。${er <= 1 ? 'ナイスピッチング！' : er >= 4 ? '打ち込まれてしまった……' : ''}`);
    score = Math.max(0, 6 - er); got = 10 + score * 4;
  }
  const win = Math.random() < 0.35 + (me - 45) * 0.012 + score * 0.04 - oppLv * 0.08;
  lines.push(win ? '試合は勝利！' : '試合は負けてしまった……');
  for (const k of Object.keys(S.pts)) if (k !== 'brk' || S.kind === 'P') S.pts[k] += Math.round(got / 3);
  lines.push(`経験点を手に入れた！（各+${Math.round(got / 3)}）`);
  S.mood = Math.max(0, Math.min(4, S.mood + (win ? 1 : -1)));
  story(lines, () => next(win));
}
function tournament() {
  const round = (n) => { S.turn = n < 2 ? 10 : 11; game(['夏の大会 1回戦', '夏の大会 2回戦', '夏の大会 決勝'][n], n + 1, (win) => {
    if (win && n < 2) round(n + 1);
    else finish(win && n === 2 ? 'win' : n);
  }); };
  round(0);
}

// ---------- 完成 ----------
function finish(res) {
  const lines = res === 'win' ? ['夏の大会、優勝！！', '剛田「お前のおかげだ……ありがとな！」', '春野「おめでとう！」'] : [`夏の大会は${['1回戦', '2回戦', '決勝'][res]}で敗退……`, '剛田「来年はお前たちが引っ張るんだぞ」', '黒崎「……次は勝つ」'];
  if (res === 'win') for (const k of Object.keys(S.pts)) S.pts[k] += 20;
  story(lines, () => upgrade(done));
}
function done() {
  const st = S.st, list = loadPlayers();
  const p = S.kind === 'P'
    ? { id: Date.now().toString(36), kind: 'P', name: S.name, hand: S.hand, velo: st.velo, control: st.control, stamina: st.stamina, field: st.field, pitches: st.pitches, inTeam: false }
    : { id: Date.now().toString(36), kind: 'F', name: S.name, hand: S.hand, pos: S.pos, meet: st.meet, power: st.power, speed: st.speed, arm: st.arm, field: st.field, inTeam: false };
  list.unshift(p); savePlayers(list.slice(0, 20));
  h(`<div class="sc-title">選手完成！</div><div class="sc-done"><b>${S.name}</b> <span>${S.kind === 'P' ? (S.hand === 'L' ? '左投げ投手' : '右投げ投手') : `${S.pos}（${S.hand === 'L' ? '左打ち' : '右打ち'}）`}</span>${statsHtml()}</div>
    <div class="sc-btns"><button id="scTeam" class="primary">チームに入れる</button><button id="scTop">サクセスのはじめへ</button></div>`);
  $('scTeam').onclick = () => { setInTeam(p.id); renderStart(); };
  $('scTop').onclick = renderStart;
  S = null;
}
