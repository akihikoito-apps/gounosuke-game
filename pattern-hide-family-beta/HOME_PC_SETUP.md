# ご自宅PCでの準備（1回だけ・コピペ3回）

これが終わると、スマホから Claude に指示するだけで、Claude がご自宅PCの Codex を呼び出して絵の制作・検査・修正・GitHubへの保存まで進めます。毎回 Codex に頼む必要はありません。

いま動いている別プロジェクトには触れません。**新しいフォルダに、新しい窓で** 準備します。

---

## ① PowerShell を新しく開いて、貼り付け（取り込みと準備）

```powershell
cd $HOME
git clone --branch claude/pattern-hide-family-beta https://github.com/akihikoito-apps/gounosuke-game.git moyou-kakurenbo
cd moyou-kakurenbo\pattern-hide-family-beta
node scripts/codex/setup-home.mjs
```

- 最後に「OK / NG」の一覧が出ます（`audit/logs/home-setup.txt` にも保存されます）
- **NG が出たら**、その行をスマホで写して Claude に見せてください。よくあるもの：
  - `Node` が NG → https://nodejs.org から LTS 版を入れて、①をもう一度
  - `Codex CLI` が NG → ② へ
  - `OPENAI_API_KEY` が NG → 従量課金の API を使ってしまう可能性があります。ChatGPT のログインで使うなら、その設定を外してください（分からなければ Claude に相談）

## ② Codex にログインしているか確認（済んでいれば不要）

同じ PowerShell で：

```powershell
codex
```

- ログイン画面が出たら、**ChatGPT のアカウントでサインイン**を選んでください（APIキーは選ばない）
- ふだんの画面が出れば、ログイン済みです。`/quit` か Ctrl+C で閉じてください
- ①で Codex CLI が NG だった場合は、Codex をいつもお使いの方法で導入してから①をもう一度

## ③ Claude を「スマホから操作できる状態」で起動

同じ PowerShell で：

```powershell
claude remote-control
```

- スマホの Claude アプリに、このPCのセッションが出てきます
- この窓は開いたままにしておいてください（閉じると止まります）

---

## スマホから最初に送る文（コピペ）

```
CLAUDE.md を読んで、まず初回確認（audit/logs/home-setup.txt と codex-help.txt を見て codex.config.json を確定）をしてください。そのあと codex-jobs/QUEUE.md の順に、Codex と連携して絵の制作を進めてください。ジョブが1つ終わるごとに、画面写真つきで短く報告してください。
```

2回目以降は、たとえば「次のジョブを進めて」「もこの色をもう少し明るくして」と送るだけです。

---

## 決まりごと（Claude と Codex に設定済み）

- Codex が書き込めるのは `art/`（絵）と `audit/codex/`（レビュー）だけ。それ以外を変えたら、Claude が止めて報告します
- Codex の呼び出しは、ChatGPT ログインの範囲だけ。`OPENAI_API_KEY` が設定されていると自動で中止します。利用上限の表示が出たら、Claude は止めて報告します
- Claude は検査・テストが通ったものだけを `claude/pattern-hide-family-beta` に保存（push）します。**main には入れません**（main は今のゲームの公開先のため）
- 公開・課金・設定変更・権限の追加が必要になったら、Claude は実行せずに確認を求めます

## うまくいかないとき

| 症状 | すること |
|---|---|
| スマホにセッションが出ない | ③の窓が開いているか確認。もう一度 `claude remote-control` |
| `git clone` で止まる | GitHub のログインを求められたら、いつもの方法でサインイン |
| `moyou-kakurenbo` が既にあると言われる | `cd $HOME\moyou-kakurenbo; git pull` のあと、①の3行目から |
| PCを再起動した | ③の2行だけ：`cd $HOME\moyou-kakurenbo\pattern-hide-family-beta` → `claude remote-control` |
