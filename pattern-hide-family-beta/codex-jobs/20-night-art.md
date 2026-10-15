# ジョブ20：追加パック「ほたるの かわべ（`night`）」の絵を作る（SVG）

## 目的
旧パックをやめ、ホラー要素ゼロのやさしい夏の夜のステージ **「ほたるの かわべ パック（`night`）」** に切り替えました。
背景・柄・新しい友だち「ひか」・うごくもの・へや「ほたるの えんがわ」・家具・シールの SVG を制作し、あわせて旧パック用の不要な絵ファイルを削除してください。

## 必ず最初に読むもの
1. `AGENTS.md`（ルールと禁止事項）
2. `CODEX_ART_BRIEF.md`（絵柄の統一ルール：輪郭線はすべて `#4A3A40`、文字を入れない、やさしい絵本調）
3. `ART_SLOTS.md`（各スロットの viewBox・中心座標・マスクの決まり）
4. **`strategy/packs/night-spec.md`**（今回の正確な色・多角形座標・小物の位置・友だちの頭の特徴）
5. `src/core/scenes/night.ts` と `src/core/props-night.ts`（コード側の正確な座標定義）
6. お手本にする既存の絵：
   - `art/scenes/forest/`、`art/scenes/aquarium/`（背景4層の分け方）
   - `art/patterns/forest-*.svg`、`art/patterns/aquarium-*.svg`（シームレス柄タイル）
   - `art/characters/pino/`、`art/characters/puka/`（友だち6層の分け方）
   - `art/movers/squirrel.svg`、`art/movers/jellyfish.svg`（うごくもの）
   - `art/myroom/rooms/yard.svg`、`art/myroom/rooms/beach-deck.svg`（部屋の背景）
   - `art/myroom/items/`（家具・おもちゃ。なお **`star-rug.svg` と `music-box.svg` はそのまま使い回すので削除しないこと**）
   - `art/stickers/f-s1.svg`〜`f-s50.svg`（シール）

## 数値の優先順位
`night-spec.md` とこの依頼書と `src/` のコードで数値が食い違うときは、**`src/` のコード（`night.ts`・`props-night.ts`・`characters.ts`・`peeks.ts`・`myroom.ts`）を正** とする。川の上岸は ゆるい波（`RIVER_POLY`）、のぞき場所の前景は `peeks.ts` の `RIVER_FRONT`・`GRASS_FRONT`。

## 書き込んでよい場所
- `art/` の中だけ（`src/` や `tests/` や `scripts/` は変更しない）

---

## 作るファイル一覧（すべて SVG、合計 25 ファイル）

### ① 柄のタイル 4枚（`art/patterns/`）
正方形、つなぎ目なく上下左右に敷き詰められること。地色・模様色は `night-spec.md` の値に合わせ、友だちの輪郭線 `#4A3A40` が沈まない中間明度を保つこと。
1. `art/patterns/night-plain.svg`（`viewBox="0 0 56 56"`、かわらの いしみち：月あかりの小石の道 `#7E889B` 地に `#909CAE` の丸い小石粒）
2. `art/patterns/night-stripes.svg`（`viewBox="0 0 40 40"`、くさはら：`#4E7A6B` 地に `#82B596` のやさしい縦しま・草の筋）
3. `art/patterns/night-dots.svg`（`viewBox="0 0 52 52"`、かわ：`#4B6E96` 地に `#F2DC8C` の月あかりの水玉）
4. `art/patterns/night-check.svg`（`viewBox="0 0 46 46"`、ござ：`#C8A86B` と `#8C9E6E` のあたたかいチェック柄）

### ② 背景 4層（`art/scenes/night/`、`viewBox="0 0 1000 1000"`）
`src/core/scenes/night.ts` の領域（`GRASS_POLY`, `RIVER_POLY`, `MAT_POLY`）および `src/core/props-night.ts` の9つの小物位置にピタリと合わせること。
5. `art/scenes/night/back.svg`（不透明：`y = 0〜250` の深い紺色の夜空 `#24345A`、`y ≈ 160〜250` の遠くのやさしい山なみ `#32476E`、中心 `(490, 112)` 半径 38 の満月 `#FFF3B0`（まわりに うすい光の輪 r62）、小さな星、`y = 240〜1000` の川原の小石の道の地 `#7E889B`。`night.ts` の `base` と同じ配置）
6. `art/scenes/night/over.svg`（透過：くさはらの ふちの 草の穂先（まるい アーチの形にそって、やわらかい草が ふさふさ）、かわの石岸と水草の縁、ござの縁取りと結び紐。**柄の領域の中を塗りつぶさないこと**）
7. `art/scenes/night/minor.svg`（透過：夜空の小さな星粒やほたるの遠い光粒、川辺の草の飾り）
8. `art/scenes/night/fore.svg`（透過：9つの隠れ場所の前景小物。**位置と大きさは `src/core/props-night.ts` の `shapes`（ガイド）と `night.ts` の `spots` に正確に合わせる**。友だちの顔（各スポットの `y - 142 × s` 付近）には絶対に重ねないこと）
   - `night-grass-1` (136, 584)：ほたるかご `fireflyCage(136, 522, 124, 72)`
   - `night-grass-2` (300, 584)：うちわ `uchiwaFan(300, 524, 134, 70)`
   - `night-river-1` (680, 584)：すいれん `waterlily(680, 526, 136, 68)`
   - `night-river-2` (865, 584)：ささぶね `bambooBoat(865, 526, 136, 68)`
   - `night-mat-1` (476, 922)：すいか `watermelon(476, 902, 76, 40)`
   - `night-mat-2` (654, 928)：はっぱの舟 `leafBoat(654, 904)`
   - `night-mat-3` (830, 922)：たけのベンチ `bambooBenchProp(830, 864, 138, 68)`
   - `night-path-1` (136, 922)：かえるの置きもの `frogStatue(136, 864, 134, 70)`
   - `night-path-2` (300, 928)：ちょうちん `paperLanternProp(300, 872, 126, 68)`

