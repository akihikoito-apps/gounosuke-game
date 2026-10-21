# ジョブ22：追加パック「きょうりゅうの たに（`dino`）」の絵を作る（SVG）

## 目的
恐竜たちが4〜5体、画面の中をのっしのっし・ふわふわ動き続ける中でかくれんぼをする新パック **「きょうりゅうの たに パック（`dino`）」** の絵一式を制作します。
3〜6歳向けに **こわくない恐竜（にっこり顔・まあるい体・パステルアースカラー。とがった牙や爪・ほえる演出・ホラー要素は一切なし）** で統一してください。
また、動く恐竜たちの体にも友だちの服と同じ柄（水玉・しま・チェック・無地）を取り入れ、「恐竜の模様と友だちの服の模様を見比べる」楽しさを作ります。

## 必ず最初に読むもの
1. `AGENTS.md`（ルールと禁止事項）
2. `CODEX_ART_BRIEF.md`（絵柄の統一ルール：輪郭線はすべて `#4A3A40`、文字を入れない、やさしい絵本調）
3. `ART_SLOTS.md`（各スロットの viewBox・中心座標・マスクの決まり）
4. **`strategy/packs/dino-spec.md`**（今回の正確な色・多角形座標・小物の位置・恐竜5体・友だち「がお」の頭の特徴）
5. `src/core/scenes/dino.ts` と `src/core/props-dino.ts`（コード側の正確な座標定義）
6. お手本にする既存の絵：
   - `art/scenes/aquarium/`、`art/scenes/forest/`、`art/scenes/night/`（背景4層の分け方。とくに `CLIFF_POLY`・`FERN_POLY`・`NEST_POLY` の外形は `aquarium` の大水槽・クラゲドーム・マットと同座標）
   - `art/patterns/aquarium-*.svg`、`art/patterns/forest-*.svg`（シームレス柄タイル）
   - `art/characters/puka/`、`art/characters/hika/`（友だち6層の分け方）
   - `art/movers/squirrel.svg`、`art/movers/frog.svg`（うごくもの）
   - `art/myroom/rooms/yard.svg`、`art/myroom/rooms/aquarium-room.svg`（部屋の背景）
   - `art/myroom/items/`（家具・おもちゃ）
   - `art/stickers/a-s1.svg`〜`a-s50.svg`、`art/stickers/n-s1.svg`〜`n-s50.svg`（シール）

## 数値の優先順位
`dino-spec.md` とこの依頼書と `src/` のコードで数値が食い違うときは、**`src/` のコード（`dino.ts`・`props-dino.ts`・`characters.ts`・`peeks.ts`・`movers.ts`・`myroom.ts`・`stickers.ts`）を正** とする。のぞき場所の前景は `peeks.ts` の `CLIFF_FRONT`・`FERN_FRONT`。

## 書き込んでよい場所
- `art/` の中だけ（`src/` や `tests/` や `scripts/` は変更しない）

---

## 作るファイル一覧（すべて SVG、合計 32 ファイル）

### ① 柄のタイル 4枚（`art/patterns/`）
正方形、つなぎ目なく上下左右に敷き詰められること。地色・模様色は `src/core/scenes/dino.ts` の値に合わせ、友だちの輪郭線 `#4A3A40` が沈まない明るい中間明度を保つこと。
1. `art/patterns/dino-plain.svg`（`viewBox="0 0 40 40"`、すなの たにぞこ：あたたかい砂色の地 `#E8D5B5` に、わずかな砂粒・丸い小石の質感）
2. `art/patterns/dino-stripes.svg`（`viewBox="0 0 40 40"`、ちそうの がけ：`#F4E4CE` 地に `#D99B78` のあたたかいテラコッタ色の地層しま模様）
3. `art/patterns/dino-dots.svg`（`viewBox="0 0 44 44"`、シダの しげみ：`#78B888` 地に `#FFF4C8` の明るいクリーム色の水玉・胞子模様）
4. `art/patterns/dino-check.svg`（`viewBox="0 0 48 48"`、たまごの す：`#FFF6E8` と `#98C686` の草編みギンガムチェック柄）

