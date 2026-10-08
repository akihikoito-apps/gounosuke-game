# ジョブ95：iOS / App Store 提出準備の独立レビュー

確認日：2026-10-08〜09。対象は手元の作業ツリーと既存の `native/www`・画面写真。

**結論：静的確認では、初回ビルドを必ず止めるパス・依存関係・アイコンの不整合は見つからなかった。ただし Xcode ビルド成功は未確認。ストア提出は、プライバシーポリシーのアプリ内導線と公開用連絡先などを整えてからにする。**

ジョブの「1ファイルだけ」を優先し、このレポート以外は変更していない。STATUS.md も更新していない。開始時点の `src/ui/styles.css`、`codex-jobs/QUEUE.md` の変更、未追跡のジョブファイル・動画は維持した。ネット接続、インストール、ビルド、同期、公開、タグ作成、commit / push は行っていない。

以下の「確定」はソース・ローカルファイル・読み取り検査で確認できた事実。「推測／未確認」は実機・Apple 側の状態・審査判断に依存する事項。ネット禁止のため、現在の Apple ガイドライン、提出 SDK 要件、GitHub ランナーの搭載版は照会していない。規則への適合認定ではない。

## 指摘（重要な順）

### 1. 審査前・高：アプリ内でプライバシーポリシーを確認できない

- **場所**：`src/ui/parent.ts:202`、`src/ui/parent.ts:232`、`site/privacy.html:17`、`strategy/APP_STORE.md:49`。
- **何が起きるか**：保護者画面に保存・個人情報の概要はあるが、正式なポリシー本文や、その閲覧入口がない。ストア側の URL を用意するだけでアプリ内の閲覧方法が残らない。
- **根拠（確定）**：保護者画面の全セクションとイベントを確認したが、ポリシー表示処理がない。`src/` にポリシー参照がなく、`site/privacy.html` は Vite のエントリー・public 配下・import 対象のいずれでもない。既存 www にも含まれない。
- **審査上の影響（推測）**：アプリ内からのポリシーへのアクセス不足として指摘される可能性がある。最新版の規則は未照会。
- **最小の直し方**：保護者ゲート通過後に「プライバシーポリシー」を設け、同梱した全文をアプリ内で表示する。戻る操作も用意する。外部ページを開く方式にするなら、ゲートの後だけに置き、「外部リンクはありません」というアプリ内・ストア説明を合わせて直す。外部表示を必須とする提案ではない。

### 2. 審査前・高：公開用ポリシー・サポートが未完成

- **場所**：`site/privacy.html:18`、`site/privacy.html:48`、`site/support.html:36`、`strategy/APP_STORE.md:14`、`strategy/APP_STORE.md:49`。
- **何が起きるか**：このまま公開・提出すると、問い合わせ先と制定日が未入力のページになり、利用者が連絡できない。提出用の実 URL も文書上は未確定。
- **根拠（確定）**：「（公開する日を入れる）」「（連絡先：公開前に入れる）」が残っている。公開先は持ち主の決定待ちとして記載されている。実際のホスティング状態・App Store Connect の入力値は確認していない。
- **最小の直し方**：日付と実際に受信できる連絡先を入れ、公開先を確定する。公開後、認証不要で privacy / support の両ページが開けることと、提出 URL が一致することを確認する。今回は公開しない。

### 3. 審査前・中：check-www の合格を「外部通信なし」の証明にしている

