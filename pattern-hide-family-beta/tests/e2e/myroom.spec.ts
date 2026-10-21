// じぶんの へや：開く・棚から置く・動かす・座らせる・しまう・保存・部屋の数（無料は2部屋まで）
import { expect, test } from '@playwright/test';
import { act, fresh } from './helpers';

const KEY = 'moyou-kakurenbo-beta';
const SHOTS = 'test-results/myroom';

async function seed(page: import('@playwright/test').Page, cleared: number, myroom?: unknown, sceneFinds: Record<string, number> = {}) {
  await page.evaluate(
    ([k, cleared, myroom, sceneFinds]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: { cleared, current: Math.min(10, (cleared as number) + 1), finds: 0 },
          collection: { totalFinds: (cleared as number) * 10, sceneFinds },
          ...(myroom ? { myroom } : {}),
        }),
      );
    },
    [KEY, cleared, myroom ?? null, sceneFinds] as const,
  );
  await page.reload();
}

const saved = (page: import('@playwright/test').Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).myroom, KEY);

test('はじめて開くと リビングに ソファ・テーブル・ラグ と ころ。はじめは リビングだけ', async ({ page }) => {
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
  // もの は ジャンルの タブに分かれる（持っているジャンルだけ）
  await page.locator('[data-mr-tab="furniture"]').click();
  await expect(page.locator('[data-mr-ref="item:bed"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:ball"]')).toHaveCount(0);
  await page.locator('[data-mr-tab="toy"]').click();
  await expect(page.locator('[data-mr-ref="item:ball"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:swing"]')).toHaveCount(0);
  await expect(page.locator('[data-mr-tab="animal"]')).toHaveCount(0); // いきもの は まだ持っていない（こいぬ は コース10）
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

test('部屋は ゆっくり増える：コース5で ひみつきち、コース6で しんしつ、パックの部屋は その背景で初めて見つけたら', async ({ page }) => {
  await fresh(page);
  await seed(page, 4);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveCount(0);
  await seed(page, 5);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveText(['リビング', 'ひみつきち']);
  await seed(page, 6);
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveText(['リビング', 'ひみつきち', 'しんしつ']);
  await seed(page, 10, undefined, { forest: 1, aquarium: 1 });
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-room-tab')).toHaveCount(5);
  await page.locator('[data-mr-room="yard"]').click();
  await page.locator('[data-mr-tab="toy"]').click();
  await page.locator('[data-mr-ref="item:swing"]').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/yard.png` });
});

test('同じ友だち・物は 1つの部屋にだけ。ほかの部屋に いる子を タップすると おひっこし して ここに来る', async ({ page }) => {
  await fresh(page);
  await seed(page, 5);
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  await page.locator('[data-mr-room="treehouse"]').click();
  await expect(page.locator('.mr-room-tab.on')).toHaveText('ひみつきち');
  // リビングに いる ころ は、うすく＋リビングの絵
  const koro = page.locator('[data-mr-ref="char:koro"]');
  await expect(koro).toHaveClass(/elsewhere/);
  await page.locator('[data-mr-tab="furniture"]').click();
  await expect(page.locator('[data-mr-ref="item:sofa"]')).toHaveClass(/elsewhere/);
  await page.screenshot({ path: `${SHOTS}/elsewhere.png` });
  // タップすると おひっこし（リビングからは いなくなる）
  await page.locator('[data-mr-tab="chars"]').click();
  await page.locator('[data-mr-ref="char:koro"]').click();
  await expect(page.locator('.mr-hint')).toContainText('リビング');
  await expect(page.locator('.mr-obj.mr-char')).toHaveCount(1);
  const m = await saved(page);
  expect(m.layouts.living.some((p: { ref: string }) => p.ref === 'char:koro')).toBe(false);
  expect(m.layouts.treehouse.some((p: { ref: string }) => p.ref === 'char:koro')).toBe(true);
  // ソファから降ろされた ほかの物は そのまま（ソファは リビングに残る）
  expect(m.layouts.living.some((p: { ref: string }) => p.ref === 'item:sofa')).toBe(true);
});

test('前の保存データで 同じ子が2つの部屋にいても、先の部屋にだけ出る', async ({ page }) => {
  await fresh(page);
  await seed(page, 5, { layouts: { living: [{ ref: 'char:mimi', x: 500, y: 900 }], treehouse: [{ ref: 'char:mimi', x: 500, y: 900 }] }, current: 'treehouse' });
  await act(page, 'toMyRoom');
  await expect(page.locator('.mr-obj')).toHaveCount(0);
  await expect(page.locator('[data-mr-ref="char:mimi"]')).toHaveClass(/elsewhere/);
});

test('壊れた保存データでも開ける（その部屋だけ初めからに）', async ({ page }) => {
  await fresh(page);
  await seed(page, 3, { layouts: { living: [{ ref: 'item:nope', x: 'a', y: 1 }], bedroom: 'x' }, current: 'zzz' });
  await act(page, 'toMyRoom');
  await expect(page.locator('[data-screen="myroom"]')).toBeVisible();
  await expect(page.locator('.mr-obj')).toHaveCount(4);
});

test('新しいおもちゃ・うきわの座席ゆれ・旧 star-rug / music-box の互換表示が動く', async ({ page }) => {
  await fresh(page);
  await seed(
    page,
    8,
    {
      layouts: {
        veranda: [
          { ref: 'item:star-rug', x: 500, y: 820 },
          { ref: 'item:music-box', x: 320, y: 780 },
          { ref: 'item:floatring', x: 640, y: 820 },
          { ref: 'char:koro', x: 640, y: 780, on: { idx: 2, seat: 0 } },
        ],
      },
      current: 'veranda',
    },
    { beach: 10, forest: 5, night: 15 },
  );
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  // 旧保存データの star-rug / music-box も壊れず部屋に残っており、うきわに座った ころ もゆれる
  await expect(page.locator('.mr-obj')).toHaveCount(4);
  await expect(page.locator('.mr-obj.mr-char.seated.mr-m-bob')).toHaveCount(1);
  // 棚のおもちゃタブには きしゃの おもちゃ・もくば・まるたの シーソー・どんぐり ごま・ほたるかご があり、旧 music-box は並ばない
  await page.locator('[data-mr-tab="toy"]').click();
  await expect(page.locator('[data-mr-ref="item:train-toy"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:rocking-horse"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:log-seesaw"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:acorn-top"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:firefly-jar"]')).toHaveCount(1);
  await expect(page.locator('[data-mr-ref="item:music-box"]')).toHaveCount(0);
  // いきものタブには きんぎょの すいそう がある
  await page.locator('[data-mr-tab="animal"]').click();
  await expect(page.locator('[data-mr-ref="item:goldfish-bowl"]')).toHaveCount(1);
});

// ---- Codex レビュー96 の指摘の再現 ----
test('ブランコの子を引っぱると、指の所へ降りる（二重にずれない）', async ({ page }) => {
  await fresh(page);
  await seed(page, 9, { layouts: { yard: [{ ref: 'item:swing', x: 500, y: 760 }, { ref: 'char:koro', x: 500, y: 760, on: { idx: 0, seat: 0 } }] }, current: 'yard' }, { forest: 1 });
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  const rb = (await page.locator('.mr-obj.rider').boundingBox())!;
  const sx = rb.x + rb.width / 2;
  const sy = rb.y + rb.height * 0.5;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 120, sy + 60, { steps: 8 });
  const mid = (await page.locator('.mr-obj.mr-char.dragging').boundingBox())!;
  // 指から大きく離れない（体の中に指がある）
  expect(Math.abs(mid.x + mid.width / 2 - (sx + 120))).toBeLessThan(mid.width);
  await page.mouse.up();
  const m = await saved(page);
  const k = m.layouts.yard.find((p: { ref: string }) => p.ref === 'char:koro');
  expect(k.on).toBeUndefined();
  await expect(page.locator('.mr-obj.rider')).toHaveCount(0);
});

test('操作の途中で中断（pointercancel）すると、元の並びに もどる', async ({ page }) => {
  await fresh(page);
  await seed(page, 0);
  await act(page, 'toMyRoom');
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  const before = await saved(page);
  const kb = (await page.locator('.mr-obj.mr-char').first().boundingBox())!;
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(kb.x + kb.width / 2 - 100, kb.y - 300, { steps: 6 });
  await page.evaluate(() => document.querySelector('main')!.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })));
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  const kb2 = (await page.locator('.mr-obj.mr-char').first().boundingBox())!;
  expect(Math.abs(kb2.x - kb.x)).toBeLessThan(2);
});

test('横向き：棚の中で指を動かしても、部屋の物は しまわれない', async ({ page }) => {
  await page.setViewportSize({ width: 852, height: 393 });
  await fresh(page);
  await seed(page, 0);
  await act(page, 'toMyRoom');
  await page.locator('[data-mr-tab="furniture"]').click();
  const cell = (await page.locator('[data-mr-ref="item:sofa"]').boundingBox())!;
  await page.mouse.move(cell.x + cell.width / 2, cell.y + cell.height / 2);
  await page.mouse.down();
  await page.mouse.move(cell.x + cell.width / 2, cell.y + cell.height / 2 + 40, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.mr-obj')).toHaveCount(4);
});
