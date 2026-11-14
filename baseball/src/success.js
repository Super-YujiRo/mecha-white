// サクセス（お試し版）：1年夏までの12ターンで選手を育てる
import { PITCHES, rank } from './data.js';
import { Stage } from './scstage.js';
import { portrait } from './scfaces.js';
import { unlockAudio, sfxCheer } from './sound.js';

const SAVE_KEY = 'hakkyu_success_players';
const TURNS = [
  ['4月', '前半'], ['4月', '後半'], ['5月', '前半'], ['5月', '後半'], ['6月', '前半'], ['6月', '練習試合'],
  ['6月', '後半'], ['7月', '前半'], ['7月', '中旬'], ['7月', '後半'], ['7月', '夏の大会'], ['7月', '夏の大会'],
];
const SEASON = ['spring', 'spring', 'clear', 'clear', 'rain', 'evening', 'rain', 'summer', 'summer', 'evening', 'summer', 'summer'];
const PT = { str: '筋力', agi: '敏捷', tec: '技術', brk: '変化球', mnd: '精神' };
const PT_C = { str: '#ff6b5a', agi: '#3ec7ff', tec: '#ffc83d', brk: '#b88cff', mnd: '#3ee07a' };
const MOODS = ['絶不調', '不調', '普通', '好調', '絶好調'];
const MOOD_K = [0.6, 0.8, 1, 1.2, 1.4];
const MATES = {
  haruka: { name: '春野 灯', role: 'マネージャー' },
  goda: { name: '剛田 鉄平', role: '3年 キャプテン', p3: 1 },
  kuro: { name: '黒崎 迅', role: '同級生 ライバル', p3: 1 },
  kantoku: { name: '鬼頭 監督', role: '監督' },
  mame: { name: '豆田 一', role: '同級生', p3: 1 },
};
const FIELD_TR = [
  { id: 'bat', name: '打撃', icon: '⚾', pts: { tec: 10, str: 5 }, hp: 16, mate: 'kuro' },
  { id: 'pow', name: '筋力', icon: '💪', pts: { str: 13 }, hp: 20, mate: 'goda' },
  { id: 'run', name: '走塁', icon: '👟', pts: { agi: 12, mnd: 3 }, hp: 16, mate: 'mame' },
  { id: 'arm', name: '肩力', icon: '🎯', pts: { str: 7, agi: 6 }, hp: 15, mate: 'goda' },
  { id: 'def', name: '守備', icon: '🧤', pts: { tec: 7, agi: 6 }, hp: 14, mate: 'mame' },
];
const PITCH_TR = [
  { id: 'velo', name: '球速', icon: '🔥', pts: { str: 13 }, hp: 20, mate: 'goda' },
  { id: 'ctl', name: 'コントロール', icon: '🎯', pts: { tec: 11, mnd: 3 }, hp: 14, mate: 'kuro' },
  { id: 'sta', name: 'スタミナ', icon: '👟', pts: { str: 6, mnd: 7 }, hp: 18, mate: 'mame' },
  { id: 'brk', name: '変化球', icon: '🌀', pts: { brk: 12, tec: 3 }, hp: 15, mate: 'kuro' },
  { id: 'def', name: '守備', icon: '🧤', pts: { tec: 6, agi: 6 }, hp: 13, mate: 'mame' },
];
const OPP = [
  { name: '緑ヶ丘高校', color: '#2e9e5b' }, { name: '港南工業', color: '#3a6fd8' },
  { name: '白鷺学園', color: '#8e44ad' }, { name: '帝王実業', color: '#c0392b' },
];

let S = null, root = null, onExit = null, stage = null, fast = false;

// ---------- 保存と、チームへの反映 ----------
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
export function applyMyPlayers(team) {
  const list = loadPlayers().filter(p => p.inTeam);
  const t = structuredClone(team);
  for (const p of list) {
    if (p.kind === 'P') t.pitcher = { name: p.name, velo: p.velo, control: p.control, stamina: p.stamina, throws: p.hand, pitches: { ST: 0, ...p.pitches } };
    else {
      const i = Math.max(0, t.lineup.findIndex(x => x.pos === p.pos));
      t.lineup[i] = { name: p.name, pos: p.pos, meet: p.meet, power: p.power, speed: p.speed, arm: p.arm, field: p.field, bats: p.hand };
    }
  }
  return t;
}