- **場所**：`native/check-www.mjs:14`、`native/check-www.mjs:17`、`native/check-www.mjs:23`、`native/check-www.mjs:32`、`strategy/APP_STORE.md:61`。
- **何が起きるか**：後から外部リンク、別名の SW、緩い CSP が混入しても合格し得る。「データの収集なし」の根拠としては検査範囲が足りない。
- **根拠（確定）**：検査は文字列の `http://` / `https://` だけ。実際の正規表現をメモリ内で試し、`https:\/\/example.invalid`、`"https:" + "//example.invalid"`、`//example.invalid`、`wss://example.invalid`、`mailto:test@example.invalid` が検出されないことを確認した。スキーム省略 URL が capacitor スキーム上で必ず外部通信になるという意味ではない。絶対 HTTPS URL のエスケープ・分割だけでも検出漏れが成立する。
- **追加の根拠（確定）**：`default-src 'self'; connect-src *; script-src * 'unsafe-inline'` の CSP でも現在の正規表現は合格する。SW は `sw.js` というファイル名だけで判定し、`worker.js` や登録コード自体は検査しない。対象拡張子も限定され、検査は `cap sync` の前なので最終 iOS バンドル・Swift・プラグインを含まない。
- **影響の区別**：現在のソースに情報送信処理を発見したわけではない。現在の CSP は `connect-src 'self'` 等を含み、通常の外部 Web リソース取得を制限している。ただしこれは外部ページへの遷移やネイティブ経由の通信全般を証明するものではない。
- **最小の直し方**：まず合格表示と提出文書を「静的チェックで禁止パターン未検出」に改める。CSP は各 directive の値を検査し、SW 登録コードも拒否する。URL のエスケープ、外部遷移 API、リンク属性、追加拡張子を検査に加える。任意の文字列組み立てまで正規表現だけで保証しようとせず、最終ネイティブ成果物・依存 SDK の確認と、主要操作時の外部通信確認を組み合わせる。

### 4. 初回ビルド前・中：CI の出荷経路に型チェックがない

- **場所**：`../.github/workflows/ios-moyou.yml:89`、`../.github/workflows/ios-moyou.yml:103`、`native/build-www.mjs:9`、`package.json:9`。
- **何が起きるか**：ローカルの `npm run build` は型エラーで停止するが、iOS 用 CI は同じ型エラーを見逃してアップロードまで進み得る。
- **根拠（確定）**：CI は `npm test` の後に Vite を直接呼ぶ `build-www.mjs` を実行する。`tsc --noEmit` はこの経路にない。Vitest の実行と Vite の変換は TypeScript の型検査の代わりにはならない。
- **最小の直し方**：ゲーム本体の working-directory で、www 生成前に `npm run typecheck` を追加する。手元の型チェックは今回合格したため、現在のビルド失敗を報告しているのではなく、出荷時の検査漏れを指摘している。

### 5. ビルド運用・中：同じ Actions 実行の再実行でビルド番号が重複する

- **場所**：`../.github/workflows/ios-moyou.yml:95`、`../.github/workflows/ios-moyou.yml:174`、`native/RELEASE.md:32`。
- **何が起きるか**：アップロード自体は受理されたが結果確認で失敗した場合などに、同じ実行を Re-run すると、同じバージョン・同じビルド番号を再送する。重複として受理されない可能性がある。初回実行を妨げるものではない。
- **根拠（確定／条件付き）**：番号は `github.run_number` のみ。再実行の区別を入れておらず、ExportOptions でも番号の自動管理は false。Apple 側に既に同番号が存在するかは未確認。
- **最小の直し方**：最小の運用変更は「受理済み、または受理された可能性がある upload を再送するときは、新しい workflow run を起こして次の番号を使う」と RELEASE に明記すること。再実行にも自動対応するなら run_attempt を含む衝突しない番号方式に変更する。その際は既存の最大番号との大小も確認する。

### 6. 審査前・低：シールの説明が実装より強い

- **場所**：`strategy/APP_STORE.md:37`、`native/store-frame.mjs:20`、`src/core/stickers.ts:34`、`src/core/stickers.ts:51`。
- **何が起きるか**：「みつけるたびに シールが ふえる」と読むと毎回もらえるように見えるが、実際はコースクリアや一定回数などの節目でもらう。
- **根拠（確定）**：回数のシールは 10 / 30 / 60 / 100 / 150 回、うみべのシールは 1 / 10 / 30 回等の条件で判定する。毎回新しいシールを付ける処理ではない。
- **最小の直し方**：「みつけて あつめる シールちょう」「コースクリアや、みつけた回数で シールが ふえる」等に揃え、画像の見出しも再生成する。

