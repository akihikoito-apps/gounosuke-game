// かくして わたす：隠す人が うごくもの を3つまで足せる。探す画面にも出る（ご本人の要望 2026-10-15）
import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, hideOne, tapAt } from './helpers';

test('うごくもの を選ぶと置く画面に出て、3つまで。わたすと探す画面にも出る', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('[data-action="toSearch"]')).toContainText('じゆうに さがす');
  await hideOne(page, 'garden', 'koro', 'stripes', 'garden-fence-1');
  const chips = page.locator('.mv-chip');
  await expect(chips).toHaveCount(5);
  await expect(page.locator('#stage .mv')).toHaveCount(0);
  for (let i = 0; i < 3; i++) await chips.nth(i).click();
  await expect(page.locator('#stage .mv')).toHaveCount(3);
  // 4つめは押せない。1つ外すと また押せる
  await expect(chips.nth(3)).toBeDisabled();
  await chips.nth(0).click();
  await expect(page.locator('#stage .mv')).toHaveCount(2);
  await expect(chips.nth(3)).toBeEnabled();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/hide-movers/place.png' });
  await act(page, 'hideDone');
  await act(page, 'ready');
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  await expect(page.locator('#stage .mv')).toHaveCount(2);
  // うごくもの の上からでも見つけられる
  await tapAt(page, await faceCenter(page, 0));
  await expect(page.locator('.find-msg')).toHaveText('みーつけた！');
});

test('背景を選び直すと、うごくもの は空にもどる', async ({ page }) => {
  await fresh(page);
  await hideOne(page, 'garden', 'koro', 'stripes', 'garden-fence-1');
  await page.locator('.mv-chip').first().click();
  await expect(page.locator('#stage .mv')).toHaveCount(1);
  // 置く画面 → 服 → 友だち、から「もどる」で背景えらびへ
  await act(page, 'backToCostume');
  await act(page, 'backToChars');
  await hideOne(page, 'room', 'koro', 'stripes', 'room-curtain');
  await expect(page.locator('#stage .mv')).toHaveCount(0);
  await expect(page.locator('.mv-chip.on')).toHaveCount(0);
});
