import { expect, test, type Page } from '@playwright/test';
import { act, findAll, state } from './helpers';
import { packDetails } from '../../src/ui/packPreview';
import { PRODUCTS } from '../../src/purchase/store';
import { PACKS } from '../../src/entitlements/entitlements';

const KEY = 'moyou-kakurenbo-beta';
const P = 'com.akihikoito.moyoukakurenbo.';

async function installMockPurchases(page: Page, initialOwned: string[] = [], restorable: string[] = []) {
  await page.addInitScript(
    ({ initialOwned, restorable, prefix }) => {
      const owned = new Set<string>(initialOwned);
      const restoreSet = new Set<string>(restorable);
      const prices: Record<string, string> = {
        morecourses: '¥480',
        beach: '¥480',
        forest: '¥480',
        aquarium: '¥480',
        night: '¥480',
        dino: '¥480',
        allpacks: '¥1,980',
      };
      (window as any).__mockStore = {
        setOwned: (ids: string[]) => {
          owned.clear();
          for (const id of ids) owned.add(id);
        },
        setRestorable: (ids: string[]) => {
          restoreSet.clear();
          for (const id of ids) restoreSet.add(id);
        },
      };
      (window as any).Capacitor = {
        Plugins: {
          NativePurchases: {
            getPurchases: async () => ({
              purchases: [...owned].map((productIdentifier) => ({ productIdentifier })),
            }),
            getProducts: async () => ({
              products: Object.entries(prices).map(([k, priceString]) => ({
                identifier: prefix + k,
                priceString,
              })),
            }),
            purchaseProduct: async ({ productIdentifier }: { productIdentifier: string }) => {
              owned.add(productIdentifier);
              return { productIdentifier };
            },
            restorePurchases: async () => {
              for (const id of restoreSet) owned.add(id);
            },
          },
        },
      };
    },
    { initialOwned, restorable, prefix: P },
  );
}

async function seedSave(page: Page, extra: Record<string, unknown> = {}) {
  await page.goto('/');
  await page.evaluate(
    ([k, ex]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: { sound: false, difficulty: 'easy', tutorialSeen: true, movers: true, newsSeen: 99 },
          resume: null,
          playtest: { enabled: false, optedOut: true, counters: {} },
          course: { cleared: 0, current: 1, finds: 0 },
          collection: { totalFinds: 0, sceneFinds: {}, seenStickers: [] },
          ...(ex as Record<string, unknown>),
        }),
      );
    },
    [KEY, extra] as const,
  );
  await page.reload();
}

async function openParent(page: Page) {
  await act(page, 'parent');
  const nums = await page.locator('.gate-nums').innerText();
  const K = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const want = nums
    .split('・')
    .map((k) => K.indexOf(k.trim()))
    .sort((a, b) => a - b);
  for (const n of want) await page.locator(`[data-key="${n}"]`).click();
  const hold = page.locator('[data-hold]');
  await hold.hover();
  await page.mouse.down();
  await page.waitForTimeout(2500);
  await page.mouse.up();
  await expect(page.locator('.panel')).toBeVisible();
}

function boxesOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }, tol = 1): boolean {
  return a.x + tol < b.x + b.width && a.x + a.width - tol > b.x && a.y + tol < b.y + b.height && a.y + a.height - tol > b.y;
}

