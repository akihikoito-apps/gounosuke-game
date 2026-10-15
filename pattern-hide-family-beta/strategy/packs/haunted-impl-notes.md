# 「おばけやしき（haunted）」パック 実装ノート

## 1. 変更・新規作成したファイル一覧

### 仕様書・絵の依頼書 (`strategy/`, `codex-jobs/drafts/`)
- `strategy/PACKS_PLAN.md` — 友だち一覧表に `pino`・`puka` を追記し、候補⑥「おばけやしき パック（haunted）」の仕様概要・価格/優先度表を追加
- `strategy/packs/haunted-spec.md`（新規） — 「おばけやしき（haunted）」パックの完全仕様書（背景4領域・柄・前景小物9種・隠れ場所9か所・のぞき場所3か所・新しい友だち `fuwa`・うごくもの5体・シール5枚・じぶんのへや `attic` と家具6種・追加パック定義）
- `codex-jobs/drafts/haunted-art.md`（新規） — Codex 向け絵の依頼文下書き（合計28枚のSVG仕様・パレット・禁止事項・検査手順）

### コア・データ・UI (`src/`)
- `src/core/scene.ts` — `SceneId` に `'haunted'` を追加
- `src/core/props-haunted.ts`（新規） — おばけやしきの前景小物9種（`smilePumpkin`, `candleStand`, `ghostPlush`, `magicBooks`, `batCushion`, `candyPots`, `musicBox`, `teaCart`, `lanternPost`）の幾何形状とSVG描画を実装
- `src/core/scenes/haunted.ts`（新規） — 背景「おばけやしき」（4種の服の柄、base、4領域 `floor`/`curtain`/`sofa`/`carpet`、decor、minorDecor、9つの隠れ場所）を実装
- `src/core/scenes/index.ts` — `SCENES` と `SCENE_IDS` に `haunted` を追加
- `src/core/peeks.ts` — `CURTAIN_FRONT`・`SOFA_FRONT` と `PEEKS.haunted`（`haunted-peek-curtain`, `haunted-peek-sofa-1`, `haunted-peek-sofa-2`）を追加
- `src/core/characters.ts` — 新しい友だち `fuwa`（ふわ）を `CharacterId`, `CHARACTERS`, `CHARACTER_IDS`, `SCENE_FRIENDS` (`{ scene: 'haunted', char: 'fuwa' }`), `headMarkup` に追加
- `src/entitlements/entitlements.ts` — `PackId` に `'haunted'`、`PACKS` に `おばけやしき パック`（`scene:haunted`, `char:fuwa`, `room:attic`）を追加
- `src/core/stickers.ts` — `Motif` に `'pumpkin' | 'ghost' | 'bat' | 'musicbox'` を追加、おばけやしきのシール5枚（`h-s1`, `h-s5`, `h-s15`, `h-s30`, `h-s50`）を追加（全33枚）
- `src/ui/stickerArt.ts` — 新モチーフ4種（`pumpkin`, `ghost`, `bat`, `musicbox`）のコード描画SVGを追加
- `src/core/movers.ts` — `MoverKind` に `'ghost' | 'bat' | 'candle'` を追加、`MOVERS.haunted`（5体）と `MOVER_NAMES` を追加
- `src/ui/moverView.ts` — `'ghost'`, `'bat'`, `'candle'` の `fallback` 描画、`FLY` 配列、`BOX` 座標を追加
- `src/core/myroom.ts` — `RoomId` と `ROOMS` に `'attic'`（ほしの やねうらべや、`needCleared: 0`, `content: 'room:attic'`）を追加、`ITEMS` に6つの新しいもの（`gothic-sofa`, `star-rug`, `pumpkin-lantern`, `music-box`, `ghost-chair`, `ghost-plush`）を追加、`starterLayout('attic')` を追加
- `src/ui/myroomView.ts` — `OUTFIT` に `fuwa` の部屋着（星ラベンダー水玉柄）、`TALL` に `'pumpkin-lantern': 160` を追加

### スクリプト (`scripts/`)
- `scripts/validate-art.mjs` — `myroom/rooms` のファイル名正規表現を `/^(living|bedroom|yard|treehouse|aquarium-room|attic)\.svg$/` に更新

