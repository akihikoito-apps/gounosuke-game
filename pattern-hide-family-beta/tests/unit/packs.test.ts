// 追加パック型の境界（ベータは全開放。購入の仕組みは無い）
import { describe, expect, it } from 'vitest';
import { PACKS, betaEntitlements, packOf, type ContentId } from '../../src/entitlements/entitlements';
import { CHARACTER_IDS, FRIEND_UNLOCKS } from '../../src/core/characters';
import { SCENE_IDS } from '../../src/core/scenes';
import { COURSES } from '../../src/core/courses';

const all: ContentId[] = [
  ...SCENE_IDS.map((s) => `scene:${s}` as ContentId),
  ...COURSES.map((c) => `course:${c.no}` as ContentId),
  ...CHARACTER_IDS.map((c) => `char:${c}` as ContentId),
  'trial:hardest',
];

describe('packs', () => {
  it('every content is in exactly one pack', () => {
    for (const id of all) expect(PACKS.filter((p) => p.contents.includes(id)).length, id).toBe(1);
  });
  it('the free base pack includes the first reward: the friend who joins at course 1', () => {
    const first = FRIEND_UNLOCKS.find((f) => f.course === 1)!;
    expect(packOf(`char:${first.char}`)?.free).toBe(true);
    expect(packOf('course:1')?.free).toBe(true);
    expect(packOf('course:5')?.free).toBe(true);
    expect(PACKS.filter((p) => p.free)).toHaveLength(1);
  });
  it('the beta unlocks everything and is not a purchase state', () => {
    expect(betaEntitlements.kind).toBe('beta-all-unlocked');
    for (const id of all) expect(betaEntitlements.canPlay(id)).toBe(true);
  });
});
