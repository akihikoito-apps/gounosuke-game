# 追加パック第3弾「ほたるの かわべ パック（`night`）」仕様書（2026-10-15）

この文書は、追加パック `night`（ほたるの かわべ パック）の実装値・座標・色をまとめた仕様書です。Codex（絵の制作）はこの数値をそのまま基準にして描いてください。
**ホラー・おどろかす要素は一切含めません**。夏の夜の くさはら と 川べりで、ほたるが ふわふわ 飛んでいる、暗めだけど やさしく おだやかな絵本の世界にします。

---

## 1. パックと中身のID

- **PackId**：`'night'`（名前：`ほたるの かわべ パック`、`free: false`）
- **ProductId（`src/purchase/store.ts`）**：`com.akihikoito.moyoukakurenbo.night`
  - `summary`：`'背景「ほたるの かわべ」・友だち「ひか」・へや「ほたるの えんがわ」・家具6つ・シール5枚'`
  - `com.akihikoito.moyoukakurenbo.allpacks` の `packs` 配列も `['more-courses', 'beach', 'forest', 'aquarium', 'night']`
- **contents**：`['scene:night', 'char:hika', 'room:veranda']`
- **SceneId**：`'night'`（名前：`ほたるの かわべ`）
- **SCENE_FRIENDS.night**：`'hika'`（その背景で1回見つけると仲間になる）

---

## 2. 背景「ほたるの かわべ」（`src/core/scenes/night.ts`）

### 2.1 柄タイル4種（`costumes`）と色
暗い夜の雰囲気を出しつつ、友だちの輪郭線（`#4A3A40`）と顔がはっきり見えるよう、**柄の領域は暗すぎない中間明度の夜色パレット**にしています（夜空と遠景の山なみは `y = 0〜180` の上部だけ深い紺色 `#24345A`〜`#2E426E` にし、柄の領域はすべて中間の明るさに保っています）。

| CostumeId | 場所の意味 | `kind` | `bg`（地の色） | `fg`（模様の色） | `size` | 柄ファイル |
|---|---|---|---|---|---|---|
| `plain` | かわらの いしみち（月あかりの小石の道） | `plain` | `#7E889B` | `#909CAE` | `56` | `art/patterns/night-plain.svg` |
| `stripes` | くさはら（夜の草の縦しま） | `stripes` | `#4E7A6B` | `#82B596` | `40` | `art/patterns/night-stripes.svg` |
| `dots` | かわ（月あかりのまるい光の粒が浮かぶ水面） | `dots` | `#4B6E96` | `#F2DC8C` | `52` | `art/patterns/night-dots.svg` |
| `check` | ござ（川べりに敷いたピクニックシート） | `check` | `#C8A86B` | `#8C9E6E` | `46` | `art/patterns/night-check.svg` |

### 2.2 柄の領域4つ（`regions`）の正確な座標（1000×1000）
すべての領域は物の形に合わせた多角形（`kind: 'poly'`）です（`path` のみ下のベース全面 `rect`）。

1. **`path`（かわらの いしみち / `costume: 'plain'`）**
   - `rect`: `x = 0, y = 180, w = 1000, h = 820`（他の3領域が上に重なるため、上部と中央・手前の小石の道として見える）
2. **`grass`（くさはら / `costume: 'stripes'`）**
   - 左上のアーチ状の草むらと竹のしげみ（`x = 12〜390, y = 128〜592`）：
   - 上端は `(12, 244)` から制御点 `(201, 128)` を通る二次ベジェ曲線で `(390, 244)` へ（16分割）
   - 下端は波打つ草の裾：`{ x: 390, y: 586 }, { x: 342, y: 592 }, { x: 295, y: 580 }, { x: 248, y: 592 }, { x: 201, y: 580 }, { x: 154, y: 592 }, { x: 107, y: 580 }, { x: 60, y: 592 }, { x: 12, y: 586 }`
3. **`river`（かわ / `costume: 'dots'`）**
   - 右中段のゆるやかな川の流れと入り江（`x = 572〜978, y = 304〜592`）：
   - 上岸は ゆるい波：`(576,372)`→制御点`(616,348)`→`(680,348)`→制御点`(770,296)`→`(860,348)`→制御点`(934,348)`→`(974,372)`（二次ベジェ3本。のぞき場所 x=680・860 は波の谷、間の x=770 が波の山）
   - 下岸は `{ x: 978, y: 592 }, { x: 572, y: 592 }`