// ---------- 画面 ----------
export function openSuccess(el, exit) {
  root = el; onExit = exit;
  root.classList.remove('hidden');
  window.__scOpen = true;
  if (!root.querySelector('.sc')) {
    root.innerHTML = `<div class="sc">
      <canvas class="sc-cv"></canvas>
      <div class="sc-tags"></div>
      <div class="sc-top hidden">
        <div class="sc-cal"><b></b><span></span></div>
        <div class="sc-st"><div class="sc-hp"><em>体力</em><i><s></s><b></b></i></div><div class="sc-mood"></div></div>
        <div class="sc-pts"></div>
      </div>
      <div class="sc-fx"></div>
      <div class="sc-face"></div>
      <div class="sc-msg hidden"><div class="sc-name"></div><div class="sc-text"></div><i class="sc-nx">▼</i></div>
      <div class="sc-menu"></div>
      <div class="sc-sb hidden"></div>
      <div class="sc-panel hidden"></div>
      <button class="sc-fast" title="文字と動きを速くする">▶▶ 早送り</button>
    </div>`;
    stage = new Stage(root.querySelector('.sc-cv'));
    window.__scStage = stage;
    stage.onTags = (tags) => { root.querySelector('.sc-tags').innerHTML = tags.map(t => `<span style="left:${t.x * 100}%;top:${t.y * 100}%">${t.name}</span>`).join(''); };
    const fb = root.querySelector('.sc-fast');
    fb.onclick = (e) => { e.stopPropagation(); fast = !fast; fb.classList.toggle('on', fast); stage.speed = fast ? 2.5 : 1; };
    root.querySelector('.sc').addEventListener('click', () => advance && advance());
    window.addEventListener('keydown', (e) => { if (!window.__scOpen) return; if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance && advance(); } });
  }
  stage.setMe({ hand: 'R', kind: 'F' });
  stage.season('spring');
  stage.start();
  stage.act('done');
  renderStart();
}
function closeSuccess() {
  root.classList.add('hidden'); window.__scOpen = false;
  stage && stage.stop();
  onExit && onExit();
}
const q = (s) => root.querySelector(s);
const wait = (ms) => new Promise(r => setTimeout(r, fast ? ms / 2.5 : ms));
let advance = null;

// 話：名前と立ち絵を出して、文字を1つずつ出す。クリックで次へ
function say(who, text, face = 'normal') {
  const msg = q('.sc-msg'), nm = q('.sc-name'), tx = q('.sc-text'), fc = q('.sc-face');
  msg.classList.remove('hidden');
  const m = MATES[who];
  nm.textContent = who === 'me' ? S.name : m ? m.name : '';
  nm.style.visibility = nm.textContent ? '' : 'hidden';
  if (m) { if (fc.dataset.who !== who + face) { fc.innerHTML = portrait(who, face); fc.dataset.who = who + face; } fc.classList.add('on'); }
  else { fc.classList.remove('on'); fc.dataset.who = ''; }
  tx.textContent = '';
  msg.classList.remove('done');
  return new Promise(res => {
    let i = 0, timer = null;
    const chars = [...text];
    const finish = () => { clearInterval(timer); tx.textContent = text; msg.classList.add('done'); advance = () => { advance = null; res(); }; };
    advance = finish;
    if (fast) return finish();
    timer = setInterval(() => { i++; tx.textContent = chars.slice(0, i).join(''); if (i >= chars.length) finish(); }, 28);
  });
}
function hideMsg() { q('.sc-msg').classList.add('hidden'); q('.sc-face').classList.remove('on'); }
// えらぶ
function ask(opts) {
  return new Promise(res => {
    const m = q('.sc-menu');
    m.innerHTML = `<div class="sc-ask">${opts.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>`;
    advance = null;
    m.querySelectorAll('button').forEach(b => (b.onclick = (e) => { e.stopPropagation(); m.innerHTML = ''; res(+b.dataset.i); }));
  });
}
// 大きな文字（スタンプ）
async function stamp(text, cls = '', ms = 1300) {
  const fx = q('.sc-fx');
  const d = document.createElement('div');
  d.className = 'sc-stamp ' + cls; d.innerHTML = text;
  fx.appendChild(d);
  await wait(ms);
  d.classList.add('out');
  setTimeout(() => d.remove(), 400);
}
// 日付が変わる
async function flipCal() {
  const [mo, half] = TURNS[S.turn];
  const fx = q('.sc-fx');
  const d = document.createElement('div');
  d.className = 'sc-calflip';
  d.innerHTML = `<div><small>1年目</small><b>${mo}</b><span>${half}</span></div>`;
  fx.appendChild(d);
  stage.season(SEASON[S.turn]);
  renderTop();
  await wait(1100);
  d.classList.add('out');
  setTimeout(() => d.remove(), 450);
}

