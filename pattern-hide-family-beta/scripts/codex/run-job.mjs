// Codex に1つの作業（codex-jobs/*.md）を頼み、結果を記録する。
// 使い方: node scripts/codex/run-job.mjs codex-jobs/01-koro.md
// - Codex への指示は「ジョブファイルを読んで実行して」という短い1行だけ（長文の引数でWindowsの引用符が壊れないように）
// - 実行前後の git status を比べ、許可した場所（art/, audit/codex/）以外の変更があれば失敗として報告する（自動で消さない）
// - ログは audit/codex/ に保存し、audit/AGENT_STATUS.md に1行追記する
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const job = process.argv[2];
if (!job || !existsSync(job)) {
  console.error('ジョブファイルを指定してください（例: codex-jobs/01-koro.md）');
  process.exit(2);
}
const cfg = JSON.parse(readFileSync(process.env.CODEX_CONFIG || 'codex.config.json', 'utf8'));
if (process.env.OPENAI_API_KEY && !process.argv.includes('--allow-api-key')) {
  console.error('OPENAI_API_KEY が設定されています。APIの従量課金になる可能性があるため中止しました（ChatGPT ログインで使う前提）。');
  process.exit(3);
}
const status = () => {
  try {
    return execSync('git status --porcelain -uall .', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).replace(/^"|"$/g, ''));
  } catch {
    return [];
  }
};
const prefix = (() => {
  try {
    return execSync('git rev-parse --show-prefix', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
})();
const rel = (p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p);
const before = new Set(status());
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
mkdirSync('audit/codex', { recursive: true });
const logPath = `audit/codex/${stamp}-${basename(job, '.md')}.log`;
const prompt = `Read the file ${job.replace(/\\/g, '/')} and AGENTS.md in this folder, then carry out the job exactly as described. Only write inside the allowed paths listed there.`;
const args = [...cfg.args, prompt];
console.log(`> ${cfg.command} ${cfg.args.join(' ')} "<prompt>"`);
const t0 = Date.now();
const child = spawn(cfg.command, args, { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
let out = '';
child.stdout.on('data', (d) => {
  out += d;
  process.stdout.write(d);
});
child.stderr.on('data', (d) => {
  out += d;
  process.stderr.write(d);
});
const timer = setTimeout(() => {
  out += `\n[run-job] timeout after ${cfg.timeoutMinutes} min, stopping codex\n`;
  child.kill();
}, cfg.timeoutMinutes * 60_000);
child.on('error', (e) => {
  out += `\n[run-job] failed to start: ${e.message}\n`;
});
child.on('close', (code) => {
  clearTimeout(timer);
  const after = status();
  const changed = after.filter((p) => !before.has(p)).map(rel);
  const outside = changed.filter((p) => !cfg.allowedPaths.some((a) => p.startsWith(a)));
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  const summary = [
    `job: ${job}`,
    `exit: ${code}`,
    `minutes: ${mins}`,
    `changed (${changed.length}): ${changed.join(', ') || '-'}`,
    `outside allowed paths (${outside.length}): ${outside.join(', ') || '-'}`,
  ].join('\n');
  writeFileSync(logPath, `${summary}\n\n----- codex output -----\n${out}`);
  appendFileSync(
    'audit/AGENT_STATUS.md',
    `\n- ${new Date().toISOString()} Codex ジョブ \`${job}\`：終了コード ${code}、${mins}分、変更 ${changed.length} 件、許可外 ${outside.length} 件（ログ \`${logPath}\`）`,
  );
  console.log('\n' + summary + `\nlog: ${logPath}`);
  if (/usage limit|rate limit|quota|insufficient|billing/i.test(out)) {
    console.log('[run-job] 利用上限・課金に関する表示がありました。続けずに、ご本人へ報告してください。');
  }
  process.exit(code === 0 && outside.length === 0 ? 0 : 1);
});
