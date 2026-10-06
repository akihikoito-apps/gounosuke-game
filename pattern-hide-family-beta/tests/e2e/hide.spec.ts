import { expect, test } from '@playwright/test';
import { act, faceCenter, fresh, hideOne, state, tapAt } from './helpers';

test('2/3. hide -> handoff (no leak) -> find at the exact placed spot -> swap', async ({ page }) => {
  await fresh(page);
  await hideOne(page, 'garden', 'mimi', 'leaf', 'garden-hedge-3');
  // 編集中は候補が見える
  expect(await page.locator('.candidate').count()).toBeGreaterThan(0);
  await act(page, 'hideDone');
  // 受け渡し画面：シーン・キャラクター・座標が DOM に無い
  await expect(page.locator('[data-screen="handoff"]')).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/garden-hedge|class="char|scene-svg|candidate|data-spot/);
  expect(await page.locator('svg.scene-svg').count()).toBe(0);
  await act(page, 'ready');
  // 探索画面：編集ガイドが残っていない
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  expect(await page.locator('.candidate, .selected-ring, .ghost').count()).toBe(0);
  expect(await page.locator('.edit-layer > *').count()).toBe(0);
  const s = await state(page);
  expect(s.session.placements).toEqual([{ char: 'mimi', spot: 'garden-hedge-3', costume: 'leaf', variant: 'exact' }]);
  await tapAt(page, await faceCenter(page, 0));
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  await act(page, 'swap');
  await expect(page.locator('[data-screen="hideChars"]')).toBeVisible();
});

test('5. placement works by tap->tap (no drag) and by drag; undo and costume change keep things safe', async ({ page }) => {
  await fresh(page);
  await act(page, 'toHide');
  await act(page, 'hidePickScene', '[data-scene="room"]');
  await act(page, 'toggleMulti');
  await act(page, 'pickChar', '[data-char="moko"]');
  await act(page, 'charsNext');
  await act(page, 'costumeNext');
  await page.waitForTimeout(400);
  // タップ→タップ：キャラクターを選び、候補をタップ
  await page.locator('[data-tray="koro"]').click();
  await page.locator('.candidate[data-spot="room-sofa-l"]').click();
  let d = (await state(page)).draft;
  expect(d.placed.koro).toBe('room-sofa-l');
  // ドラッグ：もこ をカーテン付近へ
  const tray = (await page.locator('[data-tray="moko"]').boundingBox())!;
  const svg = (await page.locator('#stage svg').boundingBox())!;
  const scale = Math.min(svg.width, svg.height) / 1000;
  const ox = svg.x + (svg.width - 1000 * scale) / 2;
  const oy = svg.y + (svg.height - 1000 * scale) / 2;
  await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2);
  await page.mouse.down();
  await page.mouse.move(ox + 130 * scale, oy + 560 * scale, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  d = (await state(page)).draft;
  expect(d.placed.moko).toBe('room-curtain');
  // ドラッグ途中の pointercancel は何も変えない
  await page.mouse.move(tray.x + 10, tray.y + 10);
  await page.mouse.down();
  await page.mouse.move(ox + 800 * scale, oy + 900 * scale, { steps: 5 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })));
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await page.locator('.ghost').count()).toBe(0);
  expect((await state(page)).draft.placed.moko).toBe('room-curtain');
  // とりけし：1手ずつ戻る（全消去しない）
  await act(page, 'undo');
  d = (await state(page)).draft;
  expect(d.placed).toEqual({ koro: 'room-sofa-l' });
  expect(d.chars).toEqual(['koro', 'moko']);
  // 服を変える → 置き場所は保持
  await act(page, 'backToCostume');
  await act(page, 'costumeTab', '[data-char="koro"]');
  await act(page, 'pickCostume', '[data-costume="dots"]');
  await act(page, 'costumeNext');
  d = (await state(page)).draft;
  expect(d.placed.koro).toBe('room-sofa-l');
  expect(d.costumes.koro).toBe('dots');
  // 空いた場所のタップでも置ける（いちばん近い安全な候補へ）
  await page.locator('[data-tray="moko"]').click();
  await page.mouse.click(ox + 820 * scale, oy + 880 * scale);
  await page.waitForTimeout(200);
  d = (await state(page)).draft;
  expect(d.placed.moko).toBeTruthy();
  await expect(page.locator('[data-action="hideDone"]')).toBeEnabled();
});

test('resume after hiding starts at the blind handoff screen', async ({ page }) => {
  await fresh(page);
  await hideOne(page, 'shop', 'koro', 'dots', 'shop-wall-1');
  await act(page, 'hideDone');
  await page.reload();
  await act(page, 'resume');
  await expect(page.locator('[data-screen="handoff"]')).toBeVisible();
  expect(await page.locator('svg.scene-svg').count()).toBe(0);
});

test('regression: resume a hide round, then "かくしなおす" and "もういちど" work (no crash)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await fresh(page);
  await hideOne(page, 'room', 'moko', 'dots', 'room-sofa-r');
  await act(page, 'hideDone');
  await act(page, 'ready');
  await act(page, 'home');
  await page.reload();
  await act(page, 'resume');
  await expect(page.locator('[data-screen="handoff"]')).toBeVisible();
  await act(page, 'handoffBack');
  await expect(page.locator('[data-screen="hidePlace"]')).toBeVisible();
  expect((await state(page)).draft.placed).toEqual({ moko: 'room-sofa-r' });
  await act(page, 'hideDone');
  await act(page, 'ready');
  await tapAt(page, await faceCenter(page, 0));
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  await act(page, 'again');
  await expect(page.locator('[data-screen="hidePlace"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keyboard: hide mode can be completed with Tab/Enter only', async ({ page }) => {
  await fresh(page);
  await act(page, 'toHide');
  await act(page, 'hidePickScene', '[data-scene="garden"]');
  await act(page, 'charsNext');
  await act(page, 'costumeNext');
  await page.waitForTimeout(400);
  await page.locator('.candidate[data-spot="garden-fence-1"]').focus();
  await page.keyboard.press('Enter');
  expect((await state(page)).draft.placed.koro).toBe('garden-fence-1');
  await expect(page.locator('[data-action="hideDone"]')).toBeEnabled();
});
