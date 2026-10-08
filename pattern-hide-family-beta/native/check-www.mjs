// iPhone アプリ版（www）の出荷前チェック。build-www.mjs のあとに走らせる。
// 文字列の静的な検査なので「禁止パターンが見つからない」ことの確認であり、通信が無いことの証明ではない。
// 実機（TestFlight）での確認と組み合わせる（RELEASE.md）。
// 使い方（native フォルダで）: node check-www.mjs
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const www = fileURLToPath(new URL('./www/', import.meta.url));
const ng = [];
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
if (!existsSync(join(www, 'index.html'))) { console.error('www/index.html がありません。先に node build-www.mjs を実行してください'); process.exit(1); }
walk(www);
const rel = (f) => relative(www, f).split('\\').join('/');

// 画像（png 等）以外は、すべて文字として調べる
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.woff', '.woff2', '.mp3', '.m4a', '.ogg', '.wav']);
const texts = files.filter((f) => !BINARY.has(extname(f).toLowerCase())).map((f) => ({ f, s: readFileSync(f, 'utf8') }));

// 1. Service Worker：ファイルも登録コードも無い
for (const { f, s } of texts) {
  if (/(^|[\/._-])(sw|service-?worker)([._-][^/]*)?\.js$/i.test(rel(f))) ng.push(`Service Worker らしいファイル ${rel(f)}`);
  if (/serviceWorker\s*\.\s*register|navigator\s*\[\s*['"]serviceWorker['"]\s*\]/.test(s)) ng.push(`Service Worker の登録コード（${rel(f)}）`);
}

// 2. 外部の通信先・遷移先：SVG/XML の名前空間だけは許す。\/ でエスケープされた書き方も見る
const allowed = /^(https?:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink|XML\/1998\/namespace|2000\/xmlns\/?|1999\/xhtml))/;
const urlRe = /(?:https?|wss?|ftp):(?:\/\/|\\\/\\\/)[^\s"'`)<>\\]*/gi;
for (const { f, s } of texts) {
  for (const u of s.match(urlRe) ?? []) if (!allowed.test(u.replace(/\\\//g, '/'))) ng.push(`外部URL ${u}（${rel(f)}）`);
  for (const m of s.match(/\b(?:mailto|tel|sms|itms-apps|itms-services):[^\s"'`)<>]+/gi) ?? []) ng.push(`外部アプリへのリンク ${m}（${rel(f)}）`);
  // スキーム省略（//example.com）の参照：src= / href= / action= / url() の中だけ見る（コメントの // と区別するため）
  for (const m of s.match(/(?:src|href|action)\s*=\s*\\?["']\/\/[^"'\\]+|url\(\s*["']?\/\/[^)]+/gi) ?? []) ng.push(`スキーム省略の外部参照 ${m}（${rel(f)}）`);
}
const js = texts.filter(({ f }) => f.endsWith('.js')).map(({ s }) => s).join('\n');

// 3. 外へ出る操作・通信の API（ゲームでは使っていない）
for (const [re, what] of [
  [/\bwindow\.open\s*\(/, 'window.open'],
  [/\bnew\s+WebSocket\b/, 'WebSocket'],
  [/\bnew\s+EventSource\b/, 'EventSource'],
  [/\bsendBeacon\b/, 'sendBeacon'],
  [/\bRTCPeerConnection\b/, 'WebRTC'],
  [/target\s*=\s*\\?["']_blank/, 'target="_blank" のリンク'],
]) if (re.test(js)) ng.push(`外へ出る処理 ${what} が含まれています`);

// 4. CSP：中身まで確かめる（緩い設定で合格しないように）
const html = readFileSync(join(www, 'index.html'), 'utf8');
const cspM = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
if (!cspM) ng.push('Content-Security-Policy が見当たりません');
else {
  const dir = Object.fromEntries(cspM[1].split(';').map((d) => d.trim().split(/\s+/)).filter((p) => p[0]).map(([k, ...v]) => [k, v]));
  const need = { 'default-src': ["'self'"], 'script-src': ["'self'"], 'connect-src': ["'self'"], 'object-src': ["'none'"], 'frame-src': ["'none'"], 'form-action': ["'none'"], 'base-uri': ["'self'"] };
  for (const [k, v] of Object.entries(need)) if (JSON.stringify(dir[k]) !== JSON.stringify(v)) ng.push(`CSP の ${k} が ${dir[k]?.join(' ') ?? '未設定'}（期待：${v.join(' ')}）`);
  for (const [k, v] of Object.entries(dir)) {
    const bad = v.filter((x) => x === '*' || /^(https?|wss?):/.test(x) || (x === "'unsafe-inline'" && k !== 'style-src') || x === "'unsafe-eval'");
    if (bad.length) ng.push(`CSP の ${k} に緩い値 ${bad.join(' ')}`);
  }
}

// 5. テスト版の表示・開発用の入口が残っていない
const shown = [html, js, ...texts.filter(({ f }) => f.endsWith('.webmanifest')).map(({ s }) => s)].join('\n');
for (const w of ['かりの なまえ', '（仮）', '家族テスト版', '__game']) if (shown.includes(w)) ng.push(`「${w}」が残っています`);
if (/<link rel="manifest"/.test(html)) ng.push('manifest の link が残っています（アプリには不要）');

// 6. 大きさ（目安 30MB 以下）
const size = files.reduce((s, f) => s + statSync(f).size, 0);
if (size > 30 * 1024 * 1024) ng.push(`www が大きすぎます（${(size / 1048576).toFixed(1)}MB）`);

if (ng.length) { for (const m of ng) console.error('NG: ' + m); process.exit(1); }
console.log(`www チェック合格（${files.length}ファイル・${(size / 1048576).toFixed(1)}MB）：外部URL・外へ出る処理・Service Worker・緩い CSP・テスト版の表示は見つかりませんでした（静的検査。実機での確認と組み合わせる）`);
