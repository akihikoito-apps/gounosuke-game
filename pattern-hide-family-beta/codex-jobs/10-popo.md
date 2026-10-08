# ジョブ10：新しい友だち「ぽぽ」と、コース5のシール

## 書き込んでよい場所
`art/characters/popo/`、`art/stickers/c5.*`、`art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「キャラクター」「シール」/ CODEX_ART_BRIEF.md の「絵の方向性」/ art-guides/character-popo.png / 先に作った art/characters/（同じ画風）と art/stickers/（同じシールの作り）/ `src/core/stickers.ts` の c5

## 背景
ご本人の希望で「最初のコースクリアで友だちが増える」ことになり、にゃこはコース1で仲間に、コース5では5体目の **ぽぽ** が仲間になる。コース5のシールは「ぽぽが きたよ」に変わった（以前の c5.svg は削除済み）。

## やること
- `art/characters/popo/`：ぽぽ＝**頭の上の まあるい みみ**（内側は淡いピンク）、くすんだローズ（目安 #E6C3BE）、明るい口まわり、小さな鼻。やさしくて ちからもち。子ぐま風だが既存の有名なくまのキャラクターに似せない
  - 層：back, clothes-mask（必須）, clothes-shade, clothes-line, front（必須）, front-found。450×600px、ガイドに合わせる
- `art/stickers/c5`：ぽぽがプレゼントを抱えたシール（地の色 #F2DCD8）。ほかのシールと同じ作り・大きさ（480×480）

## 合格条件
- `npm.cmd run validate:art` がすべて合格

## 最後に書くこと
`art/README.md` の「作業記録」に：作ったファイル、使った方法、検査結果、迷った点
