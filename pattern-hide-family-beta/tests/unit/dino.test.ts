// 追加パック「きょうりゅうの たに（dino）」の配置・のぞき場所・動く恐竜の公平さ・パック境界の検査
import { describe, expect, it } from 'vitest';
import { dino } from '../../src/core/scenes/dino';
import { SCENE_IDS } from '../../src/core/scenes';
import { CHARACTER_IDS } from '../../src/core/characters';
import { analyzeSpot, autoLayout, costumeForRegion, spotsConflict, validateLayout } from '../../src/core/placement';
import { accessoryFits } from '../../src/core/accessories';
import { PEEKS, analyzePeek } from '../../src/core/peeks';
import { courseRound, hardestRound } from '../../src/core/courses';
import { availableCharacters, canResume, visibleStickers, type CanPlay } from '../../src/core/access';
import { openRooms, ownedItems, starterLayout, validLayouts } from '../../src/core/myroom';
import { STICKERS, stickerHint } from '../../src/core/stickers';
import { MOVERS, moverPos, pickMovers, pickSearchMovers } from '../../src/core/movers';
import { PRODUCTS, packsFromProducts } from '../../src/purchase/store';
import { packOf, type ContentId, type PackId } from '../../src/entitlements/entitlements';

const owns = (...packs: PackId[]): CanPlay => (id: ContentId) => {
  const p = packOf(id);
  return !!p && (p.free || packs.includes(p.id));
};
const baseOnly = owns();
const withDino = owns('dino');

describe('dino pack: spots, peeks, and courses', () => {
  it('all 9 spots × all 11 friends pass analyzeSpot, validateLayout, and accessoryFits (hat & umbrella)', () => {
    expect(dino.spots).toHaveLength(9);
    expect(dino.spots.filter((s) => s.easy)).toHaveLength(5);
    for (const sp of dino.spots) {
      const costume = costumeForRegion(dino, sp.region);
      for (const ch of CHARACTER_IDS) {
        const rep = analyzeSpot(dino, sp, ch);
        expect(rep.problems, `${sp.id} × ${ch}`).toEqual([]);
        expect(rep.ok, `${sp.id} × ${ch}`).toBe(true);
        const v = validateLayout(dino, [{ char: ch, spot: sp.id, costume, variant: 'exact' }]);
        expect(v.problems, `validateLayout ${sp.id} × ${ch}`).toEqual([]);
        expect(v.ok).toBe(true);
        expect(accessoryFits(dino, sp, ch, 'hat', 'camo').problems, `hat camo ${sp.id} × ${ch}`).toEqual([]);
        expect(accessoryFits(dino, sp, ch, 'umbrella', 'camo').problems, `umbrella camo ${sp.id} × ${ch}`).toEqual([]);
      }
    }
  });

  it('no two spots in dino conflict, and autoLayout / courseRound succeed across seeds', () => {
    for (let i = 0; i < dino.spots.length; i++) {
      for (let j = i + 1; j < dino.spots.length; j++) {
        expect(spotsConflict(dino.spots[i], dino.spots[j]), `${dino.spots[i].id} vs ${dino.spots[j].id}`).toBe(false);
      }
    }
    for (const diff of ['easy', 'normal'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const pls = autoLayout(dino, diff, seed);
        if (diff === 'easy') {
          expect(pls).toHaveLength(1);
        } else {
          expect(pls.length).toBeGreaterThanOrEqual(2);
          expect(pls.length).toBeLessThanOrEqual(3);
        }
        expect(validateLayout(dino, pls).problems).toEqual([]);
      }
    }
    for (let c = 1; c <= 10; c++) {
      for (let seed = 1; seed <= 15; seed++) {
        const pls = courseRound(dino, c, 3, seed, CHARACTER_IDS);
        expect(pls.length).toBeGreaterThan(0);
        expect(validateLayout(dino, pls).problems).toEqual([]);
      }
    }
  });

  it('all 3 dino peek spots pass analyzePeek for all 11 friends, and hardestRound works', () => {
    expect(PEEKS.dino).toHaveLength(3);
    for (const pk of PEEKS.dino) {
      for (const ch of CHARACTER_IDS) {
        const rep = analyzePeek(dino, pk, ch);
        expect(rep.problems, `${pk.id} × ${ch}`).toEqual([]);
        expect(rep.ok).toBe(true);
      }
    }
    for (let seed = 1; seed <= 20; seed++) {
      const pls = hardestRound(dino, 3, seed, [], CHARACTER_IDS);
      expect(pls).toHaveLength(3);
    }
  });
});

