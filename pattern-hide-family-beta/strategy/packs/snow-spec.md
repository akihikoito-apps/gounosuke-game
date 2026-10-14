# 追加パック仕様書：`snow`（ゆきの まち パック）

> `strategy/PACKS_PLAN.md` の第3候補「ゆきの まち パック」を実装するための詳細仕様書です。
> `src/core/scenes/forest.ts`・`src/core/props-forest.ts`・`src/core/myroom.ts`・`src/core/movers.ts`・`src/core/stickers.ts` と同じ粒度・座標系で設計し、`forest` 実装時の知見（`spotBBox + LIMITS.gap` による全スポット非干渉、`easy: true` 5か所、コース6の迷彩傘の収まり、最難関の `HARDEST_BAND` 胴体可視率 `0.25..0.40`、コース4〜5向けの `back` 移動体2個以上＋合計5個）を最初からすべて反映しています。

---

## 1. パックの境界（`src/entitlements/entitlements.ts`）

- **PackId**: `'snow'`
- **表示名**: `'ゆきの まち パック'`
- **free**: `false`
- **contents**:
  - `'scene:snow'`（背景「ゆきの まち」）
  - `'char:kona'`（友だち「こな」：ゆきの まちで初めて誰かを見つけると仲間になる）
  - `'room:loghouse'`（じぶんの へや「ログハウス」）

---

## 2. 背景 `snow`（ゆきの まち）の配置（1000×1000）

### 2.1 服と背景の柄 4種（`costumes`）

`validate-art.mjs` の柄タイル命名規則（`{scene}-{plain|stripes|dots|check|leaf}`）にそのまま適合する4種類で構成します。

| id | kind | bg（地の色） | fg（柄の色） | size | 背景での役割 |
|---|---|---|---|---|---|
| `plain` | `'plain'` | `#EEF4FA`（やわらかいスノーホワイト） | `#EEF4FA` | `40` | 新雪が積もった広場（`snowfield`） |
| `stripes` | `'stripes'` | `#F5E2C8`（あたたかいビスケットベージュ） | `#C68E5E`（シナモンブラウン） | `40` | 左側の山小屋（ロッジ）の板壁（`lodge`） |
| `dots` | `'dots'` | `#5E9E94`（くすみパイングリーン） | `#FFFDF8`（ふんわり雪玉ホワイト） | `44` | 右側の雪玉がついた大きなもみの木群（`fir`） |
| `check` | `'check'` | `#E8827E`（ウォームベリーレッド） | `#FFF5EA`（アイボリーウール） | `48` | 手前中央〜右の大判ウールブランケット広場（`blanket`） |

### 2.2 土台（`base`）・領域（`regions`）・飾り（`decor` / `minorDecor`）

座標系は `viewBox="0 0 1000 1000"`。`regions` は配列の順に奥から手前へ塗られます。

#### `base`（柄の領域より下に塗る背景）
- **澄んだ冬の空**（`x: 0, y: 0, w: 1000, h: 470`）：淡いパウダーブルー `#D8EAF6`
- **遠くの雪山のなだらかな稜線**（`x: 0, y: 290, w: 1000, h: 180`）：やさしいアイスラベンダー `#E6EEF8` と白い山頂 `<path d="M0 470 V340 Q220 250 460 350 Q740 240 1000 330 V470 Z" fill="#E6EEF8"/>`
- **冬のやわらかい太陽**：`cx: 870, cy: 96, r: 46`、塗りは `#FFF0A8`

#### `regions`（柄の領域 4つ）

| 順番 | id | costume | 形状（`shapes`） | 説明・ねらい |
|---|---|---|---|---|
| 1 | `snowfield` | `'plain'` | `{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }` | 新雪の広場全体（`y = 460..1000`）。手前左側のスポット2か所、および `snow-blanket-1` の迷彩傘の背景になる |
| 2 | `lodge` | `'stripes'` | `{ kind: 'rect', x: 30, y: 250, w: 330, h: 404, rx: 8 }` | 左側の山小屋ロッジの板壁（`x: 30..360, y: 250..654`）。高さ404を確保し、コース後半で迷彩のニット帽をかぶっても領域内に100%収まる |
| 3 | `fir` | `'dots'` | `{ kind: 'rect', x: 580, y: 340, w: 390, h: 314, rx: 44 }` | 右側の雪玉がついた丸いもみの木並木（`x: 580..970, y: 340..654`）。上端を `y = 340` まで高く取ることで、コース6で `snow-fir-1` が迷彩の傘をさしても領域内に収まる |
| 4 | `blanket` | `'check'` | `{ kind: 'rect', x: 370, y: 760, w: 560, h: 212, rx: 40 }` | 手前中央〜右の雪上に広げた大判ウールブランケット（`x: 370..930, y: 760..972`）。チェックの服とニット帽が最高に映える領域 |

