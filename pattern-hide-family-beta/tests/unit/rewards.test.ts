import { describe, expect, it } from 'vitest';
import { friendAtCourse, upcomingRewards } from '../../src/core/rewards';
import { type ContentId, PACKS } from '../../src/entitlements/entitlements';

const all = () => true;
const baseOnly = (id: ContentId) => PACKS.find((p) => p.id === 'base')!.contents.includes(id);

describe('つぎの ごほうび', () => {
  it('はじめは「コース1で にゃこ」「コース1のシール」「10かいのシール」', () => {
    const r = upcomingRewards({ cleared: 0, totalFinds: 0 }, all);
    expect(r.map((x) => x.kind)).toEqual(['friend', 'courseSticker', 'findsSticker', 'room']);
    expect(r[0]).toMatchObject({ char: 'nyako', at: 1, remaining: 1 });
    expect(r[1]).toMatchObject({ at: 1, remaining: 1 });
    expect(r[2]).toMatchObject({ at: 10, remaining: 10, done: 0 });
    expect(r[3]).toMatchObject({ at: 5, remaining: 5 }); // ひみつきち
  });

  it('クリアするたびに「あと なんコース」が減っていく', () => {
    const rem = [1, 2, 3, 4].map((c) => upcomingRewards({ cleared: c, totalFinds: c * 10 }, all).find((x) => x.kind === 'friend')!.remaining);
    expect(rem).toEqual([4, 3, 2, 1]); // ぽぽ（コース5）
    expect(upcomingRewards({ cleared: 2, totalFinds: 23 }, all).find((x) => x.kind === 'findsSticker')).toMatchObject({ at: 30, remaining: 7, done: 23 });
  });

  it('友だちが全員そろうと、友だちの告知は出ない', () => {
    const r = upcomingRewards({ cleared: 5, totalFinds: 50 }, all);
    expect(r.some((x) => x.kind === 'friend')).toBe(false);
    expect(r.find((x) => x.kind === 'courseSticker')).toMatchObject({ at: 6 });
  });

  it('へや：コース5で ひみつきち、コース10で しんしつ。つづきのコースが無ければ しんしつ は告知しない', () => {
    expect(upcomingRewards({ cleared: 6, totalFinds: 60 }, all).find((x) => x.kind === 'room')).toMatchObject({ at: 10, remaining: 4 });
    expect(upcomingRewards({ cleared: 6, totalFinds: 60 }, baseOnly).some((x) => x.kind === 'room')).toBe(false);
  });

  it('ぜんぶ もらうと 何も出ない', () => {
    expect(upcomingRewards({ cleared: 10, totalFinds: 999, sceneFinds: { beach: 99 } }, all)).toEqual([]);
  });

  it('パックを持っていない人には、そのパックのコース・シールを告知しない', () => {
    const r = upcomingRewards({ cleared: 5, totalFinds: 50 }, baseOnly);
    // コース6〜10 は追加パック：コースのシールの告知は出ない
    expect(r.some((x) => x.kind === 'courseSticker')).toBe(false);
    expect(friendAtCourse(5, baseOnly)).toBe('popo');
    expect(friendAtCourse(1, all)).toBe('nyako');
    expect(friendAtCourse(2, all)).toBeNull();
  });
});

import { withMust } from '../../src/core/courses';
import { autoLayout } from '../../src/core/placement';
import { SCENES } from '../../src/core/scenes';

describe('発売前の仕上げ（Gemini 最終点検）', () => {
  it('パックの背景で遊びはじめたら、その背景の いちばん近いシールを告知する', () => {
    const r = upcomingRewards({ cleared: 2, totalFinds: 22, sceneFinds: { forest: 3 } }, all).find((x) => x.kind === 'sceneSticker');
    expect(r).toMatchObject({ scene: 'forest', at: 5, remaining: 2, done: 3 });
    // まだ遊んでいない背景・持っていないパックは告知しない
    expect(upcomingRewards({ cleared: 2, totalFinds: 22 }, all).some((x) => x.kind === 'sceneSticker')).toBe(false);
    expect(upcomingRewards({ cleared: 2, totalFinds: 22, sceneFinds: { forest: 3 } }, baseOnly).some((x) => x.kind === 'sceneSticker')).toBe(false);
  });

  it('初めての背景では、その背景の友だちが かならず かくれている（人数は変えない）', () => {
    expect(withMust(['koro', 'mimi'], 'pino')).toEqual(['pino', 'koro']);
    expect(withMust(['koro'], 'pino')).toEqual(['pino']);
    expect(withMust(['pino', 'koro'], 'pino')).toEqual(['pino', 'koro']);
    for (let seed = 1; seed <= 30; seed++) {
      const pls = autoLayout(SCENES.forest, 'normal', seed, ['koro', 'mimi', 'moko'], 'pino');
      expect(pls.some((p) => p.char === 'pino')).toBe(true);
    }
  });
});
