# 「すいぞくかん（aquarium）」パック 実装ノート

## 1. 変更・新規作成したファイル一覧

### コア・データ・UI (`src/`)
- `src/core/scene.ts` — `SceneId` に `'aquarium'` を追加
- `src/core/props-aquarium.ts`（新規） — すいぞくかんの前景小物9種（`turtleBoard`, `coralDisplay`, `guideStand`, `bubbleBench`, `shellCushion`, `pearlClams`, `dolphinPlush`, `souvenirCart`, `penguinSign`）の幾何形状とSVG描画を実装
- `src/core/scenes/aquarium.ts`（新規） — 背景「すいぞくかん」（4種の服の柄、base、4領域 `floor`/`tank`/`jelly`/`mat`、decor、minorDecor、9つの隠れ場所）を実装
- `src/core/scenes/index.ts` — `SCENES` と `SCENE_IDS` に `aquarium` を追加
- `src/core/peeks.ts` — `TANK_FRONT`・`JELLY_FRONT` と `PEEKS.aquarium`（`aquarium-peek-tank`, `aquarium-peek-jelly-1`, `aquarium-peek-jelly-2`）を追加
- `src/core/characters.ts` — 新しい友だち `puka`（ぷか）を `CharacterId`, `CHARACTERS`, `CHARACTER_IDS`, `SCENE_FRIENDS` (`{ scene: 'aquarium', char: 'puka' }`), `headMarkup` に追加
- `src/entitlements/entitlements.ts` — `PackId` に `'aquarium'`、`PACKS` に `すいぞくかん パック`（`scene:aquarium`, `char:puka`, `room:aquarium-room`）を追加
- `src/core/stickers.ts` — `Motif` に `'jellyfish' | 'dolphin' | 'treasure' | 'penguin'` を追加、すいぞくかんのシール5枚（`a-s1`, `a-s5`, `a-s15`, `a-s30`, `a-s50`）を追加
- `src/ui/stickerArt.ts` — 新モチーフ4種（`jellyfish`, `dolphin`, `treasure`, `penguin`）のコード描画SVGを追加
- `src/core/movers.ts` — `MoverKind` に `'tropical-fish' | 'jellyfish' | 'penguin' | 'bubble'` を追加、`MOVERS.aquarium`（5体）と `MOVER_NAMES` を追加
- `src/ui/moverView.ts` — `'tropical-fish'`, `jellyfish`, `penguin`, `bubble` の `fallback` 描画、`FLY` 配列、`BOX` 座標を追加
- `src/core/myroom.ts` — `RoomId` と `ROOMS` に `'aquarium-room'`（すいぞくかんの へや、`needCleared: 0`, `content: 'room:aquarium-room'`）を追加、`ITEMS` に6つの新しいもの（`shell-sofa`, `coral-rug`, `jelly-lamp`, `dolphin-ride`, `treasure-box`, `penguin`）を追加、`starterLayout('aquarium-room')` を追加
- `src/ui/myroomView.ts` — `OUTFIT` に `puka` の部屋着（水玉柄）、`TALL` に `'jelly-lamp': 160` を追加

### スクリプト (`scripts/`)
- `scripts/validate-art.mjs` — `myroom/rooms` のファイル名正規表現を `/^(living|bedroom|yard|treehouse|aquarium-room)\.svg$/` に更新

### テスト (`tests/`)
- `tests/unit/aquarium.test.ts`（新規） — `aquarium` の全9スポット×全8友だちの `analyzeSpot` / `validateLayout` 検査、スポット同士の非干渉（全36ペア）、のぞき場所3か所×全8友だちの `analyzePeek` 検査、パック境界（無料ユーザーに `aquarium`・`puka`・`aquarium-room`・すいぞくかん限定アイテム・シールが出ないこと）のテスト
- `tests/unit/stickers.test.ts` — シール総数（23→28）、`puka` 解放条件、`stickerHint` の背景名表示テストを更新
- `tests/unit/access.test.ts` — `withAquarium` の境界テスト（`puka`、`canResume`、シール帳の枚数 23→28）を追加
- `tests/unit/myroom.test.ts` — `openRooms`（`aquarium-room` 追加）と `ownedItems`（`shell-sofa`・`coral-rug` のパック判定）の期待値を更新
- `tests/unit/movers.test.ts` — `SIZE` に `'tropical-fish'`, `jellyfish`, `penguin`, `bubble` を追加
- `tests/unit/hardest.test.ts` — 全友だち登場チェックに `puka` を追加
- `tests/e2e/offline.spec.ts` — 背景カード数の期待値を `5` → `6` に更新
- `tests/e2e/course.spec.ts` — コース5クリア時点の `sceneFirst` の対象配列に `'aquarium'` を追加し、未取得シール枚数を `16 - sceneFirst` → `21 - sceneFirst`（全28枚）に更新
- `tests/e2e/myroom.spec.ts` — ベータ全開放時の部屋タブ数（コース0で `3`、コース3で `4`、コース9で `5`）およびコース4時点の「もの」の数を `10` → `11` に更新

