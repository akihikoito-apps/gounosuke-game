import { expect, test } from '@playwright/test';
import { act, eyePoints, faceCenter, fresh, state, tapAt } from './helpers';

const KEY = 'moyou-kakurenbo-beta';

async function findRound(page: import('@playwright/test').Page) {
  const s = await state(page);
  for (let i = 0; i < s.session.placements.length; i++) await tapAt(page, await faceCenter(page, i));
  return s.session.placements.length as number;
}

test('course 1: 10 finds clear the course, unlock course 2, and progress survives a reload', async ({ page }) => {
  await fresh(page);
  await page.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k) ?? 'null') ?? {};
    localStorage.setItem(k, JSON.stringify({ ...d, schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } }));
  }, KEY);
  await page.reload();
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeDisabled();
  await act(page, 'pickCourse', '[data-course="1"]');
  let total = 0;
  for (let round = 0; round < 10 && total < 10; round++) {
    await expect(page.locator('[data-screen="play"]')).toBeVisible();
    total += await findRound(page);
    await expect(page.locator('.course-progress .pip.on')).toHaveCount(total);
    if (total < 10) {
      await expect(page.locator('[data-action="nextRound"]')).toBeVisible({ timeout: 4000 });
      // 途中で再読み込みしても、見つけた回数は残る
      if (round === 2) {
        await page.reload();
        expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course.finds, KEY)).toBe(total);
        await act(page, 'toCourse');
        await act(page, 'pickCourse', '[data-course="1"]');
        continue;
      }
      await act(page, 'nextRound');
    }
  }
  expect(total).toBe(10);
  await expect(page.locator('.course-clear')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('.course-clear')).toContainText('コース1 クリア');
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).course, KEY);
  expect(saved).toEqual({ cleared: 1, current: 2, finds: 0 });
  await act(page, 'nextCourse');
  await expect(page.locator('.course-progress .course-no')).toHaveText('2');
  await act(page, 'home');
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeEnabled();
  await expect(page.locator('[data-action="pickCourse"][data-course="3"]')).toBeDisabled();
});

test('course 4 puts a knit hat on, course 6 an umbrella; tapping the hat or umbrella also finds', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 9, current: 4, finds: 0 } })), KEY);
  await page.reload();
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="4"]');
  await expect(page.locator('#stage .char .acc-hat')).toHaveCount(1);
  // 帽子をタッチして見つける
  const hat = await page.locator('#stage .char .acc-hat').boundingBox();
  await tapAt(page, { x: hat!.x + hat!.width / 2, y: hat!.y + hat!.height * 0.35 });
  await expect(page.locator('.course-progress .pip.on')).toHaveCount(1);

  await act(page, 'home');
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="6"]');
  await expect(page.locator('#stage .char .acc-umbrella')).toHaveCount(1);
  const umb = await page.locator('#stage .char .acc-umbrella').boundingBox();
  await tapAt(page, { x: umb!.x + umb!.width * 0.75, y: umb!.y + umb!.height * 0.2 });
  await expect(page.locator('.course-progress .pip.on')).toHaveCount(1);
});

test('a broken course save is repaired and locked courses cannot be started', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 1, current: 9, finds: 5 } })), KEY);
  await page.reload();
  expect(await page.evaluate(() => (window as any).__game.storeStatus())).toBe('recovered');
  await act(page, 'toCourse');
  await expect(page.locator('[data-action="pickCourse"][data-course="9"]')).toBeDisabled();
  await expect(page.locator('[data-action="pickCourse"][data-course="2"]')).toBeEnabled();
});

async function passGate(page: import('@playwright/test').Page) {
  await act(page, 'parent');
  const nums = await page.locator('.gate-nums').innerText();
  const K = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  for (const n of nums.split('・').map((k) => K.indexOf(k)).sort((a, b) => a - b)) await page.locator(`[data-key="${n}"]`).click();
  await page.locator('[data-hold]').hover();
  await page.mouse.down();
  await page.waitForTimeout(2600);
  await page.mouse.up();
  await expect(page.locator('.panel')).toBeVisible();
}