test('ショップの「なかみを みる」で各パックの中身が見られ（数字がコード定義と一致）、見本から買って「この背景で あそぶ」でその背景が始まる', async ({ page }) => {
  await installMockPurchases(page, []);
  await seedSave(page, { settings: { sound: false, difficulty: 'normal', tutorialSeen: true, movers: true, newsSeen: 99 } });
  await openParent(page);

  await expect(page.locator('.shop-list .shop-item')).toHaveCount(PRODUCTS.length);

  // 1) 背景パック（うみべ・きょうりゅうの たに）の見本：数字がコード定義と完全一致
  for (const packId of ['beach', 'dino'] as const) {
    const expected = packDetails(packId);
    await page.locator(`[data-act="preview"][data-pack="${packId}"]`).click();
    const preview = page.locator('.pack-preview');
    await expect(preview).toBeVisible();
    await expect(preview.locator(`[data-preview-scene="${expected.scene!.id}"] svg`)).toBeVisible();
    await expect(preview.locator(`[data-preview-friend="${expected.friend!.id}"]`)).toContainText(expected.friend!.name);
    await expect(preview.locator(`[data-preview-room="${expected.room!.id}"] svg`)).toBeVisible();
    await expect(preview.locator('[data-preview-item-count]')).toHaveText(String(expected.items.length));
    await expect(preview.locator('[data-preview-item]')).toHaveCount(expected.items.length);
    for (const item of expected.items) {
      await expect(preview.locator(`[data-preview-item="${item.id}"]`)).toContainText(item.name);
    }
    await expect(preview.locator('[data-preview-mover-count]')).toHaveText(String(expected.moverKinds.length));
    await expect(preview.locator('[data-preview-mover]')).toHaveCount(expected.moverKinds.length);
    for (const mv of expected.moverKinds) {
      await expect(preview.locator(`[data-preview-mover="${mv.kind}"]`)).toContainText(mv.name);
    }
    await expect(preview.locator('[data-preview-sticker-count]')).toHaveText(String(expected.stickers.length));
    await preview.locator('[data-act="closePreview"]').click();
  }

  // 2) つづきの コースの見本
  const mc = packDetails('more-courses');
  await page.locator('[data-act="preview"][data-pack="more-courses"]').click();
  const mcPreview = page.locator('.pack-preview');
  await expect(mcPreview).toContainText('ぼうし・かさで かくれる');
  await expect(mcPreview).toContainText('うごくものが まえを よこぎる');
  await expect(mcPreview).toContainText('最難関モード');
  await expect(mcPreview.locator(`[data-preview-friend="${mc.friend!.id}"]`)).toContainText('おう');
  await expect(mcPreview.locator(`[data-preview-room="${mc.room!.id}"]`)).toContainText('しんしつ');
  await expect(mcPreview.locator('[data-preview-item-count]')).toHaveText(String(mc.items.length));
  await expect(mcPreview.locator('[data-preview-sticker-count]')).toHaveText(String(mc.stickers.length));
  await mcPreview.locator('[data-act="closePreview"]').click();

  // 3) ぜんぶ いり の見本 → 6つのパックが並び、それぞれ「なかみを みる」を押せる
  const paidPacks = PACKS.filter((p) => !p.free);
  await page.locator('[data-act="preview"][data-pack="allpacks"]').click();
  const bundlePreview = page.locator('.pack-preview');
  await expect(bundlePreview.locator('[data-preview-pack-count]')).toHaveText(String(paidPacks.length));
  await expect(bundlePreview.locator('.preview-bundle-item')).toHaveCount(paidPacks.length);

  // ぜんぶ いり の中から うみべ パックの「なかみを みる」を開き、そのまま「¥480 で かう」を押す
  await bundlePreview.locator('[data-act="preview"][data-pack="beach"]').click();
  await expect(page.locator('.pack-preview [data-preview-scene="beach"]')).toBeVisible();
  const buyBtn = page.locator('.pack-preview [data-act="buy"]');
  await expect(buyBtn).toHaveText('¥480 で かう');
  await buyBtn.click();

  // 4) 買った直後の案内が出て、「この背景で あそぶ」で保護者の画面が閉じて うみべ（やさしい）が始まる
  const guide = page.locator('[data-bought-guide]');
  await expect(guide).toBeVisible();
  await expect(guide).toContainText('うみべ パック が あそべるように なりました');
  await expect(guide).toContainText('うみべ');
  await expect(guide).toContainText('ちょき');
  await expect(guide).toContainText('うみべの デッキ');
  await guide.locator('[data-act="playBoughtScene"][data-scene="beach"]').click();

  await expect(page.locator('.parent-layer')).toHaveCount(0);
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
  const s = await state(page);
  expect(s.session.sceneId).toBe('beach');
  expect(s.session.origin).toBe('search');
  expect(s.session.difficulty).toBe('easy');
});