### テスト (`tests/`)
- `tests/unit/haunted.test.ts`（新規） — `haunted` の全9スポット×全9友だちの `analyzeSpot` / `validateLayout` 検査、スポット同士の非干渉（全36ペア）、のぞき場所3か所×全9友だちの `analyzePeek` 検査、パック境界（無料ユーザーに `haunted`・`fuwa`・`attic`・おばけやしき限定アイテム・シールが出ないこと）のテスト
- `tests/unit/stickers.test.ts` — シール総数（28→33）、`fuwa` 解放条件、`stickerHint` の背景名表示テスト（`おばけやしきで`）を更新
- `tests/unit/access.test.ts` — `withHaunted` の境界テスト（`fuwa`、`canResume`、シール帳の枚数 28→33）を追加
- `tests/unit/myroom.test.ts` — `openRooms`（`attic` 追加）と `ownedItems`（`gothic-sofa`・`star-rug` のパック判定）の期待値を更新
- `tests/unit/movers.test.ts` — `SIZE` に `'ghost'`, `'bat'`, `'candle'` を追加
- `tests/unit/hardest.test.ts` — 全友だち登場チェックに `fuwa` を追加
- `tests/e2e/offline.spec.ts` — 背景カード数の期待値を `6` → `7` に更新
- `tests/e2e/course.spec.ts` — コース5クリア時点の `sceneFirst` の対象配列に `'haunted'` を追加し、未取得シール枚数を `21 - sceneFirst` → `26 - sceneFirst`（全33枚）に更新
- `tests/e2e/myroom.spec.ts` — ベータ全開放時の部屋タブ数（コース0で `4`、コース3で `5`、コース9で `6`）およびコース4時点の「もの」の数を `11` → `12` に更新

---

## 2. 設計上の工夫と仕様との対応

1. **「暗いけれど、こわくない・かわいい」色彩と視認性の両立**
   - 壁や夜空の装飾には深い夜色（`#4A3F6B`, `#2C3258`）を使いつつ、友だちの服の柄の地の色（`costumes` の `bg`）はすべて中間の明るさ（`#9E92B8` ラベンダーグレー、`#8672A8` ドレープパープル、`#7A86B8` トワイライトブルー、`#C8A882` ビスケットベージュ）に設定しました。これにより、友だちの輪郭線（`#4A3A40`）や黒い目（`#3A2E39`）が背景に沈まず、既存の明るいステージと同じくらいはっきり見分けられます。

2. **柄の領域（`regions`）を物の形に合わせた多角形（`poly` + `quadPoints`）で実装**
   - 「ただの四角い板」に見えないよう、以下の形状（`CURTAIN_POLY`, `SOFA_POLY`, `CARPET_POLY`）にしました：
     - `curtain`（月見窓のドレープカーテン）：上部がゴシックアーチ（頂点 `(195, 255)`）に盛り上がる窓枠とドレープの多角形。
     - `sofa`（背もたれの高いアンティークソファ）：上部が猫脚・ベルベット背もたれの曲線（頂点 `(775, 406)`）を描く多角形。
     - `carpet`（フリンジ付きのふかふか絨毯）：上下左右がやわらかく膨らむ絨毯形状の多角形。
   - `src/core/peeks.ts` の `CURTAIN_FRONT`・`SOFA_FRONT` も同じ曲線で統一しています。

3. **新しい友だち `fuwa`（ふわ）の頭シルエット**
   - 頭頂のふわふわ毛束（`{ cx: 0, cy: -195, rx: 12, ry: 14 }`）と、左右に広がった小さな羽耳（`rotEllipse(±52, -168, 19, 12, ±20, ±46, -168)`）の3点構成とし、既存8体（丸耳・垂れ耳・もこもこ・三角耳・頭頂毛・横ハサミ・ベレー帽・横ヒレ）のいずれとも重ならない形にしました。
   - 外形は `|x| <= 70.1`, `y >= -209` に収まるため、既存の全ステージの `spotBBox` の外枠サイズに影響を与えません。

---

## 3. テスト失敗3件の修正（2026-10-15 追記）