### 7. あとでよい・低：native 成果物のメタデータにはテスト版表記が残る

- **場所**：`index.html:12`、`public/manifest.webmanifest:2`、`native/check-www.mjs:25`。
- **何が起きるか**：画面の beta-tag は除去されるが、HTML title の「（仮）」と manifest の「（仮）家族テスト版」は native/www に残る。検査は JS の一文だけを見るので合格する。
- **根拠（確定）**：今回合格した既存 `native/www/index.html` と `native/www/manifest.webmanifest` に実在する。
- **最小の直し方**：native モードでは正式タイトルに置き換え、PWA manifest の link / ファイルを除外するか正式名にする。検査対象にも HTML と manifest の表示名を含める。iOS の表示名は Info.plist で正式名になっており、この件をホーム画面名の不具合や確定した審査拒否理由とは扱わない。

## ビルド経路で確認できた良い点と未確認事項

| 項目 | 結果・根拠 |
|---|---|
| checkout 後のパス | git の最上位は `moyou-kakurenbo/`。workflow の `pattern-hide-family-beta/` 起点、native 起点、WORKSPACE / PBXPROJ の関係は一致する（workflow:33–36）。 |
| npm ci | 本体・native の package-lock は追跡済みで lockfileVersion 3。各 package.json と lock のルート dependencies / devDependencies は一致。native の core / ios / cli はすべて 7.6.9。ネット禁止なので npm ci 自体は未実行。 |
| Node | CI は 22、ローカルにある Capacitor CLI 7.6.9 の要求は Node >=20。今回の手元の読み取り検査は Node 24.18.0 なので、Node 22 の実行成功まで保証したものではない。 |
| www / cap sync | native モードで `native/www` を先に作り、check の後に cap sync。Podfile の `../../node_modules/@capacitor/ios` は native 内を指す。CLI の実装も pod install を呼ぶ。 |
| workspace / Pods | 追跡済み workspace には IDEWorkspaceChecks のみで、contents.xcworkspacedata と Podfile.lock / Pods は手元で未生成。通常は pod install の生成物なので欠落だけを不具合とはしない。初回 CI では sync 成功後に workspace 本体と App scheme が利用できるかを確認する。既存のチェックは Pods と lock の存在だけ。 |
| 最低 iOS | Podfile と pbxproj の project / App Debug / Release はすべて 14.0。インストール済み Capacitor / CapacitorCordova の podspec も 14.0 で整合する。Web の CSS 互換性は別途確認が必要。 |
| 署名 | App の Debug / Release に Automatic があり、ci-set-team は現在の構造ならその2か所にチームを入れる。project 側の固定 `iPhone Developer` 2行も削除対象に一致する。Bundle ID は config と pbxproj で一致。 |
| archive → export | archive は署名無効、export は automatic / app-store-connect / upload と API キー。構成だけから成功・失敗は断定できない。キーの権限、チームとの対応、配布署名の発行・利用権限、App ID / App Store Connect 登録、契約状態は未確認。初回は archive の成功と export / upload の成功を別々に評価する。 |
| Xcode / CocoaPods | workflow:65 はインストール名を並べて最後を採用し、pod は搭載版を使う。再現性は固定されておらず、プレビュー版除外や最低版チェックもない。現在の macos-26 の提供状態・搭載版は未照会。初回成功時の Xcode / SDK / pod 版を記録し、必要ならその正式版に固定する。特定の版で必ず失敗するという根拠はない。 |
| ビルド番号・販売版 | 現在の sed は Debug / Release の2か所に一致する。販売版 1.0 と Info.plist の変数参照も整合。タグ名は MARKETING_VERSION を更新しないため、公開後は文書どおり明示的に変更する。 |
| iPad・向き | TARGETED_DEVICE_FAMILY は両構成とも `1,2`。iPhone は縦と左右横、iPad は4方向。iPad を対象から外したり、縦向きしか宣言していない問題はない。実際の横向き・分割表示レイアウトは未確認。 |
| アイコン | Contents.json の参照先が存在し、PNG 実測で 1024×1024、color type 2（RGB）、tRNS なし。全画素不透明というだけでなくアルファ情報も持たない。 |
| 起動画面 | Info.plist → LaunchScreen.storyboard → Splash.imageset → 3 PNG の参照がつながり、pbxproj の resources に含まれる。各 PNG は 2732×2732 の RGB。実機での切り抜かれ方・初回表示は未確認。 |
| 暗号化・privacy manifest | ITSAppUsesNonExemptEncryption=false がある。Capacitor / Cordova の配布物には PrivacyInfo.xcprivacy と podspec の resources 宣言があるので「SDK manifest がない」とは言えない。最終 archive への収録、Apple 側の検証は未確認。 |

