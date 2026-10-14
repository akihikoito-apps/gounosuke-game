# 追加パック仕様書：`aquarium`（すいぞくかん パック）

> `strategy/PACKS_PLAN.md` の第2候補「すいぞくかん パック」を実装するための詳細仕様書です。
> `src/core/scenes/forest.ts`・`src/core/props-forest.ts`・`src/core/myroom.ts`・`src/core/movers.ts`・`src/core/stickers.ts` と同じ粒度・座標系で設計し、`forest` 実装時の知見（`spotBBox + LIMITS.gap` による全スポット非干渉、`easy: true` 5か所、コース6の迷彩傘の収まり、最難関の `HARDEST_BAND` 胴体可視率 `0.25..0.40`、コース4〜5向けの `back` 移動体2個以上＋合計5個）を最初からすべて反映しています。

---

## 1. パックの境界（`src/entitlements/entitlements.ts`）

- **PackId**: `'aquarium'`
- **表示名**: `'すいぞくかん パック'`
- **free**: `false`
- **contents**:
  - `'scene:aquarium'`（背景「すいぞくかん」）
  - `'char:puka'`（友だち「ぷか」：すいぞくかんで初めて誰かを見つけると仲間になる）
  - `'room:aquarium-room'`（じぶんの へや「すいぞくかんの へや」）

---

## 2. 背景 `aquarium`（すいぞくかん）の配置（1000×1000）

### 2.1 服と背景の柄 4種（`costumes`）

`validate-art.mjs` の柄タイル命名規則（`{scene}-{plain|stripes|dots|check|leaf}`）にそのまま適合する4種類で構成します。

| id | kind | bg（地の色） | fg（柄の色） | size | 背景での役割 |
|---|---|---|---|---|---|
| `plain` | `'plain'` | `#C8DCE8`（清潔なアクアブルーグレー） | `#C8DCE8` | `40` | 水族館の通路・タイル床（`floor`） |
| `stripes` | `'stripes'` | `#78C6D6`（明るいアクアターコイズ） | `#4EA4B8`（深いマリンブルー） | `40` | 左側のパノラマ大水槽の水流しま模様（`tank`） |
| `dots` | `'dots'` | `#8E9CE0`（幻想的なラベンダーブルー） | `#F4F7FF`（パールホワイト） | `44` | 右側の丸いクラゲドーム水槽の水玉模様（`jelly`） |
| `check` | `'check'` | `#FFF4EE`（シェルアイボリー） | `#F2A698`（パステルコーラル） | `48` | 手前中央〜右のキッズコーナーの波型クッションマット（`mat`） |

### 2.2 土台（`base`）・領域（`regions`）・飾り（`decor` / `minorDecor`）

座標系は `viewBox="0 0 1000 1000"`。`regions` は配列の順に奥から手前へ塗られます。

#### `base`（柄の領域より下に塗る背景）
- **水族館の天井・水中トンネルの上部空間**（`x: 0, y: 0, w: 1000, h: 470`）：淡いミストアクア `#D6ECF4`
- **館内の奥の壁帯**（`x: 0, y: 300, w: 1000, h: 170`）：落ち着いたスレートアクア `#B2D4E4`
- **水中トンネルのアーチ梁**：`<path d="M0 180 Q500 80 1000 180" fill="none" stroke="#96C0D4" stroke-width="14"/>`
- **天井からのやわらかいスポットライト光**：`<circle cx="480" cy="110" r="44" fill="#FFF6C8" opacity="0.8"/>`

#### `regions`（柄の領域 4つ）

| 順番 | id | costume | 形状（`shapes`） | 説明・ねらい |
|---|---|---|---|---|
| 1 | `floor` | `'plain'` | `{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }` | 水族館の床全体（`y = 460..1000`）。手前左側のスポット2か所、および `aquarium-mat-1` の迷彩傘の背景になる |
| 2 | `tank` | `'stripes'` | `{ kind: 'rect', x: 30, y: 240, w: 330, h: 414, rx: 14 }` | 左側のパノラマ大水槽（`x: 30..360, y: 240..654`）。高さ414を確保し、コース後半で迷彩の帽子をかぶっても100%領域内に収まる |
| 3 | `jelly` | `'dots'` | `{ kind: 'rect', x: 580, y: 340, w: 390, h: 314, rx: 40 }` | 右側のクラゲドーム水槽（`x: 580..970, y: 340..654`）。上端を `y = 340` まで高く取ることで、コース6で `aquarium-jelly-1` が迷彩の傘をさしても領域一致率70%以上を満たす |
| 4 | `mat` | `'check'` | `{ kind: 'rect', x: 370, y: 760, w: 560, h: 212, rx: 48 }` | 手前中央〜右のキッズコーナーのクッションマット（`x: 370..930, y: 760..972`）。チェックの服で上に立つと溶け込む |

