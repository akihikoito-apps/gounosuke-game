// オフライン：(a) 開いたまま通信OFFで操作 (b) Service Worker でリロード
// (c) ブラウザを閉じて、配信サーバーに届かない状態で再起動
import { chromium, expect, test } from '@playwright/test';
import { act, findAll, fresh, startSearch } from './helpers';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });

  test('13a. once opened, play continues with network OFF', async ({ page, context }) => {
    await fresh(page);
    await context.setOffline(true);
    await startSearch(page, 'shop', 'normal');
    await findAll(page);
    await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
    await context.setOffline(false);
  });

  test('13b. service worker: reload while offline still starts the app', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // SW の管理下に入る
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('[data-screen="title"]')).toBeVisible();
    await startSearch(page, 'room', 'easy');
    await findAll(page);
    await expect(page.locator('.clear')).toBeVisible({ timeout: 4000 });
    await context.setOffline(false);
  });

  test('13c. close browser, relaunch offline (persistent profile) -> app starts from cache', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'phfb-'));
    let ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 390, height: 844 } });
    let page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await ctx.close(); // ブラウザを閉じる
    ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 390, height: 844 }, offline: true });
    page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('[data-screen="title"]')).toBeVisible();
    await act(page, 'toSearch');
    await expect(page.locator('.scene-card')).toHaveCount(3);
    await ctx.close();
  });
});
