// 追加パック「ほたるの かわべ（night）」の配置・のぞき場所・パック境界の検査
import { describe, expect, it } from 'vitest';
import { night } from '../../src/core/scenes/night';
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
const withNight = owns('night');

describe('night pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 9 friends pass analyzeSpot, validateLayout, and accessoryFits (hat & umbrella)', () => {
    expect(night.spots).toHaveLength(9);
    expect(night.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of night.spots) {
      const costume = costumeForRegion(night, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(night, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(night, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
        expect(accessoryFits(night, sp, ch, 'hat', 'camo').problems, `hat camo ${sp.id} × ${ch}`).toEqual([]);
        expect(accessoryFits(night, sp, ch, 'umbrella', 'camo').problems, `umbrella camo ${sp.id} × ${ch}`).toEqual([]);
      }
    }
  });

  it('no two spots in night conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < night.spots.length; i++) {
      for (let j = i + 1; j < night.spots.length; j++) {
        expect(spotsConflict(night.spots[i], night.spots[j]), `${night.spots[i].id} vs ${night.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(night, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(night, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(night, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(night, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 night peek spots pass analyzePeek for all 9 friends, and hardestRound works', () => {
    expect(PEEKS.night).toHaveLength(3);
    for (const pk of PEEKS.night) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(night, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(night, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('night pack: entitlement boundaries', () => {
  it('free users do not get night scene, hika, veranda, or night items/stickers', () => {
    expect(baseOnly('scene:night')).toBe(false);
    expect(baseOnly('char:hika')).toBe(false);
    expect(baseOnly('room:veranda')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('night');
    expect(SCENE_IDS.filter((id) => withNight(`scene:${id}`))).toContain('night');

    expect(availableCharacters(10, { night: 50 }, baseOnly)).not.toContain('hika');
    expect(availableCharacters(0, {}, withNight)).not.toContain('hika');
    expect(availableCharacters(0, { night: 1 }, withNight)).toContain('hika');

    expect(openRooms(10, baseOnly, { night: 9 }).map((r) => r.id)).not.toContain('veranda');
    // パックを持っていても、ほたるの かわべで初めて見つけるまでは開かない
    expect(openRooms(0, withNight).map((r) => r.id)).not.toContain('veranda');
    expect(openRooms(0, withNight, { night: 1 }).map((r) => r.id)).toContain('veranda');

    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { night: 99 } }, baseOnly).map((i) => i.id);
    for (const id of ['engawa-bench', 'star-rug', 'paper-lantern', 'music-box', 'bamboo-chair', 'frog-plush']) {
      expect(baseItems).not.toContain(id);
    }

    const nightStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withNight).map((i) => i.id);
    expect(nightStartItems).toContain('engawa-bench');
    expect(nightStartItems).not.toContain('star-rug');

    const nightAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { night: 50 } }, withNight).map((i) => i.id);
    for (const id of ['engawa-bench', 'star-rug', 'paper-lantern', 'music-box', 'bamboo-chair', 'frog-plush']) {
      expect(nightAllItems).toContain(id);
    }

    const veranda = starterLayout('veranda');
    expect(veranda).toEqual([{ ref: 'item:engawa-bench', x: 280, y: 720 }]);
    expect(validLayouts({ veranda }, CHARACTER_IDS)).toEqual({ veranda });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'night', placements: [pl('koro', 'night-grass-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('hika', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'night', placements: [pl('hika', 'night-grass-1')] }, withNight)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['n-s1', 'n-s5', 'n-s15', 'n-s30', 'n-s50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withNight)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'n-s1')!)).toBe('ほたるの かわべで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'n-s15')!)).toBe('ほたるの かわべで 15かい');
  });
});
