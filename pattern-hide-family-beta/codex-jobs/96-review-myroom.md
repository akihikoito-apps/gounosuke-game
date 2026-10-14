# ジョブ96：総合レビュー（つぎの ごほうび・うごくもの・じぶんの へや）

## 書き込んでよい場所
`audit/codex/review-myroom.md` の1ファイルだけ。コード・絵・設定は変更しない（読むのは自由。`npx.cmd tsc --noEmit`、`npm.cmd test` など読むだけのコマンドは可。ネット接続・公開・push はしない）

## 背景
ご本人（持ち主）が iPhone で遊んで出した要望を実装した。ご本人の希望は「クオリティは高く、総合チェックも忘れずに」。遊ぶのは幼い子ども（3〜6歳くらい）。
1. つぎの ごほうびの告知（`src/core/rewards.ts`、`src/ui/app.ts` の upcomingHtml / courseRewardHtml、「を みつけてね」）
2. コースの うごくもの（`src/core/movers.ts`、`src/ui/moverView.ts`、`src/ui/styles.css` の mv-、保護者の切りかえ `src/ui/parent.ts`）
3. じぶんの へや（`src/core/myroom.ts`、`src/ui/myroomView.ts`、`src/storage/schema.ts` の myroom、`src/entitlements/entitlements.ts` の room:）。無料は2部屋まで、ほかは追加パック。シール1枚に もの1つ

## 見るところ（重要な順に）
1. **じぶんの へや の操作**：ドラッグ・タップ・座る・しまう・部屋の切りかえで、物が消える／増える／座った子が宙に浮く／番号（on.idx）がずれる 経路が無いか。マルチタッチ・pointercancel・すばやい連打。保存データの壊れ方（validLayouts）と、パックが外れたときの表示
2. **うごくもの**：顔を長く隠さないか（moverPos とテスト）、タップを さえぎらないか、描き直しで位置が飛ばないか、視差効果を減らす のとき、iOS の WKWebView で CSS の transform（px・transform-box: view-box・変数入りの keyframes）が期待どおり動くか（推測なら推測と書く）
3. **パックの境界**：無料の人に おにわ・追加パックの もの が出ないか（告知・棚・クリア画面）
4. **幼い子にとって**：棚の大きさ、ドラッグのしやすさ、誤操作、意味が分かるか、こわい・危ない表現がないか
5. **性能**：部屋に物が多いとき、うごくものが5つのときの描画の重さ（推測でよい）

## 書き方
`audit/codex/review-myroom.md` に、重要な順に「場所（ファイル:行）・何が起きるか・再現・最小の直し方」。推測は推測と書く。良い点も短く。最後に「すぐ直すべきもの」「あとでよいもの」に分ける
