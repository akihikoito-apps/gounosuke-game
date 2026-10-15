import { test } from '@playwright/test';
import { fresh } from './helpers';
test('look', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => localStorage.setItem('moyou-kakurenbo-beta', JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'normal', tutorialSeen: true, newsSeen: 99, trialAllPacks: true, movers: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 10, current: 10, finds: 0 }, collection: { totalFinds: 200, sceneFinds: { night: 60 } } })));
  await page.reload();
  await page.click('[data-action=toSearch]');
  await page.click('[data-diff=normal]', { timeout: 2000 }).catch(() => {});
  await page.click('[data-action=startSearch][data-scene=night]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/night-look.png' });
  await page.goto('/');
  await page.click('[data-action=toMyRoom]');
  await page.click('[data-mr-room=veranda], [data-room=veranda]', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/night-room.png' });
});
