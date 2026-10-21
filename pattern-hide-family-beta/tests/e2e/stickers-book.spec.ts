// シールちょう（本のようにめくれる画面）のE2Eテスト
import { expect, test } from '@playwright/test';
import { act, fresh } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function seedSave(
  page: import('@playwright/test').Page,
  opts: {
    cleared?: number;
    current?: number;
    finds?: number;
    totalFinds?: number;
    sceneFinds?: Record<string, number>;
    seenStickers?: string[];
    trialAllPacks?: boolean;
  },
) {
  await page.evaluate(
    ([k, o]) => {
      const col: Record<string, unknown> = {
        totalFinds: o.totalFinds ?? 0,
        sceneFinds: o.sceneFinds ?? {},
      };
      if (o.seenStickers !== undefined) col.seenStickers = o.seenStickers;
      localStorage.setItem(
        k as string,
        JSON.stringify({
          schema: 1,
          settings: {
            sound: false,
            difficulty: 'easy',
            tutorialSeen: true,
            movers: true,
            ...(o.trialAllPacks !== undefined ? { trialAllPacks: o.trialAllPacks } : {}),
          },
          resume: null,
          playtest: { enabled: false, counters: {} },
          course: {
            cleared: o.cleared ?? 0,
            current: o.current ?? Math.min(10, (o.cleared ?? 0) + 1),
            finds: o.finds ?? 0,
          },
          collection: col,
        }),
      );
    },
    [KEY, opts] as const,
  );
  await page.reload();
}