#### `decor`（領域の上・キャラクターの後ろの飾り）
- **山小屋の雪が積もった三角屋根と煙突・木製デッキ**：
  - 煙突：`<rect x="280" y="168" width="42" height="70" rx="4" fill="#C97A68" stroke="#4A3A40" stroke-width="3.5"/>`
  - 屋根：`<path d="M14 262 L195 170 L376 262 Z" fill="#D97A6C" stroke="#4A3A40" stroke-width="4" stroke-linejoin="round"/>`
  - 屋根の上の白い雪の縁取り：`<path d="M20 260 Q195 244 370 260" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>`
  - 土台：`<rect x="24" y="650" width="342" height="12" rx="4" fill="#A6784E"/>`
- **もみの木の太い幹（下端）**：
  - `<g fill="#9E6E44" stroke="#4A3A40" stroke-width="3"><rect x="652" y="648" width="56" height="18" rx="4"/><rect x="837" y="648" width="56" height="18" rx="4"/></g>`
- **雪道の丸い石畳ステップ**：
  - キャラクターの立たない中央通路（`x = 460, y = 690` / `x = 530, y = 725`）に丸い石畳（`<ellipse cx="460" cy="690" rx="36" ry="14" fill="#CBD6E2"/><ellipse cx="530" cy="725" rx="36" ry="14" fill="#CBD6E2"/>`）

#### `minorDecor`（小さい画面では省く飾り）
- 空に浮かぶ冬の雲と煙突からの白いぽこぽこ煙（`cx: 210, cy: 105`、`cx: 300, cy: 135`、`cx: 600, cy: 140`）
- 空に舞う小さな白い雪粒（`cx: 480, cy: 200, r: 6`、`cx: 540, cy: 240, r: 5`）

---

## 3. 隠れ場所 9か所（`spots`）と のぞき場所 3か所（`PEEKS`）

### 3.1 隠れ場所 9か所（`spots`）

`forest` の実装検証で確立した幾何条件をすべて満たす座標です：
- **画面内（`inBounds`）**：`112 <= x <= 865`, `652 <= y <= 956`（全キャラクターの輪郭がマージン6px以上内側）
- **全36ペアで重なりなし（`spotsConflict(a, b) === false`）**：
  - 同じ段のスポット同士は横方向に **`164px` 以上**（必要差 `161.08px` 以上）離れ、奥の段（`y = 652`）と手前の段（`y = 884..956`）は縦方向に `232px` 以上離れているため、**9か所のうちどの2か所も衝突せず、どの3か所を同時に選んでも一切重なりません**。
- **`easy: true` は 5か所**：`snow-lodge-1`, `snow-fir-1`, `snow-blanket-1`, `snow-blanket-3`, `snow-field-1` の5か所。
- **コース6の迷彩傘（`spots: 'easy'`, `umbrella: 'camo'`）対応**：
  - `snow-blanket-1`（`x: 476, y: 884, easy: true`）の傘（`x: 348..592, y: 562..652`）および `snow-fir-1`（`x: 680, y: 652, easy: true`）の傘（`x: 552..796, y: 330..420`）がいずれも他小物と重ならず、背景領域と高い一致率で収まります。
- **最難関の優先帯（`HARDEST_BAND`: `bodyVisible` が `0.25..0.40`）**：
  - 小物の高さを `54〜68px` に揃えることで、複数のスポットが `bodyVisible ≈ 0.34..0.39` の優先帯に入り、口（`spot.y - 125`）との間にも `31〜65px` の安全余白を確保しています。

