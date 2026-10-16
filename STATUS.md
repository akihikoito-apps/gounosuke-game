# STATUS — ごうのすけゲーム

状態: 🟢 順調
今やっていること: v6.61 オリジナルの間の修正（削除確認・日本語化・形20種・攻撃モーションを明確化）（10/16）
次の一手: 再度触ってもらう。残る調整候補はバーの上限（体力40000/攻撃4000）と つよさのめやす の体感、パーツの追加
ブロッカー: なし（node 実行可。tests/ 6本=79件すべて実行して ok）
最終更新: 2026-10-16（Claude）

<!-- 上の5行は本部（_hq）が読む。行の頭の言葉は変えないこと。詳しいメモはこの下に自由に書いてよい。 -->

## v6.53〜6.55 の不具合（重要・修正済み）
- 症状: タイトルで「はじめる」を押しても画面が変わらない。以降すべての画面遷移が動かない。
- 原因: `js/main.js` の `show()` が `$$('.screen').forEach(...)` だったものが `$('.screen').forEach(...)` に変わっていた。`$` は querySelector（1件）なので forEach が無く TypeError。
- 混入経路: v6.53 の作業で使ったパッチスクリプトが `String.replace(a, b)` を使っており、置換文字列の `$$` が「$ 1個」として解釈された（JS の置換パターン仕様）。
- 対策: パッチ用 `sub()` は `replace(a, () => b)` に変更。さらに `tests/selectors.test.js` を追加して、`$(...)` に forEach/map 等を繋いでいないか・`show()` が `$$` を使っているか・main.js が参照する id が index.html に存在するか・main.js と sw.js のバージョンが揃っているかを自動チェックするようにした。

## テスト（すべて node で実行、2026-10-16）
- `node tests/gear.test.js` 17件 ok（装備品の定義・ステータス反映・UNITS 非破壊・vs/pierce/guard の戦闘内挙動・開放条件）
- `node tests/gimmicks.test.js` 10件 ok
- `node tests/minigame2.test.js` 19件 ok（RUNGAME/TATAKI/MEMORY の整合・3種目とも余韻がある・③が毎回順番を作り直している・新画面とボタンの存在・1人用/2人用の振り分け）
- `node tests/original.test.js` 17件 ok（素材カタログの整合・43背景すべてに日本語名・形15種以上・パーツ全組み合わせの描画・とくこうかが engine の項目に落ちる・5画面の存在・削除は3種とも確認を通す・オリジナルは報酬0で図鑑も汚さない・三番勝負が3種目を回す）
- `node tests/selectors.test.js` 5件 ok
- `node tests/sound.test.js` 11件 ok
- 画面操作の通しテスト（jsdom、scratchpad の uitest.js）: タイトル→庭→開発室→開発→装備→編成表示→外す まで全 ok
- 2人用の通しテスト（scratchpad の runtest.js / vstest.js）: 3種目すべて、名前入力→1Pが全部→交代→2P→余韻→結果→もういちど まで全 ok。余韻が結果より先に来ることも計測で確認（3.5秒）
- 全コース描画・ロジックの通しテスト（scratchpad の rt.js）: 130コース・描画 12,574回 エラーなし

