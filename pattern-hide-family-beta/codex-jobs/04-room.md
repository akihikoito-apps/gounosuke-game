# ジョブ04：へや（シーン）

## 書き込んでよい場所
`art/scenes/room/` と `art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「シーン」/ art-guides/scene-room.png（色面＝柄の領域。ここはゲームが柄を塗るので描かない。橙＝小物の位置、赤い円＝顔、何も重ねない）/ art-guides/current-room-easy.png / art/characters/, art/patterns/（画風の基準）

## やること
- back.png（柄の領域より下：床・壁の上部など）、over.png（柄の領域の上・キャラの後ろ：窓・カーテンレール・戸だな・ソファの縁や陰）、minor.png（壁の絵・時計など、省いてもよい飾り）、fore.png（前景の小物9か所：おもちゃ箱・植木鉢・クッション・ブランケット・積み木・ボール・かご 等）
- 2000×2000px 推奨。小物はガイドの橙色と同じ位置・同じくらいの大きさ
- 背景が細かすぎてさがしにくくならないこと

## 合格条件
- `npm run validate:art` がすべて合格（結果は art-guides/ART_CHECK.md）
- `npm run build` が成功

## 最後に書くこと
`art/README.md` の「作業記録」に追記：日付、作ったファイル、使った方法（SVGをコードで書いた／画像生成を使った 等）、検査結果、できなかったこと・迷った点