| id | x | y | s | region | 前の小物（`prop`） | easy | 顔(口)のy | 小物上端y | 狙い・見え方 |
|---|---|---|---|---|---|---|---|---|---|
| `snow-lodge-1` | `112` | `652` | `1` | `'lodge'` | `firewoodPile(112, 590, 126, 72)` | `true` | `527` | `580` | しまの山小屋の左前。積まれた丸太薪の後ろ |
| `snow-lodge-2` | `276` | `652` | `1` | `'lodge'` | `postbox(276, 592, 132, 70)` | `false` | `527` | `584` | しまの山小屋の右前。雪が乗った赤い郵便ポストの後ろ |
| `snow-fir-1` | `680` | `652` | `1` | `'fir'` | `miniSnowman(680, 594, 136, 68)` | `true` | `527` | `578` | 水玉もみの木の左前。雪だるまの後ろでもみの木に同化 |
| `snow-fir-2` | `865` | `652` | `1` | `'fir'` | `iglooDome(865, 594, 138, 68)` | `false` | `527` | `594` | 水玉もみの木の右前。小さな雪のかまくらの後ろ |
| `snow-blanket-1` | `476` | `884` | `1` | `'blanket'` | `mittensBasket(476, 864, 76, 40)` | `true` | `759` | `824` | チェック毛布の左。毛糸の手袋かごの後ろ |
| `snow-blanket-2` | `650` | `948` | `1` | `'blanket'` | `snowballs(650, 924)` | `false` | `823` | `886` | チェック毛布の中央手前。積まれた雪玉の山の後ろ |
| `snow-blanket-3` | `830` | `884` | `1` | `'blanket'` | `woodenSled(830, 826, 138, 68)` | `true` | `759` | `826` | チェック毛布の右。木製のそりの後ろ |
| `snow-field-1` | `135` | `896` | `1` | `'snowfield'` | `snowLantern(135, 838, 134, 70)` | `true` | `771` | `830` | 左手前の雪原。あたたかい灯りの雪見ランタン台の後ろ |
| `snow-field-2` | `300` | `956` | `0.95` | `'snowfield'` | `giftSack(300, 900, 126, 68)` | `false` | `837` | `900` | 左手前の雪原奥。リボンつきプレゼント袋の後ろ |

### 3.2 最難関用の「のぞき場所」3か所（`src/core/peeks.ts` の `PEEKS.snow`）

| id | x | y | s | region | kind | front（前に描き直す領域） | 見え方 |
|---|---|---|---|---|---|---|---|
| `snow-peek-lodge` | `372` | `652` | `1` | `'snowfield'` | `'peek'` | `LODGE_FRONT`: `[R(22, 240, 348, 426, 8)]` | 山小屋の右端の柱の陰から、顔の右半分と頭の角（または耳・双葉）がひょっこり出る |
| `snow-peek-tree-1` | `680` | `520` | `0.9` | `'fir'` | `'peek'` | `FIR_FRONT`: `[R(574, 406, 402, 256, 44)]` | もみの木の左上縁から、両目と頭の特徴だけが出る |
| `snow-peek-tree-2` | `860` | `520` | `0.9` | `'fir'` | `'peek'` | `FIR_FRONT`: `[R(574, 406, 402, 256, 44)]` | もみの木の右上縁から、両目と頭の特徴だけが出る |

---

## 4. 前景の小物の一覧（`src/core/props-snow.ts`）

`shapes` は可視判定に使われ、`markup` は同じ寸法で描きます。輪郭線は共通の `stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"`。

1. **`firewoodPile(cx: number, top: number, w = 126, h = 72): Prop`**（丸太薪の山）
   - **shapes**:
     - 薪束の本体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }`
     - 上に乗った白い雪：`{ kind: 'ellipse', cx, cy: top + 4, rx: 46, ry: 12 }`
   - **見た目**: 木肌色（`#A8764A`）と切り口の年輪（`#E8C896`）が並んだ丸太薪の上に、ふんわり白い雪（`#FFFFFF`）が積もっている。
2. **`postbox(cx: number, top: number, w = 132, h = 70): Prop`**（雪の郵便ポスト）
   - **shapes**:
     - ポスト本体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }`
     - 屋根の丸み：`{ kind: 'ellipse', cx, cy: top + 6, rx: w / 2, ry: 12 }`
   - **見た目**: くすみベリー赤（`#DF746A`）の丸っこい山小屋ポスト。屋根の上に白い雪がちょこんと乗っている（文字は入れない）。
