# 追加パック第4弾「きょうりゅうの たに パック（`dino`）」仕様書（2026-10-21）

> **目的**：持ち主の提案「男の子が、動く恐竜たちの中で隠れているキャラクターを探す。恐竜が4、5体動き続けている中でかくれんぼをさせるのは面白い」を実現する詳細仕様書です。
> [`night-spec.md`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/strategy/packs/night-spec.md)・[`forest-spec.md`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/strategy/packs/forest-spec.md)・[`aquarium-spec.md`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/strategy/packs/aquarium-spec.md) と同じ粒度・座標系で設計しており、Codex がそのまま絵を描けて、開発担当がそのままコードを書ける実装値を定めています。
> **3〜6歳向けに、こわさ・いじわるさ・理不尽な難しさは一切含めません**。にっこり笑う丸みのある恐竜たちがゆったり歩き回る、明るくワクワクする太古の谷の世界にします。

---

## 1. パックと中身のID・価格案・「ぜんぶ いり」の設計

### 1.1 ID と構成（[`src/entitlements/entitlements.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/entitlements/entitlements.ts) / [`src/purchase/store.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/purchase/store.ts)）

- **PackId**：`'dino'`（表示名：`'きょうりゅうの たに パック'`、`free: false`）
- **SceneId**：`'dino'`（表示名：`'きょうりゅうの たに'`）
- **ProductId（`src/purchase/store.ts`）**：`com.akihikoito.moyoukakurenbo.dino`
  - `name`：`'きょうりゅうの たに パック'`
  - `summary`：`'背景「きょうりゅうの たに」・動く恐竜5体・友だち「がお」・へや「きょうりゅうの ひろば」・おもちゃと家具8つ・シール5枚'`
- **contents**：`['scene:dino', 'char:gao', 'room:dino-land']`
- **SCENE_FRIENDS**：`{ scene: 'dino', char: 'gao' }`（その背景で初めて誰か1人を見つけた瞬間に仲間になる）

### 1.2 価格案と「ぜんぶ いり」の扱い

