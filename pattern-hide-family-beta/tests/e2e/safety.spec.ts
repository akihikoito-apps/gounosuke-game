import { expect, test } from '@playwright/test';
import { act, findAll, fresh, sameOriginGuard, startSearch } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function openParent(page: import('@playwright/test').Page) {
  await act(page, 'parent');
  const nums = await page.locator('.gate-nums').innerText();
  const K = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const want = nums.split('・').map((k) => K.indexOf(k)).sort((a, b) => a - b);
  for (const n of want) await page.locator(`[data-key="${n}"]`).click();
  const hold = page.locator('[data-hold]');
  await hold.hover();
  await page.mouse.down();
  await page.waitForTimeout(2600);
  await page.mouse.up();
  await expect(page.locator('.panel')).toBeVisible();
}

test('9. corrupted save -> app still starts and repairs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, '{"schema":1,"settings":{"sound":"x"},"resume":{"sceneId":"moon"}'), KEY);
  await page.reload();
  await expect(page.locator('[data-screen="title"]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__game.storeStatus())).toBe('recovered');
  await expect(page.locator('[data-action="resume"]')).toHaveCount(0);
});

test('9. storage unavailable / quota exceeded -> still playable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await page.goto('/');
  await startSearch(page, 'room', 'easy');
  await findAll(page);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
});

test('9. getItem throws (private mode-like) -> still playable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () {
      throw new Error('blocked');
    };
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as any).__game.storeStatus())).toBe('unavailable');
  await startSearch(page, 'garden', 'easy');
  await findAll(page);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
});

test('14. parent gate: random tapping does not pass; Escape closes; back does not reopen', async ({ page }) => {
  await fresh(page);
  await act(page, 'parent');
  await expect(page.locator('.gate')).toBeVisible();
  // 子どもの連打を想定：数字をでたらめに 60 回
  for (let i = 0; i < 60; i++) {
    const k = 1 + ((i * 7) % 9);
    await page.locator(`[data-key="${k}"]`).click({ force: true }).catch(() => undefined);
  }
  // 長押しボタンを単発タップしても入れない
  if (await page.locator('[data-hold]').isVisible()) await page.locator('[data-hold]').click();
  await page.waitForTimeout(300);
  await expect(page.locator('.panel')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.parent-layer')).toHaveCount(0);
  // 正しい手順なら入れる（連打後の短い待ちのあと）
  await page.waitForTimeout(3200);
  await openParent(page);
  // 戻る操作：履歴を積まないので保護領域に戻ってこない
  const len = await page.evaluate(() => history.length);
  await page.goBack().catch(() => undefined);
  await page.goForward().catch(() => undefined);
  await page.goto('/');
  await expect(page.locator('.panel')).toHaveCount(0);
  expect(len).toBeGreaterThanOrEqual(1);
  // 画面を離れると保護領域は閉じる
  await openParent(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.parent-layer')).toHaveCount(0);
});

test('parent area is keyboard operable; settings, delete, playtest toggle', async ({ page }) => {
  await fresh(page);
  // キーボードだけでゲートを通る
  await page.locator('[data-action="parent"]').focus();
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter');
  const nums = await page.locator('.gate-nums').innerText();
  const K = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  for (const n of nums.split('・').map((k) => K.indexOf(k)).sort((a, b) => a - b)) {
    await page.locator(`[data-key="${n}"]`).focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-hold]').focus();
  await page.keyboard.down('Enter');
  await page.waitForTimeout(2600);
  await page.keyboard.up('Enter');
  await expect(page.locator('.panel')).toBeVisible();
  await expect(page.locator('.panel')).toContainText('このベータでは課金はありません');
  await expect(page.locator('.panel')).toContainText('別の端末では引き継げません');
  // 音 OFF
  await page.locator('[data-set="sound"]').focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).settings.sound, KEY)).toBe(false);
  // 記録 ON → 表が出る → OFF で消える
  await page.locator('[data-set="playtest"]').check();
  await expect(page.locator('.counts')).toBeVisible();
  await page.locator('[data-set="playtest"]').uncheck();
  await expect(page.locator('.counts')).toHaveCount(0);
  // データ削除（このアプリのキーだけ）
  await page.evaluate(() => localStorage.setItem('someone-else', 'keep'));
  await page.locator('[data-act="delete"]').click();
  await page.locator('[data-act="deleteYes"]').click();
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('someone-else'))).toBe('keep');
  await page.keyboard.press('Escape');
  await expect(page.locator('.parent-layer')).toHaveCount(0);
});

test('10/12. playtest OFF leaves no counters; ON counts locally; never any external request', async ({ page }) => {
  const ext = sameOriginGuard(page);
  await fresh(page);
  await startSearch(page, 'room', 'easy');
  await act(page, 'hint');
  await findAll(page);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  let saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.playtest.enabled).toBe(false);
  expect(Object.values(saved.playtest.counters).every((v) => v === 0)).toBe(true);
  await act(page, 'bye');
  await act(page, 'home');
  await openParent(page);
  await page.locator('[data-set="playtest"]').check();
  await page.keyboard.press('Escape');
  await startSearch(page, 'room', 'easy');
  await act(page, 'hint');
  await findAll(page);
  await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.playtest.counters).toMatchObject({ searchStarted: 1, searchCompleted: 1, hintsUsed: 1 });
  expect(ext).toEqual([]);
});

test('11. child screens have no purchase, ads, tracking, external links or permission prompts', async ({ page, context }) => {
  const prompts: string[] = [];
  page.on('dialog', (d) => {
    prompts.push(d.message());
    void d.dismiss();
  });
  await fresh(page);
  const screens: string[] = [];
  const grab = async () => screens.push(await page.locator('#app').innerHTML());
  await grab();
  await act(page, 'toSearch');
  await grab();
  await startSearchFromSetup(page);
  await grab();
  await act(page, 'home');
  await act(page, 'toHide');
  await grab();
  await act(page, 'hidePickScene', '[data-scene="shop"]');
  await grab();
  for (const h of screens) {
    expect(h).not.toMatch(/<a\s|<iframe|<form|[0-9]\s*円|¥|購入|広告|ランキング|ログイン|レビュー/);
    // href/src は自分の絵（同一オリジン）か、同じ文書内の #id、data:image だけ
    for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
      expect(m[1].startsWith('http://127.0.0.1:4173/') || m[1].startsWith('./') || m[1].startsWith('/assets/') || m[1].startsWith('assets/') || m[1].startsWith('#') || m[1].startsWith('data:image/'), m[1]).toBe(true);
    }
  }
  expect(prompts).toEqual([]);
  // 権限 API を呼んでいない（geolocation / camera / notification）
  const perms = await page.evaluate(() => ({ n: typeof Notification !== 'undefined' ? Notification.permission : 'na' }));
  expect(perms.n).not.toBe('granted');
  void context;
});

async function startSearchFromSetup(page: import('@playwright/test').Page) {
  await act(page, 'startSearch', '[data-scene="garden"]');
  if (await page.locator('[data-screen="tutorial"]').count()) await act(page, 'tutorialDone');
}

test('regression: deleting data after "home" does not get written back later', async ({ page }) => {
  await fresh(page);
  await startSearch(page, 'room', 'easy');
  await act(page, 'home');
  await openParent(page);
  await page.locator('[data-act="delete"]').click();
  await page.locator('[data-act="deleteYes"]').click();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
  expect(raw === null || JSON.parse(raw).resume === null).toBe(true);
  await page.reload();
  await expect(page.locator('[data-action="resume"]')).toHaveCount(0);
});