#### `decor`（領域の上・キャラクターの後ろの飾り）
- **パノラマ大水槽の上下フレーム**：
  - 上部フレーム：`<rect x="20" y="226" width="350" height="22" rx="8" fill="#5E8EA8" stroke="#4A3A40" stroke-width="4"/>`
  - 下部台座：`<rect x="20" y="648" width="350" height="14" rx="4" fill="#5E8EA8" stroke="#4A3A40" stroke-width="3"/>`
- **クラゲドーム水槽のアーチ枠と台座**：
  - 下部台座：`<rect x="572" y="648" width="406" height="14" rx="4" fill="#6E82B8" stroke="#4A3A40" stroke-width="3"/>`
  - ガラスの白いハイライト線（顔の後ろ `y ≈ 510` を避けて上端 `y = 356` 付近のみ）：`<path d="M610 358 H940" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`
- **床の貝がらタイル模様（中央通路）**：
  - キャラクターの立たない中央通路（`x = 460, y = 690` / `x = 530, y = 725`）に丸い水色タイルのステップ（`<ellipse cx="460" cy="690" rx="36" ry="14" fill="#B0CAD8"/><ellipse cx="530" cy="725" rx="36" ry="14" fill="#B0CAD8"/>`）

#### `minorDecor`（小さい画面では省く飾り）
- 水中トンネルの上部を漂う小さな白い泡（`cx: 200, cy: 110, r: 12`、`cx: 230, cy: 86, r: 8`、`cx: 620, cy: 130, r: 10`）
- 遠くを泳ぐ小さな魚のシルエット（`x: 420, y: 170`）

---

## 3. 隠れ場所 9か所（`spots`）と のぞき場所 3か所（`PEEKS`）

### 3.1 隠れ場所 9か所（`spots`）

`forest` の実装検証で確立した幾何条件をすべて満たす座標です：
- **画面内（`inBounds`）**：`112 <= x <= 865`, `652 <= y <= 956`（全キャラクターの輪郭がマージン6px以上内側）
- **全36ペアで重なりなし（`spotsConflict(a, b) === false`）**：
  - `mimi` の耳を含む `spotBBox` 横幅（`s = 1` で `157.08px`）＋ `LIMITS.gap = 4` より、同じ段のスポット中心間距離は **`161.08px` 以上**（最小でも `aquarium-tank-1` と `aquarium-tank-2` の `276 - 112 = 164px`）。
  - 奥の段（`y = 652`）と手前の段（`y = 884..956`）は縦方向に `232px` 以上離れているため（必要差 `222.5px`）、**9か所のうちどの2か所も衝突せず、どの3か所を同時に選んでも一切重なりません**。
- **`easy: true` は 5か所**：`aquarium-tank-1`, `aquarium-jelly-1`, `aquarium-mat-1`, `aquarium-mat-3`, `aquarium-floor-1` の5か所。
- **コース6の迷彩傘（`spots: 'easy'`, `umbrella: 'camo'`）対応**：
  - `aquarium-mat-1`（`x: 476, y: 884, easy: true`）の傘（`x: 348..592, y: 562..652`）は、`aquarium-tank-2` の小物右端（`343`）とも `aquarium-jelly-1` の小物左端（`612`）とも重ならず、`floor` 領域に90%以上収まります。
  - さらに `aquarium-jelly-1`（`x: 680, y: 652, easy: true`）の傘（`x: 552..796, y: 330..420`）も、`jelly` 領域（`y: 340..654`）に85%以上収まり他小物と一切重なりません。
- **最難関の優先帯（`HARDEST_BAND`: `bodyVisible` が `0.25..0.40`）**：
  - 各小物の本体の高さを `54〜68px`（足もと上 `54〜62px`）に揃えることで、複数のスポットが `bodyVisible ≈ 0.34..0.39` の優先帯に入り、口（`spot.y - 125`）との間にも `31〜65px` の安全余白を確保しています。

