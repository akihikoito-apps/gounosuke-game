// はじめて遊ぶとき、最初に押すボタン（コースで あそぶ → コース1）が ゆれて目立つ。1回見つけたら消える（家族テスト 11/4）
import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, tapAt } from './helpers';

test('はじめては「コースで あそぶ」と コース1 が目立ち、1回見つけたら ふつうに戻る', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('[data-action="toCourse"].beckon')).toHaveCount(1);
  await act(page, 'toCourse');
  await expect(page.locator('[data-course="1"].beckon')).toHaveCount(1);
  await expect(page.locator('.course-tile.beckon')).toHaveCount(1);
  await act(page, 'pickCourse', '[data-course="1"]');
  if (await page.locator('[data-screen="tutorial"]').count()) await act(page, 'tutorialDone');
  await tapAt(page, await faceCenter(page, 0));
  await page.goto('/');
  await expect(page.locator('[data-screen="title"]')).toBeVisible();
  await expect(page.locator('.beckon')).toHaveCount(0);
});
