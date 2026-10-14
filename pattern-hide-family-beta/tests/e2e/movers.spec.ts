// うごくもの（コース）：コース1は なし、後半は前を横切る、保護者が切れる、タップは さえぎらない
import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, state, tapAt } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function seed(page: import('@playwright/test').Page, cleared: number, movers = true) {
  await page.evaluate(
    ([k, cleared, movers]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: { cleared, current: Math.min(10, (cleared as number) + 1), finds: 0 },
          collection: { totalFinds: (cleared as number) * 10, sceneFinds: {} },
        }),
      );
    },
    [KEY, cleared, movers] as const,
  );
  await page.reload();
}

test('コース1は うごくもの なし、コース7は 3つ（前を通るものを含む）。上から押しても友だちが見つかる', async ({ page }) => {
  await fresh(page);
  await seed(page, 6);
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="1"]');
  await expect(page.locator('#stage .mv')).toHaveCount(0);
  await act(page, 'home');
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="7"]');
  await expect(page.locator('#stage .mv')).toHaveCount(3);
  await expect(page.locator('#stage .movers.front .mv')).not.toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/movers/course7.png' });
  // 見つけても、うごくものは そのまま（数が変わらない）
  const s = await state(page);
  await tapAt(page, await faceCenter(page, 0));
  await expect(page.locator('#stage .mv')).toHaveCount(3);
  expect((await state(page)).session.found[0]).toBe(true);
  expect(s.session.placements.length).toBeGreaterThan(0);
});

test('保護者が「うごくものを出す」を切ると、出ない', async ({ page }) => {
  await fresh(page);
  await seed(page, 9, false);
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="10"]');
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  await expect(page.locator('#stage .mv')).toHaveCount(0);
});