4. **`mat`（ござ・ピクニックシート / `costume: 'check'`）**
   - 手前に斜め（台形）に広げた川べりのござ（`y = 708〜972`）：
   - 8頂点：`{ x: 96, y: 716 }, { x: 500, y: 708 }, { x: 904, y: 716 }, { x: 940, y: 840 }, { x: 952, y: 964 }, { x: 500, y: 972 }, { x: 48, y: 964 }, { x: 60, y: 840 }`

### 2.3 背景の4層（`art/scenes/night/`）
- **`back.svg`**：
  - 上部 `y = 0〜180`：深い紺色の夜空（`#24345A`）、遠くのやさしい山なみ（`#2E426E` / `#38507E`）、まるい満月（中心 `(500, 92)`, `r = 44`, `#FFF3B0`）、小さな星とほたるの遠い光粒。
  - 下部 `y = 180〜1000`：月あかりに照らされた川原のベースと小石の質感。
- **`over.svg`**：
  - くさはらの外縁（竹のアーチ枠 `M12 586 V244 Q201 128 390 244 V586` と草の穂）、かわの岸辺の石と水草の縁（`M572 584 V372 Q614 344 680 344 Q770 292 860 344 Q936 344 978 372 V584`）、ござの縁取りと結び紐（`y = 708〜972`）。
  - **注意**：友だちが隠れる場所の顔まわりや、柄の領域の内部を濃く塗りつぶさないこと（服の柄が背景の柄に溶け込む仕組みを守るため）。
- **`minor.svg`**：
  - 夜空の小さな星粒や、川辺の遠い草のシルエットなど（コンパクト表示では非表示になる層）。
- **`fore.svg`**：
  - 9つの隠れ場所の前景小物（友だちの「下半身・胴体の一部」だけを隠し、**顔 `y_spot - 150*s` 付近には絶対に重ねない**）。

### 2.4 隠れ場所9か所（`spots`）と前景小物（`src/core/props-night.ts`）

| SpotId | `x` | `y` | `s` | `region` | `easy` | 前景の小物（`fore.svg` の同じ位置に描く） | 小物の範囲（目安） |
|---|---|---|---|---|---|---|---|
| `night-grass-1` | `135` | `555` | `1.0` | `grass` | `true` | **ほたるかご**（竹かごの中にやさしい光粒） | `x: 69〜201, y: 459〜589` |
| `night-grass-2` | `295` | `555` | `0.95` | `grass` | `false` | **うちわ**（竹の丸うちわと水玉模様） | `x: 243〜347, y: 447〜583` |
| `night-river-1` | `675` | `565` | `0.95` | `river` | `true` | **すいれん**（丸い蓮の葉と淡いピンクの花） | `x: 613〜737, y: 465〜591` |
| `night-river-2` | `860` | `565` | `0.9` | `river` | `false` | **ささぶね**（笹の葉の舟と小さなほたるの光） | `x: 800〜920, y: 477〜591` |
| `night-mat-1` | `195` | `925` | `1.0` | `mat` | `true` | **すいか**（丸いすいかと三角に切ったすいか） | `x: 127〜263, y: 829〜957` |
| `night-mat-2` | `500` | `930` | `0.95` | `mat` | `false` | **はっぱの舟**（木の葉の舟と丸い露の玉） | `x: 432〜568, y: 830〜958` |
| `night-mat-3` | `805` | `925` | `0.9` | `mat` | `false` | **たけの ベンチ**（小さな竹の腰かけ台） | `x: 743〜867, y: 827〜953` |
| `night-path-1` | `475` | `555` | `0.9` | `path` | `false` | **かえるの置きもの**（にっこり笑う石のかえる） | `x: 405〜545, y: 447〜583` |
| `night-path-2` | `355` | `785` | `0.9` | `path` | `false` | **ちょうちん**（あたたかい灯りの丸提灯） | `x: 299〜411, y: 677〜813` |

### 2.5 のぞき場所3か所（`src/core/peeks.ts`）
- `night-peek-grass`：`(396, 584), s = 1, region: 'path'`（くさはらの右端 `GRASS_FRONT` からひょっこり顔を出す）
- `night-peek-river-1`：`(680, 452), s = 0.9, region: 'river'`（かわの上岸 `RIVER_FRONT` の向こうから顔を出す）
- `night-peek-river-2`：`(860, 452), s = 0.9, region: 'river'`（かわの上岸 `RIVER_FRONT` の向こうから顔を出す）

