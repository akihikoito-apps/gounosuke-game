// じぶんの へや：開く・棚から置く・動かす・座らせる・しまう・保存・部屋の数（無料は2部屋まで）
import { expect, test } from '@playwright/test';
import { act, fresh } from './helpers';

const KEY = 'moyou-kakurenbo-beta';
const SHOTS = 'test-results/myroom';

async function seed(page: import('@playwright/test').Page, cleared: number, myroom?: unknown) {
  await page.evaluate(
    ([k, cleared, myroom]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: { cleared, current: Math.min(10, (cleared as number) + 1), finds: 0 },
          collection: { totalFinds: (cleared as number) * 10, sceneFinds: {} },
          ...(myroom ? { myroom } : {}),
        }),
      );
    },
    [KEY, cleared, myroom ?? null] as const,
  );
  await page.reload();
}

const saved = (page: import('@playwright/test').Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).myroom, KEY);

test('はじめて開くと リビングに ソファ・テーブル・ラグ と ころ。コース0なら部屋は1つ', async ({ page }) => {
  await fresh(page);
  await seed(page, 0);
  await act(page, 'toMyRoom');
  await expect(page.locator('[data-screen="myroom"]')).toBeVisible();
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  await expect(page.locator('.mr-obj')).toHaveCount(4);
  await expect(page.locator('.mr-room-tab')).toHaveCount(0);
  const m = await saved(page);
  expect(m.layouts.living.map((p: { ref: string }) => p.ref).sort()).toEqual(['char:koro', 'item:rug', 'item:sofa', 'item:table']);
  await page.screenshot({ path: `${SHOTS}/start.png` });
});

test('棚の友だちをタップすると置け、もう一度タップで しまえる。もの は シールの分だけ', async ({ page }) => {
  await fresh(page);
  await seed(page, 4);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-cell')).toHaveCount(4); // ころ・みみ・もこ・にゃこ
  await page.locator('[data-mr-ref="char:mimi"]').click();
  await expect(page.locator('.mr-obj.mr-char')).toHaveCount(2);
  await page.locator('[data-mr-ref="char:mimi"]').click();
  await expect(page.locator('.mr-obj.mr-char')).toHaveCount(1);
  await page.locator('[data-mr-tab="items"]').click();
  // はじめから3つ＋コース1〜4のシール4つ＋10・30かい の2つ
  await expect(page.locator('.mr-cell')).toHaveCount(9);
  await expect(page.locator('[data-mr-ref="item:bed"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:swing"]')).toHaveCount(0);
});

test('友だちを ソファへ ドラッグすると座り、ソファを動かすと いっしょに動く。保存される', async ({ page }) => {
  await fresh(page);
  await seed(page, 0);
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  const koro = page.locator('.mr-obj.mr-char').first();
  const sofaIdx = (await saved(page)).layouts.living.findIndex((p: { ref: string }) => p.ref === 'item:sofa');
  const sofa = page.locator(`.mr-obj.mr-item[data-idx="${sofaIdx}"]`);
  const kb = (await koro.boundingBox())!;
  const sb = (await sofa.boundingBox())!;
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width * 0.3, sb.y + sb.height * 0.62, { steps: 8 });
  await page.mouse.up();
  let m = await saved(page);
  expect(m.layouts.living.find((p: { ref: string }) => p.ref === 'char:koro').on).toBeTruthy();
  await page.screenshot({ path: `${SHOTS}/seated.png` });
  // ソファを右へ（座ったまま）
  const sb2 = (await page.locator(`.mr-obj.mr-item[data-idx="${sofaIdx}"]`).boundingBox())!;
  await page.mouse.move(sb2.x + sb2.width * 0.85, sb2.y + sb2.height * 0.9);
  await page.mouse.down();
  await page.mouse.move(sb2.x + sb2.width * 0.85 + 50, sb2.y + sb2.height * 0.9 + 20, { steps: 6 });
  await page.mouse.up();
  m = await saved(page);
  expect(m.layouts.living.find((p: { ref: string }) => p.ref === 'char:koro').on).toBeTruthy();
  await page.reload();
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-obj.seated')).toHaveCount(1);
});

test('棚へ ドラッグして もどすと しまえる', async ({ page }) => {
  await fresh(page);
  await seed(page, 0);
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  const tableIdx = (await saved(page)).layouts.living.findIndex((p: { ref: string }) => p.ref === 'item:table');
  const t = (await page.locator(`.mr-obj.mr-item[data-idx="${tableIdx}"]`).boundingBox())!;
  const tray = (await page.locator('.mr-tray').boundingBox())!;
  await page.mouse.move(t.x + t.width / 2, t.y + t.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.mr-obj')).toHaveCount(3);
});

test('コース3で しんしつ、無料の範囲は2部屋まで。コース6以降で おにわ（追加パック）', async ({ page }) => {
  await fresh(page);
  await seed(page, 3);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveCount(2);
  await page.locator('[data-mr-room="bedroom"]').click();
  await expect(page.locator('.mr-room-tab.on')).toHaveText('しんしつ');
  await page.locator('[data-mr-tab="items"]').click();
  await page.locator('[data-mr-ref="item:bed"]').click();
  await page.locator('[data-mr-tab="chars"]').click();
  await page.locator('[data-mr-ref="char:moko"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/bedroom.png` });
  await seed(page, 9);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveCount(3);
  await page.locator('[data-mr-room="yard"]').click();
  await page.locator('[data-mr-tab="items"]').click();
  await page.locator('[data-mr-ref="item:swing"]').click();
  await page.locator('[data-mr-ref="item:plant"]').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/yard.png` });
});

test('壊れた保存データでも開ける（その部屋だけ初めからに）', async ({ page }) => {
  await fresh(page);
  await seed(page, 3, { layouts: { living: [{ ref: 'item:nope', x: 'a', y: 1 }], bedroom: 'x' }, current: 'zzz' });
  await act(page, 'toMyRoom');
  await expect(page.locator('[data-screen="myroom"]')).toBeVisible();
  await expect(page.locator('.mr-obj')).toHaveCount(4);
});