describe('dino pack: moving dinosaurs fairness', () => {
  const DINO_SIZE: Record<string, { w: number; h: number }> = {
    brachio: { w: 180, h: 160 },
    pteranodon: { w: 148, h: 86 },
    tricera: { w: 160, h: 106 },
    stegosaur: { w: 164, h: 110 },
    'mini-raptor': { w: 116, h: 88 },
  };

  it('has 5 distinct dinosaur movers (2 back, 3 front) and never covers any spot face for >= 3 seconds', () => {
    expect(MOVERS.dino).toHaveLength(5);
    expect(new Set(MOVERS.dino.map((m) => m.kind))).toEqual(
      new Set(['brachio', 'pteranodon', 'tricera', 'stegosaur', 'mini-raptor']),
    );
    expect(MOVERS.dino.filter((m) => m.layer === 'back')).toHaveLength(2);
    expect(MOVERS.dino.filter((m) => m.layer === 'front')).toHaveLength(3);

    for (const m of MOVERS.dino.filter((x) => x.layer === 'front')) {
      const { w, h } = DINO_SIZE[m.kind];
      const period = m.move === 'patrol' ? m.sec * 2 : m.sec;
      for (const sp of dino.spots) {
        const face = { x: sp.x, y: sp.y - 142 * sp.s };
        let run = 0;
        let longest = 0;
        for (let t = 0; t < period; t += 0.05) {
          const p = moverPos(m, t);
          const cover = Math.abs(face.x - p.x) < (w * m.scale) / 2 && face.y < p.y && face.y > p.y - h * m.scale;
          run = cover ? run + 0.05 : 0;
          longest = Math.max(longest, run);
        }
        expect(longest, `${m.id} × ${sp.id}`).toBeLessThan(3);
      }
    }

    expect(pickSearchMovers('dino', 'normal', 7).length).toBeGreaterThanOrEqual(4);
    expect(pickMovers('dino', 10, 7)).toHaveLength(5);
  });
});

describe('dino pack: entitlement boundaries and store products', () => {
  it('free users do not get dino scene, gao, dino-land, or dino items/stickers', () => {
    expect(baseOnly('scene:dino')).toBe(false);
    expect(baseOnly('char:gao')).toBe(false);
    expect(baseOnly('room:dino-land')).toBe(false);

    expect(SCENE_IDS.filter((id) => baseOnly(`scene:${id}`))).not.toContain('dino');
    expect(SCENE_IDS.filter((id) => withDino(`scene:${id}`))).toContain('dino');

    expect(availableCharacters(10, { dino: 50 }, baseOnly)).not.toContain('gao');
    expect(availableCharacters(0, {}, withDino)).not.toContain('gao');
    expect(availableCharacters(0, { dino: 1 }, withDino)).toContain('gao');

    expect(openRooms(10, baseOnly, { dino: 9 }).map((r) => r.id)).not.toContain('dino-land');
    // パックを持っていても、きょうりゅうの たにで初めて見つけるまでは開かない
    expect(openRooms(0, withDino).map((r) => r.id)).not.toContain('dino-land');
    expect(openRooms(0, withDino, { dino: 1 }).map((r) => r.id)).toContain('dino-land');

    const baseItems = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { dino: 99 } }, baseOnly).map((i) => i.id);
    for (const id of ['egg-sofa', 'bone-slide', 'footprint-rug', 'dino-egg', 'dino-plush', 'dino-ride', 'volcano-lamp', 'baby-dino']) {
      expect(baseItems).not.toContain(id);
    }

    const dinoStartItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: {} }, withDino).map((i) => i.id);
    expect(dinoStartItems).toContain('egg-sofa');
    expect(dinoStartItems).toContain('bone-slide');
    expect(dinoStartItems).toContain('footprint-rug');
    expect(dinoStartItems).not.toContain('dino-egg');

    const dinoAllItems = ownedItems({ cleared: 0, totalFinds: 0, sceneFinds: { dino: 50 } }, withDino).map((i) => i.id);
    for (const id of ['egg-sofa', 'bone-slide', 'footprint-rug', 'dino-egg', 'dino-plush', 'dino-ride', 'volcano-lamp', 'baby-dino']) {
      expect(dinoAllItems).toContain(id);
    }

    const dinoLand = starterLayout('dino-land');
    expect(dinoLand).toEqual([
      { ref: 'item:footprint-rug', x: 520, y: 890 },
      { ref: 'item:egg-sofa', x: 260, y: 720 },
      { ref: 'item:bone-slide', x: 740, y: 740 },
    ]);
    expect(validLayouts({ 'dino-land': dinoLand }, CHARACTER_IDS)).toEqual({ 'dino-land': dinoLand });

    const pl = (char: (typeof CHARACTER_IDS)[number], spot: string) => ({ char, spot, costume: 'plain', variant: 'exact' as const });
    expect(canResume({ sceneId: 'dino', placements: [pl('koro', 'dino-cliff-1')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'room', placements: [pl('gao', 'room-plant')] }, baseOnly)).toBe(false);
    expect(canResume({ sceneId: 'dino', placements: [pl('gao', 'dino-cliff-1')] }, withDino)).toBe(true);

    const stickerIds = (c: CanPlay) => visibleStickers(c).map((s) => s.id);
    for (const id of ['d-s1', 'd-s5', 'd-s15', 'd-s30', 'd-s50']) {
      expect(stickerIds(baseOnly)).not.toContain(id);
      expect(stickerIds(withDino)).toContain(id);
    }
    expect(stickerHint(STICKERS.find((s) => s.id === 'd-s1')!)).toBe('きょうりゅうの たにで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'd-s15')!)).toBe('きょうりゅうの たにで 15かい');

    // 商品一覧と「ぜんぶ いり」に dino が入っている
    expect(PRODUCTS.map((p) => p.id)).toContain('com.akihikoito.moyoukakurenbo.dino');
    expect(packsFromProducts(['com.akihikoito.moyoukakurenbo.dino'])).toEqual(['dino']);
    expect(packsFromProducts(['com.akihikoito.moyoukakurenbo.allpacks'])).toEqual([
      'more-courses',
      'beach',
      'forest',
      'aquarium',
      'night',
      'dino',
    ]);
  });
});
