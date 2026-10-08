# iPhone アプリ版の作り方・出し方

ゲーム本体（`../src`）を Capacitor（iOS の入れ物）に入れて、GitHub の Mac でビルドし、TestFlight に上げます。手元に Mac は要りません。
仕組みは My柔道（judo-repo の ios-player.yml）と同じです。

## しくみ

| ファイル | 役目 |
|---|---|
| `build-www.mjs` | ゲームを「アプリ版」で作る（`vite build --mode native`）。Service Worker なし・テスト版の表示なし・自動の青い枠なし |
| `check-www.mjs` | 出荷前の静的チェック：外部URL・外へ出る処理・Service Worker・緩い CSP・テスト版の表示が見つからないこと。通信が無いことの証明ではないので、実機でも機内モードで確かめる |
| `make-icons.mjs` | `art/app/icon.svg`・`splash.svg` → アイコン（1024）と起動画面（2732）の PNG（透明なし） |
| `store-shots.mjs` → `store-frame.mjs` | App Store 用の画面写真（iPhone 6.9インチ・iPad 13インチ）と、見出し付きの仕上げ |
| `ci-set-team.cjs` | ビルド時にチームIDを入れる |
| `../../.github/workflows/ios-moyou.yml` | GitHub 上のビルドと TestFlight へのアップロード |

## 1回だけの準備（持ち主）

1. **GitHub のシークレット**：`gounosuke-game` リポジトリ › Settings › Secrets and variables › Actions に4つ。値は My柔道 と同じ。
   `ASC_KEY_ID` / `ASC_ISSUER_ID` / `ASC_KEY_P8` / `APPLE_TEAM_ID`
2. **Bundle ID の確認**：App Store Connect の「もようのかくれんぼ」› App 情報 › バンドルID が `com.akihikoito.moyoukakurenbo` であること。違う場合は教えてください（こちらの設定を合わせます）。

## ビルドを TestFlight に上げる

タグ（名札）を push すると、GitHub の Mac で自動的に走ります（30〜40分）。

```
git tag moyou-v1.0
git push origin moyou-v1.0
```

- 2回目以降は `moyou-v1.0.1` のように名前を変える（ビルド番号は自動で増える）。
- ビルド番号は「実行番号.再実行の回数」（例 `12.1`）。GitHub の Re-run で同じ番号を送り直すことはない。
- App Store で公開したあとは、`ios/App/App.xcodeproj/project.pbxproj` の `MARKETING_VERSION` を上げる。
- 失敗したら GitHub の Actions 画面に「どこで止まったか」が日本語で出る。ログは artifact に7日間残る。

## 手元で確かめる（Windows でできる範囲）

```
cd native
node build-www.mjs && node check-www.mjs
node make-icons.mjs            # 絵を差し替えたとき
node store-shots.mjs && node store-frame.mjs   # 画面写真
```

## まだやっていないこと

- 課金（追加パック）：StoreKit の組み込みは未着手。今のアプリ版は全部遊べる設定（TestFlight の家族テスト向け）。
- 実機（iPhone）での確認：TestFlight で入れて確認する。見る点は `../OWNER_REVIEW.md` に追記。

## TestFlight で入れたら確かめること（実機）

最低対応は iOS 15.4（画面の大きさの指定 dvh・aspect-ratio を使うため）。

- [ ] 起動画面 → タイトルが出る。名前「もようのかくれんぼ」、アイコンの見え方
- [ ] **機内モード**でコース・さがす・かくして わたす・シールちょう がすべて遊べる
- [ ] 小さい iPhone（SE など）・ノッチ付き iPhone・iPad で、縦と横。ボタンが切れない、ホームバーに重ならない
- [ ] 背景より先にキャラクターが出ない（読み込みの待ち）
- [ ] 音：最初のタッチで鳴る。電話・別アプリ・画面ロックから戻っても鳴る。消音スイッチ
- [ ] 保護者ゲート（漢数字＋長押し）。長押しで文字選択や拡大鏡が出ない。保護者パネルが最後までスクロールできる。プライバシーポリシーが開く
- [ ] アプリを終了して開き直すと、コースの進み具合とシールが残っている
- [ ] ダブルタップやピンチで画面が拡大されない