### ③ 新しい友だち「ひか」（`art/characters/hika/`、`viewBox="-90 -225 180 240"`）
`src/core/characters.ts` の `CHARACTERS.hika` の輪郭に合わせること。
- 肌の色：`#EAF5D8`（明るい若草クリーム色）
- 頭頂のぽわんと光るしずく：中心 `(0, -195)`, `rx = 12, ry = 14`（`#FFF099`、まわりに ごく うすい光）
- 左右のまるいはっぱの耳：中心 `(±52, -168)`, `rx = 19, ry = 12`, 傾き 左 `+20°`・右 `-20°`（`characters.ts` の `rotEllipse` と同じ。`#88C88E`、内側の葉脈 `#C8ECC8`）
- 判定の輪郭（`characters.ts` の `hika.silhouette`）からはみ出さないこと（はみ出し率4%以下）
9. `art/characters/hika/back.svg`
10. `art/characters/hika/clothes-mask.svg`（服の領域＝白 `#FFFFFF`）
11. `art/characters/hika/clothes-shade.svg`
12. `art/characters/hika/clothes-line.svg`
13. `art/characters/hika/front.svg`
14. `art/characters/hika/front-found.svg`（笑顔で手を振る）

### ④ うごくもの 2枚（`art/movers/`、`viewBox="-150 -300 300 300"`）
15. `art/movers/firefly.svg`（ぽわんと光る黄色の丸いお尻と若草色の体のほたるが2匹、ふわふわ飛ぶ絵。範囲目安 `x: -36〜36, y: -72〜-12`）
16. `art/movers/frog.svg`（足もと `(0, 0)`。にっこり笑う若草色の丸いかえる。範囲目安 `x: -42〜42, y: -56〜0`）

### ⑤ じぶんの へや：新部屋1枚＋新しい物4枚（`art/myroom/`）
※ `star-rug.svg` と `music-box.svg` は既存のファイルをそのまま残して使います。
17. `art/myroom/rooms/veranda.svg`（`viewBox="0 0 1000 1000"`。ほたるの えんがわ：`y = 560` が床の上端。奥の開いた木の縁側から満月とほたるの川べりが見え、手前は木の縁側板と畳・ござのあたたかい床）
18. `art/myroom/items/engawa-bench.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 280`、2人座れる木製の縁台ベンチ）
19. `art/myroom/items/paper-lantern.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 96`、高さ `160` 程度、木のスタンドから下がるやさしい灯りの丸ちょうちん）
20. `art/myroom/items/bamboo-chair.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 160`、1人座れる丸みのある竹編みのゆりいす）
21. `art/myroom/items/frog-plush.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 100`、にっこり笑う若草色のかえるのぬいぐるみ）

### ⑥ ごほうびシール 5枚（`art/stickers/`、`viewBox="0 0 120 120"`）
白いふちつきの丸いシールに、友だちの顔とモチーフを描くこと（文字は入れない）。
22. `art/stickers/n-s1.svg`（ひか ＋ ほたる、地色 `#DCE8D8`）
23. `art/stickers/n-s5.svg`（ころ ＋ ちょうちん、地色 `#F5E6C8`）
24. `art/stickers/n-s15.svg`（ひか ＋ かえる、地色 `#D4EBD8`）
25. `art/stickers/n-s30.svg`（もこ ＋ とんぼ、地色 `#D8E4F4`）
26. `art/stickers/n-s50.svg`（ひか ＋ おつきさま、地色 `#F6EAB8`）

---

## 削除する古い絵ファイル（重要）
以下の旧パック用の絵ファイルは削除してください（**`star-rug.svg` と `music-box.svg` は引き続き使うので削除しないこと**）：
- `art/scenes/haunted/` フォルダごと（`back.svg`, `over.svg`, `minor.svg`, `fore.svg`）
- `art/patterns/haunted-plain.svg`, `haunted-stripes.svg`, `haunted-dots.svg`, `haunted-check.svg`
- `art/characters/fuwa/` フォルダごと（6枚）
- `art/movers/bat.svg`, `art/movers/candle.svg`, `art/movers/ghost.svg`
- `art/myroom/rooms/attic.svg`
- `art/myroom/items/gothic-sofa.svg`, `pumpkin-lantern.svg`, `ghost-chair.svg`, `ghost-plush.svg`
- `art/stickers/h-s1.svg`, `h-s5.svg`, `h-s15.svg`, `h-s30.svg`, `h-s50.svg`

あわせて、`art/README.md`（および `art/` 内の目録があれば）の記述も新しい「ほたるの かわべ（`night` / `hika` / `veranda`）」に更新してください（リポジトリ直下の `ASSET_MANIFEST.md` への反映提案も作業記録に書いてください）。

---

## 検査と完了条件
1. すべての SVG に `<text>` や文字が含まれていないこと。
2. `npm.cmd run validate:art` を実行し、`art-guides/ART_CHECK.md` でエラーが無いことを確認すること（もし `scripts/validate-art.mjs` の部屋名リスト等でスクリプト側の更新が必要な箇所があれば、無理に `scripts/` を書き換えず作業記録に報告してください）。
3. 下の「作業記録」欄に、やったこと・使った方法・検査結果・気づいた点を記入して終えてください。

---

## 作業記録（Codex 記入欄）
- 実施日：
- 作成・削除したファイル：
- 使った方法：
- `validate:art` の結果：
- 気づいた点・提案：
