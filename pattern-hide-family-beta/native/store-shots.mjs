// App Store に出す画面写真を作る（iPhone 6.9インチ 1320×2868・iPad 13インチ 2064×2752）。
// アプリ版の www をそのまま表示し、「少し遊んだあと」の保存データを入れてから撮る。
// 使い方（native フォルダで）: node build-www.mjs && node store-shots.mjs  → store-shots/ に PNG
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'www');
const out = join(here, 'store-shots');
mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http
  .createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = join(root, p);
    if (!existsSync(f)) return r.writeHead(404).end();
    r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(readFileSync(f));
  })
  .listen(4198);
const URL0 = 'http://localhost:4198/';

// 4コースまでクリア・5コース目の途中・うみべで少し遊んだ状態
const save = {
  schema: 1,
  settings: { sound: true, difficulty: 'easy', tutorialSeen: true },
  resume: null,
  playtest: { enabled: false, counters: { searchStarted: 0, searchCompleted: 0, hintsUsed: 0, hideRounds: 0, durationUnder1m: 0, duration1to3m: 0, durationOver3m: 0 } },
  course: { cleared: 4, current: 5, finds: 3 },
  collection: { totalFinds: 46, sceneFinds: { room: 14, garden: 12, shop: 9, beach: 11 } },
};

const devices = [
  { name: 'iphone69', viewport: { width: 440, height: 956 }, scale: 3, mobile: true },
  { name: 'ipad13', viewport: { width: 1032, height: 1376 }, scale: 2, mobile: false },
];
const b = await chromium.launch();
const errs = [];
for (const d of devices) {
  const ctx = await b.newContext({ viewport: d.viewport, deviceScaleFactor: d.scale, hasTouch: true, isMobile: d.mobile });
  await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, ['moyou-kakurenbo-beta', JSON.stringify(save)]);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(`${d.name}: ${e.message}`));
  let n = 0;
  const shot = async (k) => {
    await p.waitForTimeout(1200);
    await p.screenshot({ path: join(out, `${d.name}-${++n}-${k}.png`) });
  };
  await p.goto(URL0);
  await shot('title');
  await p.click('[data-action=toCourse]');
  await shot('courses');
  await p.click('[data-course="5"]');
  await shot('course5');
  await p.goto(URL0);
  await p.click('[data-action=toSearch]');
  await p.waitForTimeout(500);
  await p.click('[data-diff=normal]');
  await p.click('[data-action=startSearch][data-scene=beach]');
  await shot('beach');
  await p.goto(URL0);
  await p.click('[data-action=toStickers]');
  await shot('stickers');
  await ctx.close();
}
await b.close();
srv.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`画面写真を ${out} に書き出しました`);