---

## 3. 新しい友だち「ひか（`hika`）」（`src/core/characters.ts`）

- **CharacterId**：`'hika'`
- **名前**：`ひか`
- **紹介文（`personality`）**：`よるの かわべに すむ やさしい こ。あたまの ひかる しずくと はっぱの みみ が めじるし。`
- **肌の色（`skin`）**：`#EAF5D8`（暗い背景でも顔が明るくくっきり見える、やさしい若草クリーム色）
- **ほっぺの色（`cheek`）**：`#F4A6B8`
- **じぶんの へや での普段着（`myroomView.ts` の `OUTFIT.hika`）**：`{ kind: 'dots', bg: '#E2F0DC', fg: '#FFF3B0', size: 30 }`
- **輪郭（`silhouette`）と頭の特徴の正確な座標**（ローカル座標：足もと `(0, 0)`、頭の中心 `(0, -140)`, `r = 46`）：
  1. **頭頂のぽわんと光るしずく**：`circle(0, -195, 16)`（塗り `#FFF099`、内側に白いハイライト `circle(-4, -199, 6)`）
  2. **左右のまるいはっぱの耳**：
     - 左：`ellipse(-52, -168, 22, 13, -18)`（塗り `#88C88E`、内側の葉脈色 `#C8ECC8`）
     - 右：`ellipse(52, -168, 22, 13, 18)`（塗り `#88C88E`、内側の葉脈色 `#C8ECC8`）
- **絵のファイル（`art/characters/hika/`）**：
  - `back.svg`, `clothes-mask.svg`, `clothes-shade.svg`, `clothes-line.svg`, `front.svg`, `front-found.svg`（計6枚、`viewBox="-90 -225 180 240"`）

---

## 4. うごくもの（`src/core/movers.ts` / `src/ui/moverView.ts`）

- **新規 `MoverKind` 2種**（枠は `viewBox="-150 -300 300 300"`、足もと／基準 `(0, 0)`）：
  1. **`firefly`（ほたる）**：`art/movers/firefly.svg`（ぽわんと光る黄色の丸いお尻と若草色の体のほたるが2匹、ふわふわ飛ぶ。`BOX`: `[-36, -72, 72, 60]`）
  2. **`frog`（かえる）**：`art/movers/frog.svg`（にっこり笑う若草色の丸いかえる。`BOX`: `[-42, -56, 84, 56]`）
- **`MOVERS.night` の5軌道**：
  1. `night-firefly1`（`firefly`, `cross`, `(-120, 170) → (1120, 140)`, `sec: 14`, `scale: 1.1`, `layer: 'back'`）
  2. `night-firefly2`（`firefly`, `patrol`, `(180, 240) ↔ (820, 200)`, `sec: 20`, `scale: 1.05`, `layer: 'back'`）
  3. `night-frog`（`frog`, `patrol`, `(-90, 860) ↔ (1090, 860)`, `sec: 14`, `scale: 1.15`, `layer: 'front'`）
  4. `night-firefly3`（`firefly`, `cross`, `(240, 1060) → (760, -40)`, `sec: 12`, `scale: 1.0`, `layer: 'front'`）
  5. `night-firefly4`（`firefly`, `patrol`, `(1090, 580) ↔ (-90, 600)`, `sec: 13`, `scale: 1.0`, `layer: 'front'`）

---

## 5. じぶんの へや：新部屋「ほたるの えんがわ」と新しい物6つ（`src/core/myroom.ts`）

### 5.1 新しい部屋：`veranda`（ほたるの えんがわ）
- **ファイル**：`art/myroom/rooms/veranda.svg`（`viewBox="0 0 1000 1000"`）
- **RoomDef**：`{ id: 'veranda', name: 'ほたるの えんがわ', needCleared: 0, needScene: 'night', content: 'room:veranda', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 }`
- **初期配置（`starterLayout('veranda')`）**：`[{ ref: 'item:engawa-bench', x: 280, y: 720 }]`
- **背景のデザイン**：
  - 上部 `y = 0〜560`：大きく開いた木の縁側（障子枠や丸太の柱、軒先の風鈴）の向こうに、満月とほたるが舞う夏の夜の川べりと草むらが見える穏やかな和の縁側。
  - 下部 `y = 560〜1000`：あたたかみのある木の縁側板と畳・ござの床（物を置いてもごちゃつかない落ち着いた木目）。