---

## 2. 仕様（`strategy/packs/aquarium-spec.md`）から微調整した点とその理由

1. **`tank`・`jelly`・`mat` の各領域（`regions`）を単なる四角（`rect`）ではなく、物の形に合う多角形（`poly` + `quadPoints`）に変更**
   - **理由**: ご指示のとおり、柄の領域が「ただの四角い板」に見えないよう、以下の形状（`TANK_POLY`, `JELLY_POLY`, `MAT_POLY`）にしました：
     - `tank`（パノラマ大水槽）：上部が `y = 310` から頂点 `(195, 255)` へ丸く盛り上がるアーチ窓型の `poly`。
     - `jelly`（クラゲドーム水槽）：上部が `(576, 440)` から頂点 `(775, 406)` を通って `(974, 440)` へ丸く弧を描くクラゲ傘ドーム型の `poly`。
     - `mat`（キッズコーナーのクッションマット）：上辺 `y = 770` から左右と下辺がやわらかく膨らむ遠近クッション型の `poly`。
   - これに合わせて `decor` の水槽フレームおよび `src/core/peeks.ts` の `TANK_FRONT`・`JELLY_FRONT` も同じアーチ／ドーム曲線の `poly` に統一しました。
   - 特に `jelly` ドームの上縁（`x = 680, 860` で `y ≈ 408..413`）は、通常の立ち位置（`y = 652`）での迷彩ニット帽の上端（`y = 411..426`）を包み込みつつ、最難関ののぞき位置（`y = 520, s = 0.9`）での両目（`y = 383.2..401.2`）と頭の特徴（`puka` の横ヒレ `y = 371.5..394.9` 等）がドームの上から100%露出する高さに設計しています。

2. **`MOVERS.aquarium` の `aquarium-fish2` の Y 座標（`550 → 580` から `580 → 600` へ微調整）**
   - **理由**: `tests/unit/movers.test.ts` の「前を通るものは、ときどき どこかの友だちの前を ほんとうに横切る（`body.y = sp.y - 80 * sp.s` が `p.y - h * scale .. p.y` に入る）」を確実に満たし、かつ奥の段（`y = 652`）の顔（`face.y = 510`）には一切かからない（`580 - 56 = 524 > 510`）高さにするためです。

---

## 3. 自信のない所（Claude がテストで確かめるべき所）

1. **`JELLY_POLY` のドーム上縁での迷彩ニット帽（`accessoryFits(aquarium, spot, ch, 'hat', 'camo', side)`）の一致率**
   - `aquarium-jelly-1`（`x = 680, y = 652`）と `aquarium-jelly-2`（`x = 865, y = 652`）で、ドームの曲線（`y ≈ 408..424`）に対して通常・斜め深かぶり（`deep: 'l' | 'r'`）の `hat` のサンプル点が `match >= 0.70`（および `HARDEST` 優先帯の `hatMatch >= 0.90`）を満たしているか、`tests/unit/aquarium.test.ts`・`tests/unit/courses.test.ts`・`tests/unit/hardest.test.ts` で確認してください。
2. **`JELLY_FRONT` のドーム曲線での `analyzePeek`（特に `mimi` の垂れ耳の `featureFrac >= 0.15`）**
   - `aquarium-peek-jelly-1`（`x = 680, y = 520, s = 0.9`）と `aquarium-peek-jelly-2`（`x = 860, y = 520, s = 0.9`）で全8キャラクターが `analyzePeek` を通過するか確認してください。
3. **E2Eテスト（`tests/e2e/offline.spec.ts`, `tests/e2e/course.spec.ts`, `tests/e2e/myroom.spec.ts`）**
   - 背景数6・シール全28枚・部屋タブ最大5の更新箇所が通るか確認してください。