| id | x | y | s | region | 前の小物（`prop`） | easy | 顔(口)のy | 小物上端y | 狙い・見え方 |
|---|---|---|---|---|---|---|---|---|---|
| `aquarium-tank-1` | `112` | `652` | `1` | `'tank'` | `turtleBoard(112, 590, 124, 72)` | `true` | `527` | `576` | しまの大水槽の左前。ウミガメの解説パネルの後ろ |
| `aquarium-tank-2` | `276` | `652` | `1` | `'tank'` | `coralDisplay(276, 592, 134, 70)` | `false` | `527` | `580` | しまの大水槽の右前。サンゴの展示モデルの後ろ |
| `aquarium-jelly-1` | `680` | `652` | `1` | `'jelly'` | `guideStand(680, 594, 136, 68)` | `true` | `527` | `582` | 水玉クラゲ水槽の左前。丸い案内スタンドの後ろ |
| `aquarium-jelly-2` | `865` | `652` | `1` | `'jelly'` | `bubbleBench(865, 594, 136, 68)` | `false` | `527` | `594` | 水玉クラゲ水槽の右前。丸いアクアベンチの後ろ |
| `aquarium-mat-1` | `476` | `884` | `1` | `'mat'` | `shellCushion(476, 864, 76, 40)` | `true` | `759` | `824` | チェックマットの左。貝がら型クッションの後ろ |
| `aquarium-mat-2` | `650` | `948` | `1` | `'mat'` | `pearlClams(650, 924)` | `false` | `823` | `886` | チェックマットの中央手前。二枚貝のおもちゃ群の後ろ |
| `aquarium-mat-3` | `830` | `884` | `1` | `'mat'` | `dolphinPlush(830, 826, 138, 68)` | `true` | `759` | `814` | チェックマットの右。イルカの大きなぬいぐるみの後ろ |
| `aquarium-floor-1` | `135` | `896` | `1` | `'floor'` | `souvenirCart(135, 838, 134, 70)` | `true` | `771` | `830` | 左手前のタイル床。おみやげワゴンの後ろ |
| `aquarium-floor-2` | `300` | `956` | `0.95` | `'floor'` | `penguinSign(300, 900, 126, 68)` | `false` | `837` | `900` | 左手前のタイル床奥。ペンギン型の案内ボードの後ろ |

### 3.2 最難関用の「のぞき場所」3か所（`src/core/peeks.ts` の `PEEKS.aquarium`）

| id | x | y | s | region | kind | front（前に描き直す領域） | 見え方 |
|---|---|---|---|---|---|---|---|
| `aquarium-peek-tank` | `372` | `652` | `1` | `'floor'` | `'peek'` | `TANK_FRONT`: `[R(22, 224, 348, 442, 14)]` | パノラマ大水槽の右端フレームの陰から、顔の右半分と横ヒレ（または耳・双葉）がひょっこり出る |
| `aquarium-peek-jelly-1` | `680` | `520` | `0.9` | `'jelly'` | `'peek'` | `JELLY_FRONT`: `[R(574, 406, 402, 256, 40)]` | クラゲドーム水槽の左上縁から、両目と頭の特徴だけが出る |
| `aquarium-peek-jelly-2` | `860` | `520` | `0.9` | `'jelly'` | `'peek'` | `JELLY_FRONT`: `[R(574, 406, 402, 256, 40)]` | クラゲドーム水槽の右上縁から、両目と頭の特徴だけが出る |

---

## 4. 前景の小物の一覧（`src/core/props-aquarium.ts`）

`shapes` は可視判定に使われ、`markup` は同じ寸法で描きます。輪郭線は共通の `stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"`。

1. **`turtleBoard(cx: number, top: number, w = 124, h = 72): Prop`**（ウミガメの解説パネル）
   - **shapes**:
     - パネル本体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }`
     - 上部の丸いカメ甲羅モチーフ：`{ kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 }`
   - **見た目**: 木目フレーム（`#C99A68`）に淡いミント色（`#BCE4D8`）のボード。中央にやさしいウミガメのイラストシルエット（文字は入れない）。
2. **`coralDisplay(cx: number, top: number, w = 134, h = 70): Prop`**（サンゴの展示モデル）
   - **shapes**:
     - 台座とサンゴ全体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }`
     - 上部の丸いサンゴの房：`{ kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 }`, `{ kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 }`
   - **見た目**: クリーム色の岩台座（`#E8DCC8`）の上に、コーラルピンク（`#F4989C`）とパステルイエロー（`#FFE082`）の丸みのあるサンゴ模型。