### 5.2 新しい物6つ（`art/myroom/items/{id}.svg`、`viewBox="-150 -300 300 300"`）

| ItemId | 名前 | シール | `genre` | `w` | 座れる場所（`seats`） | 動き（`motion`） | 備考 |
|---|---|---|---|---|---|---|---|
| `engawa-bench` | えんがわの ベンチ | `null`（`content: 'scene:night'`） | `furniture` | `280` | `[{ x: -58, y: -60 }, { x: 58, y: -60 }]` | なし | 赤い毛氈（または緑のござ）が敷かれた木製の縁台ベンチ |
| `star-rug` | ほしぞらの ラグ | `n-s1` | `deco` | `290` | なし（`flat: true`） | なし | 既存の `art/myroom/items/star-rug.svg` を使い回す |
| `paper-lantern` | ちょうちん | `n-s5` | `deco` | `96` | なし | `sway` | 木のスタンドから下がる、やさしい灯りの丸ちょうちん（`TALL`: 160） |
| `music-box` | ほしの オルゴール | `n-s15` | `toy` | `130` | なし | `sway` | 既存の `art/myroom/items/music-box.svg` を使い回す |
| `bamboo-chair` | たけの ゆりいす | `n-s30` | `furniture` | `160` | `[{ x: 0, y: -62 }]` | `sway` | 1人座れてやさしく揺れる、丸みのある竹編みのロッキングチェア |
| `frog-plush` | かえるの ぬいぐるみ | `n-s50` | `toy` | `100` | なし | `bob` | にっこり笑う若草色のかえるのぬいぐるみ |

---

## 6. ごほうびシール5枚（`src/core/stickers.ts`）

すべて `kind: 'scene', scene: 'night'`。絵は `art/stickers/{id}.svg`（`viewBox="0 0 120 120"`）。

| StickerId | 名前 | `need` | `char` | `motif` | `color` | もらえる家具 |
|---|---|---|---|---|---|---|
| `n-s1` | ひかが きたよ | `1` | `hika` | `firefly` | `#DCE8D8` | `star-rug`（＋友だち「ひか」・部屋「ほたるの えんがわ」解放） |
| `n-s5` | かわべで 5かい | `5` | `koro` | `lantern` | `#F5E6C8` | `paper-lantern` |
| `n-s15` | かわべで 15かい | `15` | `hika` | `frog` | `#D4EBD8` | `music-box` |
| `n-s30` | かわべで 30かい | `30` | `moko` | `dragonfly` | `#D8E4F4` | `bamboo-chair` |
| `n-s50` | かわべで 50かい | `50` | `hika` | `moon` | `#F6EAB8` | `frog-plush` |

---

## 7. 古い保存データの互換方針（`src/storage/schema.ts`・`src/core/myroom.ts`）

家族テスト版で以前のパック（旧背景ID・旧キャラID・旧部屋ID・旧家具ID）が保存されている場合、**「知らない背景・知らない部屋・知らない友だちや家具はエラーにせず安全に捨てて、他の進行データ（コース・見つけた合計・他の部屋）はすべてそのまま残す」**方式に統一しています：

1. **`collection.sceneFinds`**：`SCENE_IDS` に含まれない未知の背景キーは `validate()` で読み飛ばして捨て、他の背景の見つけた回数と `totalFinds` はそのまま保持します（`repaired: true` となり次回保存時にきれいになります）。
2. **`myroom.layouts` / `myroom.current`**：`ROOMS` に存在しない部屋キーや、未知の友だち・家具を含む部屋の配置は `validLayouts()` で捨て、他の有効な部屋の配置はそのまま残します。また `myroom.current` が未知の部屋IDだった場合は `'living'` に戻し、`repaired: true` として復旧します。
3. **`resume`**：中断データが未知の背景ID・キャラIDだった場合は `validateResume()` が `null` を返し、タイトル画面から安全に始まるようにします。
4. **シール**：シールは保存データにIDを持たず、`course.cleared`・`collection.totalFinds`・`collection.sceneFinds` から毎回計算されるため、古いシールIDでエラーになることはありません。
