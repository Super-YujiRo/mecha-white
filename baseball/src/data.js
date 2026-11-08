// チーム・選手・球種のデータ（すべてオリジナル）

export const PITCHES = {
  ST: { name: 'ストレート', short: 'スト', speed: 1.00, bx: 0.00, by: 0.06, arc: 0.04 },
  SL: { name: 'スライダー', short: 'スラ', speed: 0.88, bx: 0.30, by: -0.06, arc: 0.06 },
  CU: { name: 'カーブ', short: 'カブ', speed: 0.76, bx: 0.22, by: -0.46, arc: 0.34 },
  FK: { name: 'フォーク', short: 'フォ', speed: 0.87, bx: 0.00, by: -0.50, arc: 0.08 },
  SH: { name: 'シュート', short: 'シュ', speed: 0.93, bx: -0.24, by: -0.04, arc: 0.04 },
  SK: { name: 'シンカー', short: 'シン', speed: 0.85, bx: -0.24, by: -0.32, arc: 0.08 },
  CH: { name: 'チェンジアップ', short: 'チェ', speed: 0.80, bx: -0.08, by: -0.26, arc: 0.12 },
  CT: { name: 'カットボール', short: 'カト', speed: 0.95, bx: 0.13, by: -0.02, arc: 0.03 },
};

// 能力値は0〜100。ランク表示は rank() で S〜G に変換
export function rank(v) {
  if (v >= 90) return 'S';
  if (v >= 80) return 'A';
  if (v >= 70) return 'B';
  if (v >= 60) return 'C';
  if (v >= 50) return 'D';
  if (v >= 40) return 'E';
  if (v >= 20) return 'F';
  return 'G';
}

// 野手：pos（守備位置）, meet（ミート）, power（パワー）, speed（走力）, arm（肩）, field（守備）, bats（打席 R/L）
// 投手：velo（球速km/h）, control（コントロール）, stamina（スタミナ）, pitches（球種:変化量1-7）, throws（R/L）
export const TEAMS = [
  {
    id: 'sunflowers',
    name: 'ひまわりサンズ',
    short: 'サンズ',
    color: '#ff9f1c', color2: '#ffffff', pants: '#f4f1ea', cap: '#d9480f',
    pitcher: { name: '日向 大地', velo: 148, control: 62, stamina: 70, throws: 'R', pitches: { ST: 0, SL: 4, FK: 3, CU: 2 } },
    lineup: [
      { name: '早瀬 翔', pos: 'CF', meet: 78, power: 42, speed: 88, arm: 62, field: 72, bats: 'L' },
      { name: '小坂 光', pos: 'SS', meet: 70, power: 38, speed: 74, arm: 70, field: 80, bats: 'R' },
      { name: '真壁 剛', pos: '3B', meet: 66, power: 76, speed: 52, arm: 74, field: 60, bats: 'R' },
      { name: '岩城 豪', pos: '1B', meet: 58, power: 92, speed: 38, arm: 55, field: 54, bats: 'L' },
      { name: '大谷原 守', pos: 'RF', meet: 64, power: 70, speed: 60, arm: 80, field: 62, bats: 'R' },
      { name: '風間 蓮', pos: 'LF', meet: 62, power: 56, speed: 70, arm: 58, field: 60, bats: 'L' },
      { name: '野村 誠', pos: 'C', meet: 54, power: 60, speed: 40, arm: 76, field: 70, bats: 'R' },
      { name: '島田 陽', pos: '2B', meet: 60, power: 34, speed: 68, arm: 60, field: 74, bats: 'R' },
    ],
  },
  {
    id: 'marines',
    name: 'あおぞらマリンズ',
    short: 'マリンズ',
    color: '#1d6fd8', color2: '#ffffff', pants: '#e9eef6', cap: '#0b3f86',
    pitcher: { name: '青海 隼人', velo: 142, control: 74, stamina: 76, throws: 'L', pitches: { ST: 0, CU: 5, SL: 2, CH: 4 } },
    lineup: [
      { name: '浜辺 走', pos: '2B', meet: 74, power: 36, speed: 84, arm: 58, field: 76, bats: 'L' },
      { name: '水野 拓', pos: 'CF', meet: 72, power: 48, speed: 78, arm: 66, field: 78, bats: 'L' },
      { name: '潮田 健', pos: 'RF', meet: 68, power: 72, speed: 58, arm: 82, field: 64, bats: 'R' },
      { name: '大波 豪太', pos: '1B', meet: 60, power: 90, speed: 34, arm: 52, field: 52, bats: 'R' },
      { name: '岬 一郎', pos: '3B', meet: 66, power: 68, speed: 50, arm: 76, field: 66, bats: 'R' },
      { name: '帆足 陸', pos: 'C', meet: 56, power: 58, speed: 42, arm: 78, field: 72, bats: 'R' },
      { name: '舟木 歩', pos: 'SS', meet: 64, power: 40, speed: 72, arm: 72, field: 78, bats: 'R' },
      { name: '鴎 晴', pos: 'LF', meet: 62, power: 52, speed: 66, arm: 60, field: 60, bats: 'L' },
    ],
  },
];

// 打順の9番は投手
export function battingOrder(team) {
  const p = team.pitcher;
  return [...team.lineup, { name: p.name, pos: 'P', meet: 32, power: 26, speed: 40, arm: 70, field: 60, bats: p.throws }];
}
