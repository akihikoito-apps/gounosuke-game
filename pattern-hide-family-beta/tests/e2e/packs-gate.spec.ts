// 買っていないパックは使えない（ご本人の方針 2026-10-15）。テスト用の切りかえ（保護者の画面）で ためせる
import { expect, test } from '@playwright/test';
import { act, fresh } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function seed(page: import('@playwright/test').Page, cleared: number, trialAllPacks: boolean) {
  await page.evaluate(
    ([k, cleared, trialAllPacks]) =>
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true, trialAllPacks },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: { cleared, current: Math.min(10, (cleared as number) + 1), finds: 0 },
          collection: { totalFinds: (cleared as number) * 10, sceneFinds: { beach: 5, forest: 5, aquarium: 5, night: 5, dino: 5 } },
        }),
      ),
    [KEY, cleared, trialAllPacks] as const,
  );
  await page.reload();
}

test('買っていないと：じゆうに さがす は無料の3つだけ、コース6は開かない、パックの友だち・部屋は出ない', async ({ page }) => {
  await fresh(page);
  await seed(page, 5, false);
  await act(page, 'toSearch');
  await expect(page.locator('.scene-card')).toHaveCount(3);
  for (const s of ['beach', 'forest', 'aquarium', 'night', 'dino']) await expect(page.locator(`.scene-card[data-scene="${s}"]`)).toHaveCount(0);
  await act(page, 'home');
  await act(page, 'toCourse');
  await expect(page.locator('[data-course="6"]')).toBeDisabled();
  await act(page, 'home');
  await act(page, 'toMyRoom');
  // コース5クリアで ひみつきち（無料）。パックの部屋は出ない
  await expect(page.locator('.mr-room-tab')).toHaveText(['リビング', 'ひみつきち']);
  for (const c of ['choki', 'pino', 'puka', 'hika', 'gao']) await expect(page.locator(`[data-mr-ref="char:${c}"]`)).toHaveCount(0);
});

test('保護者の画面の「追加パックを ためす」を入れると、パックが使える', async ({ page }) => {
  await fresh(page);
  await seed(page, 5, true);
  await act(page, 'toSearch');
  await expect(page.locator('.scene-card')).toHaveCount(8);
  await act(page, 'home');
  await act(page, 'toCourse');
  await expect(page.locator('[data-course="6"]')).toBeEnabled();
});