## アプリ内容・WKWebView・キッズ審査の確認

- **SW / 開発入口**：`vite.config.ts:16` と `src/main.ts:19` の双方で native を除外する。`__game` は DEV / e2e 限定。既存 www に SW 登録コード・`__game` は見つからなかった。
- **CSP / パス**：`vite.config.ts:51` はネイティブでも CSP を付与し、base は `./`。既存 HTML の JS / CSS / アイコン参照はすべて相対パス。`src/art/registry.ts:7` は Vite のローカル画像取り込み。remote server.url や allowNavigation の追加もない。`'self'` だから capacitor://localhost の同一オリジン資産が必ず遮断される、という不具合は断定できない。起動後の画像・マスク・音と CSP 違反ログは WKWebView で確認する。
- **保存**：`src/storage/storage.ts:23`・`:67` は localStorage の取得と読み書きの例外を処理し、失敗してもメモリ内で遊べる。再起動後の永続性とアプリ更新時の引継ぎは未検証。現在の schema に氏名・写真・音声・端末IDはない。
- **音**：`src/ui/app.ts:122` で最初の pointerdown / keydown 後に解禁し、`src/audio/sound.ts:19` で AudioContext を生成・resume する。外部音源は使わない。着信・バックグラウンド後の AudioContext 復帰、消音からの復帰は実機確認が必要。iOS 固有の中断状態で不具合が出るかは未確認。
- **長押し・保護者ゲート**：漢数字3つの昇順と 2200ms 長押しを組み合わせる。誤答で出題更新、連打時の待機、pointerup / leave / cancel / blur で長押しを解除する（parent.ts:128–181）。非表示時に app.ts:127 からゲートを閉じる。現状はゲート外に購入や外部リンクを発見していない。キッズカテゴリの審査合格を保証するものではなく、課金・外部リンク追加時には全入口を再確認する必要がある。
- **安全領域等**：viewport-fit=cover、四辺の safe-area padding、touch-action、callout 抑止、文字自動拡大抑止、overscroll 対策がある。native 設定も contentInset=never / scrollEnabled=false。保護者ダイアログは body 直下にあり app の一部スタイルを継承しないが、長押しボタンは個別に contextmenu を抑止している。ノッチとホームバー、保護者パネル末尾までのスクロール、横向き、ダブルタップは実機で確認する。
- **最低 OS の残るリスク（推測）**：iOS 14.0 を宣言する一方、CSS には dvh / aspect-ratio / inset などがある（styles.css:32、:97、:112、:157）。app 高さには vh の代替があるが、プレビューの max-height は dvh のみ。`target: 'es2020'` はこれら CSS の旧 WKWebView 互換性の保証ではない。最低対応 OS で衣装選択・コース・保護者画面を確認し、崩れる箇所だけ代替指定を足すか、検証済みの最低 OS に揃える。今回レイアウト崩れを実機再現したわけではない。
- **データ収集なし**：確認したゲームソースには fetch / XHR / WebSocket / Beacon 等の外部送信処理を発見していない。試遊集計も初期 OFF、端末内保存のみで、ポリシーに説明がある。Capacitor の通信機能の存在自体を収集とは扱わない。「収集なし」は現状のアプリ実装と矛盾しないが、check-www の結果だけで確定しない（指摘3）。
- **4.2 のリスク（推測）**：現状はウェブページへのリンク集ではなく、同梱アセットを使った探索、コース進行、親子の受け渡し、シール・途中保存を持つゲーム。WebView 利用だけを理由に不合格とは判断しない。`strategy/APP_STORE.md:78` の審査メモに、オフライン起動・10コース・「かくして わたす」の操作手順を加え、実機で遊べることを確認する。審査対策だけを目的に不要なネイティブ機能を増やす必要はない。