3. **`miniSnowman(cx: number, top: number, w = 136, h = 68): Prop`**（ミニゆきだるま）
   - **shapes**:
     - 下の雪玉と土台：`{ kind: 'rect', x: cx - w / 2, y: top + 8, w, h: h - 8, rx: 20 }`
     - 2つ並んだ小さな雪だるまの頭：`{ kind: 'ellipse', cx: cx - 26, cy: top + 4, rx: 26, ry: 18 }`, `{ kind: 'ellipse', cx: cx + 26, cy: top + 6, rx: 24, ry: 16 }`
   - **見た目**: 赤と黄色のマフラーを巻いた2つの小さな丸い雪だるまが仲良く並んでいる。
4. **`iglooDome(cx: number, top: number, w = 138, h = 68): Prop`**（ちいさなかまくら）
   - **shapes**:
     - かまくら本体：`{ kind: 'rect', x: cx - w / 2 + 6, y: top + 14, w: w - 12, h: h - 14, rx: 16 }`
     - ドーム上部：`{ kind: 'ellipse', cx, cy: top + 18, rx: 58, ry: 22 }`
   - **見た目**: 白〜淡いアイスブルー（`#F4F8FC`）の丸いかまくら。中央の入り口の中にあたたかいオレンジ色の灯り（`#FFE08A`）がほんのり見える。
5. **`mittensBasket(cx: number, cy: number, rx = 76, ry = 40): Prop`**（毛糸の手袋かご）
   - **shapes**: `[{ kind: 'ellipse', cx, cy, rx, ry }]`
   - **見た目**: 編みかごの中に、ふわふわの毛糸のミトン（手袋）と毛糸玉が入っている。
6. **`snowballs(cx: number, cy: number): Prop`**（雪玉の山）
   - **shapes**: 3つの重なる楕円 `(cx - 40, cy + 6, rx: 44, ry: 28)`, `(cx + 38, cy + 8, rx: 42, ry: 26)`, `(cx, cy - 8, rx: 48, ry: 30)`
   - **見た目**: ころんと丸い白い雪玉（`#FFFFFF`、陰影 `#DCE8F4`）がピラミッド状に積まれ、上に小さな小枝や葉っぱが飾られている。
7. **`woodenSled(cx: number, top: number, w = 138, h = 68): Prop`**（木製のそり）
   - **shapes**:
     - そりの座面とランナー：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 18 }`
   - **見た目**: あたたかい木目（`#C68E58`）のクラシックな木製そり。上にミントグリーンのクッションが乗っている。
8. **`snowLantern(cx: number, top: number, w = 134, h = 70): Prop`**（雪見ランタン台）
   - **shapes**:
     - 雪の台座：`{ kind: 'rect', x: cx - w / 2, y: top + 14, w, h: h - 14, rx: 14 }`
     - ランタンの灯り部分：`{ kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 }`
   - **見た目**: 丸い雪の台座の上に置かれた木枠のランプ。中からあたたかいオレンジ〜イエロー（`#FFE282`）の光が灯り、コース10の `HARDEST_BAND`（`bodyVisible: 0.25..0.40`）に入るよう高さを調整済み。
9. **`giftSack(cx: number, top: number, w = 126, h = 68): Prop`**（プレゼント袋）
   - **shapes**:
     - 袋の本体：`{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 20 }`
   - **見た目**: クリームベージュの布袋（`#F2DFC4`）の口を赤いリボン（`#E27A74`）で結んだ、ぷっくり丸いプレゼント袋。

---

## 5. うごくもの の通り道（`src/core/movers.ts` の `MOVERS.snow`）

`MoverKind` に `'snowflake'`（こなゆき）・`'snow-bunny'`（ゆきうさぎ）の2種を追加し、既存の `'cloud'`・`'bird'`・`'puppy'` と合わせて計5個（`back` 2個＋`front` 3個）定義します。

