import { expect, test } from '@playwright/test';
import { act, faceCenter, findAll, fresh, sameOriginGuard, startSearch, state, tapAt } from './helpers';

test('1. search: start, tutorial, hints, find, clear, again, bye', async ({ page }) => {
  const ext = sameOriginGuard(page);
  await fresh(page);
  await act(page, 'toSearch');
  await act(page, 'startSearch', '[data-scene="room"]');
  await expect(page.locator('[data-screen="tutorial"]')).toBeVisible(); // 初回はチュートリアル
  await act(page, 'tutorialDone');
  await expect(page.locator('.target')).toHaveCount(1);
  // ヒント 3段階（無料・無制限）
  await act(page, 'hint');
  await expect(page.locator('.hint-area')).toHaveCount(1);
  await act(page, 'hint');
  await expect(page.locator('.char.wiggle')).toHaveCount(1);
  await act(page, 'hint');
  await expect(page.locator('.hint-outline')).toHaveCount(1);
  await act(page, 'hint');
  // 外れタップ：何も減らず、赤い表示もない
  await tapAt(page, { x: 20, y: 300 });
  await expect(page.locator('.clear')).toHaveCount(0);
  await findAll(page);
  await expect(page.locator('.target.found')).toHaveCount(1);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  // 3つの選択肢が同じ大きさ
  const sizes = await page.locator('.clear-actions .btn').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  expect(new Set(sizes).size).toBe(1);
  await act(page, 'again');
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  await expect(page.locator('.clear')).toHaveCount(0); // 自動で次へ進まず、新しい1回
  await findAll(page);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  await act(page, 'bye');
  await expect(page.locator('[data-screen="bye"]')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/円|購入|広告|レビュー|評価/);
  expect(ext).toEqual([]);
});

test('normal: up to 3 characters, all findable', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => localStorage.setItem('moyou-kakurenbo-beta', JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'normal', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } })));
  await page.goto('/');
  for (const scene of ['room', 'garden', 'shop']) {
    await startSearch(page, scene, 'normal');
    const n = (await state(page)).session.placements.length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    await findAll(page);
    await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
    await act(page, 'bye');
    await act(page, 'home');
  }
});

test('6. rapid taps, multi-touch, pointercancel and screen switch do not break the game', async ({ page }) => {
  await fresh(page);
  await startSearch(page, 'garden', 'easy');
  const stage = page.locator('#stage');
  // 連打（空白）
  for (let i = 0; i < 25; i++) await page.mouse.click(30 + i * 3, 330);
  // 複数指：2本目の指（isPrimary=false）は無視される
  const p = await faceCenter(page, 0);
  await stage.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: false, clientX: p.x, clientY: p.y, bubbles: true });
  expect((await state(page)).session.found).toEqual([false]);
  await stage.dispatchEvent('pointercancel', { pointerId: 7, bubbles: true });
  // 途中で別の画面に行って戻る（つづきから）
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
  const before = (await state(page)).session.placements;
  await act(page, 'home');
  await act(page, 'resume');
  expect((await state(page)).session.placements).toEqual(before);
  await page.reload();
  await act(page, 'resume');
  expect((await state(page)).session.placements).toEqual(before);
  await page.waitForTimeout(200);
  // 同時に2回タップしても1回分として扱われる
  const q = await faceCenter(page, 0);
  await page.mouse.click(q.x, q.y);
  await page.mouse.click(q.x, q.y);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  expect((await state(page)).session.found).toEqual([true]);
});

test('4/7. coordinates stay correct across sizes and rotation; characters inside scene and not under UI', async ({ page }) => {
  await fresh(page);
  await startSearch(page, 'shop', 'normal');
  const sizes = [
    [375, 667],
    [390, 844],
    [768, 1024],
    [844, 390],
    [667, 375],
  ];
  const s0 = await state(page);
  const n = s0.session.placements.length;
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const svg = await page.locator('#stage svg').boundingBox();
    const buttons = await page.locator('.bar .btn, .targets').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (let i = 0; i < n; i++) {
      const b = (await page.locator(`#stage .char[data-index="${i}"]`).boundingBox())!;
      // シーン内
      expect(b.x).toBeGreaterThanOrEqual(svg!.x - 1);
      expect(b.y).toBeGreaterThanOrEqual(svg!.y - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(svg!.x + svg!.width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(svg!.y + svg!.height + 1);
      // UIと重ならない
      for (const r of buttons) {
        const overlap = b.x < r.right && r.left < b.x + b.width && b.y < r.bottom && r.top < b.y + b.height;
        expect(overlap).toBe(false);
      }
      // 小さすぎない（キャラクター全体の高さ）
      expect(b.height).toBeGreaterThanOrEqual(45);
    }
  }
  // 回転後もタップ位置どおりに見つかる（1体ずつ別サイズで）
  for (let i = 0; i < n; i++) {
    const [w, h] = sizes[(i * 2) % sizes.length];
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await tapAt(page, await faceCenter(page, i));
    expect((await state(page)).session.found[i]).toBe(true);
  }
});

test('15. "おしまい" from the middle of a game ends cleanly without any purchase prompt', async ({ page }) => {
  await fresh(page);
  await startSearch(page, 'room', 'easy');
  await act(page, 'home');
  await expect(page.locator('[data-screen="title"]')).toBeVisible();
  expect(await page.locator('a[href]').count()).toBe(0);
});