3. **`guideStand(cx: number, top: number, w = 136, h = 68): Prop`**（クラゲの案内スタンド）
   - **shapes**:
     - スタンド本体：`{ kind: 'rect', x: cx - w / 2, y: top + 8, w, h: h - 8, rx: 16 }`
     - 上部のクラゲ型ドーム飾り：`{ kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 }`
   - **見た目**: ラベンダー色（`#B8C0EE`）の丸みのある案内台に、白いクラゲのイラストマークがついている。
4. **`bubbleBench(cx: number, top: number, w = 136, h = 68): Prop`**（丸いアクアベンチ）
   - **shapes**:
     - ベンチ座面と脚：`{ kind: 'rect', x: cx - w / 2 + 6, y: top + 14, w: w - 12, h: h - 14, rx: 12 }`
     - クッションの丸み3つ：`(cx - 36, top + 20, rx: 30, ry: 18)`, `(cx, top + 16, rx: 34, ry: 20)`, `(cx + 36, top + 20, rx: 30, ry: 18)`
   - **見た目**: 水色のぷっくりした泡型ベンチ（`#9AD4E8`）と木製の短い脚（`#B88B58`）。
5. **`shellCushion(cx: number, cy: number, rx = 76, ry = 40): Prop`**（貝がらクッション）
   - **shapes**: `[{ kind: 'ellipse', cx, cy, rx, ry }]`
   - **見た目**: パステルピンク（`#F7C6D0`）のふかふかした扇形ホタテ貝クッション。放射状のやさしい縫い目線が入っている。
6. **`pearlClams(cx: number, cy: number): Prop`**（真珠貝のおもちゃ群）
   - **shapes**: 3つの重なる楕円 `(cx - 40, cy + 6, rx: 44, ry: 28)`, `(cx + 38, cy + 8, rx: 42, ry: 26)`, `(cx, cy - 8, rx: 48, ry: 30)`
   - **見た目**: ラベンダー（`#D6CBEF`）とミント（`#C2E6DC`）の丸い貝がらクッションが3つ並び、白い丸い真珠ボールがのぞいている。
7. **`dolphinPlush(cx: number, top: number, w = 138, h = 68): Prop`**（イルカのぬいぐるみ）
   - **shapes**:
     - 胴体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 24 }`
     - 背びれの丸み：`{ kind: 'ellipse', cx, cy: top, rx: 20, ry: 12 }`
   - **見た目**: 横向きに寝そべった水色（`#88C4E0`、お腹は白 `#FFFDF8`）の丸っこいイルカのぬいぐるみ。
8. **`souvenirCart(cx: number, top: number, w = 134, h = 70): Prop`**（おみやげワゴン）
   - **shapes**:
     - ワゴン本体：`{ kind: 'rect', x: cx - w / 2, y: top + 14, w, h: h - 14, rx: 14 }`
     - 上に並んだ丸いぬいぐるみ・カプセル：`{ kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 }`
   - **見た目**: 白とコーラルピンクの縞ひさしがついた小さな木製ワゴン（`#E8C69E`）。コース10の `HARDEST_BAND`（`bodyVisible: 0.25..0.40`）に入るよう高さを調整済み。
9. **`penguinSign(cx: number, top: number, w = 126, h = 68): Prop`**（ペンギン案内ボード）
   - **shapes**:
     - ボード本体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 18 }`
   - **見た目**: 青い丸みのある看板スタンド（`#7AA8C8`）に、白いお腹と黄色いくちばしのペンギン模様が描かれている（文字なし）。

---

## 5. うごくもの の通り道（`src/core/movers.ts` の `MOVERS.aquarium`）

`MoverKind` に `'tropical-fish'`（さかな）・`'jellyfish'`（くらげ）・`'penguin'`（ペンギン）・`'bubble'`（あわ）の4種を追加します。
コース4〜5（`back` のみから2個選出）とコース10（合計5個選出）のテスト条件を満たすため、`back` 2個＋`front` 3個の計5個を定義します。

