# ジョブ12：うみべの友だち「ちょき」と、うみべのシール3枚

## 書き込んでよい場所
`art/characters/choki/`、`art/stickers/b1.*`・`b10.*`・`b30.*`、`art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「キャラクター」「シール」/ CODEX_ART_BRIEF.md の「絵の方向性」/ art-guides/character-choki.png / 先に作った art/characters/ と art/stickers/（同じ画風・同じシールの作り）/ `src/core/stickers.ts` の b1・b10・b30（変更はしない）

## やること
- `art/characters/choki/`：ちょき＝カニの子。**頭の両わきに、上に上げた はさみ**（ガイドの橙点線の内側。小さく丸みのある はさみで、怖くない）、くすんだコーラル（目安 #E9A797）。ほがらかで よこあるきが とくい。顔は他の5体と同じ位置・同じ作り（目・ほお・口）
  - 層：back, clothes-mask（必須）, clothes-shade, clothes-line, front（必須）, front-found（手をふる）。450×600px
  - 既存の有名なカニのキャラクターに似せない
- `art/stickers/`：b1「ちょきが きたよ」（ちょき＋貝がら）、b10「うみべで 10かい」（ころ＋浮き輪）、b30「うみべで 30かい」（ちょき＋ほし、少し特別感）。480×480、既存のシールと同じ作り

## 合格条件
- `npm.cmd run validate:art` がすべて合格

## 最後に書くこと
`art/README.md` の「作業記録」に：作ったファイル、使った方法、検査結果、迷った点
