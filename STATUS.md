# STATUS — ごうのすけゲーム

状態: 🟢 順調
今やっていること: v6.57 ミニゲームを1人用/2人用に分割し、2人用「タンクン かけっこ たいけつ」を叩き台として実装（10/16）
次の一手: 本人に遊んでもらって、メーターの速さ・回数・距離の出かたの感触を聞いて調整する
ブロッカー: なし（node 実行可。tests/ 5本=54件すべて実行して ok）
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
- `node tests/minigame2.test.js` 11件 ok（RUNGAME の整合・新画面とボタンの存在・1人用/2人用の振り分け）
- `node tests/selectors.test.js` 5件 ok
- `node tests/sound.test.js` 11件 ok
- 画面操作の通しテスト（jsdom、scratchpad の uitest.js）: タイトル→庭→開発室→開発→装備→編成表示→外す まで全 ok
- 全コース描画・ロジックの通しテスト（scratchpad の rt.js）: 130コース・描画 12,574回 エラーなし

## 本部の作業記録
- 2026-10-16 Claude: v6.57 ミニゲームを「ひとりで あそぶ／ふたりで たいけつ」に分割（screen-minimode を追加、既存3つは MINIGAMES のまま1人用へ）。2人用に「タンクン かけっこ たいけつ」を追加（screen-vsname で名前入力・s.vsNames に保存、screen-run でメーター停止→3回まとめて交代→2体のタンクンが並走して結果）。数値は data.js の RUNGAME に集約。叩き台なので本人の感触待ち。
- 2026-10-14 Claude: v6.56 ごうのすけの かいはつしつ（にわの奥・受付ネコソ）。装備品16種、そうびのもと（ふしぎ遊園地7コース目クリアで1つ＋ネコソが1日1つ）、装備の戦闘反映（hp/atk/speed/range/kb/recharge/cost/vs/guard/crit/pierce）。あわせて v6.53〜6.55 の画面遷移バグを修正し、再発防止の自動チェックを追加。
- 2026-10-07 Claude: 天気（てんきだま含む）と動く床のチェック10件を入れた tests/gimmicks.test.js を追加したが、node の実行が許可されず未実行のまま。→ 10/14 に実行して10件 ok を確認。
- 2026-10-07 Claude: tests/sound.test.js を追加（にせ AudioContext で鳴った音の数を数える方式）。確かめる内容：AudioContext がない環境・最初のタップ前でもエラーにならず鳴らない／主な効果音24種とゲーム内で呼んでいる名前がすべて鳴る／知らない名前は無視／効果音オフ・BGMオフでは鳴らず予約もしない／最初のタップで目覚めて頼まれていた BGM が流れる。→ 10/14 に実行して11件 ok を確認。
