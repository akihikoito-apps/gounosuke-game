# 「きのこの もり（forest）」パック 実装ノート

## 1. 変更・新規作成したファイル一覧

### コア・データ・UI (`src/`)
- `src/core/scene.ts` — `SceneId` に `'forest'` を追加
- `src/core/props-forest.ts`（新規） — きのこの もりの前景小物9種（`lantern`, `logTable`, `acornBasket`, `miniMushrooms`, `berryClump`, `mossRocks`, `hollowLog`, `campfire`, `rucksack`）の幾何形状とSVG描画を実装
- `src/core/scenes/forest.ts`（新規） — 背景「きのこの もり」（4種の服の柄、base、4領域 `ground`/`tent`/`mushroom`/`bush`、decor、minorDecor、9つの隠れ場所）を実装
- `src/core/scenes/index.ts` — `SCENES` と `SCENE_IDS` に `forest` を追加
- `src/core/peeks.ts` — `TENT_FRONT`・`MUSH_FRONT` と `PEEKS.forest`（`forest-peek-tent`, `forest-peek-mush-1`, `forest-peek-mush-2`）を追加
- `src/core/characters.ts` — 新しい友だち `pino`（ぴの）を `CharacterId`, `CHARACTERS`, `CHARACTER_IDS`, `SCENE_FRIENDS` (`{ scene: 'forest', char: 'pino' }`), `headMarkup` に追加
- `src/entitlements/entitlements.ts` — `PackId` に `'forest'`、`PACKS` に `きのこの もり パック`（`scene:forest`, `char:pino`, `room:treehouse`）を追加
- `src/core/stickers.ts` — `Motif` に `'mushroom' | 'acorn' | 'lantern' | 'squirrel'` を追加、きのこの もりのシール5枚（`f-s1`, `f-s5`, `f-s15`, `f-s30`, `f-s50`）を追加、`stickerHint` が `SCENES[s.scene ?? 'beach'].name` を使って背景名（`うみべで` / `きのこの もりで`）を動的に出すよう変更
- `src/ui/stickerArt.ts` — 新モチーフ4種（`mushroom`, `acorn`, `lantern`, `squirrel`）のコード描画SVGを追加
- `src/core/movers.ts` — `MoverKind` に `'squirrel' | 'owl' | 'falling-leaf'` を追加、`MOVERS.forest`（5体）と `MOVER_NAMES` を追加
- `src/ui/moverView.ts` — `squirrel`, `owl`, `'falling-leaf'` の `fallback` 描画、`FLY` 配列、`BOX` 座標を追加
- `src/core/myroom.ts` — `RoomId` と `ROOMS` に `treehouse`（ひみつきち、`needCleared: 0`, `content: 'room:treehouse'`）を追加、`ItemDef` に `content?: ContentId` を追加し、`ITEMS` に6つの新しいもの（`camp-tent`, `stump-chair`, `acorn-lamp`, `mushroom-table`, `campfire-pot`, `squirrel`）を追加、`ownedItems` で `sticker: null` かつ `content` 指定のあるものをパック境界で判定するよう更新、`starterLayout('treehouse')` を追加
- `src/ui/myroomView.ts` — `OUTFIT` に `pino` の部屋着（`leaf` 柄）、`TALL` に `'acorn-lamp': 160` を追加

### スクリプト (`scripts/`)
- `scripts/validate-art.mjs` — `myroom/rooms` のファイル名正規表現を `/^(living|bedroom|yard|treehouse)\.svg$/` に更新

### テスト (`tests/`)
- `tests/unit/forest.test.ts`（新規） — `forest` の全9スポット×全7友だちの `analyzeSpot` / `validateLayout` 検査、スポット同士の非干渉、のぞき場所3か所×全7友だちの `analyzePeek` 検査、パック境界（無料ユーザーに `forest`・`pino`・`treehouse`・もり限定アイテム・シールが出ないこと）のテスト
- `tests/unit/stickers.test.ts` — シール総数（18→23）、`pino` 解放条件、`stickerHint` の背景名表示テストを更新
- `tests/unit/access.test.ts` — `withForest` の境界テスト（`pino`、`canResume`、シール帳の枚数 18→23）を追加
- `tests/unit/myroom.test.ts` — `openRooms`（`treehouse` 追加）と `ownedItems`（`camp-tent` のパック判定）の期待値を更新
- `tests/unit/movers.test.ts` — `SIZE` に `squirrel`, `owl`, `'falling-leaf'` を追加
- `tests/unit/hardest.test.ts` — 全友だち登場チェックに `pino` を追加
- `tests/e2e/offline.spec.ts` — 背景カード数の期待値を `4` → `5` に更新
- `tests/e2e/course.spec.ts` — コース5クリア時点の未取得シール枚数を `11` → `16` に更新
- `tests/e2e/myroom.spec.ts` — ベータ全開放時の部屋タブ数（コース0で `2`、コース3で `3`、コース9で `4`）およびコース4時点の「もの」の数を `9` → `10` に更新