| id | kind | 表示名（`MOVER_NAMES`） | move | from | to | sec | scale | layer | 動きの説明 |
|---|---|---|---|---|---|---|---|---|---|
| `snow-cloud` | `'cloud'` | `'くも'` | `'cross'` | `{ x: -150, y: 85 }` | `{ x: 1150, y: 85 }` | `40` | `1.2` | `'back'` | 冬の空を左から右へゆっくり流れる |
| `snow-bird` | `'bird'` | `'ことり'` | `'cross'` | `{ x: 1100, y: 190 }` | `{ x: -100, y: 145 }` | `12` | `1.05` | `'back'` | 雪山の空を右から左へ飛ぶ |
| `snow-bunny` | `'snow-bunny'` | `'ゆきうさぎ'` | `'patrol'` | `{ x: -90, y: 860 }` | `{ x: 1090, y: 860 }` | `14` | `1.15` | `'front'` | 白くて丸い雪うさぎが手前の広場をぴょこぴょこ往復する（`step` アニメ） |
| `snow-flake` | `'snowflake'` | `'こなゆき'` | `'cross'` | `{ x: 240, y: -40 }` | `{ x: 760, y: 1060 }` | `12` | `1.0` | `'front'` | 空から斜めにふわっと舞い降りる丸みのある雪の結晶（`FLY` に含める） |
| `snow-puppy` | `'puppy'` | `'こいぬ'` | `'patrol'` | `{ x: 1090, y: 560 }` | `{ x: -90, y: 580 }` | `15` | `1.1` | `'front'` | 山小屋ともみの木の間を元気に走って往復する |

- **`moverView.ts` の `BOX` と `tests/unit/movers.test.ts` の `SIZE`**：
  - `snow-bunny`: `BOX: [-46, -74, 92, 74]`, `SIZE: { w: 92, h: 74 }`
  - `snowflake`: `BOX: [-30, -56, 60, 56]`, `SIZE: { w: 60, h: 56 }`

---

## 6. 新しい友だち：`kona`（こな）の仕様（`src/core/characters.ts`）

### 6.1 キャラクター定義（`CharacterDef`）
- **id**: `'kona'`
- **name**: `'こな'`
- **personality**: `'ゆきあそびが だいすきな げんきっこ。あたまの まるい えだづの が めじるし。'`
- **skin**: `'#D9B8A6'`（あたたかいミルクココア色）
- **facePoints**: 既存の全キャラクターと共通 `[{ x: -16, y: -142 }, { x: 16, y: -142 }, { x: 0, y: -125 }]`
- **silhouette**:
  - `BODY`（共通の服多角形）
  - `HEAD`（共通の頭楕円 `{ kind: 'ellipse', cx: 0, cy: -142, rx: 48, ry: 45 }`）
  - 左の枝角（幹と小枝）：`rotEllipse(-38, -194, 10, 20, -24, -32, -178)`, `{ kind: 'ellipse', cx: -50, cy: -190, rx: 9, ry: 7 }`
  - 右の枝角（幹と小枝）：`rotEllipse(38, -194, 10, 20, 24, 32, -178)`, `{ kind: 'ellipse', cx: 50, cy: -190, rx: 9, ry: 7 }`

### 6.2 形のポイント（既存キャラクターとの違いと検査適合）
1. **白黒シルエットでの識別性**：頭の左右斜め上（`x ≈ ±38, y ≈ -194`）へ伸び、外側に丸い小枝（`x ≈ ±50, y = -190`）が1つずつ分かれた**「先が丸いトナカイ風の枝角（つの）」**が目印です。
   - とがった部分のないぷっくりしたY字の枝角なので幼児に優しく、丸耳の `popo`・三角耳の `nyako`・頭頂双葉の `pino`・横ハサミの `choki` のどれとも一目で区別できます。
2. **枠・`spotBBox`・最難関のぞきの適合**：
   - 枝角の範囲は `x ∈ [-59, +59]`, `y ∈ [-212, -174]` であり、`mimi` の横幅（`±78.54`）および `nyako` の上端（`-214`）の内側に完全に収まるため、`spotBBox` を広げません。
   - 上からのぞく `PEEKS` でも横からのぞく `PEEKS` でも枝角が必ず露出し、全シーンで `analyzePeek`（`featureFrac >= 0.15`）を満たします。
3. **解放条件（`SCENE_FRIENDS`）**：
   - `{ scene: 'snow', char: 'kona' }`（ゆきの まちで初めて誰か1人を見つけた瞬間に仲間になる）
4. **じぶんの へや での部屋着（`myroomView.ts` の `OUTFIT`）**：
   - `kona: { kind: 'check', bg: '#F7E2DC', fg: '#E59A92', size: 32 }`

---

