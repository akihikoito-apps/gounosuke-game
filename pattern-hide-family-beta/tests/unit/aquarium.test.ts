// 追加パック「すいぞくかん（aquarium）」の配置・のぞき場所・パック境界の検査
import { describe, expect, it } from 'vitest';
import { aquarium } from '../../src/core/scenes/aquarium';
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
const withAquarium = owns('aquarium');

describe('aquarium pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 8 friends pass analyzeSpot and validateLayout', () => {
    expect(aquarium.spots).toHaveLength(9);
    expect(aquarium.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of aquarium.spots) {
      const costume = costumeForRegion(aquarium, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(aquarium, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(aquarium, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
      }
    }
  });

  it('no two spots in aquarium conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < aquarium.spots.length; i++) {
      for (let j = i + 1; j < aquarium.spots.length; j++) {
        expect(spotsConflict(aquarium.spots[i], aquarium.spots[j]), `${aquarium.spots[i].id} vs ${aquarium.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(aquarium, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(aquarium, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(aquarium, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(aquarium, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 aquarium peek spots pass analyzePeek for all 8 friends, and hardestRound works', () => {
    expect(PEEKS.aquarium).toHaveLength(3);
    for (const pk of PEEKS.aquarium) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(aquarium, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(aquarium, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('aquarium pack: entitlement boundaries', () => {
  it('free users do not get aquarium scene, puka, aquarium-room, or aquarium items/stickers', () => {
    expect(baseOnly('scene:aquarium')).toBe(false);
    expect(baseOnly('char:puka')).toBe(false);
    expect(baseOnly('room:aquarium-room')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('aquarium');
    expect(SCENE_IDS.filter((id) => withAquarium(`scene:${id}`))).toContain('aquarium');

    expect(availableCharacters(10, { aquarium: 50 }, baseOnly)).not.toContain('puka');
    expect(availableCharacters(0, {}, withAquarium)).not.toContain('puka');
    expect(availableCharacters(0, { aquarium: 1 }, withAquarium)).toContain('puka');

    expect(openRooms(10, baseOnly).map((r) => r.id)).not.toContain('aquarium-room');
    expect(openRooms(0, withAquarium).map((r) => r.id)).toContain('aquarium-room');

    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { aquarium: 99 } }, baseOnly).map((i) => i.id);
    for (const id of ['shell-sofa', 'coral-rug', 'jelly-lamp', 'dolphin-ride', 'treasure-box', 'penguin']) {
      expect(baseItems).not.toContain(id);
    }

    const aquariumStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withAquarium).map((i) => i.id);
    expect(aquariumStartItems).toContain('shell-sofa');
    expect(aquariumStartItems).not.toContain('coral-rug');

    const aquariumAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { aquarium: 50 } }, withAquarium).map((i) => i.id);
    for (const id of ['shell-sofa', 'coral-rug', 'jelly-lamp', 'dolphin-ride', 'treasure-box', 'penguin']) {
      expect(aquariumAllItems).toContain(id);
    }

    const aquariumRoom = starterLayout('aquarium-room');
    expect(aquariumRoom).toEqual([
      { ref: 'item:shell-sofa', x: 280, y: 720 },
      { ref: 'char:koro', x: 640, y: 880 },
    ]);
    expect(validLayouts({ 'aquarium-room': aquariumRoom }, CHARACTER_IDS)).toEqual({ 'aquarium-room': aquariumRoom });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'aquarium', placements: [pl('koro', 'aquarium-tank-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('puka', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'aquarium', placements: [pl('puka', 'aquarium-tank-1')] }, withAquarium)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['a-s1', 'a-s5', 'a-s15', 'a-s30', 'a-s50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withAquarium)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s1')!)).toBe('すいぞくかんで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s15')!)).toBe('すいぞくかんで 15かい');
  });
});
