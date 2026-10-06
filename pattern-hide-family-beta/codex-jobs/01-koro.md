# ジョブ01：ころ（画風の基準）

## 書き込んでよい場所
`art/characters/koro/` と `art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「キャラクター」/ CODEX_ART_BRIEF.md の「絵の方向性」/ art-guides/character-koro.png（今の絵が薄く入った下書き。青＝服、赤点＝目と口、橙点線＝はみ出し上限）/ art-guides/current-*.png（今の画面）

## やること
- ころ を、絵本の挿絵のような品のある画風で描き直す。この絵が以後の全ての絵の画風の基準になる
- 層：back, clothes-mask（必須）, clothes-shade, clothes-line, front（必須）, front-found（手をふる）
- 450×600px（または 900×1200px）、透過PNG（またはSVG）。足もと中央の位置・顔の位置はガイドに合わせる
- 特徴（あたまの「くるん」とした毛、アプリコット色、げんきでくいしんぼう）を保つ

## 合格条件
- `npm run validate:art` がすべて合格（結果は art-guides/ART_CHECK.md）
- `npm run build` が成功

## 最後に書くこと
`art/README.md` の「作業記録」に追記：日付、作ったファイル、使った方法（SVGをコードで書いた／画像生成を使った 等）、検査結果、できなかったこと・迷った点
