// 追加パック「おばけやしき（haunted）」の配置・のぞき場所・パック境界の検査
import { describe, expect, it } from 'vitest';
import { haunted } from '../../src/core/scenes/haunted';
import { SCENE_IDS } from '../../src/core/scenes';
import { CHARACTER_IDS } from '../../src/core/characters';
import { analyzeSpot, autoLayout, costumeForRegion, spotsConflict, validateLayout } from '../../src/core/placement';
import { accessoryFits } from '../../src/core/accessories';
import { PEEKS, analyzePeek } from '../../src/core/peeks';
import { courseRound, hardestRound } from '../../src/core/courses';
import { availableCharacters, canResume, visibleStickers, type CanPlay } from '../../src/core/access';
import { openRooms, ownedItems, starterLayout, validLayouts } from '../../src/core/myroom';
import { STICKERS, stickerHint } from '../../src/core/stickers';
import { packOf, type ContentId, type PackId } from '../../src/entitlements/entitlements';

const owns = (...packs: PackId[]): CanPlay => (id: ContentId) => {
  const p = packOf(id);
  return !!p && (p.free || packs.includes(p.id));
};
const baseOnly = owns();
const withHaunted = owns('haunted');

describe('haunted pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 9 friends pass analyzeSpot, validateLayout, and accessoryFits (hat & umbrella)', () => {
    expect(haunted.spots).toHaveLength(9);
    expect(haunted.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of haunted.spots) {
      const costume = costumeForRegion(haunted, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(haunted, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(haunted, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
        expect(accessoryFits(haunted, sp, ch, 'hat', 'camo').problems, `hat camo ${sp.id} × ${ch}`).toEqual([]);
        expect(accessoryFits(haunted, sp, ch, 'umbrella', 'camo').problems, `umbrella camo ${sp.id} × ${ch}`).toEqual([]);
      }
    }
  });

  it('no two spots in haunted conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < haunted.spots.length; i++) {
      for (let j = i + 1; j < haunted.spots.length; j++) {
        expect(spotsConflict(haunted.spots[i], haunted.spots[j]), `${haunted.spots[i].id} vs ${haunted.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(haunted, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(haunted, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(haunted, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(haunted, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 haunted peek spots pass analyzePeek for all 9 friends, and hardestRound works', () => {
    expect(PEEKS.haunted).toHaveLength(3);
    for (const pk of PEEKS.haunted) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(haunted, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(haunted, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('haunted pack: entitlement boundaries', () => {
  it('free users do not get haunted scene, fuwa, attic, or haunted items/stickers', () => {
    expect(baseOnly('scene:haunted')).toBe(false);
    expect(baseOnly('char:fuwa')).toBe(false);
    expect(baseOnly('room:attic')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('haunted');
    expect(SCENE_IDS.filter((id) => withHaunted(`scene:${id}`))).toContain('haunted');

    expect(availableCharacters(10, { haunted: 50 }, baseOnly)).not.toContain('fuwa');
    expect(availableCharacters(0, {}, withHaunted)).not.toContain('fuwa');
    expect(availableCharacters(0, { haunted: 1 }, withHaunted)).toContain('fuwa');

    expect(openRooms(10, baseOnly, { haunted: 9 }).map((r) => r.id)).not.toContain('attic');
    // パックを持っていても、おばけやしきで初めて見つけるまでは開かない
    expect(openRooms(0, withHaunted).map((r) => r.id)).not.toContain('attic');
    expect(openRooms(0, withHaunted, { haunted: 1 }).map((r) => r.id)).toContain('attic');

    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { haunted: 99 } }, baseOnly).map((i) => i.id);
    for (const id of ['gothic-sofa', 'star-rug', 'pumpkin-lantern', 'music-box', 'ghost-chair', 'ghost-plush']) {
      expect(baseItems).not.toContain(id);
    }

    const hauntedStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withHaunted).map((i) => i.id);
    expect(hauntedStartItems).toContain('gothic-sofa');
    expect(hauntedStartItems).not.toContain('star-rug');

    const hauntedAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { haunted: 50 } }, withHaunted).map((i) => i.id);
    for (const id of ['gothic-sofa', 'star-rug', 'pumpkin-lantern', 'music-box', 'ghost-chair', 'ghost-plush']) {
      expect(hauntedAllItems).toContain(id);
    }

    const attic = starterLayout('attic');
    expect(attic).toEqual([{ ref: 'item:gothic-sofa', x: 280, y: 720 }]);
    expect(validLayouts({ attic }, CHARACTER_IDS)).toEqual({ attic });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'haunted', placements: [pl('koro', 'haunted-curtain-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('fuwa', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'haunted', placements: [pl('fuwa', 'haunted-curtain-1')] }, withHaunted)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['h-s1', 'h-s5', 'h-s15', 'h-s30', 'h-s50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withHaunted)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'h-s1')!)).toBe('おばけやしきで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'h-s15')!)).toBe('おばけやしきで 15かい');
  });
});
