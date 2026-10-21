# ジョブ21：既存パックの魅力強化（新しい友だち「おう」・おもちゃ6点・かわべのうごくもの2点・うみべ前景小物）の絵を作る（SVG）

## 目的
`strategy/packs/pack-appeal-review.md` の優先度1〜5に基づき、各追加パックの「友だち・おもちゃ・うごくもの・前景小物」を強化しました。
新しく追加・差し替えた以下の SVG アセット（新友だち「おう」6枚、シール `c10` の描き直し1枚、へやのおもちゃ・いきもの6枚、うごくもの2枚、`beach/fore.svg` の描き直し1枚、合計 16 ファイル）を制作してください。

## 必ず最初に読むもの
1. `AGENTS.md`（ルールと禁止事項）
2. `CODEX_ART_BRIEF.md`（絵柄の統一ルール：輪郭線はすべて `#4A3A40`、文字を入れない、やさしい絵本調）
3. `ART_SLOTS.md`（各スロットの viewBox・中心座標・マスクの決まり）
4. `strategy/packs/pack-appeal-review.md`（今回の追加・改善の背景）
5. コード側の正確な定義：
   - `src/core/characters.ts`（`CHARACTERS.ou` の輪郭・色・頭の特徴）
   - `src/core/stickers.ts`（`c10` の定義）
   - `src/core/myroom.ts`（新しいおもちゃ・いきもの6点の `w`・`seats`・`motion`）
   - `src/core/movers.ts` と `src/ui/moverView.ts`（`dragonfly`・`floating-lantern` の `BOX` とフォールバック図形）
   - `src/core/scenes/beach.ts` と `src/core/props-beach.ts`（うみべ9か所の小物位置と `shapes`）
6. お手本にする既存の絵：
   - `art/characters/popo/`、`art/characters/hika/`（友だち6層の分け方）
   - `art/myroom/items/dolphin-ride.svg`、`art/myroom/items/fishtank.svg`、`art/myroom/items/floatring.svg`（座れるおもちゃ・いきものの描き方）
   - `art/movers/firefly.svg`、`art/movers/sailboat.svg`（うごくものの描き方）
   - `art/scenes/beach/fore.svg`（うみべの前景小物レイヤー）

## 数値の優先順位
この依頼書や `strategy/` の文書と `src/` のコードで数値が食い違うときは、**`src/` のコード（`characters.ts`・`myroom.ts`・`movers.ts`・`moverView.ts`・`beach.ts`・`props-beach.ts`・`stickers.ts`）が正** です。

## 書き込んでよい場所
- `art/` の中だけ（`src/` や `tests/` や `scripts/` は変更しない）

---

## 作る・描き直すファイル一覧（すべて SVG、合計 16 ファイル）

### ① 新しい友だち「おう」6枚（`art/characters/ou/`、`viewBox="-90 -225 180 240"`）
コース10クリア（「つづきの コース」パック）で仲間になる10人目の友だちです。`src/core/characters.ts` の `CHARACTERS.ou` の輪郭・座標にピタリと合わせること。
- 肌の色：`#F7DFB8`（あたたかいクリームゴールド）
- 頭の特徴（めじるし）：頭のてっぺんの **まるい3つ山の おうかん**（王冠）
  - 王冠の土台：`{ kind: 'rect', x: -30, y: -196, w: 60, h: 18, rx: 6 }`
  - 中央の山と丸飾り：`{ kind: 'ellipse', cx: 0, cy: -202, rx: 10, ry: 12 }`（先端の丸 `cx = 0, cy = -206, r = 7`）
  - 左の山と丸飾り：`{ kind: 'ellipse', cx: -22, cy: -197, rx: 9, ry: 10 }`（先端の丸 `cx = -29, cy = -200, r = 6`）
  - 右の山と丸飾り：`{ kind: 'ellipse', cx: 22, cy: -197, rx: 9, ry: 10 }`（先端の丸 `cx = 29, cy = -200, r = 6`）
  - 王冠の色：`#FFD45C`（やまぶき色）、中央の丸い宝石飾り `#E9785F`（サンゴ赤）、左右の小さな丸飾り `#7CC6BC`（ミント水色）
- 頭本体：`{ kind: 'ellipse', cx: 0, cy: -142, rx: 48, ry: 45 }`
- からだ：`BODY`（全員共通）、顔の目・口位置：`FACE`（`(-16, -142)`, `(16, -142)`, `(0, -125)`）
- 判定の輪郭（`characters.ts` の `ou.silhouette`）からはみ出さないこと（はみ出し率4%以下、`front-found` は12%以下）
1. `art/characters/ou/back.svg`
2. `art/characters/ou/clothes-mask.svg`（服の領域＝白 `#FFFFFF`）
3. `art/characters/ou/clothes-shade.svg`
4. `art/characters/ou/clothes-line.svg`
5. `art/characters/ou/front.svg`
6. `art/characters/ou/front-found.svg`（笑顔で手を振る）

