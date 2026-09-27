# めちゃホワイト

ブラウザで遊べる、雪の町づくりサバイバル＋ものがたり（RPG）ゲーム。GitHub Pages でそのまま動く。

## 構成
- `index.html` … 画面の骨組みとスタイル（`tools/index.template.html` から生成）
- `game.js` … ゲーム本体（`src/*.js` を結合して生成。直接編集しない）
- `src/` … ゲームのソース。番号順に結合される
  - `01_core` 描画の基本 / `02_scenery` 地面・粒子・入力・音 / `03_models` モデルと素材読み込み
  - `04_town` 町の成長・状態・購入床 / `05_gameplay` 出現・ミッション / `06_net` オンライン
  - `07_update` ゲームの更新 / `08_render` 表示・カメラ・HUD
  - `09_explore` 探索・洞窟・採掘・お題・図鑑 / `10_rank` ランクで開く世界 / `11_rpg` 住人の依頼・装備
  - `12_life` くらしランク・工房・吹雪 / `13_boss` ボス / `14_story_main` ものがたり・起動
- `assets/` … 3Dモデル（.glb）とテクスチャ。`manifest.json` の一覧から起動時に読み込む
- `tools/build.py` … ビルド（`python3 tools/build.py`）

## 素材
- KayKit（Kay Lousberg, CC0）
- Quaternius（CC0）: 動物・洞窟の魔物・宝箱・鉱石・武器
