// ご自宅PCで1回だけ実行する準備スクリプト（Windows / macOS / Linux 共通）。
// 何も設定を書き換えず、確認とこのフォルダ内の準備だけを行う。
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('audit/logs', { recursive: true });
const lines = [];
const log = (s) => {
  console.log(s);
  lines.push(s);
};
const run = (cmd) => {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message).trim() };
  }
};
log(`# ご自宅PCの準備チェック ${new Date().toISOString()}`);
log(`OS: ${process.platform} / Node: ${process.version}`);
const major = Number(process.version.slice(1).split('.')[0]);
log(major >= 20 ? 'OK  Node 20 以上' : 'NG  Node 20 以上が必要です（https://nodejs.org の LTS を入れてください）');
for (const [name, cmd] of [
  ['git', 'git --version'],
  ['npm', 'npm --version'],
  ['Claude Code', 'claude --version'],
  ['Codex CLI', 'codex --version'],
]) {
  const r = run(cmd);
  log(`${r.ok ? 'OK ' : 'NG '} ${name}: ${r.out.split('\n')[0]}`);
}
const branch = run('git rev-parse --abbrev-ref HEAD');
log(`${branch.out === 'claude/pattern-hide-family-beta' ? 'OK ' : 'NG '} ブランチ: ${branch.out}`);
log(process.env.OPENAI_API_KEY ? 'NG  OPENAI_API_KEY が設定されています（Codex が従量課金のAPIを使う可能性。ChatGPTログインで使うなら外してください）' : 'OK  OPENAI_API_KEY は未設定（ChatGPT ログインで使う前提）');

// Codex の実際のオプションを保存（存在しないオプションを推測で使わないため）
const help = run('codex exec --help');
writeFileSync('audit/logs/codex-help.txt', help.out + '\n');
log(help.ok ? 'OK  codex exec --help を audit/logs/codex-help.txt に保存' : 'NG  codex exec --help が実行できません（Codex CLI の導入・ログインを確認）');

log('\n## 依存を入れる（このフォルダの中だけ）');
const ci = spawnSync('npm', ['ci'], { stdio: 'inherit', shell: true });
log(ci.status === 0 ? 'OK  npm ci' : 'NG  npm ci');
log('\n## 画面確認用のブラウザ（Playwright の Chromium。ユーザーのキャッシュフォルダに入ります）');
const pw = spawnSync('npx', ['playwright', 'install', 'chromium'], { stdio: 'inherit', shell: true });
log(pw.status === 0 ? 'OK  Chromium' : 'NG  Chromium の導入に失敗（ネットワークを確認）');
const t = spawnSync('npm', ['test'], { stdio: 'inherit', shell: true });
log(t.status === 0 ? 'OK  単体テスト' : 'NG  単体テスト');
const g = spawnSync('npm', ['run', 'art:guides'], { stdio: 'inherit', shell: true });
log(g.status === 0 ? 'OK  下書きガイド（art-guides/）' : 'NG  下書きガイド');

writeFileSync('audit/logs/home-setup.txt', lines.join('\n') + '\n');
console.log('\n結果は audit/logs/home-setup.txt に保存しました。');
console.log('次に、このフォルダで  claude remote-control  を実行してください。');
