# Claude Code 向け：このプロジェクトの進め方

「もようのかくれんぼ（仮）」家族内テスト用Webベータ。**発売まで続くプロジェクト**です。最初の指示書の禁止事項（公開・課金・既存プロジェクトの変更・OS設定・管理者権限・公開トンネル・子どもの個人情報）は引き続き有効です。概要は README.md / OWNER_REVIEW.md / KNOWN_LIMITATIONS.md。

## 役割
- **Claude Code（あなた）**：司令塔。作業分割・統合・テスト・画面確認・最終報告。`art/` 以外を編集する
- **Codex**：絵の制作（`art/` だけ）と、重要部分の独立レビュー（`audit/codex/` にレポート）。本人がいちいち頼まなくても、**あなたが Codex を呼び出して進める**
- 同じファイルを同時に2つのAIで編集しない

## Codex の呼び出し方（スキル `codex-art` も参照）
1. 初回だけ：`audit/logs/home-setup.txt` と `audit/logs/codex-help.txt` を読む。`codex.config.json` の `args` が、help に実在するオプションだけで「このフォルダ内に書き込める非対話の実行」になっているか確認し、必要なら直して `"verified": true` にする。**help に無いオプションを推測で書かない。** 分からなければ本人に確認する
2. `codex-jobs/QUEUE.md` の先頭の未完了ジョブを選ぶ
3. `node scripts/codex/run-job.mjs codex-jobs/<ジョブ>.md` を実行（Codex が動き、ログが audit/codex/ に残る。許可外の変更があれば失敗になる）
4. `npm run validate:art` → 不合格なら `codex-jobs/fix-validation.md` で直させる（最大3回）
5. `npm run build` → `npx vite preview` を起動して `node scripts/capture.mjs` で画面写真 → 自分の目で確認（方向性：CODEX_ART_BRIEF.md「絵の方向性」。安っぽくないか・柄で隠れる仕組みが保たれているか・既存作品に似ていないか）
6. 直したい点があれば `codex-jobs/feedback.md` に具体的に書いて再実行（最大2回）
7. `npm test` と `npm run test:e2e` が通ったら、そのジョブの成果をコミットし、`claude/pattern-hide-family-beta` に push してよい（本人承認済み）。**main には絶対に入れない**（GitHub Pages で一般公開されるため）
8. QUEUE.md を更新し、ASSET_MANIFEST.md に絵の由来を追記。本人には、スマホで見やすい短い報告と画面写真（SendUserFile が使えれば送る）

## 止まって本人に聞くこと
- Codex の利用上限・課金・ログインの表示が出た／OPENAI_API_KEY を使う必要が出た
- Codex が許可外のファイルを変更した（勝手に戻さず、内容を報告）
- 公開・課金・権限追加・設定変更が必要になった
- 絵の方向性を大きく変える判断

## よく使うコマンド
`npm test` / `npm run test:e2e` / `npm run build` / `npm run validate:art` / `npm run art:guides` / `node scripts/capture.mjs`（preview 起動中に）
