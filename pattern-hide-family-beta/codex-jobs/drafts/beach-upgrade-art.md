# ジョブ（下書き）：追加パック「うみべ」アップグレードの絵（計6点）

## 目的
「うみべ パック（`beach`）」をほかの追加パック（きのこの もり・すいぞくかん・おばけやしき）と同じ6点セットにそろえるため、新しく追加した **じぶんの へやの部屋1枚・もの3個・シール2枚** の SVG を制作する。
※ 既存の背景（`art/scenes/beach-*.svg`）・友だち（`art/characters/choki-*.svg`）・うごくもの（`art/movers/crab.svg`, `seagull.svg`）・シール3枚（`b1.svg`, `b10.svg`, `b30.svg`）・へやの物3個（`shell.svg`, `floatring.svg`, `beachball.svg`）はそのまま活かす。

## 必ず最初に読むファイル
- `AGENTS.md`
- `CODEX_ART_BRIEF.md`（色・線の太さ・頭身・禁止事項）
- `src/core/myroom.ts`（`beach-deck` と `beach-chair` / `shaved-ice` / `hermit-crab` の定義・`w`・`seats`・`motion`）
- `src/core/stickers.ts`（`b5`, `b50` の定義）
- お手本にする既存の絵：
  - `art/scenes/beach-back.svg`, `art/scenes/beach-front.svg`（うみべの空・海・砂浜・海の家のトーン）
  - `art/characters/choki-body.svg`, `art/characters/choki-face.svg`（ちょき の色・形）
  - `art/myroom/items/shell.svg`, `art/myroom/items/floatring.svg`, `art/myroom/items/beachball.svg`（既存のうみべ家具）
  - `art/myroom/rooms/yard.svg`, `art/myroom/rooms/aquarium-room.svg`（パック部屋の奥行き・床の境目）
  - `art/stickers/b1.svg`, `art/stickers/b10.svg`, `art/stickers/b30.svg`（うみべシールの枠・質感）

## 共通ルール
- **SVG のみ**。文字（`<text>` やパス化した文字）は一切入れない。
- `<animate>` / `<set>` / CSS `@keyframes` などのアニメーションは SVG 内に入れない（動きはゲーム側の CSS が付ける）。
- 主線はすべて `#4A3A40`（こげ茶・丸みのある線 `stroke-linecap="round" stroke-linejoin="round"`）。真っ黒 `#000000` や原色は使わない。
- 既存の `beach` 背景・`choki`・他パックの部屋や家具と並べたときに、絵本のような暖かいくすみパステル調で統一されていること。

---

## 1. じぶんの へやの背景（1枚：`art/myroom/rooms/`、`viewBox="0 0 1000 1000"`）

- **`art/myroom/rooms/beach-deck.svg`**（うみべの デッキ）
  - `floorTop: 560`：`y = 560..1000` が友だちや家具を置ける木のウッドデッキの床。`y = 560` にデッキの手すりや段差の境目がはっきり分かるように描く。
  - 奥（`y = 0..560`）：穏やかな夏の空（`#CFE8F5`〜`#FFF6E2`）、きらめく浅瀬の海（`#7EC4DA`〜`#A6DCEB`）、遠くの白い入道雲や小さなヨット、デッキの柱にかけた浮き輪や貝殻ガーランド。
  - 手前の床（`y = 560..1000`）：あたたかい明るめの木目デッキ（`#E8C69E`〜`#D9B084`）。手前に家具や友だちをたくさん置くため、床の上はすっきり開けておく。

---

## 2. じぶんの へやの「もの」（3個：`art/myroom/items/`、`viewBox="-150 -300 300 300"`）

足もと中央が `(0, 0)`。地面に接する部分に薄い楕円の影（`fill="#4A3A40" opacity="0.12"`）を入れる。

1. **`art/myroom/items/beach-chair.svg`**（パラソル ベンチ / パック購入時から使える家具、`w: 260`、`seats: [{ x: -52, y: -58 }, { x: 52, y: -58 }]`）
   - 2人掛けの白い木製ビーチベンチの後ろ（中央）から、コーラルピンク×クリーム白のしましまビーチパラソルが立ち上がっているデザイン。
   - 座面の高さは `y = -58` 付近にそろえ、`(-52, -58)` と `(52, -58)` に友だちが2人並んで座ったときに自然に見えるようにする（パラソルの支柱は真ん中 `x = 0` を通り、傘は `y = -180..-280` の高い位置に開いて友だちの顔と重ならないようにする）。
2. **`art/myroom/items/shaved-ice.svg`**（かきごおりき / シール `b5`、`w: 110`、`motion: 'sway'`）
   - レトロでかわいい水色（`#88C4E0`）の手回し氷削り器と、その下に置かれたカップ入りのいちご＆メロンシロップのかき氷（てっぺんに練乳）。
3. **`art/myroom/items/hermit-crab.svg`**（やどかり / シール `b50`、`w: 96`、`motion: 'walk'`）
   - クリームイエロー〜うすだいだい色の巻貝の殻を背負った、コーラルピンクの小さなヤドカリ。丸い目と小さなハサミで、ちょきと並んでもかわいいデザイン。

---

## 3. シール（2枚：`art/stickers/`、`viewBox="0 0 120 120"`）

既存の `b1.svg` / `b10.svg` / `b30.svg` と同じ白いふち付きの丸いシール（中心 `60, 58`、外円 `r="54"` 白、内円 `r="47"` パステル背景色）。

1. **`art/stickers/b5.svg`**（うみべで 5かい：みみ ＋ かき氷、地の色 `#E2F0CB`）
   - 笑顔の「みみ」と、いちごシロップのかき氷のモチーフ。
2. **`art/stickers/b50.svg`**（うみべで 50かい：ちょき ＋ やどかり、地の色 `#F5DFC6`）
   - うれしそうな「ちょき」と、巻貝に入った小さなヤドカリが並んでいるお祝いシール。

---

## 仕上げと検査
1. 6ファイルすべて作成したら `npm.cmd run validate:art` を実行し、`art-guides/ART_CHECK.md` で **すべて合格** になることを確認する。
2. 作業記録をこのファイルの末尾に追記する。
