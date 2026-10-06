# ジョブ03：柄タイル12枚

## 書き込んでよい場所
`art/patterns/` と `art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「柄のタイル」/ src/core/scenes/*.ts の costumes（今の色と size。**読むだけ、変更しない**）/ art/characters/（画風の基準）

## やること
- room-{plain,stripes,dots,check}, garden-{plain,stripes,dots,leaf}, shop-{plain,stripes,dots,check} の12枚
- 正方形・不透明・上下左右がつなぎ目なく続く。256×256px 程度
- 今の色味を基本に、布の織り目・紙の質感・葉脈などの質感を控えめに加える。**同じタイルが背景と服の両方に使われる**ので、服になったときにうるさくならないこと
- 柄の種類（無地・しま・水玉・チェック・葉）が、幼児にもひと目で分かること

## 合格条件
- `npm run validate:art` がすべて合格（結果は art-guides/ART_CHECK.md）
- `npm run build` が成功

## 最後に書くこと
`art/README.md` の「作業記録」に追記：日付、作ったファイル、使った方法（SVGをコードで書いた／画像生成を使った 等）、検査結果、できなかったこと・迷った点
