// 最難関（おためし）：Codex 第2回の検証条件（3背景×100シード×残り1〜10）
import { describe, expect, it } from 'vitest';
import { HARDEST, hardestRound, inHardestBand } from '../../src/core/courses';
import { accessoryFits } from '../../src/core/accessories';
import { analyzeSpot, getSpot, silhouetteBBox, spotsConflict, validateLayout } from '../../src/core/placement';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { CHARACTER_IDS } from '../../src/core/characters';
import { bbox, bboxOverlap, transformShape, unionBBox } from '../../src/core/geometry';
import { hatShapes } from '../../src/core/accessories';

/** 別の方法（素直な全探索）で、帯の中に置ける最大人数を数える */
function bandMax(sceneId: (typeof SCENE_IDS)[number]): number {
  const sc = SCENES[sceneId];
  const cands = sc.spots.flatMap((sp) => CHARACTER_IDS.filter((c) => inHardestBand(analyzeSpot(sc, sp, c))).map((c) => ({ sp, c })));
  let max = 0;
  const n = cands.length;
  for (let i = 0; i < n; i++) {
    max = Math.max(max, 1);
    for (let j = i + 1; j < n; j++) {
      const a = cands[i], b = cands[j];
      if (a.c === b.c || spotsConflict(a.sp, b.sp)) continue;
      max = Math.max(max, 2);
      for (let k = j + 1; k < n; k++) {
        const d = cands[k];
        if (d.c === a.c || d.c === b.c || spotsConflict(d.sp, a.sp) || spotsConflict(d.sp, b.sp)) continue;
        max = 3;
      }
    }
  }
  return max;
}

describe("hardest trial", { timeout: 120_000 }, () => {
  for (const id of SCENE_IDS) {
    it(`${id}: 100 seeds × remaining 1..10 are safe, band-first, max count, no umbrella, deterministic`, () => {
      const sc = SCENES[id];
      const max = bandMax(id);
      const stats = { rounds: 0, chars: 0, hats: 0, outOfBand: 0 };
      for (let seed = 1; seed <= 100; seed++) {
        for (let remaining = 1; remaining <= 10; remaining++) {
          const pls = hardestRound(sc, remaining, seed * 31 + remaining);
          expect(pls.length).toBeGreaterThan(0);
          expect(pls.length).toBeLessThanOrEqual(Math.min(HARDEST.maxChars, remaining));
          expect(pls.length).toBe(Math.min(max, remaining)); // 帯の中で置ける最大人数
          expect(validateLayout(sc, pls).problems).toEqual([]);
          expect(new Set(pls.map((p) => p.char)).size).toBe(pls.length);
          for (const p of pls) {
            const spot = getSpot(sc, p.spot);
            expect(p.variant).toBe('exact');
            expect(p.acc?.umbrella).toBeUndefined();
            if (!inHardestBand(analyzeSpot(sc, spot, p.char))) stats.outOfBand++;
            if (p.acc?.hat) {
              stats.hats++;
              expect(p.acc.hat).toBe('camo');
              expect(accessoryFits(sc, spot, p.char, 'hat', 'camo').problems).toEqual([]);
              const t = { tx: spot.x, ty: spot.y, s: spot.s };
              const hb = unionBBox(hatShapes().map((s) => bbox(transformShape(t, s))));
              for (const q of pls) if (q !== p) expect(bboxOverlap(hb, silhouetteBBox(q.char, getSpot(sc, q.spot)), 4)).toBe(false);
            }
          }
          stats.rounds++;
          stats.chars += pls.length;
          if (seed <= 3) expect(hardestRound(sc, remaining, seed * 31 + remaining)).toEqual(pls);
        }
      }
      expect(hardestRound(sc, 0, 1)).toEqual([]);
      expect(stats.outOfBand).toBe(0);
      console.log(`${id}: band max ${max}, avg chars ${(stats.chars / stats.rounds).toFixed(2)}, hats ${(stats.hats / stats.chars).toFixed(2)}`);
    });
  }
});

describe('hardest trial: variety', () => {
  it('avoids spots used earlier in the same trial when the count does not drop', () => {
    for (const id of SCENE_IDS) {
      const first = hardestRound(SCENES[id], 3, 7);
      const second = hardestRound(SCENES[id], 3, 8, first.map((p) => p.spot));
      expect(second.length).toBe(first.length);
      const overlap = second.filter((p) => first.some((q) => q.spot === p.spot)).length;
      console.log(`${id}: first ${first.map((p) => p.spot).join(',')} / second ${second.map((p) => p.spot).join(',')} (overlap ${overlap})`);
      expect(overlap).toBeLessThan(first.length);
    }
  });
});
