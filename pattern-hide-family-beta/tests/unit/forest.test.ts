// 追加パック「きのこの もり（forest）」の配置・のぞき場所・パック境界の検査
import { describe, expect, it } from 'vitest';
import { forest } from '../../src/core/scenes/forest';
import { SCENE_IDS } from '../../src/core/scenes';
import { CHARACTER_IDS } from '../../src/core/characters';
import { analyzeSpot, autoLayout, costumeForRegion, spotsConflict, validateLayout } from '../../src/core/placement';
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
const withForest = owns('forest');

describe('forest pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 7 friends pass analyzeSpot and validateLayout', () => {
    expect(forest.spots).toHaveLength(9);
    expect(forest.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of forest.spots) {
      const costume = costumeForRegion(forest, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(forest, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(forest, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
      }
    }
  });

  it('no two spots in forest conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < forest.spots.length; i++) {
      for (let j = i + 1; j < forest.spots.length; j++) {
        expect(spotsConflict(forest.spots[i], forest.spots[j]), `${forest.spots[i].id} vs ${forest.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(forest, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(forest, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(forest, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(forest, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 forest peek spots pass analyzePeek for all 7 friends, and hardestRound works', () => {
    expect(PEEKS.forest).toHaveLength(3);
    for (const pk of PEEKS.forest) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(forest, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(forest, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('forest pack: entitlement boundaries', () => {
  it('free users do not get forest scene, pino, treehouse, or forest items/stickers', () => {
    expect(baseOnly('scene:forest')).toBe(false);
    expect(baseOnly('char:pino')).toBe(false);
    expect(baseOnly('room:treehouse')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('forest');
    expect(SCENE_IDS.filter((id) => withForest(`scene:${id}`))).toContain('forest');

    expect(availableCharacters(10, { forest: 50 }, baseOnly)).not.toContain('pino');
    expect(availableCharacters(0, {}, withForest)).not.toContain('pino');
    expect(availableCharacters(0, { forest: 1 }, withForest)).toContain('pino');

    expect(openRooms(10, baseOnly).map((r) => r.id)).not.toContain('treehouse');
    expect(openRooms(0, withForest).map((r) => r.id)).toContain('treehouse');

    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { forest: 99 } }, baseOnly).map((i) => i.id);
    for (const id of ['camp-tent', 'stump-chair', 'acorn-lamp', 'mushroom-table', 'campfire-pot', 'squirrel']) {
      expect(baseItems).not.toContain(id);
    }

    const forestStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withForest).map((i) => i.id);
    expect(forestStartItems).toContain('camp-tent');
    expect(forestStartItems).not.toContain('stump-chair');

    const forestAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { forest: 50 } }, withForest).map((i) => i.id);
    for (const id of ['camp-tent', 'stump-chair', 'acorn-lamp', 'mushroom-table', 'campfire-pot', 'squirrel']) {
      expect(forestAllItems).toContain(id);
    }

    const treehouse = starterLayout('treehouse');
    expect(treehouse).toEqual([
      { ref: 'item:camp-tent', x: 260, y: 720 },
      { ref: 'char:koro', x: 640, y: 880 },
    ]);
    expect(validLayouts({ treehouse }, CHARACTER_IDS)).toEqual({ treehouse });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'forest', placements: [pl('koro', 'forest-tent-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('pino', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'forest', placements: [pl('pino', 'forest-tent-1')] }, withForest)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['f-s1', 'f-s5', 'f-s15', 'f-s30', 'f-s50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withForest)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s1')!)).toBe('きのこの もりで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s15')!)).toBe('きのこの もりで 15かい');
  });
});