### ② コース10のシール描き直し 1枚（`art/stickers/`、`viewBox="0 0 120 120"`）
`src/core/stickers.ts` の `c10` が `{ id: 'c10', name: 'おうが きたよ', kind: 'course', need: 10, char: 'ou', motif: 'crown', color: '#F6E3A8' }` になりました。
7. `art/stickers/c10.svg`（既存の `c10.svg` を上書き。白いふちつきの丸いシール、地色 `#F6E3A8` に、新しい友だち「おう」の顔と おうかん モチーフを描く。文字は入れない）

### ③ じぶんの へや：新しいおもちゃ・いきもの 6枚（`art/myroom/items/`、`viewBox="-150 -300 300 300"`）
すべて足もと中央が `(0, 0)`、輪郭線は `#4A3A40`、SVG 内にアニメーション要素（`<animate>` や `@keyframes`）は入れないこと（動きはゲーム側の CSS がつけます）。
※ **既存の `art/myroom/items/star-rug.svg` と `art/myroom/items/music-box.svg` は、古い保存データで既に部屋に置いてある場合の互換表示に引き続き使うため、絶対に削除しないこと。**

- **「つづきの コース」パック追加分（2点）**
8. `art/myroom/items/train-toy.svg`（きしゃの おもちゃ：`genre: 'toy'`, 横幅目安 `w = 140`, `motion: 'walk'`。パステル赤 `#E9785F`・黄色 `#FFD45C`・水色 `#8EC4E6` の木製おもちゃの汽車。煙突にまるい綿のけむり）
9. `art/myroom/items/rocking-horse.svg`（もくば：`genre: 'toy'`, 横幅目安 `w = 160`, `seats: [{ x: 0, y: -64 }]`, `motion: 'sway'`。1人座れるパステル木馬。背中の鞍の中央 `(0, -64)` に友だちの足もとが乗って自然な位置になる高さで描くこと）

- **「きのこの もり」パック追加分（2点）**
10. `art/myroom/items/log-seesaw.svg`（まるたの シーソー：`genre: 'toy'`, 横幅目安 `w = 220`, `seats: [{ x: -58, y: -52 }, { x: 58, y: -52 }]`, `motion: 'sway'`。切り株の支点の上に丸太の板が乗った2人乗りシーソー。左右 `(-58, -52)` と `(58, -52)` に友だち2人が座れる形）
11. `art/myroom/items/acorn-top.svg`（どんぐり ごま：`genre: 'toy'`, 横幅目安 `w = 86`, `motion: 'roll'`。かさ帽子つきの丸くてかわいい木製のどんぐり独楽）

- **「ほたるの かわべ」パック差し替え分（2点）**
12. `art/myroom/items/firefly-jar.svg`（ほたるかご：`genre: 'toy'`, 横幅目安 `w = 100`, `motion: 'bob'`。竹編みの丸いかごの中に、ぽわんと黄色 `#FFE866` に光るほたるが2匹入った置きもの。高さ目安 `130` 程度）
13. `art/myroom/items/goldfish-bowl.svg`（きんぎょの すいそう：`genre: 'animal'`, 横幅目安 `w = 120`, `motion: 'sway'`。丸いガラスの金魚鉢に水草と赤い金魚2匹が仲よく泳ぐ絵。高さ目安 `130` 程度）

### ④ 「ほたるの かわべ」の新しい うごくもの 2枚（`art/movers/`、`viewBox="-150 -300 300 300"`）
`src/core/movers.ts` と `src/ui/moverView.ts` の `BOX` に合わせること（右向きが基準。左へ動くときはゲーム側が反転します）。
14. `art/movers/dragonfly.svg`（とんぼ：範囲目安 `BOX = [-42, -58, 84, 52]`、つまり `x: -42〜42, y: -58〜-6`。透き通った水色 `#D6ECF4` の羽と、水色〜青緑 `#6B9AC4` / `#78B5A8` の体、丸い目のにっこりした夕暮れとんぼ）
15. `art/movers/floating-lantern.svg`（とうろうぶね：範囲目安 `BOX = [-42, -64, 84, 64]`、つまり `x: -42〜42, y: -64〜0`。足もと `(0, 0)` が水面。木の小舟 `#C48E5A` の上に、あたたかい黄色 `#FFF099` に灯る四角い紙灯籠が乗って水面に浮かぶ絵）