test('hardest trial: opens from the parent area while locked, counts exactly 10, saves nothing', async ({ page }) => {
  await page.goto('/');
  const saved = JSON.stringify({
    schema: 1,
    settings: { sound: false, difficulty: 'easy', tutorialSeen: true },
    resume: { sceneId: 'room', difficulty: 'easy', placements: [{ char: 'koro', spot: 'room-plant', costume: 'plain', variant: 'soft' }], found: [false], origin: 'search' },
    playtest: { enabled: true, counters: { searchStarted: 1, searchCompleted: 0, hintsUsed: 0, hideRounds: 0, durationUnder1m: 0, duration1to3m: 0, durationOver3m: 0 } },
    course: { cleared: 0, current: 1, finds: 3 },
  });
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, saved]);
  await page.reload();
  const before = await page.evaluate((k) => localStorage.getItem(k), KEY);
  await passGate(page);
  await page.locator('[data-act="trial"]').click();
  await expect(page.locator('[data-screen="play"][data-origin="trial"]')).toBeVisible();
  await expect(page.locator('.course-progress.trial')).toContainText('おためし');
  // 最難関の描画：傘なし、服の陰影 0.5、ふち線 0.25
  await expect(page.locator('#stage .acc-umbrella')).toHaveCount(0);
  const shade = await page.locator('#stage .char .char-body image[style*="multiply"]').first().getAttribute('opacity');
  expect(shade).toBe('0.5');
  let total = 0;
  for (let round = 0; round < 10 && total < 10; round++) {
    await expect(page.locator('[data-screen="play"][data-origin="trial"]')).toBeVisible();
    const s = await state(page);
    expect(s.session.placements.length).toBeLessThanOrEqual(Math.min(3, 10 - total));
    for (let i = 0; i < s.session.placements.length; i++) {
      // 物の裏からのぞく子もいるので、見えている目を押す（隠れている目を押しても何も起きない）
      const eyes = await eyePoints(page, i);
      for (const e of eyes) await tapAt(page, e);
      await tapAt(page, eyes[0]); // 見つけた子をもう一度押しても増えない
      await tapAt(page, eyes[1]);
      total++;
      await expect(page.locator('.course-progress .pip.on')).toHaveCount(total);
    }
    if (total < 10) {
      // 自動で次へ進む（ボタンを押さない）
      await expect(page.locator('[data-action="nextTrialRound"]')).toBeVisible({ timeout: 4000 });
      await expect(page.locator('[data-action="nextTrialRound"]')).toHaveCount(0, { timeout: 5000 });
    }
  }
  expect(total).toBe(10);
  await expect(page.locator('.course-clear')).toContainText('10にん みつけた');
  await expect(page.locator('[data-action="nextTrialRound"]')).toHaveCount(0);
  // 保存データはまったく変わらない（再開データ・コース・集計を含む）
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(before);
  // もういちど：0 から
  await act(page, 'trialAgain');
  await expect(page.locator('.course-progress .pip.on')).toHaveCount(0);
  // 途中で再読み込みすると、おためしは消えて通常のタイトルへ
  await page.reload();
  await expect(page.locator('[data-screen="title"]')).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(before);
});

test('course rounds advance on their own after a short wait', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } })), KEY);
  await page.reload();
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="1"]');
  const first = await state(page);
  await findRound(page);
  await expect(page.locator('[data-action="nextRound"]')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('[data-action="nextRound"]')).toHaveCount(0, { timeout: 5000 });
  const second = await state(page);
  expect(second.session.found.every((f: boolean) => !f)).toBe(true);
  expect(second.session.sceneId).not.toBe(first.session.sceneId);
});

test('regression: characters never show before the background (slow image loading)', async ({ browser }) => {
  // Service Worker が絵を先に保存していると遅延を再現できないので止める（初めて開いたときと同じ状態）
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  // 背景などの絵の読み込みを 5 秒遅らせる（起動時の先読みも間に合わない状態）
  await page.route('**/*.png', async (route) => {
    await new Promise((r) => setTimeout(r, 5000));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } })), KEY);
  // 絵の読み込み完了を待たずに操作する（実際の人と同じ）
  await page.reload({ waitUntil: 'domcontentloaded' });
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="1"]');
  // 読み込み中：ステージは見えず（キャラクターも見えない）、押せない
  await expect(page.locator('#stage.loading')).toHaveCount(1);
  await expect(page.locator('#stage svg')).toBeHidden();
  // 読み込みが終わると、背景とキャラクターが一緒に出る
  await expect(page.locator("#stage.loading")).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#stage svg')).toBeVisible();
  await ctx.close();
});

test('clearing course 5 gives its sticker and brings nyako; the sticker book shows what was earned', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ schema: 1, settings: { sound: false, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} }, course: { cleared: 4, current: 5, finds: 9 }, collection: { totalFinds: 29 } })), KEY);
  await page.reload();
  // 仲間になる前は、かくす画面に にゃこ はいない
  await act(page, 'toHide');
  await act(page, 'hidePickScene', '[data-scene="room"]');
  await expect(page.locator('[data-action="pickChar"]')).toHaveCount(3);
  await act(page, 'toHide');
  await act(page, 'home');
  await act(page, 'toCourse');
  await act(page, 'pickCourse', '[data-course="5"]');
  const s = await state(page);
  expect(s.session.placements.some((p: any) => p.char === 'nyako')).toBe(false);
  const eyes = await eyePoints(page, 0);
  await tapAt(page, { x: (eyes[0].x + eyes[1].x) / 2, y: eyes[0].y });
  // 30かい みつけた のシールの知らせ
  await expect(page.locator('.toast')).toContainText('シール ゲット');
  await expect(page.locator('.course-clear')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('.course-clear .reward-sticker')).toBeVisible();
  await expect(page.locator('.course-clear .new-friend')).toContainText('にゃこ');
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.collection.totalFinds).toBe(30);
  expect(saved.course.cleared).toBe(5);
  // シールちょう
  await act(page, 'bye');
  await act(page, 'home');
  await act(page, 'toStickers');
  await expect(page.locator('.sticker.got')).toHaveCount(7); // コース1〜5 ＋ 10回・30回
  await expect(page.locator('.sticker.locked')).toHaveCount(8);
  // 仲間になったあとは、かくす画面に にゃこ がいる
  await act(page, 'home');
  await act(page, 'toHide');
  await act(page, 'hidePickScene', '[data-scene="room"]');
  await expect(page.locator('[data-action="pickChar"][data-char="nyako"]')).toBeVisible();
});