test('ページをめくれる（まえ・つぎ・タブ・横スワイプ）と、コンプリートの印が出る', async ({ page }) => {
  await fresh(page);
  const seen = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'f10'];
  await seedSave(page, { cleared: 10, totalFinds: 18, seenStickers: seen });
  await act(page, 'toStickers');

  // 新しいシールが無いときは、次にもらえそうなシール（あと12かいの f30）がある「みつけた かず」ページから開く
  await expect(page.locator('.sticker-page[data-page="finds"]')).toBeVisible();
  await expect(page.locator('.sticker-dots .dot.on')).toHaveAttribute('data-dot-page', 'finds');

  // 「まえ」ボタンで「コース」ページへ。10枚すべてそろっているので「コンプリート」が出る
  await act(page, 'stickerPrev');
  await expect(page.locator('.sticker-page[data-page="course"]')).toBeVisible();
  await expect(page.locator('.sticker.got')).toHaveCount(10);
  await expect(page.locator('.sticker.locked')).toHaveCount(0);
  await expect(page.locator('.sticker-complete')).toBeVisible();
  await expect(page.locator('.sticker-complete')).toContainText('コンプリート');

  // 「つぎ」ボタンで「みつけた かず」へ
  await act(page, 'stickerNext');
  await expect(page.locator('.sticker-page[data-page="finds"]')).toBeVisible();
  await expect(page.locator('.sticker-complete')).toHaveCount(0);

  // 横スワイプで次の「うみべ」へ、逆スワイプで「みつけた かず」へもどる
  const book = (await page.locator('.sticker-book').boundingBox())!;
  const cy = book.y + book.height / 2;
  await page.mouse.move(book.x + book.width * 0.75, cy);
  await page.mouse.down();
  await page.mouse.move(book.x + book.width * 0.2, cy, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.sticker-page[data-page="beach"]')).toBeVisible();

  await page.mouse.move(book.x + book.width * 0.2, cy);
  await page.mouse.down();
  await page.mouse.move(book.x + book.width * 0.75, cy, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.sticker-page[data-page="finds"]')).toBeVisible();

  // 上のタブで直接ページを選べる
  await act(page, 'stickerPage', '[data-page="forest"]');
  await expect(page.locator('.sticker-page[data-page="forest"]')).toBeVisible();
});

test('もらったシールには家具の絵が出て、タップで大きく見え「へやで あそぶ」でじぶんのへやへ行ける', async ({ page }) => {
  await fresh(page);
  await seedSave(page, { cleared: 2, totalFinds: 10 });
  await act(page, 'toStickers');
  await act(page, 'stickerPage', '[data-page="course"]');

  const c1 = page.locator('.sticker.got[data-sticker="c1"]');
  await expect(c1).toBeVisible();
  await expect(c1.locator('.sticker-gift svg')).toBeVisible();

  // タップで拡大モーダルが開く
  await act(page, 'openSticker', '[data-sticker="c1"]');
  const modal = page.locator('.overlay.sticker-detail');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('ころと ボール');
  await expect(modal).toContainText('へやに ボールが とどいたよ');

  // 「とじる」で閉じる
  await act(page, 'closeSticker');
  await expect(modal).toHaveCount(0);

  // もう一度開いて「へやで あそぶ」で じぶんの へや へ移動できる
  await act(page, 'openSticker', '[data-sticker="c1"]');
  await act(page, 'toMyRoom');
  await expect(page.locator('[data-screen="myroom"]')).toBeVisible();
});

test('あたらしいシールに印とタイトルのバッジが出て、1回見たら消える（古い保存データは見た扱い）', async ({ page }) => {
  await fresh(page);
  // seenStickers が無い古い保存データでは、すでに持っているシールは「見た」扱いになり、一斉に「あたらしい！」が出ない
  await seedSave(page, { cleared: 3, totalFinds: 15 });
  await expect(page.locator('[data-action="toStickers"] .sticker-btn-badge')).toHaveCount(0);
  await act(page, 'toStickers');
  await expect(page.locator('.sticker-new')).toHaveCount(0);
  await act(page, 'home');

  // 前にシールちょうを開いたあとに新しくもらったシール（b1）があるとき
  await seedSave(page, {
    cleared: 3,
    totalFinds: 15,
    sceneFinds: { beach: 1 },
    seenStickers: ['c1', 'c2', 'c3', 'f10'],
  });
  await expect(page.locator('[data-action="toStickers"] .sticker-btn-badge')).toHaveCount(1);

  // 開くと「あたらしいシールがあるページ（うみべ）」が最初に出る
  await act(page, 'toStickers');
  await expect(page.locator('.sticker-page[data-page="beach"]')).toBeVisible();
  await expect(page.locator('[data-sticker="b1"] .sticker-new')).toHaveText('あたらしい！');

  // 1回見てタイトルへもどるとバッジが消え、もう一度シールちょうを開いても「あたらしい！」は出ない
  await act(page, 'home');
  await expect(page.locator('[data-action="toStickers"] .sticker-btn-badge')).toHaveCount(0);
  await act(page, 'toStickers');
  await expect(page.locator('.sticker-new')).toHaveCount(0);
});

test('まだのシールにはシルエットと短い条件が出て、つぎにもらえるシールが目立つ', async ({ page }) => {
  await fresh(page);
  await seedSave(page, { cleared: 6, totalFinds: 18, sceneFinds: { beach: 2 } });
  await act(page, 'toStickers');

  // うみべページ（b1 は獲得済み、次は b5：うみべで あと 3かい）
  await act(page, 'stickerPage', '[data-page="beach"]');
  const b5 = page.locator('.sticker.locked[data-sticker="b5"]');
  await expect(b5).toHaveClass(/next/);
  await expect(b5).toContainText('うみべで あと 3かい');
  await expect(b5.locator('.sticker-art.silhouette')).toBeVisible();
  await expect(b5.locator('.sticker-gift.silhouette')).toBeVisible();
  await expect(b5.locator('.sticker-q')).toHaveText('？');

  // みつけた かずページ（f10 は獲得済み、次は f30：あと 12かい）
  await act(page, 'stickerPage', '[data-page="finds"]');
  const f30 = page.locator('.sticker.locked[data-sticker="f30"]');
  await expect(f30).toHaveClass(/next/);
  await expect(f30).toContainText('あと 12かい');

  // コースページ（c1〜c6 は獲得済み、次は c7：コース7）
  await act(page, 'stickerPage', '[data-page="course"]');
  const c7 = page.locator('.sticker.locked[data-sticker="c7"]');
  await expect(c7).toHaveClass(/next/);
  await expect(c7).toContainText('コース7');
});

test('遊べないパックのページは出ず、購入や価格の案内も一切出ない', async ({ page }) => {
  await fresh(page);
  await seedSave(page, { cleared: 2, totalFinds: 12, trialAllPacks: false });
  await act(page, 'toStickers');

  await expect(page.locator('.stickers h2 .count')).toHaveText('3/15');
  await expect(page.locator('.sticker-tab')).toHaveCount(2);
  await expect(page.locator('.sticker-tab[data-page="course"]')).toBeVisible();
  await expect(page.locator('.sticker-tab[data-page="finds"]')).toBeVisible();
  await expect(page.locator('.sticker-tab[data-page="beach"]')).toHaveCount(0);
  await expect(page.locator('.sticker-tab[data-page="forest"]')).toHaveCount(0);
  await expect(page.locator('.sticker-tab[data-page="aquarium"]')).toHaveCount(0);
  await expect(page.locator('.sticker-tab[data-page="night"]')).toHaveCount(0);

  const text = await page.locator('[data-screen="stickers"]').innerText();
  expect(text).not.toMatch(/[¥￥]|円|購入|価格|広告/);
});

test('320×568 と 1032×1376 で重なり・はみ出しがなく、タップ領域が 56px 以上（まえ・つぎは 64px 以上）', async ({ page }) => {
  await fresh(page);
  await seedSave(page, {
    cleared: 3,
    totalFinds: 15,
    sceneFinds: { beach: 1 },
    seenStickers: ['c1', 'c2'],
  });

  for (const vp of [
    { width: 320, height: 568 },
    { width: 1032, height: 1376 },
  ]) {
    await page.setViewportSize(vp);
    await act(page, 'toStickers');
    await expect(page.locator('[data-screen="stickers"]')).toBeVisible();

    const check = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const docOverflow = document.documentElement.scrollWidth > vw + 1 || document.documentElement.scrollHeight > vh + 1;

      const overlaps = (a: DOMRect, b: DOMRect) =>
        a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

      // 上から並ぶブロック同士が重ならないこと
      const sections = ['.topbar', '.sticker-note', '.sticker-tabs', '.sticker-book', '.sticker-pager']
        .map((s) => document.querySelector<HTMLElement>(s)?.getBoundingClientRect())
        .filter((r): r is DOMRect => !!r);
      let sectionOverlap = false;
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          if (overlaps(sections[i], sections[j])) sectionOverlap = true;
        }
      }
      const outOfViewport = sections.some((r) => r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1);

      // タブ同士・カード同士が重ならないこと
      const tabs = [...document.querySelectorAll<HTMLElement>('.sticker-tab')].map((el) => el.getBoundingClientRect());
      let tabOverlap = false;
      for (let i = 0; i < tabs.length; i++) {
        for (let j = i + 1; j < tabs.length; j++) {
          if (overlaps(tabs[i], tabs[j])) tabOverlap = true;
        }
      }
      const cards = [...document.querySelectorAll<HTMLElement>('.sticker')].map((el) => el.getBoundingClientRect());
      let cardOverlap = false;
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          if (overlaps(cards[i], cards[j])) cardOverlap = true;
        }
      }

      // 押せる要素はすべて 56px 以上、まえ・つぎは 64px 以上
      const actionEls = [...document.querySelectorAll<HTMLElement>('[data-screen="stickers"] [data-action]')];
      const smallAction = actionEls.some((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 55.5 || r.height < 55.5;
      });
      const navEls = [...document.querySelectorAll<HTMLElement>('.sticker-nav-btn')];
      const smallNav = navEls.some((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 63.5 || r.height < 63.5;
      });

      return { docOverflow, sectionOverlap, outOfViewport, tabOverlap, cardOverlap, smallAction, smallNav };
    });

    expect(check).toEqual({
      docOverflow: false,
      sectionOverlap: false,
      outOfViewport: false,
      tabOverlap: false,
      cardOverlap: false,
      smallAction: false,
      smallNav: false,
    });

    await act(page, 'home');
  }
});