| id | kind | 表示名（`MOVER_NAMES`） | move | from | to | sec | scale | layer | 動きの説明 |
|---|---|---|---|---|---|---|---|---|---|
| `aquarium-fish` | `'tropical-fish'` | `'さかな'` | `'cross'` | `{ x: -120, y: 180 }` | `{ x: 1120, y: 150 }` | `15` | `1.1` | `'back'` | 水族館の上部トンネルを左から右へすいすい横切る（`FLY` に含める） |
| `aquarium-jelly` | `'jellyfish'` | `'くらげ'` | `'patrol'` | `{ x: 180, y: 240 }` | `{ x: 820, y: 200 }` | `22` | `1.05` | `'back'` | 館内の上部をふわふわ漂いながら往復する（`FLY` に含める） |
| `aquarium-penguin` | `'penguin'` | `'ペンギン'` | `'patrol'` | `{ x: -90, y: 860 }` | `{ x: 1090, y: 860 }` | `14` | `1.15` | `'front'` | 手前の通路をよちよち歩いて往復する（`step` アニメ） |
| `aquarium-bubble` | `'bubble'` | `'あわ'` | `'cross'` | `{ x: 240, y: 1060 }` | `{ x: 760, y: -40 }` | `12` | `1.0` | `'front'` | 下から上へぷくぷく昇っていく透明感のある泡（`FLY` に含める） |
| `aquarium-fish2` | `'tropical-fish'` | `'さかな'` | `'patrol'` | `{ x: 1090, y: 550 }` | `{ x: -90, y: 580 }` | `13` | `1.0` | `'front'` | 水槽の前をゆったり往復し、奥の段の友だちの前を一瞬横切る |

- **`moverView.ts` の `BOX` と `tests/unit/movers.test.ts` の `SIZE`**：
  - `tropical-fish`: `BOX: [-48, -64, 96, 56]`, `SIZE: { w: 96, h: 56 }`
  - `jellyfish`: `BOX: [-36, -82, 72, 80]`, `SIZE: { w: 72, h: 80 }`
  - `penguin`: `BOX: [-42, -86, 84, 86]`, `SIZE: { w: 84, h: 86 }`
  - `bubble`: `BOX: [-28, -64, 56, 60]`, `SIZE: { w: 56, h: 60 }`

---

## 6. 新しい友だち：`puka`（ぷか）の仕様（`src/core/characters.ts`）

### 6.1 キャラクター定義（`CharacterDef`）
- **id**: `'puka'`
- **name**: `'ぷか'`
- **personality**: `'のんびりやで およぐのが だいすき。ほっぺの よこの ひらひらヒレ が めじるし。'`
- **skin**: `'#E8C6DC'`（やさしいパステルピンクラベンダー）
- **facePoints**: 既存の全キャラクターと共通 `[{ x: -16, y: -142 }, { x: 16, y: -142 }, { x: 0, y: -125 }]`
- **silhouette**:
  - `BODY`（共通の服多角形）
  - `HEAD`（共通の頭楕円 `{ kind: 'ellipse', cx: 0, cy: -142, rx: 48, ry: 45 }`）
  - 左の横ヒレ：`rotEllipse(-52, -152, 18, 12, -15, -46, -152)`
  - 右の横ヒレ：`rotEllipse(52, -152, 18, 12, 15, 46, -152)`

### 6.2 形のポイント（既存7体との違いと検査適合）
1. **白黒シルエットでの識別性**：頭頂ではなく**顔の左右真横（`y = -152` 付近）に水平に近い角度で張り出した「丸い扇形のひらひらヒレ（メンダコ・ウーパールーパー風）」**が目印です。
   - 下へ垂れる `mimi` の耳（`y = -126` 中心）、頭頂の `koro`・`pino`、頭上の `nyako`・`popo`・`choki` のどれともシルエットの位置が異なります。
2. **枠・`spotBBox`・最難関のぞきの適合**：
   - 横ヒレの外端は `|x| ≈ 70` で `mimi`（`78.54`）より内側に収まるため、既存の全シーンの `spotBBox` 横幅を一切広げません。
   - ヒレの高さは `y = -166..-138` にあるため、上からのぞく `PEEKS`（境界 `local_y ≈ -126.7`）で100%露出し、横からのぞく `PEEKS`（境界 `local_x ≈ -2`）でも片側が100%露出するため、全シーンの `analyzePeek`（`featureFrac >= 0.15`）を確実に満たします。
3. **解放条件（`SCENE_FRIENDS`）**：
   - `{ scene: 'aquarium', char: 'puka' }`（すいぞくかんで初めて誰か1人を見つけた瞬間に仲間になる）
4. **じぶんの へや での部屋着（`myroomView.ts` の `OUTFIT`）**：
   - `puka: { kind: 'dots', bg: '#DCECF8', fg: '#FFFFFF', size: 30 }`

---

## 7. じぶんの へや：新しい部屋と新しい物 6つ（`src/core/myroom.ts`）

