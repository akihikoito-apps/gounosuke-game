// つぎの ごほうびの告知と「を みつけてね」（ご本人の実機テストの要望 2026-10-15）
import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, state, tapAt } from './helpers';

const KEY = 'moyou-kakurenbo-beta';
const SHOTS = 'test-results/rewards';

async function seed(page: import('@playwright/test').Page, course: { cleared: number; current: number; finds: number }, totalFinds: number) {
  await page.evaluate(
    ([k, course, totalFinds]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course,
          collection: { totalFinds, sceneFinds: {} },
        }),
      );
    },
    [KEY, course, totalFinds] as const,
  );
  await page.reload();
}

test('コースを えらぶ：はじめは「つぎの コースで にゃこ」とシール2つを告知し、コース1に にゃこの顔', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 0, current: 1, finds: 0 }, 0);
  await act(page, 'toCourse');
  const up = page.locator('.upcoming .up-row');
  await expect(up).toHaveCount(3);
  await expect(up.nth(0)).toContainText('つぎの コースを クリアすると');
  await expect(up.nth(0)).toContainText('にゃこ');
  await expect(up.nth(2)).toContainText('あと 10かい みつけると');
  await expect(page.locator('[data-course="1"] .tile-friend')).toHaveCount(1);
  await expect(page.locator('[data-course="5"] .tile-friend')).toHaveCount(1);
  await expect(page.locator('[data-course="2"] .tile-friend')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/select-start.png` });
});

test('コースを えらぶ：2コース クリアすると「あと 3コースで ぽぽ」、まるが1つ うまる', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 2, current: 3, finds: 0 }, 23);
  await act(page, 'toCourse');
  const friend = page.locator('.upcoming .up-row.friend');
  await expect(friend).toContainText('あと 3コース クリアすると');
  await expect(friend).toContainText('ぽぽ');
  await expect(friend.locator('.up-dots i')).toHaveCount(4);
  await expect(friend.locator('.up-dots i.on')).toHaveCount(1);
  await expect(page.locator('.upcoming')).toContainText('あと 7かい みつけると');
  await expect(page.locator('[data-course="1"] .tile-friend')).toHaveCount(0); // もう なかま
  // 画面からはみ出さない
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${SHOTS}/select-mid.png` });
});

test('遊ぶ画面：顔の横に「を みつけてね」、ぜんぶ見つけると「みーつけた！」', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 0, current: 1, finds: 0 }, 0);
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="1"]');
  await expect(page.locator('.find-msg')).toHaveText('をみつけてね');
  await page.screenshot({ path: `${SHOTS}/play.png` });
  const s = await state(page);
  for (let i = 0; i < s.session.placements.length; i++) await tapAt(page, await faceCenter(page, i));
  await expect(page.locator('.find-msg')).toHaveText('みーつけた！');
});

test('遊ぶ画面：3人のときも、顔と文字が 画面に おさまる', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 9, current: 10, finds: 0 }, 95);
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="10"]');
  for (let k = 0; k < 12; k++) {
    const n = (await state(page)).session.placements.length;
    if (n === 3) break;
    for (let i = 0; i < n; i++) await tapAt(page, await faceCenter(page, i));
    await act(page, 'nextRound');
  }
  const bar = await page.locator('.bar').boundingBox();
  const msg = await page.locator('.find-msg').boundingBox();
  expect(msg!.x + msg!.width).toBeLessThanOrEqual(bar!.x + bar!.width);
  await page.screenshot({ path: `${SHOTS}/play-3.png` });
});

test('コースクリア：もらったごほうびの下に、つぎの目標（あと 4コースで ぽぽ）', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 0, current: 1, finds: 9 }, 9);
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="1"]');
  const s = await state(page);
  await tapAt(page, await faceCenter(page, 0));
  expect(s.session.placements.length).toBe(1);
  await expect(page.locator('.course-clear .new-friend')).toContainText('にゃこ');
  await expect(page.locator('.course-clear .upcoming.compact')).toContainText('あと 4コース クリアすると');
  await expect(page.locator('.course-clear .upcoming.compact')).toContainText('ぽぽ');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/clear.png` });
});
