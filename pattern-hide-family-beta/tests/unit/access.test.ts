// パックを持っていないときに、コース・友だち・つづきから・シールが出てこないこと（Codex 総合レビュー指摘1〜4・6）
import { describe, expect, it } from 'vitest';
import { availableCharacters, canPlayCourse, canResume, visibleStickers, type CanPlay } from '../../src/core/access';
import { PACKS, packOf, type ContentId, type PackId } from '../../src/entitlements/entitlements';
import { FRIEND_UNLOCKS } from '../../src/core/characters';

const owns = (...packs: PackId[]): CanPlay => (id: ContentId) => {
  const p = packOf(id);
  return !!p && (p.free || packs.includes(p.id));
};
const baseOnly = owns();
const withBeach = owns('beach');
const withMore = owns('more-courses');

describe('access by pack', () => {
  it('free base: courses 1-5 only, no hardest; nyako (course 1) and popo (course 5) are free rewards', () => {
    for (let n = 1; n <= 5; n++) expect(canPlayCourse(n, baseOnly)).toBe(true);
    for (let n = 6; n <= 10; n++) expect(canPlayCourse(n, baseOnly)).toBe(false);
    expect(baseOnly('trial:hardest')).toBe(false);
    for (const f of FRIEND_UNLOCKS) expect(packOf(`char:${f.char}`)?.free, f.char).toBe(true);
    expect(availableCharacters(5, {}, baseOnly)).toEqual(['koro', 'mimi', 'moko', 'nyako', 'popo']);
  });

  it('choki needs the beach pack even if old save data says the beach was played', () => {
    expect(availableCharacters(10, { beach: 30 }, baseOnly)).not.toContain('choki');
    expect(availableCharacters(10, { beach: 30 }, withMore)).not.toContain('choki');
    expect(availableCharacters(0, {}, withBeach)).not.toContain('choki'); // パックがあっても、うみべで見つけるまでは
    expect(availableCharacters(0, { beach: 1 }, withBeach)).toContain('choki');
  });

  it('resume is refused for a scene or a friend you cannot play', () => {
    const pl = (char: any, spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'beach', placements: [pl('koro', 'beach-hut-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('choki', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('koro', 'room-plant')] }, baseOnly)).toBe(true);
    expect(canResume({ sceneId: 'beach', placements: [pl('choki', 'beach-hut-1')] }, withBeach)).toBe(true);
  });

  it('the sticker book only shows stickers of packs you have', () => {
    const ids = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    expect(ids(baseOnly)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'f10', 'f30', 'f60', 'f100', 'f150']);
    expect(ids(withBeach)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'f10', 'f30', 'f60', 'f100', 'f150', 'b1', 'b10', 'b30']);
    expect(ids(owns('beach', 'more-courses'))).toHaveLength(18);
  });

  it('every pack is reachable and every paid pack has something to play', () => {
    for (const p of PACKS) expect(p.contents.length).toBeGreaterThan(0);
  });
});
