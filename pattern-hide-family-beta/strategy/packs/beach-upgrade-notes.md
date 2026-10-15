# うみべパック（`beach`）水準そろえ：変更点とメモ

## 1. 変更した内容

ほかの追加パック（`forest` / `aquarium` / `haunted`）と同じ「背景＋友だち＋部屋1つ＋シール5枚＋家具6つ（初期の座れる家具1＋シール家具5）」の構成にそろえました。

### ① シールを3枚 → 5枚に拡張（[src/core/stickers.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/stickers.ts)、[src/ui/stickerArt.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/stickerArt.ts)）
- 既存の `b1`（`need: 1`）、`b10`（`need: 10`）、`b30`（`need: 30`）は **ID も `need` も一切変更せず維持**しました。
  - これにより、すでに `sceneFinds.beach` が `10〜14` 回のセーブデータを持つプレイヤーが、既存の `b10` シールや「うきわ（`floatring`）」を失うことがありません。
- 新たに2枚を追加し、うみべのシールを合計5枚（全シール合計 33枚 → **35枚**）にしました：
  - `b1`：`ちょきが きたよ`（`need: 1`, `char: 'choki'`, `motif: 'shell'`）※既存
  - `b5`：`うみべで 5かい`（`need: 5`, `char: 'mimi'`, `motif: 'shavedice'`, `color: '#E2F0CB'`）**※新規**
  - `b10`：`うみべで 10かい`（`need: 10`, `char: 'koro'`, `motif: 'floatring'`）※既存
  - `b30`：`うみべで 30かい`（`need: 30`, `char: 'choki'`, `motif: 'star'`）※既存
  - `b50`：`うみべで 50かい`（`need: 50`, `char: 'choki'`, `motif: 'crab'`, `color: '#F5DFC6'`）**※新規**
- `src/ui/stickerArt.ts` に `'shavedice'` と `'crab'` のフォールバック SVG 描画を追加しました（Codex の絵が入る前でもシール帳・トーストで正しく表示されます）。

### ② 家具を3つ → 6つに拡張（[src/core/myroom.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/myroom.ts)、[src/ui/myroomView.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/ui/myroomView.ts)）
- パック購入時から置ける座れる家具1つ＋シール5枚に対応する家具5つの計6つにしました（5つの `genre` すべてを網羅し、動く家具は計3つ）：
  1. `beach-chair`（`パラソル ベンチ`）：`sticker: null`, `content: 'scene:beach'`, `genre: 'furniture'`, `w: 260`, `seats: [{ x: -52, y: -58 }, { x: 52, y: -58 }]` **※新規（初期配置・2人座れる）**
  2. `shell`（`かいがら`）：`sticker: 'b1'`, `genre: 'deco'`, `w: 70` ※既存
  3. `shaved-ice`（`かきごおりき`）：`sticker: 'b5'`, `genre: 'food'`, `w: 110`, `motion: 'sway'` **※新規（動く）**
  4. `floatring`（`うきわ`）：`sticker: 'b10'`, `genre: 'toy'`, `w: 120` ※既存
  5. `beachball`（`ビーチボール`）：`sticker: 'b30'`, `genre: 'toy'`, `w: 80`, `motion: 'roll'` ※既存（動く）
  6. `hermit-crab`（`やどかり`）：`sticker: 'b50'`, `genre: 'animal'`, `w: 96`, `motion: 'walk'` **※新規（動く）**
- `src/ui/myroomView.ts` の `TALL` に `'shaved-ice': 160` を追加しました。

### ③ 新しい部屋「うみべの デッキ」（[src/core/myroom.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/core/myroom.ts)、[src/entitlements/entitlements.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/src/entitlements/entitlements.ts)、[scripts/validate-art.mjs](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/scripts/validate-art.mjs)）
- `RoomId` と `ROOMS` に `{ id: 'beach-deck', name: 'うみべの デッキ', needCleared: 0, needScene: 'beach', content: 'room:beach-deck', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 }` を追加しました。
- `PACKS`（`src/entitlements/entitlements.ts`）の `beach` パックの `contents` に `'room:beach-deck'` を追加しました。
- `starterLayout('beach-deck')` が `[{ ref: 'item:beach-chair', x: 280, y: 720 }]` を返すようにしました。
- `scripts/validate-art.mjs` の `myroom/rooms` のファイル名正規表現に `beach-deck` を追加しました。