| 項目 | 案A（推奨：大型目玉パック価格） | 案B（他背景パックと横並び価格） | 理由・位置づけ |
|---|---|---|---|
| **`dino` 単品価格** | **480円**（税込） | **400円**（税込） | 既存の背景パック（400円：新規移動体2〜4種・部屋の物6個）に対し、本パックは **「新規の動く恐竜5体」＋「おもちゃ4個を含む部屋の物8個（初期所持3個＋シール報酬5個）」** と中身が約1.3倍の豪華仕様。「つづきの コース（480円）」と並ぶ二大看板パックとして **480円** の価値が十分にある（購入率を最優先するなら400円）。 |
| **`allpacks`（ぜんぶ いり）の中身** | `['more-courses', 'beach', 'forest', 'aquarium', 'night', 'dino']`（**全6パック**） | 同左（**全6パック**） | [`src/purchase/store.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/purchase/store.ts#L24) の `allpacks.packs` に `'dino'` を追加し、`summary` を `'上の6つ すべて（まとめて お得）'` に更新する。 |
| **`allpacks`（ぜんぶ いり）の価格** | **1,480円**（税込）<br>（単品合計 2,560円から **1,080円お得**） | **1,400円〜1,480円**（税込）<br>（単品合計 2,480円から **約1,000円お得**） | 保護者の心理的上限（1,500円以内）を守りつつ、「つづきのコース＋恐竜＋もう1パック（計1,360円）にプラス120円で残り3パックも全部ついてくる」という強いお得感を作る。 |

---

## 2. 背景「きょうりゅうの たに」（`src/core/scenes/dino.ts`）

### 2.1 世界観と色設計の方針
- **明るい太古の谷**：日差しが降り注ぐあたたかい太古の草原と砂礫の谷。奥にはやさしい丸みのある火山がそびえ、噴火の怖さはなく、山頂から**パステルクリーム色のふわふわしたわたあめ雲（けむり）**がぽこぽこと浮かんでいます。
- **中間明度のパステル・アースカラー**：キャラクターの輪郭線（`#4A3A40`）と顔が昼間の他ステージと同じくらいはっきり見えつつ、恐竜たちの体の模様とも自然に馴染む4色・4柄で構成します。

### 2.2 服と背景の柄タイル 4種（`costumes`）

[`scripts/validate-art.mjs`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/scripts/validate-art.mjs#L241) の柄タイル命名規則（`{scene}-{plain|stripes|dots|check|leaf}`）に適合する `plain, stripes, dots, check` の4種類です。

| CostumeId | 場所の意味（`region`） | `kind` | `bg`（地の色） | `fg`（模様の色） | `size` | 柄ファイル |
|---|---|---|---|---|---|---|
| `plain` | たいこの だいち（`valley`：あたたかい琥珀砂の地面） | `'plain'` | `#E8D5B5` | `#E8D5B5` | `40` | `art/patterns/dino-plain.svg` |
| `stripes` | しましまの ちそう（`cliff`：左側の丸い地層アーチ岩山） | `'stripes'` | `#F4E4CE` | `#D99B78` | `40` | `art/patterns/dino-stripes.svg` |
| `dots` | みずたまの おおソテツ（`fern`：右側の黄色い実がついた古代ソテツ群） | `'dots'` | `#78B888` | `#FFF4C8` | `44` | `art/patterns/dino-dots.svg` |
| `check` | はっぱの す（`nest`：手前中央〜右の編み葉の恐竜の巣マット） | `'check'` | `#FFF6E8` | `#98C686` | `48` | `art/patterns/dino-check.svg` |

### 2.3 土台（`base`）・4つの柄領域（`regions`）・飾り（`decor` / `minorDecor`）の正確な座標（1000×1000）

#### `base`（柄の領域より下に塗る背景）
- **太古の明るい空**（`x: 0, y: 0, w: 1000, h: 470`）：あたたかみのあるペールスカイブルー `#D8F0F4`
- **遠くのやさしい火山となだらかな山なみ**（`y: 120..470`）：
  - 遠景の丘帯：`<rect x="0" y="310" width="1000" height="160" fill="#B8D8BA"/>`
  - 中央奥のやさしい火山（台形＋丸い山頂、`x: 370..610, y: 140..340`）：`<path d="M370 340 Q420 150 456 144 H524 Q560 150 610 340 Z" fill="#C4A69D"/>`
  - 火口付近のあたたかい山肌（溶岩ではなく夕焼け色の丸い稜線）：`<path d="M446 154 Q490 170 534 154 Q524 142 456 142 Z" fill="#E8B49A"/>`
  - ふわふわのけむり雲（火口の上 `y = 60..130`）：`<g fill="#FFFDF6" opacity="0.92"><ellipse cx="490" cy="112" rx="34" ry="20"/><ellipse cx="520" cy="84" rx="44" ry="24"/><ellipse cx="468" cy="76" rx="30" ry="18"/></g>`
- **陽だまりの太陽**：`<circle cx="870" cy="96" r="48" fill="#FFE282"/>`

#### `regions`（柄の領域 4つ）

[`aquarium.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/scenes/aquarium.ts) と同じ多角形ヘルパー `quadPoints` を用い、物の形に合わせた自然な曲線多角形にします。

1. **`valley`（たいこの だいち / `costume: 'plain'`）**
   - `{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }`（下のベース地面全体。他の3領域が上に重なる）
2. **`cliff`（しましまの ちそう / `costume: 'stripes'`）** — `CLIFF_POLY`
   - 左側のアーチ型テーブルマウンテン地層（`x = 26〜364, y = 200〜654`）：
   - `[{ x: 26, y: 654 }, { x: 26, y: 310 }, ...quadPoints({ x: 26, y: 310 }, { x: 195, y: 200 }, { x: 364, y: 310 }, 16), { x: 364, y: 654 }]`
   - ※高さ `454px` を確保しており、コース4〜10で迷彩の帽子・傘をかぶっても100%領域内に収まります。
3. **`fern`（みずたまの おおソテツ / `costume: 'dots'`）** — `FERN_POLY`
   - 右側の丸いドーム型古代ソテツのしげみ（`x = 576〜974, y = 372〜654`）：
   - `[{ x: 576, y: 654 }, { x: 576, y: 440 }, ...quadPoints({ x: 576, y: 440 }, { x: 775, y: 372 }, { x: 974, y: 440 }, 16), { x: 974, y: 654 }]`
4. **`nest`（はっぱの す / `costume: 'check'`）** — `NEST_POLY`
   - 手前中央〜右の大きな恐竜の巣マット（`x = 358〜942, y = 770〜982`）：
   - `[{ x: 395, y: 770 }, { x: 905, y: 770 }, ...quadPoints({ x: 905, y: 770 }, { x: 942, y: 870 }, { x: 925, y: 972 }, 8), ...quadPoints({ x: 925, y: 972 }, { x: 650, y: 982 }, { x: 375, y: 972 }, 8), ...quadPoints({ x: 375, y: 972 }, { x: 358, y: 870 }, { x: 395, y: 770 }, 8)]`

#### `decor`（領域の上・キャラクターの後ろの飾り）
- **しましま地層の外縁ラインと岩の根元**：
  - `<path d="M22 652 V310 Q195 196 368 310 V652" fill="none" stroke="#C48866" stroke-width="10" stroke-linecap="round"/>`
  - `<rect x="18" y="648" width="354" height="14" rx="5" fill="#C48866" stroke="#4A3A40" stroke-width="3"/>`
- **おおソテツドームの葉冠縁と幹の根元**：
  - `<path d="M572 652 V440 Q775 368 978 440 V652" fill="none" stroke="#569468" stroke-width="10" stroke-linecap="round"/>`
  - `<rect x="568" y="648" width="414" height="14" rx="5" fill="#9E7B56" stroke="#4A3A40" stroke-width="3"/>`
- **中央通路の恐竜の足あと型飛び石**（キャラクターの立たない `x = 460, y = 690` / `x = 530, y = 725`）：
  - `<ellipse cx="460" cy="690" rx="36" ry="14" fill="#D4BE98"/><ellipse cx="530" cy="725" rx="36" ry="14" fill="#D4BE98"/>`

#### `minorDecor`（小さい画面では省く飾り）
- 空に浮かぶ雲（`cx: 180, cy: 105`、`cx: 680, cy: 130`）と、遠くの空を舞う小さな翼竜のシルエット（`x: 310, y: 150`）。

### 2.4 背景の4層ファイル（`art/scenes/dino/`）
- **`back.svg`**：上部の空・太陽・遠くのやさしい火山とふわふわの煙・遠景のシダ森、および下部のサバンナ大地の砂礫テクスチャ。
- **`over.svg`**：地層アーチの岩縁（`CLIFF_POLY` の外枠）、おおソテツの外周のシダ葉飾り、はっぱの巣の外周の編み枝縁、中央の飛び石。**※友だちの顔の位置（`y_spot - 142*s`）には一切描かず、服の後ろの領域内部も平均不透明度35%以下に保つこと**。
- **`minor.svg`**：空の雲と遠景の小さな翼竜シルエット。
- **`fore.svg`**：2.5節の9つの隠れ場所の前景小物すべて。**顔（赤い円 `y_spot - 142*s`〜`y_spot - 125*s`）には絶対に重ねないこと**。

### 2.5 隠れ場所 9か所（`spots`）と前景の小物（`src/core/props-dino.ts`）

すべてのスポットで以下の幾何条件を100%満たしています：
- **画面内（`inBounds`）**：`112 <= x <= 865, 652 <= y <= 956`（全10キャラクターがマージン6px以上内側）
- **全36ペアで重なりなし（`!spotsConflict`）**：同じ段のスポット間は横 `164px` 以上、奥の段（`y = 652`）と手前の段（`y = 884..956`）は縦 `232px` 以上離れており、どの3か所を同時に選んでも一切重なりません。
- **`easy: true` は 5か所**：`dino-cliff-1`, `dino-fern-1`, `dino-nest-1`, `dino-nest-3`, `dino-valley-1`。
- **顔が隠れない（`faceVisible`）＆最難関の優先帯（`HARDEST_BAND`: `bodyVisible 0.25..0.40`）**：口（`y - 125*s`）と小物上端の間に `31〜65px` の安全余白があり、服の可視率も約 `0.34〜0.42` に収まります。

| SpotId | `x` | `y` | `s` | `region` | `easy` | 前景の小物関数（`src/core/props-dino.ts`） | 顔(口)y | 小物上端y | 小物の見た目と範囲 |
|---|---|---|---|---|---|---|---|---|---|
| `dino-cliff-1` | `112` | `652` | `1` | `'cliff'` | `true` | `ammoniteRock(112, 590, 124, 72)` | `527` | `574` | **アンモナイトの いわ**：うずまき化石がついた丸い砂岩（`x: 50〜174, y: 574〜662`） |
| `dino-cliff-2` | `276` | `652` | `1` | `'cliff'` | `false` | `ribArch(276, 592, 134, 70)` | `527` | `580` | **ほねの トンネル**：丸みのあるアイボリー色の恐竜のほねアーチ（`x: 209〜343, y: 580〜662`） |
| `dino-fern-1` | `680` | `652` | `1` | `'fern'` | `true` | `cycadStump(680, 594, 136, 68)` | `527` | `576` | **ソテツの かぶ**：パイナップル状の丸い幹と若葉（`x: 612〜748, y: 576〜662`） |
| `dino-fern-2` | `865` | `652` | `1` | `'fern'` | `false` | `geyserPool(865, 594, 136, 68)` | `527` | `594` | **ぽこぽこ おんせんいわ**：水色の丸い温泉石と白い泡玉（`x: 797〜933, y: 594〜662`） |
| `dino-nest-1` | `476` | `884` | `1` | `'nest'` | `true` | `spottedEgg(476, 864, 76, 40)` | `759` | `824` | **みずたまの たまご**：藁の巣に入った大きな水玉模様の恐竜の卵（`cx: 476, cy: 864, rx: 76, ry: 40`） |
| `dino-nest-2` | `650` | `948` | `1` | `'nest'` | `false` | `eggShells(650, 924)` | `823` | `886` | **われた たまごの から**：パカッと割れた3つのパステル卵殻（`x: 566〜730, y: 886〜960`） |
| `dino-nest-3` | `830` | `884` | `1` | `'nest'` | `true` | `fernCushion(830, 826, 138, 68)` | `759` | `826` | **はっぱの ベッド**：大きなシダの葉を重ねたふかふかクッション（`x: 761〜899, y: 826〜894`） |
| `dino-valley-1` | `135` | `896` | `1` | `'valley'` | `true` | `footprintStone(135, 838, 134, 70)` | `771` | `830` | **あしあと いわ**：3本指の大きな恐竜の足あとがついた丸岩（`x: 68〜202, y: 830〜908`） |
| `dino-valley-2` | `300` | `956` | `0.95` | `'valley'` | `false` | `explorerCrate(300, 900, 126, 68)` | `837` | `900` | **たんけん トランク**：双眼鏡マークのついた木製探検ボックス（`x: 237〜363, y: 900〜968`） |

#### 前景小物 9関数の `shapes` 定義（`src/core/props-dino.ts`）
1. `ammoniteRock(cx, top, w = 124, h = 72)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }, { kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 }]`（サンドベージュ `#D8BC96` の岩に、キャラメル色 `#B88658` のうずまき模様）
2. `ribArch(cx, top, w = 134, h = 70)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 14 }, { kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 }, { kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 }]`（あたたかいアイボリー `#F7EFE2` の丸っこい骨のアーチ3本と赤土の土台 `#C99272`）
3. `cycadStump(cx, top, w = 136, h = 68)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top + 8, w, h: h - 8, rx: 16 }, { kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 }]`（茶色の網目幹 `#A8764C` の上に広がる若草色のソテツ葉 `#6EB478`）
4. `geyserPool(cx, top, w = 136, h = 68)`：`shapes: [{ kind: 'rect', x: cx - w / 2 + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 }, { kind: 'ellipse', cx: cx - 38, cy: top + 24, rx: 30, ry: 18 }, { kind: 'ellipse', cx: cx + 38, cy: top + 26, rx: 28, ry: 18 }, { kind: 'ellipse', cx, cy: top + 16, rx: 34, ry: 20 }]`（グレーの丸石枠 `#B4B8C2` にターコイズブルー `#84D0DC` のお湯と白い丸泡）
5. `spottedEgg(cx, cy, rx = 76, ry = 40)`：`shapes: [{ kind: 'ellipse', cx, cy, rx, ry }]`（クリーム色 `#FFF6E0` の寝かせた大卵に、コーラルピンク `#F29A8E` とミント `#88C896` の水玉模様）
6. `eggShells(cx, cy)`：`shapes: [{ kind: 'ellipse', cx: cx - 40, cy: cy + 6, rx: 44, ry: 28 }, { kind: 'ellipse', cx: cx + 38, cy: cy + 8, rx: 42, ry: 26 }, { kind: 'ellipse', cx, cy: cy - 8, rx: 48, ry: 30 }]`（ギザギザの割れ目がついた3つのパステル卵殻 `#F6E2B8`, `#DCEEE0`, `#F5D6D0`）
7. `fernCushion(cx, top, w = 138, h = 68)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 22 }]`（セージグリーン `#78B882` と若葉色 `#A2D69A` の葉を重ねた横長クッション）
8. `footprintStone(cx, top, w = 134, h = 70)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top + 14, w, h: h - 14, rx: 14 }, { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 }]`（琥珀色の平石 `#D6B88E` に、くっきり可愛い3本指の恐竜スタンプ `#A68256`）
9. `explorerCrate(cx, top, w = 126, h = 68)`：`shapes: [{ kind: 'rect', x: cx - w / 2, y: top, w, h, rx: 18 }]`（木箱 `#C8945E` にオリーブ色 `#7A9E7E` のベルトと丸い双眼鏡のイラスト）

### 2.6 最難関用の「のぞき場所」3か所（`src/core/peeks.ts` の `PEEKS.dino`）

- **`CLIFF_FRONT`**：`[{ kind: 'poly', pts: [{ x: 18, y: 666 }, { x: 18, y: 310 }, ...quadPoints({ x: 18, y: 310 }, { x: 195, y: 192 }, { x: 370, y: 310 }, 16), { x: 370, y: 666 }] }]`
- **`FERN_FRONT`**：`[{ kind: 'poly', pts: [{ x: 568, y: 664 }, { x: 568, y: 436 }, ...quadPoints({ x: 568, y: 436 }, { x: 775, y: 368 }, { x: 982, y: 436 }, 16), { x: 982, y: 664 }] }]`

| PeekId | `x` | `y` | `s` | `region` | `kind` | `front` | 見え方 |
|---|---|---|---|---|---|---|---|
| `dino-peek-cliff` | `372` | `652` | `1` | `'valley'` | `'peek'` | `CLIFF_FRONT` | しましま地層の右端の岩陰から、顔の右半分と頭の背びれ・耳がひょっこり出る |
| `dino-peek-fern-1` | `680` | `520` | `0.9` | `'fern'` | `'peek'` | `FERN_FRONT` | 水玉ソテツドームの左上縁から、両目と頭の特徴だけが出る |
| `dino-peek-fern-2` | `860` | `520` | `0.9` | `'fern'` | `'peek'` | `FERN_FRONT` | 水玉ソテツドームの右上縁から、両目と頭の特徴だけが出る |

---

## 3. 主役：動き続ける恐竜 5体の設計（`src/core/movers.ts` / `src/ui/moverView.ts`）

### 3.1 体の大きさと「顔を3秒以上ふさがない」公平性ルールの両立

既存の歩行する生きもの（ねこ・こいぬ・りす・ペンギン）は `w: 84〜130, h: 56〜120` ですが、恐竜ステージでは恐竜が主役なので **ひとまわり大きい `w: 116〜180, h: 86〜160`（スケール込みで横幅最大 `207px`）** に設計します。

[`tests/unit/movers.test.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/movers.test.ts#L44-L61) の公平性テストでは、`layer: 'front'` の移動体が各スポットの顔座標 `face = (sp.x, sp.y - 142 * sp.s)` を覆う連続秒数 `longest` が **`3.0秒未満`** であることが求められます。

- **連続遮蔽秒数の計算式**：
  $$\text{遮蔽秒数} = \frac{w \times \text{scale}}{|x_1 - x_0| / \text{sec}}$$
  （※折り返し地点 `x_0, x_1` をすべて画面外の `-120` と `1120` に置くことで、スポットの真上で折り返して2倍の時間ふさぐ現象を完全に防ぎます）
- **検証結果**：
  - `tricera`（`w: 160, scale: 1.1` → 実効幅 `176px`）：移動距離 `|-120 - 1120| = 1240px`、片道 `sec: 14` 秒（速度 `88.57 px/秒`）→ **最大遮蔽時間は `176 / 88.57 = 1.99秒`（`< 3.0秒` で合格！）**
  - `stegosaur`（`w: 164, scale: 1.1` → 実効幅 `180.4px`）：移動距離 `1240px`、片道 `sec: 15` 秒（速度 `82.67 px/秒`）→ **最大遮蔽時間は `180.4 / 82.67 = 2.18秒`（`< 3.0秒` で合格！）**
  - `mini-raptor`（`w: 116, scale: 1.05` → 実効幅 `121.8px`）：移動距離 `1220px`、片道 `sec: 9` 秒（速度 `135.56 px/秒`）→ **最大遮蔽時間は `121.8 / 135.56 = 0.90秒`（`< 3.0秒` で合格！）**
  - `brachio`（`w: 180, h: 160, scale: 1.15` → 実効幅 `207px`）：最も巨大な首長竜は **`layer: 'back'`（キャラクターの後ろ・背景の前）** を歩くため、どれだけ大きくゆっくり歩いても友だちの顔を隠す時間は **0秒** です。

### 3.2 恐竜 5体のスペック一覧（`MOVERS.dino`）

枠はすべて `viewBox="-150 -300 300 300"`、足もと中央が `(0, 0)`、右向きを基本とします。

| MoverId | 新規 `MoverKind` | 表示名（`MOVER_NAMES`） | `move` | `from` | `to` | `sec` | `scale` | `layer` | `SIZE` (`w, h`) / `BOX` (`x, y, w, h`) | 動き方と「もようのカモフラージュ」 |
|---|---|---|---|---|---|---|---|---|---|---|
| `dino-brachio` | `'brachio'` | `'くびながりゅう'` | `'patrol'` | `{ x: -130, y: 455 }` | `{ x: 1130, y: 455 }` | `22` | `1.15` | `'back'` | `w: 180, h: 160`<br>`[-90, -162, 180, 160]` | **のしのし歩行＋首振り**：谷の奥をゆったり往復する超大型の首長竜。体はセージグリーン（`#78B888`）で、背中に**おおソテツと同じクリーム色の「みずたま模様（`#FFF4C8`）」**がある。 |
| `dino-ptera` | `'pteranodon'` | `'よくりゅう'` | `'cross'` | `{ x: 1120, y: 175 }` | `{ x: -120, y: 135 }` | `14` | `1.1` | `'back'` | `w: 148, h: 86`<br>`[-74, -92, 148, 86]` | **滑空（`fly` アニメ）**：太古の空と火山の前を、大きな丸い翼を広げて気持ちよく飛ぶ。翼に**地層と同じ「しましま模様」**が入っている。 |
| `dino-tricera` | `'tricera'` | `'つのりゅう'` | `'patrol'` | `{ x: -120, y: 615 }` | `{ x: 1120, y: 615 }` | `14` | `1.1` | `'front'` | `w: 160, h: 106`<br>`[-80, -108, 160, 106]` | **のしのし歩行（`lumber`）**：中段を歩き、奥の段（`y = 652`）の友だちの前を横切る。大きな丸い襟飾り（フリル）と背中に**地層と同じテラコッタの「しましま模様（`#F4E4CE`×`#D99B78`）」**があり、しまの服の友だちと重なると一瞬見分けがつきにくくなる。 |
| `dino-stego` | `'stegosaur'` | `'せびれりゅう'` | `'patrol'` | `{ x: 1120, y: 855 }` | `{ x: -120, y: 855 }` | `15` | `1.1` | `'front'` | `w: 164, h: 110`<br>`[-82, -112, 164, 110]` | **のしのし歩行＋しっぽ振り（`lumber`）**：手前を歩き、手前の段（`y = 884..956`）の友だちの前を横切る。丸い背びれプレートと体に**恐竜の巣と同じピスタチオの「チェック風模様（`#FFF6E8`×`#98C686`）」**があり、チェック服の友だちと視覚的にまぎれる。 |
| `dino-raptor` | `'mini-raptor'` | `'ちびきょうりゅう'` | `'cross'` | `{ x: -110, y: 740 }` | `{ x: 1110, y: 760 }` | `9` | `1.05` | `'front'` | `w: 116, h: 88`<br>`[-58, -90, 116, 88]` | **ぴょこぴょこ走り（`step` アニメ）**：中段〜手前の広場を、左から右へ元気にぴょこぴょこ跳ねながら駆け抜ける琥珀色（`#E8B878`）のちび恐竜。 |

### 3.3 アニメーションの工夫（`src/ui/moverView.ts` / `src/ui/styles.css`）
- `pteranodon` は既存の `FLY` 配列に追加し、`mv-fly`（上下14pxのゆったりした浮遊）を適用します。
- 大型恐竜3体（`brachio`, `tricera`, `stegosaur`）には、小刻みな `mv-step`（0.5秒）ではなく、大きな体がのしのしと揺れる専用クラス **`lumber`** を [`moverView.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/moverView.ts#L75) で付与します：
  ```css
  .mv-inner.lumber { animation: mv-lumber 0.85s ease-in-out infinite alternate; transform-origin: 0 0; }
  @keyframes mv-lumber {
    from { transform: translateY(0) rotate(-1.8deg); }
    to { transform: translateY(-7px) rotate(1.8deg); }
  }
  ```
  これにより、首やしっぽが歩行に合わせてゆったりと上下に揺れる恐竜らしい動きがCSSだけで表現できます。

### 3.4 「恐竜が常に4〜5体動いている中でかくれんぼする」ための選出仕様
持ち主の狙い「恐竜が4、5体動き続けている中でかくれんぼをさせる」を実現するため、以下の仕様にします：
1. **「じゆうに さがす」モード（`app.ts` の `startSearch`）**：
   - `settings.movers` が ON のとき、`searchScene === 'dino'` では「やさしい」で **4体**（`back` 2体＋`front` 2体）、「ふつう」で **全5体** を最初から動かします（他の背景でも「やさしい」2〜3体・「ふつう」4〜5体を動かすと全パックの魅力が上がります）。
2. **「コース」モード（`movers.ts` の `pickMovers`）**：
   - **実装案A（既存の `movers.test.ts` を変更しない場合）**：コース進行に沿って `COURSE_MOVERS`（0〜5体）で増やし、「じゆうに さがす」で常時4〜5体動かす。
   - **実装案B（推奨：コースでも恐竜ステージは最初から賑やかにする場合）**：`pickMovers(scene, courseNo, seed)` で `scene === 'dino'` かつ `courseNo >= 2` のときは最低4体（コース2〜5では `back` 2体＋顔を隠さない軌道、またはコース2から4体、コース6以降で5体）を出すよう `dino` 専用の特例を設け、`tests/unit/movers.test.ts` で `dino` の期待個数を `courseNo === 1 ? 0 : Math.max(4, COURSE_MOVERS[c - 1])` とする。

### 3.5 かくれんぼとしての工夫（なぜ動く恐竜がいると楽しくて少し難しいのか）
1. **「動くもよう」による視覚トリック**：
   - 従来の `movers` は単色の動物（茶色の犬やリス、青いペンギン）でしたが、恐竜たちは**背中に水玉・フリルにしましま・背びれにチェック**という「背景や友だちの服と同じ柄・同じ色」を持っています。
   - そのため、恐竜が隠れ場所の近くを歩いていると、「そこにいるのは水玉の服の友だちなのか、それとも水玉のくびながりゅうの背中なのか」で一瞬目が惑わされます。
2. **理不尽さゼロの安全性**：
   - 恐竜は立ち止まらずに一定速度で歩き続けるため、友だちの前を横切っても約1〜2秒で通り過ぎます。
   - また `.movers { pointer-events: none; }` により、**恐竜の体が友だちの上に重なっている瞬間にタップしても、タップは恐竜に邪魔されず100%後ろの友だちに届いて「みーつけた！」になります**。

### 3.6 こわくないデザインと、恐竜をタップしたときの反応
- **こわくない原則**：
  - 全員が黒目に白いハイライトの入った**にっこり笑顔（またはおっとりした優しげな目）**で、体や角・背びれの先端はすべて丸く（`stroke-linejoin="round"`）描きます。
  - ティラノサウルスのような鋭い牙（ギザギザの歯）や鋭い爪、吠える演出・怖い効果音は一切入れません。
- **恐竜をタップしたらくすぐったそうに笑う仕掛け（友だち探しの邪魔にならない方式）**：
  - **課題**：もし恐竜自体に `pointer-events: auto` をつけてしまうと、後ろに隠れている友だちをタップしたときに恐竜がタップを 가로채（横取りし）てしまい、友だち探しの邪魔になります。
  - **解決策**：
    1. `.movers` はこれまで通り **`pointer-events: none` のまま**にし、画面タップ時はまず100% [`tap(scene, this.session, p)`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/app.ts#L1287)（友だちの発見判定）を実行します。**友だちの上に恐竜が重なっていても、友だちが最優先で見つかります**。
    2. `tap()` の結果が **`r.foundIndex < 0`（そこには友だちがいなかった＝外れタップ）のときだけ**、タップ座標 `p` とその時刻 `elapsed` における各移動体の位置 `moverPos(m, elapsed)` を照合します。
    3. いずれかの恐竜の中心（`(pos.x, pos.y - 55 * m.scale)`）から半径 `75px` 以内であれば、その恐竜の `<g class="mv" data-mover="...">` に `tickled` クラスを `600ms` 付与し、優しい音（`play('pop')`）を鳴らします。
    4. `tickled` クラスがついた恐竜は、ぷるぷるっとくすぐったそうに揺れて、頭上に小さな黄色い星・笑顔マークがふわっと浮かびます。これなら**友だち探しの邪魔は0%で、恐竜に触って遊ぶ楽しさだけを両立**できます。

---

## 4. 新しい友だち「がお（`gao`）」（`src/core/characters.ts`）

恐竜の着ぐるみフードをかぶったような、元気でやさしい10人目の友だちです。既存9人の誰とも頭の特徴（シルエット）が重なりません。

- **CharacterId**：`'gao'`
- **名前**：`'がお'`
- **紹介文（`personality`）**：`'きょうりゅうごっこが だいすきな げんきっこ。あたまの まるい せびれ が めじるし。'`
- **肌の色（`skin`）**：`'#C8E6B8'`（明るくやさしいパステルライムグリーン）
- **ほっぺの色**：共通の `#F28B8B`（`opacity="0.55"`）
- **じぶんの へや での普段着（`myroomView.ts` の `OUTFIT.gao`）**：
  - `{ kind: 'stripes', bg: '#F4E4CE', fg: '#D99B78', size: 30 }`（太古の地層カラーのしましま服）
- **輪郭（`silhouette`）と頭の特徴の正確な座標**（ローカル座標：足もと `(0, 0)`、頭 `HEAD` は `{ kind: 'ellipse', cx: 0, cy: -142, rx: 48, ry: 45 }`）：
  - 頭の上から左右のななめ上にかけて、**恐竜の丸いせびれ（トサカプレート）が5つアーチ状に並んだシルエット**：
    1. 中央てっぺんのせびれ：`{ kind: 'ellipse', cx: 0, cy: -196, rx: 11, ry: 15 }`
    2. 左上のせびれ：`rotEllipse(-28, -188, 10, 14, -28, -28, -188)`
    3. 右上のせびれ：`rotEllipse(28, -188, 10, 14, 28, 28, -188)`
    4. 左横上のせびれ：`rotEllipse(-50, -166, 9, 12, -55, -50, -166)`
    5. 右横上のせびれ：`rotEllipse(50, -166, 9, 12, 55, 50, -166)`
- **既存9人との識別性と検査適合**：
  - `koro`（中央の毛1つ）、`pino`（中央からV字の双葉2枚）、`hika`（中央しずく＋左右の葉耳の3点）、`popo`・`nyako`・`choki`（左右2つの耳／ハサミ）、`puka`（真横のヒレ2つ）、`mimi`（垂れ耳）、`moko`（雲頭＋星）に対し、`gao` は**頭の外周に沿って5つの丸い突起がぽこぽこ並ぶ恐竜トサカ型**のため、白黒シルエットだけで一目で判別できます。
  - 外枠は `x: -62..62, y: -211..0` で `CHAR_FRAME`（`x: -90..90, y: -225..15`）に余裕で収まり、上からのぞく `PEEKS` でも横からのぞく `PEEKS` でも突起が複数露出するため、`analyzePeek` の `featureFrac >= 0.15` をすべての背景で満たします。
- **`headMarkup`（コード描画）**：
  - 5つのせびれはあたたかいオレンジイエロー（塗り `#F2A868`、内側の小さな丸ハイライト `#FFE29A`、輪郭線 `#4A3A40`）を頭の楕円の後ろに描き、顔には共通の `eyes()`・`cheeks()` と、元気な笑顔の口 `<path d="M-9 -125 Q0 -116 9 -125" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>` を描きます。
- **絵のファイル（`art/characters/gao/`）**：
  - `back.svg`, `clothes-mask.svg`, `clothes-shade.svg`, `clothes-line.svg`, `front.svg`, `front-found.svg`（計6枚、`viewBox="-90 -225 180 240"`）

---

## 5. じぶんの へや：新部屋「きょうりゅうの ひろば」と新しい物 8つ（`src/core/myroom.ts`）

持ち主の方針「おもちゃが増えるのが大事」に応え、通常の背景パック（6個）より2個多い **全8個（うち `genre: 'toy'` のおもちゃ4個＋歩く生きもの1個）** を収録します。
さらに、**パックを買った瞬間から3個（たまごのソファ・ほねのすべりだい・あしあとのラグ）がすぐに置けて、シール5枚で動くおもちゃやちび恐竜が5個増えていく**構成にします。これにより、既存の「1シール＝1アイテム通知（`itemForSticker`）」のコード構造を一切壊さずに8個を実装できます。

### 5.1 新しい部屋：`dino-land`（きょうりゅうの ひろば）
- **ファイル**：`art/myroom/rooms/dino-land.svg`（`viewBox="0 0 1000 1000"`）
- **RoomDef**：
  ```ts
  { id: 'dino-land', name: 'きょうりゅうの ひろば', needCleared: 0, needScene: 'dino', content: 'room:dino-land', floorTop: 550, scaleBack: 0.95, scaleFront: 1.45 }
  ```
- **初期配置（`starterLayout('dino-land')`）**：
  ```ts
  [{ ref: 'item:footprint-rug', x: 520, y: 890 }, { ref: 'item:egg-sofa', x: 260, y: 720 }, { ref: 'item:bone-slide', x: 740, y: 740 }]
  ```
- **背景のデザイン**：
  - 上部 `y = 0〜550`：明るい青空とふわふわの雲、遠くにやさしい火山と古代ソテツの木立、丸いアンモナイト岩が見える開放的な太古の広場。
  - 下部 `y = 550〜1000`：おもちゃや友だちをたくさん並べやすい、あたたかいサバンナベージュと若草の広場床。

### 5.2 新しい物 8つ（`art/myroom/items/{id}.svg`、`viewBox="-150 -300 300 300"`）

| ItemId | 名前 | `sticker` | `content` | `genre` | `w` | 座れる場所（`seats`） | 動き（`motion`） | 見た目と遊び方 |
|---|---|---|---|---|---|---|---|---|
| `egg-sofa` | `'たまごの ソファ'` | `null` | `'scene:dino'` | `'furniture'` | `270` | `[{ x: -56, y: -58 }, { x: 56, y: -58 }]` | なし | パカッと割れた大きな水玉たまごの殻の中に、ふかふかのクッションが入った2人掛けソファ。 |
| `bone-slide` | `'ほねの すべりだい'` | `null` | `'scene:dino'` | **`'toy'`** | `260` | `[{ x: -52, y: -104 }, { x: 54, y: -38 }]` | なし | **初期から遊べる大型おもちゃ！** 丸みのある白い恐竜のほね階段と、つるつるのすべりだい。上の踊り場と下の滑り口に友だちを2人座らせられる。 |
| `footprint-rug` | `'あしあとの ラグ'` | `null` | `'scene:dino'` | `'deco'` | `290` | なし（`flat: true`） | なし | 恐竜の大きな3本指の足あと形をした、ピスタチオグリーンのふわふわラグ。 |
| `dino-egg` | `'うごく たまご'` | `'d-s1'` | — | **`'toy'`** | `96` | なし | `'sway'` | 割れ目からちび恐竜のつぶらな目がのぞいていて、カタカタと左右にゆらゆら揺れる不思議なたまごのおもちゃ。 |
| `dino-plush` | `'きょうりゅうの ぬいぐるみ'` | `'d-s5'` | — | **`'toy'`** | `116` | なし | `'bob'` | ぽよんぽよんと上下に弾む、にっこり笑った緑の恐竜のぬいぐるみ。 |
| `dino-ride` | `'きょうりゅうの ゆりもの'` | `'d-s15'` | — | **`'toy'`** | `184` | `[{ x: 0, y: -64 }]` | `'sway'` | **乗って揺れる遊具！** トリケラトプス型の木馬（ロッキング遊具）。背中に友だちを1人乗せると一緒にゆらゆら揺れる。 |
| `volcano-lamp` | `'かざんの ランプ'` | `'d-s30'` | — | `'deco'` | `120` | なし | `'bob'` | 怖くないミニ火山型のルームライト。てっぺんからパステルピンクと黄色の丸いわたあめ光球がぽわんぽわん浮かぶ（`TALL`: `160`）。 |
| `baby-dino` | `'ちびきょうりゅう'` | `'d-s50'` | — | `'animal'` | `116` | なし | `'walk'` | 部屋の中をトコトコ歩いて往復する、人懐っこい赤ちゃん恐竜（`art/movers/mini-raptor.svg` の絵を共有可能）。 |

> **ジャンル別集計**：**`toy`（おもちゃ）4個**、`furniture`（かぐ）1個、`animal`（いきもの）1個、`deco`（かざり）2個（計8個）。うち**動くもの5個**、**座れるもの3個（計5席）**。

---

## 6. ごほうびシール 5枚（`src/core/stickers.ts`）

すべて `kind: 'scene', scene: 'dino'`。「きょうりゅうの たに」で見つけた回数（`sceneFinds.dino`）が 1・5・15・30・50回に達すると確定でもらえます。
`Motif` 型には `'dino-egg' | 'footprint' | 'tricera' | 'ammonite' | 'brachio'` を追加します。

| StickerId | 名前 | `need` | `char` | `motif` | `color`（地の色） | 一緒にもらえる「へやの物」 |
|---|---|---|---|---|---|---|
| `d-s1` | `'がおが きたよ'` | `1` | `'gao'` | `'dino-egg'` | `'#E2F0D4'`（ライムパステル） | `dino-egg`（うごく たまご）＋友だち「がお」＋部屋「きょうりゅうの ひろば」解放 |
| `d-s5` | `'たにで 5かい'` | `5` | `'koro'` | `'footprint'` | `'#F4E2C6'`（サバンナサンド） | `dino-plush`（きょうりゅうの ぬいぐるみ） |
| `d-s15` | `'たにで 15かい'` | `15` | `'gao'` | `'tricera'` | `'#F5D8C8'`（テラコッタピーチ） | `dino-ride`（きょうりゅうの ゆりもの） |
| `d-s30` | `'たにで 30かい'` | `30` | `'popo'` | `'ammonite'` | `'#DCE8F2'`（スカイミスト） | `volcano-lamp`（かざんの ランプ） |
| `d-s50` | `'きょうりゅう はかせ'` | `50` | `'gao'` | `'brachio'` | `'#D6ECD8'`（ソテツグリーン） | `baby-dino`（ちびきょうりゅう） |

---

## 7. コースや最難関モードでの使われ方

1. **コースモード（[`src/core/courses.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/courses.ts#L56) の `courseScene`）**：
   - `SCENE_IDS` に `'dino'` が追加されることで、`this.can('scene:dino')` が真（恐竜パックを所持）のとき、コース内の各ラウンドで `ids = SCENE_IDS.filter(id => this.can('scene:' + id))` のローテーションに自動的に組み込まれます。
   - たとえば基本3背景＋恐竜パックを持っている場合、4ラウンドに1回必ず「きょうりゅうの たに」が登場します。
   - まだ「きょうりゅうの たに」で誰も見つけたことがない状態（`sceneFinds.dino === 0`）でコース中にこの背景が出た場合、`firstMeet('dino')` によって**必ず新キャラ「がお（`gao`）」が隠れている**ため、コースを遊んでいるだけでも自然に「がお」と出会って仲間にできます。
2. **コース後半のギミックとの相乗効果**：
   - コース4〜5で「色つきニット帽」、コース6〜10で「背景と同じ柄の傘（しましま地層柄の傘・水玉ソテツ柄の傘）」や「背景と同じ柄の帽子」が加わり、さらに前を横切る恐竜たち（`tricera`, `stegosaur`, `mini-raptor`）の背中の柄と重なることで、コース後半ならではのワクワクする歯ごたえが生まれます。
3. **最難関モード（`trial:hardest`）での出方**：
   - `PEEKS.dino` の3か所（地層アーチの右端・水玉ソテツの左上と右上）から友だちが片目と背びれ（または耳）だけを出してのぞき、残りの1〜2人が優先帯（`HARDEST_BAND`）の化石や卵の後ろに深く帽子やサングラスをつけて隠れます。

---

## 8. 実装の手順と Codex への絵の依頼一覧

### 8.1 コードの実装手順（変更するファイル一覧）

1. **[`src/core/scene.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/scene.ts)**：`SceneId` に `| 'dino'` を追加。
2. **`src/core/props-dino.ts`（新規作成）**：2.5節の9つの前景小物関数（`ammoniteRock`, `ribArch`, `cycadStump`, `geyserPool`, `spottedEgg`, `eggShells`, `fernCushion`, `footprintStone`, `explorerCrate`）を実装。
3. **`src/core/scenes/dino.ts`（新規作成）** ＆ **[`src/core/scenes/index.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/scenes/index.ts)**：2.2〜2.5節の `dino` シーン定義を作成し、`SCENES` と `SCENE_IDS` に `'dino'` を登録。
4. **[`src/core/peeks.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/peeks.ts)**：`CLIFF_FRONT`, `FERN_FRONT` と `PEEKS.dino`（3か所）を追加。
5. **[`src/core/characters.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/characters.ts)**：`CharacterId` に `| 'gao'`、`CHARACTERS.gao`、`CHARACTER_IDS`、`SCENE_FRIENDS`（`{ scene: 'dino', char: 'gao' }`）、`headMarkup` の `case 'gao':` を追加。
6. **[`src/core/movers.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/movers.ts)** ＆ **[`src/ui/moverView.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/moverView.ts)**：
   - `MoverKind` に `'brachio' | 'pteranodon' | 'tricera' | 'stegosaur' | 'mini-raptor'` を追加。
   - `MOVERS.dino`（5体）と `MOVER_NAMES` を追加。
   - `moverView.ts` に5体の `fallback`、`BOX`、`FLY`（`pteranodon` 追加）、および `lumber` アニメーション分岐を追加。
7. **[`src/core/myroom.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/myroom.ts)** ＆ **[`src/ui/myroomView.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/myroomView.ts)**：
   - `RoomId` に `| 'dino-land'`、`ROOMS` に `'dino-land'`、`starterLayout('dino-land')` を追加。
   - `ITEMS` に5.2節の8アイテムを追加。
   - `myroomView.ts` の `OUTFIT` に `gao`、`TALL` に `'volcano-lamp': 160` を追加。
8. **[`src/core/stickers.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/stickers.ts)** ＆ **`src/ui/stickerArt.ts`**：`Motif` に5種を追加し、`STICKERS` に `d-s1`〜`d-s50` の5枚を追加。
9. **[`src/entitlements/entitlements.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/entitlements/entitlements.ts)** ＆ **[`src/purchase/store.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/purchase/store.ts)**：`PackId` に `| 'dino'`、`PACKS` に `'dino'`、`PRODUCTS` に `com.akihikoito.moyoukakurenbo.dino` と `allpacks` への `'dino'` 追加。
10. **[`src/ui/app.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/app.ts)**：「じゆうに さがす（`startSearch`）」でも `settings.movers` が ON なら恐竜たちが動くようにし、外れタップ時に恐竜がくすぐったがる反応（3.6節）を追加。
11. **[`scripts/validate-art.mjs`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/scripts/validate-art.mjs)**：274行目の `myroom/rooms` 正規表現に `dino-land` を追加。

### 8.2 Codex に依頼する新規 SVG ファイル一覧（合計 31枚）

（※`baby-dino` は `art/movers/mini-raptor.svg` を [`registry.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/art/registry.ts#L125) の仕組みで自動共有できるため、部屋アイテム用の個別ファイルは7枚で済みます）

| カテゴリ | 枚数 | ファイルパスと寸法（`viewBox`） |
|---|---|---|
| **① 柄タイル** | **4枚** | `art/patterns/dino-plain.svg`, `dino-stripes.svg`, `dino-dots.svg`, `dino-check.svg`（正方形 `128×128` 以上、不透明・シームレス） |
| **② 背景 4層** | **4枚** | `art/scenes/dino/back.svg`, `over.svg`, `minor.svg`, `fore.svg`（`viewBox="0 0 1000 1000"`） |
| **③ 新しい友だち「がお」** | **6枚** | `art/characters/gao/back.svg`, `clothes-mask.svg`, `clothes-shade.svg`, `clothes-line.svg`, `front.svg`, `front-found.svg`（`viewBox="-90 -225 180 240"` / `450×600`） |
| **④ 動く恐竜（movers）** | **5枚** | `art/movers/brachio.svg`, `pteranodon.svg`, `tricera.svg`, `stegosaur.svg`, `mini-raptor.svg`（`viewBox="-150 -300 300 300"`） |
| **⑤ じぶんの へや（背景）** | **1枚** | `art/myroom/rooms/dino-land.svg`（`viewBox="0 0 1000 1000"`） |
| **⑥ じぶんの へや（物）** | **7枚** | `art/myroom/items/egg-sofa.svg`, `bone-slide.svg`, `footprint-rug.svg`, `dino-egg.svg`, `dino-plush.svg`, `dino-ride.svg`, `volcano-lamp.svg`（`viewBox="-150 -300 300 300"`、`baby-dino` は `movers/mini-raptor.svg` を共有） |
| **⑦ ごほうびシール** | **5枚** | `art/stickers/d-s1.svg`, `d-s5.svg`, `d-s15.svg`, `d-s30.svg`, `d-s50.svg`（`viewBox="0 0 120 120"`） |

---

## 9. テストで確かめること（品質・公平性の検証項目）

1. **うごく恐竜の公平性（[`tests/unit/movers.test.ts`](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/movers.test.ts)）**：
   - `SIZE` に5体の恐竜サイズ（`brachio: { w: 180, h: 160 }`, `pteranodon: { w: 148, h: 86 }`, `tricera: { w: 160, h: 106 }`, `stegosaur: { w: 164, h: 110 }`, `mini-raptor: { w: 116, h: 88 }`）を追加して実行。
   - **顔遮蔽3秒未満**：`front` の恐竜3体（`tricera`, `stegosaur`, `mini-raptor`）が、9か所すべてのスポットの顔 `(sp.x, sp.y - 142 * sp.s)` を連続して覆う最大時間が **3.0秒未満**（実測 `0.90〜2.18秒`）であること。
   - **横切り回数**：`front` の恐竜たちが、隠れ場所の胴体 `(sp.x, sp.y - 80 * sp.s)` を合計2回以上実際に横切ること（奥の段4か所を `tricera` が、手前の段5か所を `stegosaur` が横切るため合計9回で余裕で合格）。
   - **画面内通過**：全5体の `t = sec / 2` における中間座標が `(0..1000, 0..1000)` の画面内にあること。
2. **隠れ場所・のぞき場所・アクセサリーの幾何検査**：
   - 全9スポット × 全10キャラクター（`gao` 含む）で `analyzeSpot(dino, sp, ch).ok === true`（顔が隠れない、服の可視率 `0.20〜0.92`、全体の可視率 `0.45` 以上、領域一致率 `0.70` 以上、画面端マージン `6px` 以上）。
   - 全36ペアのスポット間で `spotsConflict(a, b) === false`（どの3人を同時に置いても重ならない）。
   - 全3か所の `PEEKS.dino` × 全10キャラクターで `analyzePeek(dino, pk, ch).ok === true`（片目が丸ごと見え、頭20%以上・全体5%以上・頭の特徴15%以上が見える）。さらに既存の7背景の `PEEKS` でも新キャラ `gao` がすべて合格すること。
   - コース6（`spots: 'easy', umbrella: 'camo'`）で迷彩の傘が使えるスポットが存在し、最難関（`hardestRound`）で優先帯（`HARDEST_BAND`）の候補から3人配置できること。
3. **タップの透過性と操作性**：
   - 恐竜（`front` レイヤー）が友だちの目の前を通過している最中にその場所をタップしても、恐竜に邪魔されずに1回で友だちが見つかること。
   - 恐竜を直接タップしたとき、そこに友だちがいれば友だちが見つかり、友だちがいなければ恐竜がくすぐったがる反応をしてエラーにならないこと。
4. **絵の自動検査（`npm.cmd run validate:art`）**：
   - 追加した31枚のSVGすべてで、寸法・`viewBox`・不透明度・つなぎ目・顔の非干渉・スクリプトや文字の非含有が100%合格（`OK`）になること。
