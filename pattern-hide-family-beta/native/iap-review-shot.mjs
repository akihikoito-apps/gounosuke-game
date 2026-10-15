// アプリ内課金の「審査用スクリーンショット」：保護者の画面の 追加パック の欄（iPhone 6.9インチ 1320×2868）。
// 価格は Apple から取れないので、撮影のときだけ 日本の価格（案）を表示する。
// 使い方（native フォルダで）: node build-www.mjs && node iap-review-shot.mjs → store-shots/iap-review.png
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'www');
mkdirSync(join(here, 'store-shots'), { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const srv = http
  .createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = join(root, p);
    if (!existsSync(f)) return r.writeHead(404).end();
    r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(readFileSync(f));
  })
  .listen(4197);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => {
  const P = 'com.akihikoito.moyoukakurenbo.';
  const price = { morecourses: '¥480', beach: '¥400', forest: '¥400', aquarium: '¥400', night: '¥400', allpacks: '¥1,480' };
  window.Capacitor = {
    Plugins: {
      NativePurchases: {
        getPurchases: async () => ({ purchases: [] }),
        getProducts: async () => ({ products: Object.entries(price).map(([k, v]) => ({ identifier: P + k, priceString: v })) }),
        purchaseProduct: async () => ({}),
        restorePurchases: async () => {},
      },
    },
  };
  localStorage.setItem('moyou-kakurenbo-beta', JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true, newsSeen: 99 }, resume: null, playtest: { enabled: false, counters: {} } }));
});
const p = await ctx.newPage();
await p.goto('http://localhost:4197/');
await p.waitForTimeout(800);
await p.click('[data-action=parent]');
const K = '〇一二三四五六七八九';
const nums = (await p.textContent('.gate-nums')).split('・').map((c) => K.indexOf(c.trim())).sort((a, c) => a - c);
for (const n of nums) {
  await p.click(`[data-key="${n}"]`);
  await p.waitForTimeout(450);
}
const hb = await p.$('[data-hold]');
const bx = await hb.boundingBox();
await p.mouse.move(bx.x + 20, bx.y + 20);
await p.mouse.down();
await p.waitForTimeout(2600);
await p.mouse.up();
await p.waitForTimeout(1200);
await p.$eval('.shop', (e) => e.scrollIntoView({ block: 'start' }));
await p.waitForTimeout(400);
await p.screenshot({ path: join(here, 'store-shots', 'iap-review.png') });
await b.close();
srv.close();
console.log('store-shots/iap-review.png を書き出しました');
