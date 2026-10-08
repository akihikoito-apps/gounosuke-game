import { type Page, expect } from '@playwright/test';

export async function fresh(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect(page.locator('[data-screen="title"]').first()).toBeVisible();
}

export async function act(page: Page, action: string, extra = '') {
  const loc = page.locator(`[data-action="${action}"]${extra}`).first();
  await expect(loc).toBeEnabled();
  await page.waitForTimeout(action === 'ready' || action === 'handoffBack' ? 760 : 420); // 画面切替直後の誤タップ防止（navLock）を待つ
  await loc.click();
}

export async function state(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__game.state());
}

/** i 番目のキャラクターの顔の中心（画面座標） */
export async function faceCenter(page: Page, i: number) {
  // 絵の読み込みが終わってステージが見えるまで待つ
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  const b = await page.locator(`#stage .char[data-index="${i}"] .char-head`).boundingBox();
  if (!b) throw new Error('no char ' + i);
  return { x: b.x + b.width / 2, y: b.y + b.height * 0.6 };
}

export async function tapAt(page: Page, p: { x: number; y: number }, touch = false) {
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  if (touch) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(160);
}

export async function startSearch(page: Page, scene = 'room', diff: 'easy' | 'normal' = 'easy') {
  await act(page, 'toSearch');
  await act(page, 'diff', `[data-diff="${diff}"]`);
  await act(page, 'startSearch', `[data-scene="${scene}"]`);
  if (await page.locator('[data-screen="tutorial"]').count()) await act(page, 'tutorialDone');
  await expect(page.locator('[data-screen="play"]')).toBeVisible();
}

/** i 番目のキャラクターの両目の位置（画面座標）。物の裏からのぞく子でも、見えている目を押せる */
export async function eyePoints(page: Page, i: number) {
  await expect(page.locator('#stage.loading')).toHaveCount(0);
  return page.evaluate((i) => {
    const st = (window as any).__game.state();
    const sp = st.spots[i];
    const svg = document.querySelector('#stage svg') as SVGSVGElement;
    const m = svg.getScreenCTM()!;
    return [-16, 16].map((x) => {
      const p = new DOMPoint(sp.x + x * sp.s, sp.y - 142 * sp.s).matrixTransform(m);
      return { x: p.x, y: p.y };
    });
  }, i);
}

export async function findAll(page: Page, touch = false) {
  const s = await state(page);
  for (let i = 0; i < s.session.placements.length; i++) {
    await tapAt(page, await faceCenter(page, i), touch);
  }
}

/** かくすモード：1体を場所に置いて「できた」まで */
export async function hideOne(page: Page, scene: string, char: string, costume: string, spot: string) {
  await act(page, 'toHide');
  await act(page, 'hidePickScene', `[data-scene="${scene}"]`);
  await act(page, 'pickChar', `[data-char="${char}"]`);
  await act(page, 'charsNext');
  await act(page, 'pickCostume', `[data-costume="${costume}"]`);
  await act(page, 'costumeNext');
  await page.waitForTimeout(400);
  await page.locator(`.candidate[data-spot="${spot}"]`).click();
  await page.waitForTimeout(200);
}

export function sameOriginGuard(page: Page) {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['127.0.0.1:4173'].includes(u.host) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) external.push(r.url());
  });
  return external;
}
