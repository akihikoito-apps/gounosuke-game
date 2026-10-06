# もようのかくれんぼ（仮）家族内テスト用ベータ

3〜6歳くらいの子どもと家族で遊ぶ、柄の服でまぎれたキャラクターをさがす2Dかくれんぼの **Webベータ** です。
**公開・課金・広告・通信はありません。** 名前は仮称で、商標などの確認はしていません。

- 「さがす」：柄の服で背景にまぎれたキャラクターを見つける（やさしい＝1体／ふつう＝2〜3体）
- 「かくして わたす」：場所 → キャラクター → 服の柄 → 置く → できた → 目隠し画面で端末を渡す → 次の人がさがす

## 必要なもの

- Node.js 22 系（確認した版：v22.22.0）と npm 10 系（確認した版：10.9.4）
- 依存の版は `package-lock.json` で固定（vite 7.3.6 / typescript 5.9.3 / vitest 5.0.3 / @playwright/test 1.56.1 / @types/node 22.20.5。2026-10-06 時点の `npm audit` は 0 件）

## 起動・ビルド・テスト

```bash
cd pattern-hide-family-beta
npm ci                 # 依存をロックファイルどおりに入れる（このフォルダの中だけ）
npm run dev            # 開発用サーバー http://127.0.0.1:5173/ （このPCの中からだけ開ける）
npm run build          # 本番ビルド → dist/
npm run preview        # ビルド済みを http://127.0.0.1:4173/ で確認
npm test               # 単体テスト（配置300シード以上の検査を含む）
npm run test:e2e       # ブラウザ操作テスト（Chromium。e2e用ビルドを自動で作る）
node scripts/capture.mjs   # preview を起動した状態で、画面写真と操作動画を撮り直す
```

スマホで開く方法は [PHONE_ACCESS.md](PHONE_ACCESS.md) を見てください（localhost のURLはスマホからは開けません）。

## 絵の差し替え（Codex など）

`art/` に決まった名前でPNG/WebP/SVGを置くと、その絵が使われます（[ART_SLOTS.md](ART_SLOTS.md)）。
`npm run art:guides` で下書きガイド、`npm run validate:art` で自動検査。依頼文は [CODEX_ART_BRIEF.md](CODEX_ART_BRIEF.md)。

## 構成

| 場所 | 役割 |
|---|---|
| `src/core/` | ゲームのロジック（形状・隠れ場所・自動配置・当たり判定・ヒント・隠す編集）。表示から独立した純粋関数 |
| `src/core/scenes/` | 背景3種。背景レイヤー・柄の領域・隠れ場所・前景の小物を **1組のデータ** として定義 |
| `src/ui/` | 画面・入力・SVG描画・保護者領域 |
| `src/storage/` | 端末内保存（スキーマ版・検証・破損時の復旧）と、既定OFFの試遊用集計 |
| `src/entitlements/` | 将来の買い切り購入との境界（今回はベータ全開放のみ。購入証明ではない） |
| `src/audio/` | 端末内で生成する短い音（ユーザー操作の後だけ、消音可） |
| `src/sw-template.js` | オフライン用 Service Worker（ビルド時に版と資産一覧を埋め込む） |
| `tests/unit`, `tests/e2e` | 単体テスト・ブラウザテスト |

同じ形状データを、描画・配置検査・当たり判定・ヒントで共有しています。
新しい背景を足すときは、`src/core/scenes/` に1ファイル追加 → `npm test`（全隠れ場所×全キャラクターを自動検査）→ 画面点検 → 本人承認、の順です。

## 将来のネイティブ化

ロジック・表示・保存・購入権限の窓口を分けてあるので、Capacitor 等で包む検討ができます。今回は iOS/Android ビルド・課金実装は行っていません。

## 関連文書

[OWNER_REVIEW.md](OWNER_REVIEW.md) / [TEST_REPORT.md](TEST_REPORT.md) / [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) / [PRIVACY_DRAFT.md](PRIVACY_DRAFT.md) / [ASSET_MANIFEST.md](ASSET_MANIFEST.md) / [PLAYTEST_SHEET.md](PLAYTEST_SHEET.md) / [audit/AGENT_STATUS.md](audit/AGENT_STATUS.md)
