// 実際に操作しながら、画面写真と操作動画を撮る（ビルド済みアプリを vite preview で配信している前提）
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
const BASE = 'http://127.0.0.1:4173/';
mkdirSync('screenshots', { recursive: true });
mkdirSync('video', { recursive: true });
const browser = await chromium.launch();
const wait = (p, ms) => p.waitForTimeout(ms);
async function act(page, a, extra = '', ms = 450) {
  await wait(page, ms);
  await page.locator(`[data-action="${a}"]${extra}`).first().click();
}
async function face(page, i) {
  const b = await page.locator(`#stage .char[data-index="${i}"] .char-head`).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height * 0.6 };
}
const sizes = [
  ['375x667', 375, 667],
  ['390x844', 390, 844],
  ['768x1024', 768, 1024],
  ['844x390-landscape', 844, 390],
];
for (const [name, w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE);
  const shot = (n) => page.screenshot({ path: `screenshots/${name}_${n}.png` });
  await wait(page, 300); await shot('01-title');
  await act(page, 'toSearch'); await wait(page, 300); await shot('02-search-setup');
  await act(page, 'startSearch', '[data-scene="room"]'); await wait(page, 1600); await shot('03-tutorial');
  await act(page, 'tutorialDone'); await wait(page, 400); await shot('04-search-room-easy');
  await act(page, 'hint'); await act(page, 'hint'); await act(page, 'hint'); await wait(page, 300); await shot('05-hint-outline');
  await page.mouse.click(...Object.values(await face(page, 0))); await wait(page, 500); await shot('06-found');
  await wait(page, 1200); await shot('07-clear');
  await act(page, 'bye'); await act(page, 'home');
  await act(page, 'toSearch'); await act(page, 'diff', '[data-diff="normal"]');
  await act(page, 'startSearch', '[data-scene="shop"]'); await wait(page, 400); await shot('08-search-shop-normal');
  await act(page, 'home'); await act(page, 'toHide');
  await act(page, 'hidePickScene', '[data-scene="garden"]'); await wait(page, 300); await shot('09-hide-chars');
  await act(page, 'charsNext'); await act(page, 'pickCostume', '[data-costume="leaf"]'); await wait(page, 300); await shot('10-hide-costume');
  await act(page, 'costumeNext'); await wait(page, 500); await shot('11-hide-place-candidates');
  await page.locator('.candidate[data-spot="garden-hedge-2"]').click(); await wait(page, 400); await shot('12-hide-placed');
  await act(page, 'hideDone'); await wait(page, 500); await shot('13-handoff-blind');
  await act(page, 'ready', '', 800); await wait(page, 400); await shot('14-find-after-handoff');
  await act(page, 'home'); await act(page, 'parent'); await wait(page, 300); await shot('15-parent-gate');
  await ctx.close();
}

// 操作動画：隠す → 渡す → 見つける（スマホ縦）
rmSync('video/tmp', { recursive: true, force: true });
const vctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: false, recordVideo: { dir: 'video/tmp', size: { width: 390, height: 844 } } });
const page = await vctx.newPage();
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.goto(BASE);
await wait(page, 1500);
await act(page, 'toHide', '', 900);
await act(page, 'hidePickScene', '[data-scene="room"]', 1500);
await act(page, 'pickChar', '[data-char="mimi"]', 1500);
await act(page, 'charsNext', '', 1200);
for (const c of ['plain', 'dots', 'check', 'stripes']) await act(page, 'pickCostume', `[data-costume="${c}"]`, 1100);
await act(page, 'costumeNext', '', 1500);
// ドラッグで置く（カーテンの前へ）
const tray = await page.locator('[data-tray="mimi"]').boundingBox();
const svg = await page.locator('#stage svg').boundingBox();
const sc = Math.min(svg.width, svg.height) / 1000;
const ox = svg.x + (svg.width - 1000 * sc) / 2, oy = svg.y + (svg.height - 1000 * sc) / 2;
await wait(page, 1500);
await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2);
await page.mouse.down();
await page.mouse.move(ox + 130 * sc, oy + 560 * sc, { steps: 40 });
await page.mouse.up();
await wait(page, 2200);
await act(page, 'hideDone', '', 600);
await wait(page, 3000);
await act(page, 'ready', '', 800);
await wait(page, 2500);
await act(page, 'hint', '', 400);
await wait(page, 2500);
const f = await face(page, 0);
await page.mouse.move(f.x, f.y, { steps: 20 });
await page.mouse.click(f.x, f.y);
await wait(page, 4000);
await act(page, 'swap', '', 300);
await wait(page, 2000);
const vpath = await page.video().path();
await vctx.close();
renameSync(vpath, 'video/hide-handoff-find.webm');
rmSync('video/tmp', { recursive: true, force: true });
await browser.close();
console.log('done', readdirSync('screenshots').length, 'screenshots');
