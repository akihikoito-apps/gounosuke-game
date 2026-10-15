// 追加パック「うみべ（beach）」の配置・のぞき場所・パック境界・既存記録との互換の検査
import { describe, expect, it } from 'vitest';
import { beach } from '../../src/core/scenes/beach';
import { SCENE_IDS } from '../../src/core/scenes';
import { CHARACTER_IDS } from '../../src/core/characters';
import { analyzeSpot, autoLayout, costumeForRegion, spotsConflict, validateLayout } from '../../src/core/placement';
import { accessoryFits } from '../../src/core/accessories';
import { PEEKS, analyzePeek } from '../../src/core/peeks';
import { courseRound, hardestRound } from '../../src/core/courses';
import { availableCharacters, canResume, visibleStickers, type CanPlay } from '../../src/core/access';
import { ITEM_BY_ID, openRooms, ownedItems, starterLayout, validLayouts } from '../../src/core/myroom';
import { STICKERS, earnedStickers, stickerHint } from '../../src/core/stickers';
import { packOf, type ContentId, type PackId } from '../../src/entitlements/entitlements';

const owns = (...packs: PackId[]): CanPlay => (id: ContentId) => {
  const p = packOf(id);
  return !!p && (p.free || packs.includes(p.id));
};
const baseOnly = owns();
const withBeach = owns('beach');

describe('beach pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 9 friends pass analyzeSpot, validateLayout, and accessoryFits (hat & umbrella)', () => {
    expect(beach.spots).toHaveLength(9);
    expect(beach.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of beach.spots) {
      const costume = costumeForRegion(beach, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(beach, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(beach, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
        expect(accessoryFits(beach, sp, ch, 'hat', 'camo').problems, `hat camo ${sp.id} × ${ch}`).toEqual([]);
        expect(accessoryFits(beach, sp, ch, 'umbrella', 'camo').problems, `umbrella camo ${sp.id} × ${ch}`).toEqual([]);
      }
    }
  });

  it('no two spots in beach conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < beach.spots.length; i++) {
      for (let j = i + 1; j < beach.spots.length; j++) {
        expect(spotsConflict(beach.spots[i], beach.spots[j]), `${beach.spots[i].id} vs ${beach.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(beach, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(beach, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(beach, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(beach, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 beach peek spots pass analyzePeek for all 9 friends, and hardestRound works', () => {
    expect(PEEKS.beach).toHaveLength(3);
    for (const pk of PEEKS.beach) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(beach, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(beach, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('beach pack: entitlement boundaries and save compatibility', () => {
  it('free users do not get beach scene, choki, beach-deck, or beach items/stickers', () => {
    expect(baseOnly('scene:beach')).toBe(false);
    expect(baseOnly('char:choki')).toBe(false);
    expect(baseOnly('room:beach-deck')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('beach');
    expect(SCENE_IDS.filter((id) => withBeach(`scene:${id}`))).toContain('beach');

    expect(availableCharacters(10, { beach: 50 }, baseOnly)).not.toContain('choki');
    expect(availableCharacters(0, {}, withBeach)).not.toContain('choki');
    expect(availableCharacters(0, { beach: 1 }, withBeach)).toContain('choki');

    expect(openRooms(10, baseOnly, { beach: 9 }).map((r) => r.id)).not.toContain('beach-deck');
    // パックを持っていても、うみべで初めて見つけるまでは開かない
    expect(openRooms(0, withBeach).map((r) => r.id)).not.toContain('beach-deck');
    expect(openRooms(0, withBeach, { beach: 1 }).map((r) => r.id)).toContain('beach-deck');

    const beachItemIds = ['beach-chair', 'shell', 'shaved-ice', 'floatring', 'beachball', 'hermit-crab'] as const;
    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { beach: 99 } }, baseOnly).map((i) => i.id);
    for (const id of beachItemIds) {
      expect(baseItems).not.toContain(id);
    }

    const beachStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withBeach).map((i) => i.id);
    expect(beachStartItems).toContain('beach-chair');
    expect(beachStartItems).not.toContain('shell');
    expect(ITEM_BY_ID['beach-chair'].seats?.length).toBeGreaterThanOrEqual(1);

    const beachAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { beach: 50 } }, withBeach).map((i) => i.id);
    for (const id of beachItemIds) {
      expect(beachAllItems).toContain(id);
    }
    // 動く家具が含まれていること
    expect(beachItemIds.filter((id) => !!ITEM_BY_ID[id].motion).length).toBeGreaterThanOrEqual(2);

    const deck = starterLayout('beach-deck');
    expect(deck).toEqual([{ ref: 'item:beach-chair', x: 280, y: 720 }]);
    expect(validLayouts({ 'beach-deck': deck }, CHARACTER_IDS)).toEqual({ 'beach-deck': deck });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'beach', placements: [pl('koro', 'beach-hut-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('choki', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'beach', placements: [pl('choki', 'beach-hut-1')] }, withBeach)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['b1', 'b5', 'b10', 'b30', 'b50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withBeach)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'b1')!)).toBe('うみべで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b5')!)).toBe('うみべで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b10')!)).toBe('うみべで 10かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b30')!)).toBe('うみべで 30かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b50')!)).toBe('うみべで 50かい');
  });

  it('existing players never lose earned stickers or furniture (b1 at 1, b10 at 10, b30 at 30)', () => {
    expect(earnedStickers(0, 0, { beach: 1 }).map((s) => s.id)).toContain('b1');
    expect(earnedStickers(0, 0, { beach: 10 }).map((s) => s.id)).toEqual(['b1', 'b5', 'b10']);
    expect(earnedStickers(0, 0, { beach: 30 }).map((s) => s.id)).toEqual(['b1', 'b5', 'b10', 'b30']);
    const itemsAt10 = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { beach: 10 } }, withBeach).map((i) => i.id);
    expect(itemsAt10).toContain('shell');
    expect(itemsAt10).toContain('floatring');
  });
});
