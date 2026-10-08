import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, state, tapAt } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function findRound(page: import('@playwright/test').Page) {
  const s = await state(page);
  for (let i = 0; i < s.session.placements.length; i++) await tapAt(page, await faceCenter(page, i));
  return s.session.placements.length as number;
}

test('course 1: 10 finds clear the course, unlock course 2, and progress survives a reload', async ({ page }) => {
  await fresh(page);
  await page.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k) ?? 'null') ?? {};
    localStorage.setItem(k, JSON.stringify({ ...d, schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } }));
  }, KEY);
  await page.reload();
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeDisabled();
  await act(page, 'pickCourse', '[data-course="1"]');
  let total = 0;
  for (let round = 0; round < 10 && total < 10; round++) {
    await expect(page.locator('[data-screen="play"]')).toBeVisible();
    total += await findRound(page);
    await expect(page.locator('.course-progress .pip.on')).toHaveCount(total);
    if (total < 10) {
      await expect(page.locator('[data-action="nextRound"]')).toBeVisible({ timeout: 4000 });
      // 途中で再読み込みしても、見つけた回数は残る
      if (round === 2) {
        await page.reload();
        expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course.finds, KEY)).toBe(total);
        await act(page, 'toCourse');
        await act(page, 'pickCourse', '[data-course="1"]');
        continue;
      }
      await act(page, 'nextRound');
    }
  }
  expect(total).toBe(10);
  await expect(page.locator('.course-clear')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('.course-clear')).toContainText('コース1 クリア');
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course, KEY);
  expect(saved).toEqual({ cleared: 1, current: 2, finds: 0 });
  await act(page, 'nextCourse');
  await expect(page.locator('.course-progress .course-no')).toHaveText('2');
  await act(page, 'home');
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeEnabled();
  await expect(page.locator('[data-action="pickCourse"][data-course="3"]')).toBeDisabled();
});

test('course 4 puts a knit hat on, course 6 an umbrella; tapping the hat or umbrella also finds', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 9, current: 4, finds: 0 } })), KEY);
  await page.reload();
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="4"]');
  await expect(page.locator('#stage .char .acc-hat')).toHaveCount(1);
  // 帽子をタッチして見つける
  const hat = await page.locator('#stage .char .acc-hat').boundingBox();
  await tapAt(page, { x: hat!.x + hat!.width / 2, y: hat!.y + hat!.height * 0.35 });
  await expect(page.locator('.course-progress .pip.on')).toHaveCount(1);

  await act(page, 'home');
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="6"]');
  await expect(page.locator('#stage .char .acc-umbrella')).toHaveCount(1);
  const umb = await page.locator('#stage .char .acc-umbrella').boundingBox();
  await tapAt(page, { x: umb!.x + umb!.width * 0.75, y: umb!.y + umb!.height * 0.2 });
  await expect(page.locator('.course-progress .pip.on')).toHaveCount(1);
});

test('a broken course save is repaired and locked courses cannot be started', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 1, current: 9, finds: 5 } })), KEY);
  await page.reload();
  expect(await page.evaluate(() => (window as any).__game.storeStatus())).toBe('recovered');
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="9"]')).toBeDisabled();
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeEnabled();
});
