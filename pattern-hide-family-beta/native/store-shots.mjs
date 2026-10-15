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

// 4コースまでクリア・5コース目の途中。じぶんの へや は家具をいくつか置いた状態。ニュースは見た扱い
const save = {
  schema: 1,
  settings: { sound: true, difficulty: 'easy', tutorialSeen: true, movers: true, newsSeen: 99 },
  resume: null,
  playtest: { enabled: false, counters: { searchStarted: 0, searchCompleted: 0, hintsUsed: 0, hideRounds: 0, durationUnder1m: 0, duration1to3m: 0, durationOver3m: 0 } },
  course: { cleared: 4, current: 5, finds: 3 },
  collection: { totalFinds: 46, sceneFinds: { room: 14, garden: 12, shop: 9 } },
  myroom: {
    current: 'living',
    layouts: {
      living: [
        { ref: 'item:rug', x: 520, y: 900 },
        { ref: 'item:sofa', x: 470, y: 690 },
        { ref: 'item:table', x: 520, y: 900 },
        { ref: 'char:koro', x: 410, y: 600, on: { idx: 1, seat: 0 } },
        { ref: 'char:nyako', x: 530, y: 600, on: { idx: 1, seat: 1 } },
        { ref: 'item:ball', x: 780, y: 940 },
        { ref: 'item:plant', x: 160, y: 760 },
        { ref: 'char:mimi', x: 760, y: 820 },
        { ref: 'item:cushion', x: 300, y: 960 },
      ],
    },
  },
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
  // 追加パックの写真用：Apple の購入の答え（ぜんぶ いり を持っている）を、撮影のときだけ ふりをする
  await ctx.addInitScript(() => {
    window.Capacitor = {
      Plugins: {
        NativePurchases: {
          // 6枚目（追加パック）のときだけ「ぜんぶ いり を持っている」。ほかは無料の状態で撮る
          getPurchases: async () => ({ purchases: localStorage.getItem('shotPacks') ? [{ productIdentifier: 'com.akihikoito.moyoukakurenbo.allpacks' }] : [] }),
          getProducts: async () => ({ products: [] }),
          purchaseProduct: async () => ({}),
          restorePurchases: async () => {},
        },
      },
    };
  });
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
  await p.waitForTimeout(2500);
  await shot('course5');
  await p.goto(URL0);
  await p.click('[data-action=toMyRoom]');
  await shot('myroom');
  await p.goto(URL0);
  await p.click('[data-action=toStickers]');
  await shot('stickers');
  await p.evaluate(() => localStorage.setItem('shotPacks', '1'));
  await p.goto(URL0);
  await p.click('[data-action=toSearch]');
  await p.waitForTimeout(500);
  await p.click('[data-diff=normal]');
  await p.click('[data-action=startSearch][data-scene=forest]');
  await shot('forest');
  await ctx.close();
}
await b.close();
srv.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`画面写真を ${out} に書き出しました`);
