import { describe, expect, it } from 'vitest';
import { CHARACTER_IDS } from '../../src/core/characters';
import { LIMITS, analyzeSpot, autoLayout, snapToSpot, spotBBox, spotsConflict, validateLayout } from '../../src/core/placement';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { bboxOverlap } from '../../src/core/geometry';

describe('scenes', () => {
  it.each(SCENE_IDS)('%s has >= 8 spots and 4 costumes, regions cover costumes', (id) => {
    const s = SCENES[id];
    expect(s.spots.length).toBeGreaterThanOrEqual(8);
    expect(s.costumes.length).toBe(4);
    expect(new Set(s.costumes.map((c) => c.kind)).has('plain')).toBe(true);
    for (const r of s.regions) expect(s.costumes.some((c) => c.id === r.costume)).toBe(true);
    // 各衣装に、合う領域の隠れ場所が少なくとも1つある（柄を選ぶ意味がある）
    for (const c of s.costumes) {
      const regs = s.regions.filter((r) => r.costume === c.id).map((r) => r.id);
      expect(s.spots.some((sp) => regs.includes(sp.region))).toBe(true);
    }
    expect(s.spots.filter((sp) => sp.easy).length).toBeGreaterThanOrEqual(3);
  });

  // すべての隠れ場所 × すべてのキャラクターで、可視性・画面内・大きさ・柄の領域を検査
  for (const id of SCENE_IDS) {
    for (const sp of SCENES[id].spots) {
      for (const c of CHARACTER_IDS) {
        it(`${sp.id} / ${c} passes geometric checks`, () => {
          const r = analyzeSpot(SCENES[id], sp, c);
          expect(r.problems).toEqual([]);
          expect(r.faceVisible).toBe(true);
          expect(r.visible).toBeGreaterThanOrEqual(LIMITS.minVisible);
          expect(r.visible).toBeLessThan(1); // 全面丸見えでもない
        });
      }
    }
  }
});

describe('autoLayout (seeded)', { timeout: 60_000 }, () => {
  const SEEDS = 320;
  it(`>= ${SEEDS} seeds per scene x difficulty produce valid, non-overlapping layouts`, () => {
    let checked = 0;
    for (const id of SCENE_IDS) {
      for (const diff of ['easy', 'normal'] as const) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const l = autoLayout(SCENES[id], diff, seed * 7919);
          const v = validateLayout(SCENES[id], l);
          if (!v.ok) throw new Error(`${id}/${diff}/${seed}: ${v.problems.join('; ')}`);
          if (diff === 'easy') {
            expect(l.length).toBe(1);
            expect(l[0].variant).toBe('soft');
            expect(SCENES[id].spots.find((s) => s.id === l[0].spot)!.easy).toBe(true);
          } else {
            expect(l.length).toBeGreaterThanOrEqual(2);
            expect(l.length).toBeLessThanOrEqual(3);
            expect(l.every((p) => p.variant === 'exact')).toBe(true);
          }
          for (let i = 0; i < l.length; i++)
            for (let j = i + 1; j < l.length; j++) {
              const a = SCENES[id].spots.find((s) => s.id === l[i].spot)!;
              const b = SCENES[id].spots.find((s) => s.id === l[j].spot)!;
              expect(bboxOverlap(spotBBox(a), spotBBox(b))).toBe(false);
            }
          checked++;
        }
      }
    }
    expect(checked).toBe(SEEDS * SCENE_IDS.length * 2);
  });

  it('same seed gives same layout', () => {
    expect(autoLayout(SCENES.room, 'normal', 42)).toEqual(autoLayout(SCENES.room, 'normal', 42));
  });
});

describe('snapToSpot', () => {
  it('snaps outside / invalid points to the nearest free spot', () => {
    const s = SCENES.garden;
    expect(snapToSpot(s, { x: -500, y: -500 }, [])).not.toBeNull();
    expect(snapToSpot(s, { x: 5000, y: 5000 }, [])).not.toBeNull();
    const first = snapToSpot(s, { x: 290, y: 560 }, [])!;
    expect(first.id).toBe('garden-hedge-2');
    const second = snapToSpot(s, { x: 290, y: 560 }, [first.id])!;
    expect(second.id).not.toBe(first.id);
    expect(spotsConflict(first, second)).toBe(false);
  });

  it('returns null only when no spot is free', () => {
    const s = SCENES.room;
    expect(snapToSpot(s, { x: 0, y: 0 }, s.spots.map((x) => x.id))).toBeNull();
  });
});