### ④ テストの更新・新規作成
- [tests/unit/stickers.test.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/stickers.test.ts)：全シール数を `33` → `35` に更新し、`b5`・`b50` の獲得とヒント文字列の検証を追加。
- [tests/unit/myroom.test.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/myroom.test.ts)：`openRooms` に `beach-deck`、`ownedItems` の初期所持に `beach-chair` を反映し、無料（`baseOnly`）で `beach-chair` が出ないことを検証。
- [tests/unit/access.test.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/access.test.ts)：`withBeach` で見えるシール一覧に `b5`, `b50` を追加し、パック組み合わせごとのシール総数を +2（`20 / 25 / 30 / 35`）に更新。
- [tests/e2e/course.spec.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/e2e/course.spec.ts)：
  - シール帳の `.sticker.locked` の枚数を `26 - sceneFirst`（全33枚）→ `28 - sceneFirst`（全35枚）に更新。
  - うみべで初めて見つけたときのトースト通知順に、新しく開く部屋「うみべの デッキ」の通知（`ちょき` → `うみべの デッキ` → `シール`）を追加。
- [tests/unit/beach-pack.test.ts](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/tests/unit/beach-pack.test.ts)（新規）：`forest.test.ts` / `haunted.test.ts` と同じ形式で、全9スポット×全9キャラの配置・アクセサリー検査、のぞき3箇所、パック境界、および既存セーブデータの互換性（10回・30回時点で既存のシールや家具が減らないこと）を検査。

### ⑤ Codex への絵の依頼文下書き
- [codex-jobs/drafts/beach-upgrade-art.md](file:///C:/Users/aki5h/moyou-forest/pattern-hide-family-beta/codex-jobs/drafts/beach-upgrade-art.md) を作成しました（`beach-deck.svg`、`beach-chair.svg`、`shaved-ice.svg`、`hermit-crab.svg`、`b5.svg`、`b50.svg` の計6点）。

---

## 2. 判断した点・自信のない所（確認をお願いしたい点）

1. **シールの回数段階（`1・5・10・30・50` vs `1・5・15・30・50`）**
   - ご指示の「今の `b1`・`b10`・`b30` の id と、もらった人の記録は消さない。必要なら `need` だけ変えず、足りない分（5回・15回・50回など）を新しい id で足す。合計5枚。すでに持っている人のシールが減らないこと」に従い、既存の `b10`（`need: 10`）の `need` は `15` に引き上げず `10` のまま維持し、新しく `b5`（`need: 5`）と `b50`（`need: 50`）を追加して `[1, 5, 10, 30, 50]` の5枚にしました。
   - もし `b10` の `need` を `15` に変更してしまうと、`sceneFinds.beach` が `10〜14` 回の既存プレイヤーから `b10` と「うきわ」が消えてしまうため、`need: 10` を維持するのが最も安全と判断しました。
2. **E2E テスト（`tests/e2e/course.spec.ts`）のトースト通知順**
   - `beach-deck`（`needScene: 'beach'`）が追加されたことで、うみべで初めて友だちを見つけた際に `src/ui/app.ts` の `countFind()` が「① 友だち（ちょき） → ② 新しい部屋（うみべの デッキ） → ③ シール（ちょきが きたよ）」の3つのトーストを順番（各2600ms）に出します。
   - そのため `tests/e2e/course.spec.ts` の `'beach pack: first find at the beach brings choki and the b1 sticker; notices do not overlap'` で、`ちょき` の次に `うみべの デッキ`、その次に `シール` のトーストを確認するよう更新しています。実ブラウザでの E2E 実行時にタイミングが通るかご確認をお願いします。
