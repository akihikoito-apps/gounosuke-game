# ジョブ07：ニット帽と傘（コースモード用）

## 書き込んでよい場所
`art/accessories/` と `art/README.md` だけ

## 読むもの
AGENTS.md / ART_SLOTS.md の「帽子・傘」/ CODEX_ART_BRIEF.md の「絵の方向性」/ art-guides/accessory-hat.png・accessory-umbrella.png（青＝形、緑＝傘の棒、赤丸＝顔）/ 今のコードの絵：`src/ui/accessoryArt.ts`（形は `src/core/accessories.ts` と同じ。変更はしない）

## 背景
コースモードで、キャラクターがニット帽をかぶったり傘をさしたりする。今は Claude Code がコードで描いた仮の絵。これを、art/characters/ と同じ絵本の画風で描き直す。
ゲームは mask の白い部分に、**色つき（くすんだ毛糸の色）** か **うしろの背景と同じ柄** を流し込む。背景の柄のときは溶け込むことが大事なので、**陰影や線を強くしすぎない**（服の陰影と同じくらいの控えめさ）。

## やること
- `art/accessories/hat/`：mask（必須）, shade, line, front（任意）。ぼんぼり付きのニット帽。ゴム編みの折り返し・編み目の質感は shade で控えめに。3体の頭（ころのくるん毛・みみの耳の付け根・もこの雲の頭）に自然にかぶさること（ガイドの薄い絵を参照）
- `art/accessories/umbrella/`：mask（必須）, shade, line, back（棒）, front（先の飾り、任意）。骨と布のふくらみは shade と line で
- 600×720px（または 1200×1440px）、透過PNG または SVG。ガイドの位置・形に合わせる
- 顔（赤丸）にはどの層も重ねない。文字を入れない

## 合格条件
- `npm.cmd run validate:art` がすべて合格（結果は art-guides/ART_CHECK.md）

## 最後に書くこと
`art/README.md` の「作業記録」に：作ったファイル、使った方法、検査結果、できなかったこと・迷った点