## 7. じぶんの へや：新しい部屋と新しい物 6つ（`src/core/myroom.ts`）

### 7.1 新しい部屋：`loghouse`（ログハウス）

| id | name | needCleared | content | floorTop | scaleBack | scaleFront |
|---|---|---|---|---|---|---|
| `'loghouse'` | `'ログハウス'` | `0` | `'room:loghouse'` | `560` | `1.0` | `1.5` |

- **初期配置（`starterLayout('loghouse')`）**：
  - `[{ ref: 'item:kotatsu', x: 300, y: 760 }, { ref: 'char:koro', x: 660, y: 880 }]`
- **`scripts/validate-art.mjs`**：
  - `myroom/rooms` の正規表現に `loghouse` を追加します。

### 7.2 新しい物 6つ（`ITEMS`）

すべての物の絵の枠は `viewBox="-150 -300 300 300"`、足もと中央が `(0, 0)` です。
うち **2つは友だちが座れる家具（`seats`）**、**3つは動く物（`motion`）** です。

| id | name | sticker | content | w（横幅） | seats（座る位置） | motion（動き） | 説明・見た目 |
|---|---|---|---|---|---|---|---|
| `kotatsu` | `'ぽかぽか こたつ'` | `null` | `'scene:snow'` | `280` | `[{ x: -58, y: -56 }, { x: 58, y: -56 }]` | なし | 赤いチェック布団の上に木目天板とみかんかごが乗ったこたつ。2人並んで座れる |
| `rocking-chair` | `'ゆりいす'` | `'s-s1'` | — | `130` | `[{ x: 0, y: -60 }]` | `'sway'`（ゆっくり揺れる） | あたたかい木製のロッキングチェア。クッションの上に友だちが1人座れる |
| `snowman` | `'ゆきだるま'` | `'s-s5'` | — | `110` | なし | なし | 赤いマフラーとバケツ帽をかぶった可愛い雪だるま |
| `snow-globe` | `'スノードーム'` | `'s-s15'` | — | `96` | なし | `'bob'`（ふわっと揺れる） | 木の台座に入った大きなガラスのスノードーム（中に小さな山小屋と雪粒） |
| `stew-pot` | `'シチューの おなべ'` | `'s-s30'` | — | `120` | なし | なし | クリームシチューが入った両手鍋と木の鍋敷き |
| `snow-bunny` | `'ゆきうさぎ'` | `'s-s50'` | — | `100` | なし | `'walk'`（左右に歩いて往復） | 部屋の中をぴょこぴょこ散歩する白い雪うさぎ（`art/movers/snow-bunny.svg` と同じ絵を共有可） |

---

## 8. シール 5枚（`src/core/stickers.ts`）

「ゆきの まち」で見つけた回数（`sceneFinds.snow`）に応じて順番に必ずもらえます。
`Motif` 型には `'snowman' | 'snowglobe' | 'mitten' | 'snowbunny'`（および既存の `'present'` 等）を追加します。

| id | name | kind | scene | need | char | motif | color（地の色） | 一緒にもらえる「へやの物」 |
|---|---|---|---|---|---|---|---|---|
| `s-s1` | `'こなが きたよ'` | `'scene'` | `'snow'` | `1` | `'kona'` | `'mitten'` | `#F5DDD8`（ウォームコーラル） | `rocking-chair`（ゆりいす）＋ 友だち「こな」 |
| `s-s5` | `'ゆきの まちで 5かい'` | `'scene'` | `'snow'` | `5` | `'popo'` | `'snowman'` | `#D8EAF6`（パウダーブルー） | `snowman`（ゆきだるま） |
| `s-s15` | `'ゆきの まちで 15かい'` | `'scene'` | `'snow'` | `15` | `'kona'` | `'snowglobe'` | `#E2DCF4`（スノーラベンダー） | `snow-globe`（スノードーム） |
| `s-s30` | `'ゆきの まちで 30かい'` | `'scene'` | `'snow'` | `30` | `'mimi'` | `'present'` | `#F6E6C2`（ビスケットクリーム） | `stew-pot`（シチューの おなべ） |
| `s-s50` | `'ゆきの まちで 50かい'` | `'scene'` | `'snow'` | `50` | `'kona'` | `'snowbunny'` | `#DCEEE8`（アイスパステルミント） | `snow-bunny`（ゆきうさぎ） |
