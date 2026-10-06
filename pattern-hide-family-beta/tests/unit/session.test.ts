import { describe, expect, it } from 'vitest';
import { currentHint, hitTest, isComplete, newSession, nextHint, tap, MAX_HINT } from '../../src/core/session';
import { SCENES } from '../../src/core/scenes';
import { getSpot, spotAnchor } from '../../src/core/placement';
import type { Placement } from '../../src/core/placement';

const scene = SCENES.room;
const placements: Placement[] = [
  { char: 'koro', spot: 'room-curtain', costume: 'stripes', variant: 'exact' },
  { char: 'moko', spot: 'room-rug-3', costume: 'check', variant: 'exact' },
];

describe('play session', () => {
  it('finds by tapping the face; misses cost nothing', () => {
    let s = newSession('room', 'normal', placements, 'search', 0);
    const miss = tap(scene, s, { x: 500, y: 100 });
    expect(miss.foundIndex).toBe(-1);
    expect(miss.session).toBe(s);
    const sp = getSpot(scene, 'room-curtain');
    const r = tap(scene, s, { x: sp.x, y: sp.y - 142 });
    expect(r.foundIndex).toBe(0);
    s = r.session;
    // 見つかった子は二度は数えない
    expect(tap(scene, s, { x: sp.x, y: sp.y - 142 }).foundIndex).toBe(-1);
    const sp2 = getSpot(scene, 'room-rug-3');
    s = tap(scene, s, spotAnchor(sp2)).session;
    expect(isComplete(s)).toBe(true);
  });

  it('hit area is a little tolerant but not a huge rectangle', () => {
    const s = newSession('room', 'normal', placements, 'search', 0);
    const sp = getSpot(scene, 'room-curtain');
    // 頭の少し外（許容範囲内）
    expect(hitTest(scene, s, { x: sp.x, y: sp.y - 142 - 45 - 15 })).toBe(0);
    // バウンディングボックスの角（形の外で遠い）は当たらない
    expect(hitTest(scene, s, { x: sp.x - 75, y: sp.y - 200 })).toBe(-1);
    expect(hitTest(scene, s, { x: sp.x + 200, y: sp.y - 100 })).toBe(-1);
  });

  it('hints are free, unlimited, and step up to outline', () => {
    let s = newSession('room', 'easy', placements.slice(0, 1), 'search', 0);
    expect(currentHint(scene, s)).toBeNull();
    for (let i = 0; i < 10; i++) s = nextHint(s);
    expect(s.hintLevel).toBe(MAX_HINT);
    expect(s.hintsUsed).toBe(10);
    const h = currentHint(scene, s)!;
    expect(h.index).toBe(0);
    // ヒントのまるは対象を含む
    const sp = getSpot(scene, 'room-curtain');
    const a = spotAnchor(sp);
    expect(Math.hypot(a.x - h.area.cx, a.y - h.area.cy)).toBeLessThan(h.area.r);
  });
});