### 7.1 新しい部屋：`aquarium-room`（すいぞくかんの へや）

| id | name | needCleared | content | floorTop | scaleBack | scaleFront |
|---|---|---|---|---|---|---|
| `'aquarium-room'` | `'すいぞくかんの へや'` | `0` | `'room:aquarium-room'` | `560` | `1.0` | `1.5` |

- **初期配置（`starterLayout('aquarium-room')`）**：
  - `[{ ref: 'item:shell-sofa', x: 280, y: 720 }, { ref: 'char:koro', x: 640, y: 880 }]`
- **`scripts/validate-art.mjs`**：
  - `myroom/rooms` の正規表現に `aquarium-room` を追加します。

### 7.2 新しい物 6つ（`ITEMS`）

すべての物の絵の枠は `viewBox="-150 -300 300 300"`、足もと中央が `(0, 0)` です。
うち **2つは友だちが座れる家具（`seats`）**、**3つは動く物（`motion`）**、**1つは床に敷くラグ（`flat: true`）** です。

| id | name | sticker | content | w（横幅） | seats（座る位置） | motion（動き） | 説明・見た目 |
|---|---|---|---|---|---|---|---|
| `shell-sofa` | `'かいがらの ソファ'` | `null` | `'scene:aquarium'` | `280` | `[{ x: -58, y: -60 }, { x: 58, y: -60 }]` | なし | 開いた大きなホタテ貝の背もたれがついたパステルピンク＆パールの2人掛けソファ |
| `coral-rug` | `'さんごの ラグ'` | `'a-s1'` | — | `290` | なし | なし（`flat: true`） | 水色とクリームの波型ラグ。床の一番奥に描かれる |
| `jelly-lamp` | `'くらげの ランプ'` | `'a-s5'` | — | `96` | なし | `'bob'`（上下にふわっと揺れる） | スタンドから下がる半透明パステルラベンダーのクラゲ型ランプ（`TALL` に `160` を指定） |
| `dolphin-ride` | `'イルカの のりもの'` | `'a-s15'` | — | `180` | `[{ x: 0, y: -64 }]` | `'sway'`（前後にゆらゆら揺れる） | 水色のイルカ型ロッキング遊具。背中に友だちが1人座れる |
| `treasure-box` | `'たからばこ'` | `'a-s30'` | — | `130` | なし | なし | 木と金色の縁取りの宝箱。ふたが少し開いて丸い真珠や星が見える |
| `penguin` | `'ペンギン'` | `'a-s50'` | — | `100` | なし | `'walk'`（左右に歩いて往復） | 部屋の中をよちよち歩いて往復する子ペンギン（`art/movers/penguin.svg` と同じ絵を共有可） |

---

## 8. シール 5枚（`src/core/stickers.ts`）

「すいぞくかん」で見つけた回数（`sceneFinds.aquarium`）に応じて順番に必ずもらえます。
`Motif` 型には `'jellyfish' | 'dolphin' | 'treasure' | 'penguin'`（および既存の `'shell'`）を使用します。

| id | name | kind | scene | need | char | motif | color（地の色） | 一緒にもらえる「へやの物」 |
|---|---|---|---|---|---|---|---|---|
| `a-s1` | `'ぷかが きたよ'` | `'scene'` | `'aquarium'` | `1` | `'puka'` | `'shell'` | `#F5DCE8`（シェルピンク） | `coral-rug`（さんごの ラグ）＋ 友だち「ぷか」 |
| `a-s5` | `'すいぞくかんで 5かい'` | `'scene'` | `'aquarium'` | `5` | `'moko'` | `'jellyfish'` | `#DCD8F4`（クラゲラベンダー） | `jelly-lamp`（くらげの ランプ） |
| `a-s15` | `'すいぞくかんで 15かい'` | `'scene'` | `'aquarium'` | `15` | `'puka'` | `'dolphin'` | `#CFE8F6`（マリンブルー） | `dolphin-ride`（イルカの のりもの） |
| `a-s30` | `'すいぞくかんで 30かい'` | `'scene'` | `'aquarium'` | `30` | `'koro'` | `'treasure'` | `#F6E4B8`（パールゴールド） | `treasure-box`（たからばこ） |
| `a-s50` | `'すいぞくかんで 50かい'` | `'scene'` | `'aquarium'` | `50` | `'puka'` | `'penguin'` | `#D4ECE8`（アクアミント） | `penguin`（ペンギン） |