## 本部の作業記録
- 2026-10-16 Claude: v6.61 本人の指摘4点を修正。(1) × が即削除だったので askOrigDelete() による確認モーダル（#orig-del、#app 直下に1つ置いて全画面から使う）を追加。使用中のものは従来どおり確認前に拒否。(2) ステージ作成の既存背景がローマ字キー表示だったので BG_NAME（43件）と bgNameOf() を追加。(3) からだの形を 7→20（極端な形も: wide/thin/tri/hex/spiky/jelly/mush/tower/heart/crescent/snake/cross/cloudb）、て 6→9、あし 5→7。(4) 攻撃モーションを明確化：ふりかぶりの引きを大きくし、drawFoeParts の最後に fx レイヤ（punch/charge の衝撃光、bite の大あご、spin の回転弧、shoot の弾の成長と発射、stomp の地面の輪）を追加。
- 2026-10-16 Claude: v6.60 オリジナルの間。data.js に BG_PARTS/FOE_PARTS/FOE_COLORS/FOE_MOTION/FOE_STATS/FOE_EXTRAS/ORIG を追加、draw.js に drawFoeParts()+registerFoeDrawer() を追加（パーツ44種×色12×動き6×6をすべて描画テスト済み）。engine 側は3点だけ触った：Game.foeDef() で ENEMIES と Game.extraEnemies を見るように、currentBg() が stage.bgData を優先、start() で orig 以外は extraEnemies を破棄。保存は s.orig = {bgs,foes,stages,seq}。オリジナルステージは reward 0・ENEMIES に登録しない・recordSeen で弾くので、育成バランスと図鑑に影響しない。あわせて三番勝負（screen-match の成績表に戻ってくる方式）。
- 2026-10-16 Claude: v6.59 ③じゅんばん おぼえ の難易度修正。mmNewRound が MM.seq.push で前の続きに1つ足していたため、覚えた分がそのまま使えて実質「新しい1つだけ」の勝負になっており、本人と幸之助君の両方が満点（12）だった。mmMakeSeq(n) を追加して毎ステージ全部作り直す形に。同じパネルが2回連続しないようにもした（間の暗い時間が短く見分けづらいため）。検証は scratchpad/memtest.js — パネルごとの効果音の呼び出しを横取りして光った順番を外から読み取り、その通りに押して8ステージ進め、7回の遷移すべてが「前の続きではない」ことを確認。
- 2026-10-16 Claude: v6.58 2人用を3種目に。②むしむし たたき（6つの穴・15秒・キンキラ+3／なかま-1・終盤ほど出ている時間が短い）、③じゅんばん おぼえ（4パネルのサイモン・間違えるまでの段数が点数・最大12）。あわせて3種目すべてに「勝ちの余韻」phase 'cheer' を入れ、紙吹雪＋新SE fanfare＋タンクンのジャンプを 2.6秒 見せてから結果ウィンドウを出すようにした。共通処理は vsDrawCheer / vsDrawHandoff / vsFillOver / vsMakeConfetti に集約。次は「三番勝負」モードを足しやすい形にしてある（各種目が names と scores[2] を持つだけ）。
- 2026-10-16 Claude: v6.57 ミニゲームを「ひとりで あそぶ／ふたりで たいけつ」に分割（screen-minimode を追加、既存3つは MINIGAMES のまま1人用へ）。2人用に「タンクン かけっこ たいけつ」を追加（screen-vsname で名前入力・s.vsNames に保存、screen-run でメーター停止→3回まとめて交代→2体のタンクンが並走して結果）。数値は data.js の RUNGAME に集約。叩き台なので本人の感触待ち。
- 2026-10-14 Claude: v6.56 ごうのすけの かいはつしつ（にわの奥・受付ネコソ）。装備品16種、そうびのもと（ふしぎ遊園地7コース目クリアで1つ＋ネコソが1日1つ）、装備の戦闘反映（hp/atk/speed/range/kb/recharge/cost/vs/guard/crit/pierce）。あわせて v6.53〜6.55 の画面遷移バグを修正し、再発防止の自動チェックを追加。
- 2026-10-07 Claude: 天気（てんきだま含む）と動く床のチェック10件を入れた tests/gimmicks.test.js を追加したが、node の実行が許可されず未実行のまま。→ 10/14 に実行して10件 ok を確認。
- 2026-10-07 Claude: tests/sound.test.js を追加（にせ AudioContext で鳴った音の数を数える方式）。確かめる内容：AudioContext がない環境・最初のタップ前でもエラーにならず鳴らない／主な効果音24種とゲーム内で呼んでいる名前がすべて鳴る／知らない名前は無視／効果音オフ・BGMオフでは鳴らず予約もしない／最初のタップで目覚めて頼まれていた BGM が流れる。→ 10/14 に実行して11件 ok を確認。