// ---------- 上の表示（日付・体力・やる気・経験点） ----------
function renderTop(anim) {
  const top = q('.sc-top');
  top.classList.remove('hidden');
  const [mo, half] = TURNS[Math.min(S.turn, TURNS.length - 1)];
  q('.sc-cal b').textContent = mo; q('.sc-cal span').textContent = half;
  const hb = q('.sc-hp b'), hs = q('.sc-hp s');
  hb.style.width = S.hp + '%';
  hb.style.background = S.hp < 30 ? '#ff4d4d' : S.hp < 60 ? '#ffc83d' : '#3ee07a';
  setTimeout(() => { hs.style.width = S.hp + '%'; }, anim ? 450 : 0);
  const md = q('.sc-mood');
  md.className = 'sc-mood m' + S.mood; md.innerHTML = `<i>${['😫', '😞', '🙂', '😄', '🔥'][S.mood]}</i>${MOODS[S.mood]}`;
  const pts = q('.sc-pts');
  const keys = Object.keys(PT).filter(k => S.kind === 'P' || k !== 'brk');
  if (pts.dataset.kind !== S.kind) { pts.innerHTML = keys.map(k => `<span data-p="${k}" style="--c:${PT_C[k]}">${PT[k]}<b>0</b></span>`).join(''); pts.dataset.kind = S.kind; }
  for (const k of keys) { const b = pts.querySelector(`[data-p=${k}] b`); if (!anim) b.textContent = S.pts[k]; }
}
function moodTo(v) {
  const up = v > S.mood;
  S.mood = Math.max(0, Math.min(4, v));
  renderTop();
  const md = q('.sc-mood');
  md.classList.remove('up', 'dn'); void md.offsetWidth; md.classList.add(up ? 'up' : 'dn');
}
function hpTo(v) {
  const down = v < S.hp;
  S.hp = Math.max(0, Math.min(100, Math.round(v)));
  renderTop(true);
  if (down) { const h = q('.sc-hp'); h.classList.remove('hit'); void h.offsetWidth; h.classList.add('hit'); }
}
// 経験点：頭の上から数字が出て、上の欄に飛んでいく
async function gain(g) {
  const fx = q('.sc-fx'), hp = stage.headPos(), rect = fx.getBoundingClientRect();
  let i = 0;
  for (const [k, v] of Object.entries(g)) {
    if (!v) continue;
    S.pts[k] += v;
    const d = document.createElement('div');
    d.className = 'sc-pop'; d.style.setProperty('--c', PT_C[k]);
    d.innerHTML = `${PT[k]}<b>+${v}</b>`;
    d.style.left = (hp.x * 100) + '%'; d.style.top = `calc(${hp.y * 100}% - ${i * 34}px)`;
    fx.appendChild(d);
    const target = q(`.sc-pts [data-p=${k}]`);
    const delay = 650 + i * 140;
    setTimeout(() => {
      if (!target) return;
      const tr = target.getBoundingClientRect(), dr = d.getBoundingClientRect();
      d.style.transition = 'transform .45s cubic-bezier(.5,0,.8,.3), opacity .45s';
      d.style.transform = `translate(${tr.left + tr.width / 2 - dr.left - dr.width / 2}px, ${tr.top - dr.top}px) scale(.5)`;
      d.style.opacity = '0.2';
      setTimeout(() => { d.remove(); countUp(target.querySelector('b'), S.pts[k]); target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash'); }, 450);
    }, fast ? delay / 2.5 : delay);
    i++;
  }
  void rect;
  await wait(900 + i * 140);
}
function countUp(el, to) {
  const from = +el.textContent || 0, t0 = performance.now(), D = 400;
  const f = () => { const k = Math.min(1, (performance.now() - t0) / D); el.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); };
  f();
}

// ---------- はじめ ----------
function renderStart() {
  S = null;
  hideMsg(); q('.sc-top').classList.add('hidden'); q('.sc-menu').innerHTML = ''; q('.sc-sb').classList.add('hidden');
  const saved = loadPlayers();
  const p = q('.sc-panel'); p.classList.remove('hidden');
  p.innerHTML = `<div class="sc-card0">
    <div class="sc-title">サクセス <small>お試し版・1年の夏まで</small></div>
    <div class="sc-row"><label>名前 <input id="scName" maxlength="8" value="${['山田 太郎', '佐藤 大輝', '鈴木 颯太', '高橋 蒼'][Math.floor(Math.random() * 4)]}"></label></div>
    <div class="sc-row">
      <label><input type="radio" name="kind" value="F" checked> 野手</label>
      <label><input type="radio" name="kind" value="P"> 投手</label>
      <label>利き手 <select id="scHand"><option value="R">右</option><option value="L">左</option></select></label>
      <label id="scPosL">守備位置 <select id="scPos">${['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].map(x => `<option>${x}</option>`).join('')}</select></label>
    </div>
    <div class="sc-btns"><button id="scGo" class="primary">入学する</button><button id="scBack">もどる</button></div>
    ${saved.length ? `<div class="sc-sub">作った選手（「チームに入れる」とCPU対戦で自分のチームに入ります）</div><div class="sc-list">${saved.map(x => `<div class="sc-card ${x.inTeam ? 'on' : ''}"><b>${x.name}</b> <span>${x.kind === 'P' ? '投手' : x.pos}</span> <em>${x.kind === 'P' ? `${x.velo}km ${rank(x.control)}/${rank(x.stamina)}` : `${rank(x.meet)}${rank(x.power)}${rank(x.speed)}${rank(x.arm)}${rank(x.field)}`}</em><button data-id="${x.id}">${x.inTeam ? 'チームから外す' : 'チームに入れる'}</button></div>`).join('')}</div>` : ''}
  </div>`;
  const sync = () => { q('#scPosL').style.display = p.querySelector('input[name=kind]:checked').value === 'F' ? '' : 'none'; };
  p.querySelectorAll('input[name=kind]').forEach(r => (r.onchange = sync));
  p.addEventListener('click', e => e.stopPropagation());
  q('#scBack').onclick = closeSuccess;
  q('#scGo').onclick = () => {
    unlockAudio();
    const kind = p.querySelector('input[name=kind]:checked').value;
    p.classList.add('hidden');
    run({ name: (q('#scName').value || '名無し').slice(0, 8), kind, hand: q('#scHand').value, pos: q('#scPos').value });
  };
  p.querySelectorAll('.sc-card button').forEach(b => (b.onclick = () => { setInTeam(b.dataset.id); renderStart(); }));
}

// ---------- 全体の流れ ----------
async function run(o) {
  S = {
    ...o, turn: 0, hp: 100, mood: 2, pts: { str: 0, agi: 0, tec: 0, brk: 0, mnd: 0 },
    st: o.kind === 'P' ? { velo: 128, control: 40, stamina: 40, field: 40, pitches: {} } : { meet: 40, power: 40, speed: 45, arm: 45, field: 40 },
    like: Object.fromEntries(Object.keys(MATES).map(k => [k, 0])),
  };
  stage.setMe(S);
  await opening();
  while (S.turn < TURNS.length) {
    if (S.turn === 5) { await flipCal(); await game('練習試合', 0); S.turn++; continue; }
    if (S.turn === 10) { const r = await tournament(); return finish(r); }
    await week();
  }
}

async function opening() {
  await flipCal();
  stage.act('talk', { mates: [{ id: 'goda', name: '剛田', anim: 'Idle_A' }, { id: 'mame', name: '豆田', anim: 'Waving' }] });
  await say(null, '春。桜の舞う、白鷺台高校のグラウンド。');
  await say('me', `「${S.name}です！ よろしくお願いします！」`);
  await say('kantoku', '「声だけは一人前だな。」', 'normal');
  await say('kantoku', '「夏の大会まで、あと3か月。使える選手になってみせろ」', 'angry');
  await say('goda', '「キャプテンの剛田だ！ 一緒に甲子園目指そうぜ！」', 'smile');
  await say('mame', '「お、同じ1年の豆田です……よろしく」', 'normal');
  await say('haruka', '「マネージャーの春野です。困ったことがあったら言ってね」', 'smile');
  hideMsg();
}

// ---------- 1週間（練習をえらぶ） ----------
async function week() {
  await flipCal();
  const tr = S.kind === 'P' ? PITCH_TR : FIELD_TR;
  S.mates = {};
  for (const t of tr) if (Math.random() < 0.45) S.mates[t.id] = t.mate;
  stage.reset();
  stage.act('talk');
  let id;
  for (;;) {
    id = await trainMenu(tr);
    if (id === 'up') { await upgrade(); continue; }
    break;
  }
  q('.sc-menu').innerHTML = '';
  await doTrain(id, tr);
  await maybeEvent();
  S.turn++;
}
function gainK(t) { return MOOD_K[S.mood] * (S.mates && S.mates[t.id] ? 1.35 : 1); }
function trainMenu(tr) {
  return new Promise(res => {
    const m = q('.sc-menu');
    advance = null;
    m.innerHTML = `<div class="sc-train">${tr.map(t => {
      const mt = S.mates[t.id];
      return `<button data-t="${t.id}"><em>${t.icon}</em><b>${t.name}</b><small>${Object.entries(t.pts).map(([k, v]) => `<i style="color:${PT_C[k]}">${PT[k]}+${Math.round(v * gainK(t))}</i>`).join('')}</small><u>体力 -${t.hp}</u>${mt ? `<span class="sc-mf">${portrait(mt, 'smile')}</span>` : ''}</button>`;
    }).join('')}
      <button data-t="rest" class="alt"><em>💤</em><b>休む</b><small>体力 回復</small></button>
      <button data-t="play" class="alt"><em>🎮</em><b>遊ぶ</b><small>やる気 アップ</small></button>
      <button data-t="up" class="up"><em>⬆</em><b>能力アップ</b><small>経験点を使う</small></button></div>
      ${S.hp < 30 ? '<div class="sc-warn">体力が少ないとケガをしやすい！</div>' : ''}`;
    m.querySelectorAll('[data-t]').forEach(b => (b.onclick = (e) => { e.stopPropagation(); res(b.dataset.t); }));
  });
}

async function doTrain(id, tr) {
  if (id === 'rest') {
    const a = stage.act('rest');
    await say(null, 'しっかり休んだ。'); await a;
    hpTo(S.hp + 55);
    await stamp('体力 回復！', 'blue', 900);
    return hideMsg();
  }
  if (id === 'play') {
    const a = stage.act('play');
    await say('mame', '「河原でキャッチボールしようぜ！」', 'smile');
    await a;
    hpTo(S.hp + 15); moodTo(S.mood + 1);
    await say(null, `楽しかった！ やる気が上がった！（${MOODS[S.mood]}）`);
    return hideMsg();
  }
  const t = tr.find(x => x.id === id);
  hideMsg();
  // ケガ：体力が少ないと起こりやすい
  if (S.hp < 30 && Math.random() < (30 - S.hp) / 45 + 0.1) {
    await stage.act('hurt');
    hpTo(S.hp - 10); moodTo(S.mood - 1);
    await stamp('ケガ…', 'bad', 1000);
    await say(null, `${t.name}練習中に足をひねってしまった……`);
    await say('haruka', '「大丈夫！？ 無理しちゃだめだよ……」', 'sad');
    return hideMsg();
  }
  const mt = S.mates[t.id];
  const big = Math.random() < (mt ? 0.18 : 0.1) + S.mood * 0.02;
  const k = gainK(t) * (big ? 1.5 : 1);
  await stage.act(t.id, { mates: mt ? [{ id: mt, name: MATES[mt].name.split(' ')[0] }] : [] });
  const g = {};
  for (const [p, v] of Object.entries(t.pts)) g[p] = Math.round(v * k * (0.9 + Math.random() * 0.2));
  hpTo(S.hp - t.hp);
  await stamp(big ? '大成功！！' : '練習成功！', big ? 'rainbow' : '', 900);
  await gain(g);
  if (mt) { S.like[mt] += 10; await say(mt, LINES[mt][Math.floor(Math.random() * LINES[mt].length)], 'smile'); hideMsg(); }
  stage.act('talk');
}
const LINES = {
  goda: ['「いいぞ！ その調子だ！」', '「まだまだ！ もう1セット！」', '「根性あるじゃねえか！」'],
  kuro: ['「……フン、悪くない」', '「次は俺が勝つ」', '「お前には負けねえ」'],
  mame: ['「すごいなあ、ボクも頑張らなきゃ」', '「ふう、きつかったね！」', '「一緒にやると楽しいね！」'],
};

// ---------- ランダムイベント ----------
const EVENTS = [
  async () => {
    stage.act('talk');
    await say(null, '練習の後、マネージャーの春野がスポーツドリンクを差し入れてくれた。');
    await say('haruka', '「無理しすぎないでね。……ちゃんと見てるから」', 'smile');
    hpTo(S.hp + 20); S.like.haruka += 10;
    await stamp('体力 回復！', 'blue', 800);
  },
  async () => {
    stage.act('talk', { mates: [{ id: 'goda', name: '剛田', anim: 'Cheering' }] });
    await say('goda', '「おい、筋トレ付き合え！ 根性見せてみろ！」', 'smile');
    const c = await ask(['付き合う', '今日はやめておく']);
    if (c === 0) { stage.act('pow', { mates: [{ id: 'goda', name: '剛田' }] }); await wait(1800); hpTo(S.hp - 15); S.like.goda += 10; await gain({ str: 14 }); await say('goda', '「やるじゃねえか！」', 'smile'); stage.act('talk'); }
    else { await say('goda', '「そうか……」', 'sad'); moodTo(S.mood - 1); await say(null, `やる気が下がった……（${MOODS[S.mood]}）`); }
  },
  async () => {
    stage.act('talk', { mates: [{ id: 'kuro', name: '黒崎', anim: 'Idle_B' }] });
    await say(null, 'ライバルの黒崎が、一人で居残り練習をしている。');
    await say('kuro', '「……何見てんだ。お前には負けねえよ」', 'angry');
    S.like.kuro += 10;
    await say(null, '負けていられない！');
    await gain({ mnd: 8, tec: 6 });
  },
  async () => {
    stage.act('talk');
    await say('kantoku', '「お前、最近いい顔になってきたな」', 'smile');
    moodTo(S.mood + 1);
    await say(null, `やる気が上がった！（${MOODS[S.mood]}）`);
  },
  async () => {
    stage.act('talk', { mates: [{ id: 'mame', name: '豆田', anim: 'Waving' }] });
    await say('mame', '「なあ、帰りにラーメン食べてかない？」', 'smile');
    const c = await ask(['行く', '自主練する']);
    if (c === 0) { stage.season('evening'); hpTo(S.hp + 10); moodTo(S.mood + 1); await say('mame', '「うまかったー！ また行こうね」', 'smile'); await say(null, `やる気が上がった！（${MOODS[S.mood]}）`); }
    else { stage.season('night'); await stage.act(S.kind === 'P' ? 'ctl' : 'bat'); hpTo(S.hp - 8); await gain({ agi: 7, tec: 5 }); }
  },
  async () => {
    stage.season('night');
    const a = stage.act(S.kind === 'P' ? 'brk' : 'bat');
    await say(null, '夜、一人で練習していると……何かをつかんだ気がした！'); await a;
    const k = S.kind === 'P' ? 'brk' : 'tec';
    await stamp('ひらめき！', 'rainbow', 900);
    await gain({ [k]: 10 });
  },
  async () => {
    stage.act('talk');
    await say(null, '寝坊して朝練に遅れてしまった……');
    await say('kantoku', '「グラウンド10周だ！！」', 'angry');
    await stage.act('run');
    hpTo(S.hp - 10);
    await gain({ agi: 4 });
  },
  async () => {
    stage.act('talk', { mates: [{ id: 'mame', name: '豆田', anim: 'Idle_A' }] });
    await say('haruka', '「ねえ、スコアのつけ方、手伝ってくれない？」', 'normal');
    const c = await ask(['手伝う', 'ごめん、練習がある']);
    if (c === 0) { S.like.haruka += 15; await say('haruka', '「ありがとう！ 助かっちゃった」', 'smile'); await gain({ tec: 4, mnd: 6 }); }
    else { await say('haruka', '「そっか、がんばってね」', 'normal'); await gain({ str: 5 }); }
  },
];
async function maybeEvent() {
  if (S.turn >= TURNS.length - 1 || Math.random() > 0.55) return hideMsg();
  await EVENTS[Math.floor(Math.random() * EVENTS.length)]();
  hideMsg();
}

// ---------- 能力アップ ----------
function costOf(key, v) {
  const step = 2 + Math.max(0, Math.floor((v - 30) / 10)) * 2;
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
const vcost = (k, v) => costOf(k, k === 'velo' ? 30 + (v - 128) * 2.5 : v);
function upgrade(final) {
  return new Promise(res => {
    const p = q('.sc-panel');
    p.classList.remove('hidden');
    advance = null;
    const draw = (hit) => {
      const keys = S.kind === 'P' ? [['velo', '球速', 160], ['control', 'コントロール', 99], ['stamina', 'スタミナ', 99], ['field', '守備', 99]] : [['meet', 'ミート', 99], ['power', 'パワー', 99], ['speed', '走力', 99], ['arm', '肩力', 99], ['field', '守備', 99]];
      const rows = keys.map(([k, n, max]) => {
        const v = S.st[k], c = vcost(k, v);
        return `<div class="sc-up ${hit === k ? 'pop' : ''}"><span>${n}</span><b>${k === 'velo' ? `<i class="rk">${v}</i>km` : `<i class="rk ${rank(v)}">${rank(v)}</i>${v}`}</b><small>${Object.entries(c).map(([q2, x]) => `<i style="color:${PT_C[q2]}">${PT[q2]}${x}</i>`).join(' ')}</small><button data-k="${k}" ${v >= max || !canPay(c) ? 'disabled' : ''}>+1</button></div>`;
      });
      let brk = '';
      if (S.kind === 'P') {
        const own = Object.keys(S.st.pitches);
        brk = `<div class="sc-sub">変化球</div>${own.map(k => { const lv = S.st.pitches[k], c = { brk: 12 + lv * 8 }; return `<div class="sc-up ${hit === k ? 'pop' : ''}"><span>${PITCHES[k].name}</span><b><i class="rk">${lv}</i></b><small><i style="color:${PT_C.brk}">変化球${c.brk}</i></small><button data-p="${k}" ${lv >= 7 || !canPay(c) ? 'disabled' : ''}>+1</button></div>`; }).join('')}
          ${own.length < 3 ? `<div class="sc-up"><span>新しい球種</span><select id="scNewP">${Object.keys(PITCHES).filter(k => k !== 'ST' && !own.includes(k)).map(k => `<option value="${k}">${PITCHES[k].name}</option>`).join('')}</select><small><i style="color:${PT_C.brk}">変化球25</i></small><button id="scLearn" ${S.pts.brk < 25 ? 'disabled' : ''}>覚える</button></div>` : ''}`;
      }
      p.innerHTML = `<div class="sc-card0 sc-upbox"><div class="sc-title">${final ? '最後の能力アップ' : '能力アップ'}</div>${rows.join('')}${brk}<div class="sc-btns"><button id="scDone" class="primary">${final ? '完成！' : 'もどる'}</button></div></div>`;
      const after = (k) => { renderTop(); draw(k); };
      p.querySelectorAll('[data-k]').forEach(b => (b.onclick = (e) => { e.stopPropagation(); const k = b.dataset.k, c = vcost(k, S.st[k]); if (canPay(c)) { const r0 = rank(S.st[k]); pay(c); S.st[k]++; after(k); if (k !== 'velo' && rank(S.st[k]) !== r0) rankUp(n2(k), rank(S.st[k])); } }));
      p.querySelectorAll('[data-p]').forEach(b => (b.onclick = (e) => { e.stopPropagation(); const k = b.dataset.p, c = { brk: 12 + S.st.pitches[k] * 8 }; if (canPay(c)) { pay(c); S.st.pitches[k]++; after(k); } }));
      if (q('#scLearn')) q('#scLearn').onclick = (e) => { e.stopPropagation(); if (S.pts.brk >= 25) { S.pts.brk -= 25; const k = q('#scNewP').value; S.st.pitches[k] = 1; after(k); stamp(`${PITCHES[k].name}<br>習得！`, 'rainbow', 900); } };
      q('#scDone').onclick = (e) => { e.stopPropagation(); p.classList.add('hidden'); res(); };
      p.onclick = (e) => e.stopPropagation();
    };
    draw();
  });
}
const n2 = (k) => ({ meet: 'ミート', power: 'パワー', speed: '走力', arm: '肩力', field: '守備', control: 'コントロール', stamina: 'スタミナ' }[k]);
function rankUp(name, r) { stamp(`${name}<br><span class="rk ${r}">${r}</span> に上がった！`, 'rank', 800); }

// ---------- 試合 ----------
function power() {
  const st = S.st;
  return S.kind === 'P' ? ((st.velo - 120) * 1.6 + st.control + st.stamina * 0.6 + Object.values(st.pitches).reduce((a, b) => a + b * 4, 0)) / 3.2 : (st.meet * 1.2 + st.power + st.speed * 0.5 + st.field * 0.4) / 3.1;
}
const RES = { hr: ['ホームラン！！', 'rainbow'], double: ['ツーベース！', 'good'], hit: ['ヒット！', 'good'], out: ['センターフライ', 'bad'], k: ['空振り三振…', 'bad'], look: ['見逃し三振…', 'bad'] };
function board(me, op, upto, opp) {
  const sb = q('.sc-sb'); sb.classList.remove('hidden');
  const row = (n, a) => `<tr><td class="t">${n}</td>${a.map((v, i) => `<td class="${i === upto - 1 ? 'now' : ''}">${i < upto ? v : ''}</td>`).join('')}<td class="sum">${a.slice(0, upto).reduce((x, y) => x + y, 0)}</td></tr>`;
  sb.innerHTML = `<table><tr><th></th>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<th>${i}</th>`).join('')}<th>計</th></tr>${row(opp.name.slice(0, 4), op)}${row('白鷺台', me)}</table>`;
}
async function game(title, lv) {
  const opp = OPP[lv];
  hideMsg(); q('.sc-menu').innerHTML = '';
  stage.season(lv >= 1 ? 'summer' : 'evening');
  await stamp(`<small>${title}</small><br>白鷺台 <i>VS</i> ${opp.name}`, 'vs', 1600);
  const me = power();
  const win = Math.random() < 0.35 + (me - 45) * 0.012 + MOOD_K[S.mood] * 0.06 - lv * 0.08;
  // 打席の結果
  const results = [];
  let myScore = 0, gotPts = 0;
  if (S.kind === 'F') {
    for (let i = 0; i < 4; i++) {
      const p = 0.2 + (S.st.meet - 40) * 0.006 + MOOD_K[S.mood] * 0.05 - lv * 0.03;
      const r = Math.random();
      let res;
      if (r < p * 0.25 * (S.st.power / 60)) res = 'hr';
      else if (r < p * 0.45) res = 'double';
      else if (r < p) res = 'hit';
      else res = ['out', 'k', 'look', 'out'][Math.floor(Math.random() * 4)];
      results.push(res);
      myScore += { hr: 4, double: 2.5, hit: 2 }[res] || 0;
    }
    gotPts = 8 + myScore * 4;
  }
  // 点数：勝ち負けに合わせて作る
  const inn = (n) => { const a = Array(9).fill(0); for (let i = 0; i < n; i++) a[Math.floor(Math.random() * 9)]++; return a; };
  const hrs = results.filter(r => r === 'hr').length;
  let myR = hrs + Math.floor(Math.random() * 4) + results.filter(r => r === 'hit' || r === 'double').length;
  let er = S.kind === 'P' ? Math.max(0, Math.round((3.5 - (me - 40) * 0.06 + lv * 0.7) * (0.5 + Math.random()))) : Math.floor(Math.random() * 6);
  if (win && myR <= er) myR = er + 1 + Math.floor(Math.random() * 2);
  if (!win && myR >= er) er = myR + 1;
  const mine = inn(myR), theirs = inn(er);
  // 自分の打席の回に、ホームランの点を入れる
  const abInn = [0, 3, 5, 7];
  results.forEach((r, i) => { if (r === 'hr' && mine[abInn[i]] === 0) { const j = mine.findIndex(v => v > 0); if (j >= 0) { mine[j]--; mine[abInn[i]]++; } } });
  board(mine, theirs, 0, opp);
  if (S.kind === 'F') {
    for (let i = 0; i < 4; i++) {
      board(mine, theirs, abInn[i] + 1, opp);
      await say(null, `${abInn[i] + 1}回、${S.name}の打席！`);
      hideMsg();
      await stage.act('atbat', { res: results[i], oppColor: opp.color });
      await stamp(RES[results[i]][0], RES[results[i]][1], 900);
    }
    stage.reset();
  } else {
    const ip = Math.min(9, Math.round(4 + S.st.stamina / 18));
    const show = [2, Math.max(3, ip - 2), ip];
    for (let i = 0; i < 3; i++) {
      board(mine, theirs, show[i], opp);
      const res = theirs[show[i] - 1] > 0 && Math.random() < 0.6 ? 'hit' : 'k';
      await say(null, `${show[i]}回、ピンチの場面！`);
      hideMsg();
      await stage.act('mound', { res, oppColor: opp.color });
      await stamp(res === 'k' ? '三振！' : '打たれた…', res === 'k' ? 'good' : 'bad', 800);
    }
    await say(null, `${ip}回を投げて${er}失点。${er <= 1 ? 'ナイスピッチング！' : er >= 4 ? '打ち込まれてしまった……' : ''}`);
    gotPts = 10 + Math.max(0, 6 - er) * 4;
  }
  board(mine, theirs, 9, opp);
  await wait(500);
  if (win) {
    stage.confetti(true);
    stage.act('cheer', { mates: [{ id: 'goda', name: '剛田' }, { id: 'kuro', name: '黒崎' }, { id: 'mame', name: '豆田' }] });
    sfxCheer(1);
    await stamp('勝利！！', 'rainbow', 1400);
    await say('goda', '「よっしゃあ！ ナイスゲーム！」', 'smile');
  } else {
    stage.act('sad', { mates: [{ id: 'goda', name: '剛田' }, { id: 'mame', name: '豆田' }] });
    await stamp('敗北……', 'bad', 1300);
    await say('kantoku', '「負けは負けだ。次に活かせ」', 'normal');
  }
  q('.sc-sb').classList.add('hidden');
  hideMsg();
  const each = Math.round(gotPts / 3);
  await say(null, '試合で経験点を手に入れた！'); hideMsg();
  const g = {}; for (const k of Object.keys(S.pts)) if (k !== 'brk' || S.kind === 'P') g[k] = each;
  await gain(g);
  moodTo(S.mood + (win ? 1 : -1));
  stage.confetti(false);
  return win;
}
async function tournament() {
  for (let n = 0; n < 3; n++) {
    S.turn = n < 2 ? 10 : 11;
    await flipCal();
    const win = await game(['夏の大会 1回戦', '夏の大会 2回戦', '夏の大会 決勝'][n], n + 1);
    if (!win) return n;
  }
  return 'win';
}

// ---------- 完成 ----------
async function finish(res) {
  q('.sc-menu').innerHTML = '';
  if (res === 'win') {
    stage.confetti(true);
    stage.act('cheer', { mates: [{ id: 'goda', name: '剛田' }, { id: 'kuro', name: '黒崎' }, { id: 'mame', name: '豆田' }] });
    await stamp('夏の大会<br>優勝！！', 'rainbow', 1800);
    await say('goda', '「お前のおかげだ……ありがとな！」', 'smile');
    await say('haruka', '「おめでとう！ 本当にすごかったよ！」', 'smile');
    await say('kuro', '「……今回だけは認めてやる」', 'normal');
    for (const k of Object.keys(S.pts)) S.pts[k] += 20;
  } else {
    stage.act('sad', { mates: [{ id: 'goda', name: '剛田' }, { id: 'kuro', name: '黒崎' }] });
    await say(null, `夏の大会は${['1回戦', '2回戦', '決勝'][res]}で敗退……`);
    await say('goda', '「来年はお前たちが引っ張るんだぞ」', 'sad');
    await say('kuro', '「……次は勝つ」', 'angry');
  }
  hideMsg(); renderTop();
  await upgrade(true);
  stage.confetti(false);
  done();
}
function statsHtml() {
  const st = S.st;
  if (S.kind === 'P') return `<div class="sc-stats"><span>球速<b>${st.velo}km</b></span><span>コントロール<b class="rk ${rank(st.control)}">${rank(st.control)}</b>${st.control}</span><span>スタミナ<b class="rk ${rank(st.stamina)}">${rank(st.stamina)}</b>${st.stamina}</span><span>守備<b class="rk ${rank(st.field)}">${rank(st.field)}</b>${st.field}</span><span>変化球<b>${Object.entries(st.pitches).map(([k, v]) => PITCHES[k].short + v).join(' ') || 'なし'}</b></span></div>`;
  return `<div class="sc-stats">${[['meet', 'ミート'], ['power', 'パワー'], ['speed', '走力'], ['arm', '肩力'], ['field', '守備']].map(([k, n]) => `<span>${n}<b class="rk ${rank(st[k])}">${rank(st[k])}</b>${st[k]}</span>`).join('')}</div>`;
}
function done() {
  const st = S.st, list = loadPlayers();
  const p = S.kind === 'P'
    ? { id: Date.now().toString(36), kind: 'P', name: S.name, hand: S.hand, velo: st.velo, control: st.control, stamina: st.stamina, field: st.field, pitches: st.pitches, inTeam: false }
    : { id: Date.now().toString(36), kind: 'F', name: S.name, hand: S.hand, pos: S.pos, meet: st.meet, power: st.power, speed: st.speed, arm: st.arm, field: st.field, inTeam: false };
  list.unshift(p); savePlayers(list.slice(0, 20));
  stage.season('summer');
  stage.act('done');
  q('.sc-top').classList.add('hidden');
  const pn = q('.sc-panel'); pn.classList.remove('hidden');
  pn.innerHTML = `<div class="sc-card0 sc-donecard"><div class="sc-title">選手完成！</div><div class="sc-done"><b>${S.name}</b> <span>${S.kind === 'P' ? (S.hand === 'L' ? '左投げ投手' : '右投げ投手') : `${S.pos}（${S.hand === 'L' ? '左打ち' : '右打ち'}）`}</span>${statsHtml()}</div>
    <div class="sc-btns"><button id="scTeam" class="primary">チームに入れる</button><button id="scTop">サクセスのはじめへ</button></div></div>`;
  pn.onclick = (e) => e.stopPropagation();
  pn.querySelectorAll('.sc-stats span').forEach((s, i) => { s.style.animationDelay = (0.3 + i * 0.18) + 's'; });
  q('#scTeam').onclick = () => { setInTeam(p.id); renderStart(); };
  q('#scTop').onclick = renderStart;
}
