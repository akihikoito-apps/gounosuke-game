---
name: codex-art
description: Codex に絵の制作や独立レビューを依頼し、検査・画面確認・修正依頼・コミットまで回す手順。「Codexに絵を作らせて」「次の絵を進めて」「Codexでレビュー」などのときに使う。
---

# Codex 連携の手順

前提：このフォルダ（pattern-hide-family-beta）で Claude Code が動いていること。Codex CLI が導入・ログイン済みであること（`audit/logs/home-setup.txt`）。

## 0. 初回確認（1回だけ）
- `audit/logs/codex-help.txt` を読み、`codex.config.json` の `args` を、実在するオプションだけで「非対話・このフォルダに書き込み可」に合わせる。推測で書かない。合わせたら `"verified": true`
- `"verified": false` のままなら、まず本人に help の内容を見せて確認する

## 1. ジョブを選ぶ
`codex-jobs/QUEUE.md` の先頭の `[ ]` を選ぶ。本人から別の依頼があれば、`codex-jobs/_template.md` をもとに新しいジョブファイルを作ってキューに足す。

## 2. 実行
```
node scripts/codex/run-job.mjs codex-jobs/<ファイル>.md
```
- 終了コード 0：成功。1：Codex の失敗、または許可外の変更あり（ログの "outside allowed paths" を確認）
- 許可外の変更は自動で戻さない。内容を確認し、本人に報告する（明らかに Codex の生成物だけで、戻しても失うものがない場合のみ `git checkout -- <path>` / 削除してよい）

## 3. 検査と修正
- `npm run validate:art`。不合格なら `codex-jobs/fix-validation.md` を実行（中で ART_CHECK.md を読むよう書いてある）。最大3回
- `npm run build` → 別ターミナルで `npx vite preview --host 127.0.0.1 --port 4173` → `node scripts/capture.mjs` → screenshots/ を Read で見て確認
- 見た目の修正は `codex-jobs/feedback.md` の「今回の修正点」を書き換えて実行。最大2回

## 4. 仕上げ
- `npm test` と `npm run test:e2e`（preview は止めておく。e2e は自分でサーバーを起動する）
- `git add art audit codex-jobs ASSET_MANIFEST.md screenshots && git commit` → `git push origin claude/pattern-hide-family-beta`（main には入れない）
- QUEUE.md の `[ ]` を `[x]` にし、日付と結果を1行で
- 本人へ：できたこと／画面写真2〜3枚／気になる点／次のジョブ、を短く