## 画面写真の確認

- `native/store-shots.mjs:37` の 440×956×3 は 1320×2868、`:38` の 1032×1376×2 は 2064×2752。`store-frame.mjs:22` と一致する。既存の原版10枚と framed 10枚すべてを PNG ヘッダーで確認し、寸法一致・RGB・tRNS なしだった。これら寸法の現在のストア受付条件はネット禁止のため未照会。
- `store-shots.mjs:27–34` の保存データを抽出し、既存 TypeScript をメモリ内で変換して実際の `src/storage/schema.ts` の validate に通した。`repaired: false`。キー、schema、設定、集計、course、collection は受理される。ファイルへの変換出力はしていない。
- 撮影の各 shot が 1200ms 待つため、コース一覧撮影後の course5 選択を「350ms の画面遷移ロックで必ず無視される」とは扱わない。既存の course5 画像にもコースのゲーム画面が写っている。
- 見出し付き iPhone course5 と iPad title を目視した。見出しの欠けは見られず、ゲーム画面・ボタンが写っている。iPhone ゲーム画面は上下の空白が大きめで、掲載品質の改善余地はある。
- **残る制限**：生成元は Chromium + HTTP（store-shots.mjs:40）。iOS のフォント、safe-area、WKWebView、ネイティブ起動・保存を検証した画面ではない。提出前に TestFlight / iOS Simulator の同じ場面と比較し、差があれば iOS 側で撮り直して同じフレームに入れる。これを理由に現画像が必ず拒否されるとは断定しない。
- 固定時間待ちと pageerror だけでは画像ロード失敗や誤画面を確実に検出しない。撮影を継続利用するなら `data-current`、対象コース、画像ロード完了の確認を加えるとよい。今回は撮影スクリプトを実行・再生成していない。

## 実施した検査・できなかったこと

| 方法 | 結果 |
|---|---|
| 指定ファイル・ローカル依存実装の静的レビュー | 上記の範囲を確認。ネット画像・画像生成は使用していない。 |
| `node node_modules/typescript/bin/tsc --noEmit` | 終了コード0。ローカルの tsc を直接利用し、ダウンロードはしていない。 |
| `node native/check-www.mjs` | 終了コード0。「61ファイル・4.2MB」の合格表示。既存 www に対する結果であり、現在のソースからの再ビルド結果ではない。 |
| `node --check`（build-www / check-www / ci-set-team / store-shots / store-frame） | 5ファイルとも終了コード0。スクリプトの本処理は実行していない。 |
| package / lock、PNG ヘッダー、撮影データ schema | 上記の整合性を確認。 |
| checker の正規表現へのメモリ内サンプル入力 | URL、緩い CSP、別名 SW の検出漏れを確認。実通信・テスト用ファイル作成なし。 |
| Xcode / CocoaPods / archive / 署名 / upload | Windows およびジョブ制約のため未実行。macos-26 の搭載環境、秘密情報、Apple 側設定にもアクセスしていない。 |
| 単体・E2E テスト、Vite ビルド、cap sync、画面写真再生成 | 今回未実行。書き込み先をレポート1ファイルに保ち、生成物・キャッシュを増やさない範囲の検査に限定した。検査ツール、node_modules、環境設定の変更はしていない。 |
| Apple の最新規則・URL 公開確認 | ネット禁止のため未確認。審査判断は推測とした。 |