---

## 2. 仕様（`strategy/packs/forest-spec.md`）から微調整した点とその理由

1. **`forest-tent-1`（`x: 115` → `x: 112`）と `forest-tent-2`（`x: 275` → `x: 276`）の X 座標微調整**
   - **理由**: 仕様書 3.1 節の「9か所のうちどの3か所を同時に選んでも一切重ならない（`!spotsConflict`）」を満たすため。`mimi` の回転した耳を含めた `spotBBox` の横幅は `s = 1` で `157.08px`（`x ± 78.54`）あり、`LIMITS.gap = 4` を足すと同段のスポット中心間距離は `161.08px` 以上必要です。`x = 115` と `x = 275`（差 `160px`）では `1.08px` だけ重なり判定になっていたため、`x = 112` と `x = 276`（差 `164px`）に広げることで、全9か所のどの2か所（全36組）も `spotsConflict === false` となり、かつ `tent` 領域（`x: 30..360`）の内部に完全に収まります。

2. **`forest-bush-1` の X 座標（`x: 470` → `x: 476`）**
   - **理由**: コース6（`spots: 'easy'`, `umbrella: { rate: 1, style: 'camo' }`）では、`easy: true` のスポットの中に「かさ（`UMBRELLA_CANOPY`: `x: [-128, +116]`）が他のスポットの前景小物と重ならない場所」が必要です。`forest-bush-1` を `x = 476` にすることで、かさの左端 `348` が `forest-tent-2` の前景小物 `logTable(276, 592, 134, 70)` の右端 `343` と重ならず、手前の隣スポット（`forest-ground-2`, `forest-bush-2`）とも十分な間隔を保っています。

3. **`props-forest.ts` の `campfire` の高さ（`top + 22` → `top + 14`、楕円 `rx: 36, ry: 22`）**
   - **理由**: コース10（`HARDEST_BAND`: `bodyVisible` が `0.25..0.40`）で `forest-ground-1`（`s = 1.0`, `y = 955`）が選ばれるよう、胴体の隠れ率を約61%（`bodyVisible ≈ 0.39`）に調整しました。

4. **`ItemDef` への `content?: ContentId` 追加（`camp-tent` のパック境界管理）**
   - **理由**: 仕様書 7.2 節および 7.5 節の「`camp-tent` は `sticker: null` だが、きのこの もりパックを持っている人だけ最初から使えるようにする」を実現するため、`ItemDef` に `content?: ContentId` を持たせ、`camp-tent` に `content: 'scene:forest'` を設定しました。

---

## 3. Claude がテストで確かめるべき所（更新済み）

既存のユニットテスト 429 件はすべて合格済みです。今回修正した以下の点を確認してください：

1. **`tests/unit/forest.test.ts` の4テストと型チェック（`npx tsc --noEmit` / `npx vitest run tests/unit/forest.test.ts`）**
   - `easy: true` のスポット数を仕様・`beach.ts` と同じ `5` に修正しました。
   - `validateLayout` に渡す `costume` を `sp.region` ではなく `costumeForRegion(forest, sp.region)` に修正しました。
   - `forest-tent-1` (`x: 112`) と `forest-tent-2` (`x: 276`) の間隔調整により、全36ペアの `spotsConflict === false` が通ることを確認してください。
   - `Difficulty` を `['easy', 'normal']` に修正し、背景の絞り込みを `app.ts` の `sceneCards` と同じ `SCENE_IDS.filter((id) => can(\`scene:${id}\`))` に統一しました。
2. **E2Eテスト（`npx playwright test`）**
   - `tests/e2e/offline.spec.ts`, `tests/e2e/course.spec.ts`, `tests/e2e/myroom.spec.ts` の要素数更新箇所が実ブラウザ上で通るか。
