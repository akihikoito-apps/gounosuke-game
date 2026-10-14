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
    expect(r[3]).toMatchObject({ at: 3, remaining: 3 }); // しんしつ
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

  it('へや：コース3で しんしつ、追加パックが無ければ おにわ は告知しない', () => {
    expect(upcomingRewards({ cleared: 3, totalFinds: 30 }, all).find((x) => x.kind === 'room')).toMatchObject({ at: 6, remaining: 3 });
    expect(upcomingRewards({ cleared: 3, totalFinds: 30 }, baseOnly).some((x) => x.kind === 'room')).toBe(false);
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
