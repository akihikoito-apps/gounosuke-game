// 発売前の仕上げ（Codex 最終点検97）：あそびかた・あたらしく なったよ・無料の最後のコース・部屋の並びを守る
import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, state, tapAt } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function seed(page: import('@playwright/test').Page, o: { cleared: number; finds?: number; trial?: boolean; newsSeen?: number; myroom?: unknown; sceneFinds?: Record<string, number> }) {
  await page.evaluate(
    ([k, o]) => {
      const x = o as { cleared: number; finds?: number; trial?: boolean; newsSeen?: number; myroom?: unknown; sceneFinds?: Record<string, number> };
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true, trialAllPacks: x.trial ?? false, ...(x.newsSeen !== undefined ? { newsSeen: x.newsSeen } : {}) },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: { cleared: x.cleared, current: Math.min(10, x.cleared + 1), finds: x.finds ?? 0 },
          collection: { totalFinds: x.cleared * 10, sceneFinds: x.sceneFinds ?? {} },
          ...(x.myroom ? { myroom: x.myroom } : {}),
        }),
      );
    },
    [KEY, o] as const,
  );
  await page.reload();
}

test('トップの「あそびかた」：説明を見て、もどるとトップ、やってみる で 無料の へや', async ({ page }) => {
  await fresh(page);
  await act(page, 'howto');
  await expect(page.locator('[data-screen="tutorial"]')).toBeVisible();
  await act(page, 'backFromTutorial');
  await expect(page.locator('[data-screen="title"]')).toBeVisible();
  await act(page, 'howto');
  await act(page, 'tutorialDone');
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  expect((await state(page)).session.sceneId).toBe('room');
});

test('「あたらしく なったよ」：前の版から更新した人には1回だけ出て、わかった で消える', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('.news')).toHaveCount(0); // はじめて入れた人
  await seed(page, { cleared: 2, newsSeen: 1 });
  await expect(page.locator('.news')).toBeVisible();
  await act(page, 'newsOk');
  await expect(page.locator('.news')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.news')).toHaveCount(0);
});

test('無料の最後のコース（コース5）：「つぎの コース」ではなく「きほんの コースを ぜんぶ クリア」と じぶんの へや', async ({ page }) => {
  await fresh(page);
  await seed(page, { cleared: 4, finds: 9 });
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="5"]');
  const s = await state(page);
  for (let i = 0; i < s.session.placements.length; i++) await tapAt(page, await faceCenter(page, i));
  await expect(page.locator('.course-clear')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.course-clear')).toContainText('きほんの コースを ぜんぶ クリア');
  await expect(page.locator('.course-clear [data-action="nextCourse"]')).toHaveCount(0);
  await act(page, 'toMyRoom');
  await expect(page.locator('[data-screen="myroom"]')).toBeVisible();
});

test('パックが使えなくなっても、部屋の並びは消えない（もどれば また出る）。閉じた部屋に残った無料の子は ほかで使える', async ({ page }) => {
  await fresh(page);
  const living = [{ ref: 'item:sofa', x: 500, y: 700 }, { ref: 'item:shell-sofa', x: 300, y: 800 }];
  const aq = [{ ref: 'char:koro', x: 500, y: 900 }];
  await seed(page, { cleared: 2, trial: false, sceneFinds: { aquarium: 3 }, myroom: { layouts: { living, 'aquarium-room': aq }, current: 'living' } });
  await act(page, 'toMyRoom');
  // かいがらの ソファ（すいぞくかんパック）は見えない
  await expect(page.locator('.mr-obj')).toHaveCount(1);
  // 無料のソファを動かして保存しても…
  await page.locator('[data-mr-tab="furniture"]').click();
  await page.locator('[data-mr-ref="item:table"]').click();
  let m = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).myroom, KEY);
  expect(m.layouts.living.some((p: { ref: string }) => p.ref === 'item:shell-sofa')).toBe(true);
  // 閉じた すいぞくかんの へや にいた ころ は、リビングに つれてこられる
  await page.locator('[data-mr-tab="chars"]').click();
  await expect(page.locator('[data-mr-ref="char:koro"]')).not.toHaveClass(/elsewhere/);
  await page.locator('[data-mr-ref="char:koro"]').click();
  m = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).myroom, KEY);
  expect(m.layouts.living.some((p: { ref: string }) => p.ref === 'char:koro')).toBe(true);
  expect(m.layouts['aquarium-room'].some((p: { ref: string }) => p.ref === 'char:koro')).toBe(false);
  // パックが もどると、かいがらの ソファが また出る
  await seed(page, { cleared: 2, trial: true, sceneFinds: { aquarium: 3 }, myroom: m });
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-obj[data-idx]')).toHaveCount(4);
});