### ⑤ 「うみべ」の前景小物レイヤー描き直し 1枚（`art/scenes/beach/fore.svg`、`viewBox="0 0 1000 1000"`）
`src/core/scenes/beach.ts` と `src/core/props-beach.ts` で、重複していた3か所の小物を新しい小物に置き換え、9か所すべて違う小物（9種類）にしました。
16. `art/scenes/beach/fore.svg`（既存の `art/scenes/beach/fore.svg` を更新）
    - 変えない6か所（そのまま残す）：
      - `beach-hut-1` (110, 652)：すなばけつ `sandBucket(110, 594)`
      - `beach-wind-1` (690, 652)：クーラーボックス `cooler(690, 606, 132, 70)`
      - `beach-towel-1` (490, 884)：ビーチボール `ball(490, 870, 52)`
      - `beach-towel-2` (660, 948)：かいがらの やま `shellPile(660, 926)`
      - `beach-towel-3` (830, 884)：うきわ `floatRing(830, 852)`
      - `beach-sand-1` (150, 900)：すなの おしろ `sandcastle(150, 848, 132, 78)`
    - **新しく描き直す3か所（`props-beach.ts` の `shapes` の位置・寸法にピタリと合わせ、各スポットの顔 `y - 142 × s` には絶対に重ねないこと）**：
      - `beach-hut-2` (260, 652, `s = 1`)：**ミニサーフボード `surfboard(258, 616, 74, 40)`**
        - 判定形状：中心 `(258, 616)`, `rx = 74, ry = 40` の横置き楕円（旧 `floatRing(258, 616)` と同じ外周）
        - 色・見た目：黄色 `#FFE082` 地にコーラル `#F28B6B` と白 `#FFFDF6` のライン、水色 `#6BB6C8` の小さなフィンがついた丸みのあるミニサーフボード（ボディボード）
      - `beach-wind-2` (880, 652, `s = 1`)：**フルーツかご `pineappleBasket(880, 600, 132, 78)`**
        - 判定形状：`cx = 880, top = 600, w = 132, h = 78`（台形のかご本体 `y: 626〜678` ＋ 上に並ぶ3つの果物・葉の突起 `cx - 38`, `cx`, `cx + 38`、旧 `sandcastle(880, 600, 132, 78)` と同じ判定枠）
        - 色・見た目：編みかご `#D9A76A` の中に、緑の葉冠 `#6AB578` がついたパイナップル `#F4B942` と、左右にオレンジ `#FF9A76`・黄色 `#FFD166` の南国フルーツが入ったピクニックかご
      - `beach-sand-2` (320, 960, `s = 0.95`)：**しましまビーチバッグ `beachBag(320, 914, 118, 78)`**
        - 判定形状：`cx = 320, top = 914, w = 118, h = 78`（逆台形のバッグ本体 `y: 914〜992` ＋ 上端楕円 `ry = 9` ＋ 上の持ち手アーチ `top - 54`、旧 `sandBucket(320, 914)` と同じ判定枠）
        - 色・見た目：生成り白 `#FFF8EC` と水色 `#72B5D8` の横しまキャンバストートバッグ、コーラル `#F29B7E` のふち、茶色 `#D99B66` の持ち手、中央に黄色い丸ワッペン `#FFD66B`

---

## Claude への連絡（`scripts/validate-art.mjs` について）
- `scripts/validate-art.mjs` はキャラクター一覧を `G.CHARACTER_IDS`（`src/core/characters.ts`）から動的に読み込むため、`ou` はスクリプト変更なしで自動検査されます。
- `art/movers/` と `art/myroom/items/` も `/^[a-z0-9-]+\.svg$/`（`viewBox="-150 -300 300 300"`）で検査されるため、新しい部屋が増えない今回のジョブ（優先度1〜5）では `scripts/validate-art.mjs` の変更は不要です。

---

## 検査と完了条件
1. すべての SVG に `<text>` や `font-family` が含まれていないこと。
2. `npm.cmd run validate:art` を実行し、`art-guides/ART_CHECK.md` でエラーが無いことを確認すること（特に `ou` の6層マスク・はみ出し率、および `beach/fore.svg` の全スポット×全10体の可視率・顔重なり検査）。
3. `art/README.md` のファイル数・一覧を新しい内容に合わせて更新すること。
4. 下の「作業記録」欄に、やったこと・使った方法・検査結果・気づいた点を記入して終えてください。

---

## 作業記録（Codex 記入欄）
- 実施日：
- 作成・更新したファイル：
- 使った方法：
- `validate:art` の結果：
- 気づいた点・提案：
