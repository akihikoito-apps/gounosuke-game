// iPhone アプリ版（www）の出荷前チェック。build-www.mjs のあとに走らせる。
// 使い方（native フォルダで）: node check-www.mjs
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const www = new URL('./www/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ng = [];
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
if (!existsSync(join(www, 'index.html'))) { console.error('www/index.html がありません。先に node build-www.mjs を実行してください'); process.exit(1); }
walk(www);

// 1. オフライン用の Service Worker はアプリ版に入れない
if (files.some((f) => /(^|[\/])sw\.js$/.test(f))) ng.push('Service Worker（sw.js）が入っています');
// 2. 外部への通信先が無い（SVG の名前空間だけは許す）
const allowed = new Set(['http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink']);
for (const f of files.filter((f) => ['.html', '.js', '.css', '.svg', '.webmanifest'].includes(extname(f)))) {
  for (const u of readFileSync(f, 'utf8').match(/https?:\/\/[^\s"'`)<>]+/g) ?? []) if (!allowed.has(u)) ng.push(`外部URL ${u}（${f.slice(www.length)}）`);
}
const html = readFileSync(join(www, 'index.html'), 'utf8');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
// 3. 通信先を同じ場所に限る設定がある
if (!/Content-Security-Policy[^>]*default-src 'self'/.test(html)) ng.push('Content-Security-Policy が見当たりません');
// 4. テスト版の表示・開発用の入口が残っていない
if (js.includes('かりの なまえ')) ng.push('「かぞく テスト ばん（かりの なまえ）」が残っています');
if (js.includes('__game')) ng.push('開発用の __game が残っています');
// 5. 大きさ（目安 30MB 以下）
const size = files.reduce((s, f) => s + statSync(f).size, 0);
if (size > 30 * 1024 * 1024) ng.push(`www が大きすぎます（${(size / 1048576).toFixed(1)}MB）`);

if (ng.length) { for (const m of ng) console.error('NG: ' + m); process.exit(1); }
console.log(`www チェック合格（${files.length}ファイル・${(size / 1048576).toFixed(1)}MB・外部通信なし・SWなし・テスト版表示なし）`);