### ② 背景 4層（`art/scenes/dino/`、`viewBox="0 0 1000 1000"`）
`src/core/scenes/dino.ts` の領域（`CLIFF_POLY`, `FERN_POLY`, `NEST_POLY`）および `src/core/props-dino.ts` の9つの小物位置にピタリと合わせること。
5. `art/scenes/dino/back.svg`（不透明：`y = 0〜470` のあたたかいクリーム色の空 `#FFF3D6`、遠くのテーブルマウンテン `#E6C6A0`、中央奥のまあるいぽかぽか火山 `#C89678`・`#F4A27E` と白い湯気雲、右上の太陽 `(840, 108)`、`y = 460〜1000` の砂の谷底の地 `#E8D5B5`。`dino.ts` の `base` と同じ配置）
6. `art/scenes/dino/over.svg`（透過：左の赤土の地層がけ `CLIFF_POLY` のアーチ枠と岩の台座 `#B67856`、右のシダジャングル `FERN_POLY` のくるくる巻いたシダ葉の縁と台座 `#4E9464`、たまごの巣マット `NEST_POLY` の編み草の縁、中央通路のあしあと飛び石 `(460, 690)`・`(530, 725)`。**柄の領域の中を塗りつぶさないこと**）
7. `art/scenes/dino/minor.svg`（透過：空に浮かぶふわふわの白い綿毛・雲粒）
8. `art/scenes/dino/fore.svg`（透過：9つの隠れ場所の前景小物。**位置と大きさは `src/core/props-dino.ts` の `shapes`（ガイド）と `dino.ts` の `spots` に正確に合わせる**。友だちの顔（各スポットの `y - 142 × s` 付近）には絶対に重ねないこと）
   - `dino-cliff-1` (112, 652)：アンモナイトの化石岩 `ammoniteRock(112, 590, 124, 72)`
   - `dino-cliff-2` (276, 652)：まるい骨のトンネル岩 `ribArch(276, 592, 134, 70)`
   - `dino-fern-1` (680, 652)：ソテツのきりかぶ `cycadStump(680, 594, 136, 68)`
   - `dino-fern-2` (865, 652)：ぽこぽこ間欠泉の岩場 `geyserPool(865, 594, 136, 68)`
   - `dino-nest-1` (476, 884)：大きな水玉たまご `spottedEgg(476, 864, 76, 40)`
   - `dino-nest-2` (650, 948)：われたたまごのから `eggShells(650, 924)`
   - `dino-nest-3` (830, 884)：シダの葉クッション `fernCushion(830, 826, 138, 68)`
   - `dino-valley-1` (135, 896)：あしあと化石の石 `footprintStone(135, 838, 134, 70)`
   - `dino-valley-2` (300, 956)：たんけん木箱 `explorerCrate(300, 900, 126, 68)`

### ③ 新しい友だち「がお」（`art/characters/gao/`、`viewBox="-90 -225 180 240"`）
`src/core/characters.ts` の `CHARACTERS.gao` の輪郭に合わせること。
- 肌の色：`#C8E6B8`（パステルピスタチオグリーン）
- 頭のふちに並んだ5つのまあるい「せびれプレート」（とがったトゲではなく、丸い花びら・水滴形。色 `#F2A868`、内側ハイライト `#FFE29A`、輪郭線 `#4A3A40`）：
  1. てっぺん中央：中心 `(0, -196)`, `rx = 11, ry = 15`, 傾き `0°`
  2. 左上：中心 `(-28, -188)`, `rx = 10, ry = 14`, 傾き `-28°`
  3. 右上：中心 `(28, -188)`, `rx = 10, ry = 14`, 傾き `+28°`
  4. 左横：中心 `(-50, -166)`, `rx = 9, ry = 12`, 傾き `-55°`
  5. 右横：中心 `(50, -166)`, `rx = 9, ry = 12`, 傾き `+55°`
- 判定の輪郭（`characters.ts` の `gao.silhouette`）からはみ出さないこと（はみ出し率4%以下）
9. `art/characters/gao/back.svg`
10. `art/characters/gao/clothes-mask.svg`（服の領域＝白 `#FFFFFF`）
11. `art/characters/gao/clothes-shade.svg`
12. `art/characters/gao/clothes-line.svg`
13. `art/characters/gao/front.svg`
14. `art/characters/gao/front-found.svg`（笑顔で手を振る）