1. **`tests/unit/courses.test.ts`（course 8 の傘の出現率）の修正 — `src/core/scenes/haunted.ts`, `src/core/peeks.ts`**
   - **原因**: `accessoryFits(haunted, spot, char, 'umbrella', 'camo')` において、当初の `haunted` では9か所中2か所（`haunted-curtain-2`, `haunted-carpet-1`）しか傘が使えませんでした：
     - `haunted-curtain-1`（`x = 112`）は傘の左端 `x - 128 = -16 < 6` で `out of bounds`。
     - `haunted-sofa-1` / `haunted-sofa-2`（`y = 652`）は傘の基準点 `UMBRELLA_ANCHOR`（`y = 376`）が `hall` 領域（`y >= 460`）より上にあり、`regionAt` が `null` で `camo match 0.00`。
     - 手前の列（`haunted-carpet-2`, `haunted-carpet-3`, `haunted-hall-1`, `haunted-hall-2`）は傘の上端（`y = spot.y - 322`）が奥の列の小物（`y = 590..662`）や領域境界（`y = 654`）に重なり `under another prop` / `camo match` 不足。
   - **修正**:
     - 屋内の洋館ホールに合わせて `hall` 領域を `y = 240..1000`（`{ kind: 'rect', x: 0, y: 240, w: 1000, h: 760 }`）に広げました。
     - 奥の列（`curtain-1/2`, `sofa-1/2`）および `CURTAIN_POLY`・`SOFA_POLY`・`CURTAIN_FRONT`・`SOFA_FRONT`・`PEEKS.haunted` を `y = 584` 基準（`dy = -68`）に上げ、さらに `curtain-1` を `x = 136`（`136 - 128 = 8 >= 6`）、`curtain-2` を `x = 300`、`CURTAIN_POLY` の横幅を `x = 14..388` に広げました。
     - 手前の列（`carpet-1/2/3`, `hall-1/2`）を `y = 922..928`（`CARPET_POLY` 上端 `y = 784`）に配置しました。これにより、手前の列の傘（`y = 600..696`）が奥の列の小物（下端 `y = 594`）や奥のキャラクターの足もと（`y = 588.5`）と一切重ならず、かつ `hall` 領域内に100%収まります。
     - 結果として、**`haunted` の全9スポットすべて（easy 5か所・通常4か所の9/9）で `hat`（color / camo）と `umbrella`（camo）の両方が `accessoryFits` に合格**するようになり、`tests/unit/haunted.test.ts` にもその検査を追加しました。

2. **`tests/unit/haunted.test.ts`（`openRooms` の `sceneFinds` 対応と `starterLayout('attic')`）の修正**
   - `tests/unit/forest.test.ts` と同じ形に合わせ、`openRooms(10, baseOnly, { haunted: 9 })`・`openRooms(0, withHaunted)` では `attic` が開かず、`openRooms(0, withHaunted, { haunted: 1 })` で開く検査に更新しました。
   - あわせて `starterLayout('attic')` の期待値も、新しい仕様（同じ友だちは1つの部屋にだけ置けるため `[{ ref: 'item:gothic-sofa', x: 280, y: 720 }]`）に合わせました。

3. **`tests/unit/myroom.test.ts`（`gothic-sofa` と `attic` の追加）の修正**
   - `openRooms` のパック部屋テストに `haunted: 1` → `'attic'` を追加し、`ownedItems` の全パック所有時の期待値に `'gothic-sofa'` を追加、無料（`baseOnly`）で出ない物の検査に `'gothic-sofa'`・`'star-rug'` を追加しました。

---

## 4. 自信のない所（Claude がテストで確かめるべき所）

1. **`tests/unit/courses.test.ts` の全10コースの帽子・傘の出現率と配置検証**
   - `haunted` の全9スポットで帽子・傘ともに `accessoryFits` が通るようになり、奥の列と手前の列の傘・キャラクター外枠も重ならない座標にしてありますが、全シードで `course 8` を含む全コースが合格するか確認してください。
2. **`tests/unit/haunted.test.ts`・`tests/unit/hardest.test.ts`・`tests/unit/movers.test.ts`**
   - 座標調整後の `haunted` で `analyzeSpot`・`analyzePeek`・`hardestRound`・`movers` の交差判定（手前の列 `body.y = 842..848` が `haunted-ghost` の `y = 763.4..860` と交差）がすべて通るか確認してください。

