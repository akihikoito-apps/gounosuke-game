# ジョブ95：総合レビュー（iPhone アプリ版と App Store 提出の準備）

## 書き込んでよい場所
`audit/codex/review-native.md` の1ファイルだけ。コード・絵・設定・ワークフローは変更しない（読むのは自由。`npx.cmd tsc --noEmit`、`node native/check-www.mjs` など読むだけのコマンドは可。ネット接続・ビルドの公開・タグの作成・push はしない）

## 背景
ゲーム本体を Capacitor 7（iOS）に入れ、GitHub Actions（macOS）でビルドして TestFlight に上げる準備をした。手順は持ち主の別アプリ（My柔道）で実績のあるものを流用。手元は Windows なので、Xcode では一度もビルドしていない。**最初のビルドで失敗しそうな所を先に見つけたい。** ご本人の希望は「クオリティは高く、総合チェックも忘れずに」。

## 見るところ（重要な順に）
1. **ビルドの流れ**：`../.github/workflows/ios-moyou.yml`、`native/package.json`、`native/capacitor.config.json`、`native/build-www.mjs`、`native/ci-set-team.cjs`、`native/ios/App/`（project.pbxproj・Podfile・Info.plist・Assets.xcassets）
   - パス・作業フォルダの取り違え、npm ci に必要な package-lock の有無、cap sync の前提、署名（自動署名・チームID）、ビルド番号、Xcode/CocoaPods の版、iOS の最低版、iPad 対応（TARGETED_DEVICE_FAMILY）と画面の向き、App Store の必須項目（アイコン 1024 の透明なし・起動画面・ITSAppUsesNonExemptEncryption）
2. **アプリ版の中身**：`vite.config.ts`（Service Worker を native で外す条件）、`src/main.ts`、`src/ui/platform.ts`、`src/ui/app.ts`・`src/ui/parent.ts` の NATIVE 分岐、`native/check-www.mjs`
   - WKWebView（capacitor://localhost）で動かないもの（CSP の 'self'、絶対パス、localStorage、音の再生開始、長押しの挙動、ノッチ・ホームバーの安全領域、スクロールのはね返り、文字の自動拡大、ダブルタップ拡大）
   - check-www.mjs の抜け（見逃す外部URLの書き方など）
3. **ストア審査で問題になりそうな所**：`strategy/APP_STORE.md`、`site/privacy.html`、`site/support.html`、保護者ゲート（`src/ui/parent.ts`）
   - キッズカテゴリの条件（保護者ゲート、外部リンク、データ収集）、「データの収集なし」の申告と実装の一致、説明文の言い過ぎ、ガイドライン 4.2（Web をそのまま包んだだけのアプリ）と見なされる恐れと、その対策
4. **画面写真の作り方**：`native/store-shots.mjs`・`native/store-frame.mjs`（大きさ・保存データの形が schema と合っているか）

## 書き方
`audit/codex/review-native.md` に、重要な順に「場所（ファイル:行）・何が起きるか・根拠・最小の直し方」。推測は推測と書く（Xcode で試せないので、確実なことと推測をはっきり分ける）。良い点も短く。最後に「最初のビルド前に直すべきもの」「審査前に直すべきもの」「あとでよいもの」に分ける