## 最初のビルド前に直すべきもの

1. CI に `npm run typecheck` を追加する（指摘4）。現時点の型チェック自体は合格。
2. 初回からの致命的ビルド不整合は今回発見していない。実行時は Xcode / SDK / CocoaPods 版、pod install による workspace 生成、App scheme、archive と export それぞれの結果を確認する。
3. 受理済みビルドの再アップロード時に同じ run を使わない運用を明記する（指摘5）。再実行前に必要となる対策で、初回の blocker ではない。

## 審査前に直すべきもの

1. アプリ内ポリシー導線を用意し、ポリシー・サポートの連絡先と日付、提出 URL を完成させる（指摘1・2）。
2. check-www の保証表現を直し、CSP / SW / URL 検査を補強する。最終成果物と実機操作でも「外部送信なし」を確認する（指摘3）。
3. シールの説明を実装に合わせる（指摘6）。現状の全コンテンツ開放は TestFlight 用の意図どおりだが、課金を含む販売版を選ぶ場合は機能・説明・写真・ゲートを改めて揃える。
4. 最低対応 OS、小型 iPhone、ノッチ付き iPhone、iPad で起動、縦横、保護者ゲート、スクロール、音の中断復帰、保存と再起動、オフラインの主要遊びを確認する。Chromium の画面写真と実際の iOS 表示の差を確認する。
5. 4.2 に関して、審査メモにゲームの操作手順とオフラインで遊べる内容を具体的に記載する。最終 archive の manifest・署名検証と、提出時点の SDK / スクリーンショット要件も別途確認する。

## あとでよいもの

- native の HTML / manifest に残る仮称を整理する（指摘7）。
- 初回成功後の Xcode / CocoaPods 版を固定して再現性を上げる。
- 画面写真の画像ロード・画面状態の確認を自動化し、余白や文字の見やすさを調整する。

作業成果はこのレポートのみ。コード・絵・設定・ワークフローの修正提案は未適用。

---

## Claude の対応（2026-10-09）

| 指摘 | 対応 |
|---|---|
| 1 アプリ内ポリシー | 保護者パネルに「プライバシーポリシー」（全文を読む）を追加（`src/ui/privacy.ts`、site/privacy.html と同じ内容）。ゲートを通った後だけに出る |
| 2 連絡先・日付・公開先 | **持ち主の決定待ち**（公開になるため）。`strategy/APP_STORE.md` の B・C |
| 3 check-www の保証表現・抜け | 合格表示を「静的検査で見つからない」に変更。CSP を directive ごとに検査、SW 登録コード・別名ファイル、`\/` エスケープ URL、wss/mailto/tel、スキーム省略参照、window.open・WebSocket・sendBeacon 等を追加。わざと混ぜて NG になることを確認。実機の機内モード確認を RELEASE.md のチェック表に追加 |
| 4 CI に型チェック | workflow に `npm run typecheck` を追加 |
| 5 ビルド番号の重複 | `実行番号.再実行回数`（例 12.1）に変更 |
| 6 シールの説明 | 見出しを「みつけて あつめる シールちょう」に、説明文を「コースクリアや、たくさん みつけると」に修正。画面写真を作り直し |
| 7 仮称の残り | native ビルドで title を正式名に、manifest の link・ファイル、robots を外す。check-www で「（仮）」「家族テスト版」も検査 |
| 最低 iOS と CSS | 最低対応を 15.4 に上げた（dvh・aspect-ratio）。pbxproj 4か所・Podfile |
| 4.2 対策 | 審査メモに遊び方3つとオフラインで遊べることを具体的に記載 |
| 画面写真の限界 | 実機と見比べる旨を APP_STORE.md に記載 |