### ④ うごく恐竜 5枚（`art/movers/`、`viewBox="-150 -300 300 300"`）
すべて **右向き**（移動方向で自動反転）、足もと中央が `(0, 0)`。**にっこり笑顔・丸い体・牙や鋭い爪なし**。体の模様をステージの柄（水玉・しま・チェック・無地）とそろえること。`src/ui/moverView.ts` の `BOX` の範囲に収めること。
15. `art/movers/brachio.svg`（くびながりゅう：やさしい緑 `#78B888` のまあるい胴体にクリーム色 `#FFF4C8` の大きな **水玉（dots）** 模様。長い首を伸ばしてにっこり笑う。範囲目安 `x: -90〜90, y: -162〜-2`）
16. `art/movers/pteranodon.svg`（よくりゅう：クリーム `#F4E4CE` とテラコッタ `#D99B78` の **しま（stripes）** 模様のまあるい翼でふわふわ飛ぶ。丸いくちばしで笑う。範囲目安 `x: -74〜74, y: -92〜-6`）
17. `art/movers/tricera.svg`（つのりゅう：大きなまあるいエリマキと背中に `#F4E4CE` × `#D99B78` の **しま（stripes）** 模様。先が丸い小さな3本のつの `#FFF6E8`。範囲目安 `x: -80〜80, y: -108〜-2`）
18. `art/movers/stegosaur.svg`（せびれりゅう：まあるい背中に `#FFF6E8` × `#98C686` の **チェック（check）** 模様、背中の上にオレンジ `#F2A868` の丸い花びら形の背びれプレートが並ぶ。範囲目安 `x: -82〜82, y: -112〜-2`）
19. `art/movers/mini-raptor.svg`（ちびきょうりゅう：パステルグリーン `#A8D898` のまるい体に、ギザギザに割れた白い **たまごの殻パンツ** `#FFF6E8` をはいてよちよち走る赤ちゃん恐竜。範囲目安 `x: -58〜58, y: -90〜-2`。`じぶんの へや` の `baby-dino` とも共用）

### ⑤ じぶんの へや：新部屋1枚＋新しい物7枚（`art/myroom/`）
※ 8つ目のアイテム `baby-dino` は `art/movers/mini-raptor.svg` を自動で共用するため、`art/myroom/items/` への重複作成は不要です。
20. `art/myroom/rooms/dino-land.svg`（`viewBox="0 0 1000 1000"`。きょうりゅうの ひろば：`y = 550` が地面の上端。奥にぽかぽか火山・テーブルマウンテン・大きなシダとソテツの木が見え、手前はあたたかい砂と芝生の広場）
21. `art/myroom/items/egg-sofa.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 270`、座席 `(-56, -58)`・`(56, -58)` に2人座れる、水玉たまごの殻と緑のクッションのふかふかソファ）
22. `art/myroom/items/bone-slide.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 260`、上の踊り場 `(-52, -104)` と下の着地 `(54, -38)` に座れる、まあるい白骨と赤土のすべりだい）
23. `art/myroom/items/footprint-rug.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 290`、床に敷く大きな3本指の恐竜あしあとラグ）
24. `art/myroom/items/dino-egg.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 96`、割れ目から小さな目や葉っぱがのぞく水玉模様のたまご）
25. `art/myroom/items/dino-plush.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 116`、おすわりしたパステルグリーンの恐竜ぬいぐるみ）
26. `art/myroom/items/dino-ride.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 184`、高さ目安 `160`、背中の座席 `(0, -64)` に1人乗れる木製のくびながりゅうロッキング遊具）
27. `art/myroom/items/volcano-lamp.svg`（`viewBox="-150 -300 300 300"`、横幅目安 `w = 120`、高さ目安 `160`、火口からぽわんと光る丸い綿雲が浮かぶ小さな火山ランプ）

### ⑥ ごほうびシール 5枚（`art/stickers/`、`viewBox="0 0 120 120"`）
白いふちつきの丸いシールに、友だちの顔とモチーフを描くこと（文字は入れない）。
28. `art/stickers/d-s1.svg`（がお ＋ 水玉たまご `dino-egg`、地色 `#E2F0D4`）
29. `art/stickers/d-s5.svg`（ころ ＋ きょうりゅうのあしあと `footprint`、地色 `#F4E2C6`）
30. `art/stickers/d-s15.svg`（がお ＋ つのりゅう `tricera`、地色 `#F5D8C8`）
31. `art/stickers/d-s30.svg`（ぽぽ ＋ アンモナイト `ammonite`、地色 `#DCE8F2`）
32. `art/stickers/d-s50.svg`（がお ＋ くびながりゅう `brachio`、地色 `#D6ECD8`）

---

## 目録の更新
`art/README.md` の記述にも「きょうりゅうの たに（`dino` / `gao` / `dino-land`）」の絵一覧を追記してください。

---

## 検査と完了条件
1. すべての SVG に `<text>` や文字が含まれていないこと。
2. 恐竜たちに鋭い牙・爪・怖い表情がないこと。
3. `npm.cmd run validate:art` を実行し、`art-guides/ART_CHECK.md` でエラーが無いことを確認すること（もし `scripts/validate-art.mjs` の部屋名リスト等でスクリプト側の更新が必要な箇所があれば、無理に `scripts/` を書き換えず作業記録に報告してください）。
4. 下の「作業記録」欄に、やったこと・使った方法・検査結果・気づいた点を記入して終えてください。

---

## 作業記録（Codex 記入欄）
- 実施日：
- 作成・削除したファイル：
- 使った方法：
- `validate:art` の結果：
- 気づいた点・提案：
