// タイトル画面のボタンが、どの画面の大きさでも重ならず、文字も切れない（ご本人の実機 iPhone で下の3つが重なった 2026-10-15）
import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

const KEY = 'moyou-kakurenbo-beta';
const SIZES = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 440, height: 956 },
  { width: 844, height: 390 },
  { width: 1032, height: 1376 },
  { width: 1376, height: 1032 },
];

for (const size of SIZES) {
  test(`タイトルのボタンが重ならない ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await fresh(page);
    // シールの数が いちばん長い表示（2けた/2けた）になるよう、たくさん遊んだ保存にする
    await page.evaluate((k) => {
      localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true, newsSeen: 99 }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 5, current: 6, finds: 0 }, collection: { totalFinds: 400, sceneFinds: { room: 100, garden: 100, shop: 100 } } }));
    }, KEY);
    await page.reload();
    const boxes = await page.$$eval('[data-screen="title"] .btn', (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const clipped = [e, ...e.querySelectorAll('*')].some((c) => c.scrollWidth > c.clientWidth + 1 && getComputedStyle(c).overflow !== 'visible') || e.scrollWidth > e.clientWidth + 1;
        return { a: (e as HTMLElement).dataset.action, x: r.x, y: r.y, w: r.width, h: r.height, clipped };
      }),
    );
    for (const b of boxes) {
      expect(b.clipped, `${b.a} の文字が切れている`).toBe(false);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(size.width + 0.5);
      expect(b.y + b.h).toBeLessThanOrEqual(size.height + 0.5);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const p = boxes[i], q = boxes[j];
        const overlap = p.x < q.x + q.w - 0.5 && q.x < p.x + p.w - 0.5 && p.y < q.y + q.h - 0.5 && q.y < p.y + p.h - 0.5;
        expect(overlap, `${p.a} と ${q.a} が重なっている`).toBe(false);
      }
    await page.screenshot({ path: `test-results/title-layout/${size.width}x${size.height}.png` });
  });
}