test('「つづきの コース」「購入を 復元」「ぜんぶ いり」でも購入直後の案内が出てコース選択へ進める', async ({ page }) => {
  await installMockPurchases(page, [], [`${P}forest`]);
  await seedSave(page, { course: { cleared: 5, current: 5, finds: 0 } });
  await openParent(page);

  // つづきの コースを買う → 「コース6から あそべます」と「コースを えらぶ」
  await page.locator(`[data-act="buy"][data-product="${P}morecourses"]`).click();
  const guide = page.locator('[data-bought-guide]');
  await expect(guide).toBeVisible();
  await expect(guide).toContainText('コース6から あそべます');
  await guide.locator('[data-act="goBoughtCourses"]').click();
  await expect(page.locator('.parent-layer')).toHaveCount(0);
  await expect(page.locator('[data-screen="courseSelect"]')).toBeVisible();
  await expect(page.locator('[data-action="pickCourse"][data-course="6"]')).toBeEnabled();

  // 購入を 復元 → きのこの もり パック の案内が出る
  await openParent(page);
  await page.locator('[data-act="restore"]').click();
  await expect(page.locator('[data-bought-guide]')).toContainText('きのこの もり パック が あそべるように なりました');
  await page.locator('[data-act="closeBought"]').click();
  await expect(page.locator('[data-bought-guide]')).toHaveCount(0);

  // ぜんぶ いり を買う → 増えた背景がすべて並び「とじる」がある
  await page.locator(`[data-act="buy"][data-product="${P}allpacks"]`).click();
  const allGuide = page.locator('[data-bought-guide]');
  await expect(allGuide).toContainText('ぜんぶ いり が あそべるように なりました');
  for (const name of ['うみべ', 'きのこの もり', 'すいぞくかん', 'ほたるの かわべ', 'きょうりゅうの たに']) {
    await expect(allGuide).toContainText(name);
  }
  await allGuide.locator('[data-act="closeBought"]').click();
  await expect(allGuide).toHaveCount(0);
});

test('コースの「どこで あそぶ？」で背景を選べ、おまかせに戻せ、保存され、遊べない背景は出ず、あたらしい！は1回遊ぶまで付く', async ({ page }) => {
  await installMockPurchases(page, [`${P}beach`]);
  await seedSave(page);

  // じゆうに さがす：遊べる背景（きほん3つ＋うみべ）だけが出て、うみべに「あたらしい！」が付いている
  await act(page, 'toSearch');
  await expect(page.locator('[data-action="startSearch"]')).toHaveCount(4);
  await expect(page.locator('[data-action="startSearch"][data-scene="forest"]')).toHaveCount(0);
  await expect(page.locator('[data-action="startSearch"][data-scene="beach"] .scene-new')).toHaveText('あたらしい！');
  await expect(page.locator('[data-action="startSearch"][data-scene="room"] .scene-new')).toHaveCount(0);
  await act(page, 'home');

  // コース選択：「どこで あそぶ？」の先頭は「おまかせ」、後ろに遊べる背景だけ。うみべに「あたらしい！」
  await act(page, 'toCourse');
  const cards = page.locator('[data-action="pickCourseScene"]');
  await expect(cards).toHaveCount(5); // おまかせ + room, garden, shop, beach
  await expect(cards.first()).toHaveAttribute('data-scene', 'auto');
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="forest"]')).toHaveCount(0);
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="beach"] .scene-new')).toHaveText('あたらしい！');

  // うみべ を選ぶと保存され、再読み込みしても残る
  await act(page, 'pickCourseScene', '[data-scene="beach"]');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="beach"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course.scene, KEY)).toBe('beach');

  await page.reload();
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="beach"]')).toHaveAttribute('aria-pressed', 'true');

  // コース1を始めると、1回目も2回目も出題がすべて「うみべ」になる
  await act(page, 'pickCourse', '[data-course="1"]');
  expect((await state(page)).session.sceneId).toBe('beach');
  await findAll(page);
  await expect(page.locator('[data-action="nextRound"]')).toBeVisible({ timeout: 4000 });
  await act(page, 'nextRound');
  expect((await state(page)).session.sceneId).toBe('beach');

  // 1回遊んだあとは、コース選択でも「じゆうに さがす」でも「あたらしい！」が消える
  await act(page, 'home');
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="beach"] .scene-new')).toHaveCount(0);

  // 「おまかせ」に戻せる（保存データからも消える）
  await act(page, 'pickCourseScene', '[data-scene="auto"]');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="auto"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course.scene, KEY)).toBeUndefined();

  await act(page, 'home');
  await act(page, 'toSearch');
  await expect(page.locator('[data-action="startSearch"][data-scene="beach"] .scene-new')).toHaveCount(0);

  // 遊べなくなった背景（返金など）が保存されていたら「おまかせ」に戻る
  await page.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k)!);
    d.course.scene = 'forest';
    localStorage.setItem(k, JSON.stringify(d));
  }, KEY);
  await page.reload();
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourseScene"][data-scene="auto"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course.scene, KEY)).toBeUndefined();
});

for (const vp of [
  { width: 320, height: 568 },
  { width: 1032, height: 1376 },
]) {
  test(`${vp.width}×${vp.height} でコース選択・さがす・ショップの見本や案内が重ならない`, async ({ page }) => {
    await page.setViewportSize(vp);
    await installMockPurchases(page, [`${P}beach`]);
    await seedSave(page);

    // 1) コース選択画面：ヘッダー・「どこで あそぶ？」・コースタイル・つぎのごほうび が互いに重ならない
    await act(page, 'toCourse');
    const sections = ['.topbar', '.course-scenes', '.course-grid', '.upcoming'];
    const secBoxes = [];
    for (const sel of sections) {
      const box = await page.locator(sel).boundingBox();
      expect(box, sel).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(-1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 2);
      secBoxes.push({ sel, box: box! });
    }
    for (let i = 0; i < secBoxes.length; i++) {
      for (let j = i + 1; j < secBoxes.length; j++) {
        expect(boxesOverlap(secBoxes[i].box, secBoxes[j].box), `${secBoxes[i].sel} vs ${secBoxes[j].sel}`).toBe(false);
      }
    }
    // 「どこで あそぶ？」のカードどうしが重ならない
    const sceneCards = page.locator('.course-scene-card');
    const scCount = await sceneCards.count();
    const scBoxes = [];
    for (let i = 0; i < scCount; i++) scBoxes.push((await sceneCards.nth(i).boundingBox())!);
    for (let i = 0; i < scBoxes.length; i++) {
      for (let j = i + 1; j < scBoxes.length; j++) {
        expect(boxesOverlap(scBoxes[i], scBoxes[j])).toBe(false);
      }
    }

    // 2) じゆうに さがす画面
    await act(page, 'home');
    await act(page, 'toSearch');
    const searchCards = page.locator('.scene-card');
    const sCount = await searchCards.count();
    const sBoxes = [];
    for (let i = 0; i < sCount; i++) sBoxes.push((await searchCards.nth(i).boundingBox())!);
    for (let i = 0; i < sBoxes.length; i++) {
      for (let j = i + 1; j < sBoxes.length; j++) {
        expect(boxesOverlap(sBoxes[i], sBoxes[j])).toBe(false);
      }
    }

    // 3) 保護者の画面：ショップのボタン・見本・購入後の案内のボタンが重ならない
    await act(page, 'home');
    await openParent(page);
    const firstActions = page.locator('.shop-item', { has: page.locator('[data-act="buy"]') }).first().locator('button');
    expect(await firstActions.count()).toBe(2);
    const b0 = (await firstActions.nth(0).boundingBox())!;
    const b1 = (await firstActions.nth(1).boundingBox())!;
    expect(boxesOverlap(b0, b1)).toBe(false);

    await page.locator('[data-act="preview"][data-pack="forest"]').click();
    const prevBtns = page.locator('.pack-preview .preview-actions button');
    const pBoxes = [];
    for (let i = 0; i < (await prevBtns.count()); i++) pBoxes.push((await prevBtns.nth(i).boundingBox())!);
    for (let i = 0; i < pBoxes.length; i++) {
      for (let j = i + 1; j < pBoxes.length; j++) {
        expect(boxesOverlap(pBoxes[i], pBoxes[j])).toBe(false);
      }
    }

    await page.locator(`.pack-preview [data-act="buy"][data-product="${P}forest"]`).click();
    const guideBtns = page.locator('[data-bought-guide] .bought-actions button');
    expect(await guideBtns.count()).toBe(2);
    const g0 = (await guideBtns.nth(0).boundingBox())!;
    const g1 = (await guideBtns.nth(1).boundingBox())!;
    expect(boxesOverlap(g0, g1)).toBe(false);
  });
}
