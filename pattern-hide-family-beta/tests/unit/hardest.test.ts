// 最難関（おためし）：Codex 第2回・第3回の検証条件（3背景×100シード×残り1〜10）
import { describe, expect, it } from 'vitest';
import { HARDEST, hardestRound } from '../../src/core/courses';
import { accessoryFits, deepHatShapes, glassesShapes } from '../../src/core/accessories';
import { getSpot, validateLayout } from '../../src/core/placement';
import { PEEKS, analyzePeek, isPeek, peekHides } from '../../src/core/peeks';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { CHARACTERS, CHARACTER_IDS } from '../../src/core/characters';
import { contains, samplePoints, transformPt, transformShape } from '../../src/core/geometry';
import { hitTest, newSession } from '../../src/core/session';

const eyeRing = (cx: number, cy: number) => [{ x: cx, y: cy }, ...Array.from({ length: 16 }, (_, i) => ({ x: cx + Math.cos((i / 16) * 6.283) * 8.5, y: cy + Math.sin((i / 16) * 6.283) * 10 }))];

describe('hardest trial', { timeout: 120_000 }, () => {
  it('every peek spot keeps one whole eye, 20% of the head, 5% of the body and a shape cue visible', () => {
    for (const id of SCENE_IDS) {
      for (const pk of PEEKS[id]) {
        const okChars = CHARACTER_IDS.filter((c) => analyzePeek(SCENES[id], pk, c).ok);
        expect(okChars.length, pk.id).toBeGreaterThan(0);
      }
    }
  });

  it('a tilted deep hat or sunglasses hide exactly one eye and never the mouth', () => {
    for (const side of ['l', 'r'] as const) {
      for (const sh of [deepHatShapes(side), glassesShapes(side)]) {
        const cov = (x: number) => eyeRing(x, -142).filter((p) => sh.some((s) => contains(s, p))).length / 17;
        const hidden = side === 'l' ? -16 : 16;
        expect(cov(hidden)).toBeGreaterThanOrEqual(0.8);
        expect(cov(-hidden)).toBe(0);
        expect(sh.some((s) => contains(s, { x: 0, y: -125 }))).toBe(false);
      }
    }
  });

  for (const id of SCENE_IDS) {
    it(`${id}: 100 seeds × remaining 1..10 — one peek, others hide one eye, all safe`, () => {
      const sc = SCENES[id];
      const stats = { rounds: 0, peeks: 0, deep: 0, glasses: 0 };
      for (let seed = 1; seed <= 100; seed++) {
        for (let remaining = 1; remaining <= 10; remaining++) {
          const pls = hardestRound(sc, remaining, seed * 31 + remaining);
          expect(pls.length).toBe(Math.min(HARDEST.maxChars, remaining));
          expect(new Set(pls.map((p) => p.char)).size).toBe(pls.length);
          const peeks = pls.filter((p) => isPeek(getSpot(sc, p.spot)));
          expect(peeks.length).toBeLessThanOrEqual(1);
          const normal = pls.filter((p) => !isPeek(getSpot(sc, p.spot)));
          if (normal.length) expect(validateLayout(sc, normal).problems).toEqual([]);
          for (const p of peeks) {
            const pk = getSpot(sc, p.spot);
            if (!isPeek(pk)) throw new Error('not peek');
            expect(analyzePeek(sc, pk, p.char).problems).toEqual([]);
            expect(p.acc).toBeUndefined(); // のぞき＋顔を隠す物は重ねない
            // ほかの子は、のぞき場所の「前に描き直す物」の中に入らない
            for (const q of normal) {
              const sp = getSpot(sc, q.spot);
              const t = { tx: sp.x, ty: sp.y, s: sp.s };
              const pts = CHARACTERS[q.char].silhouette.flatMap((sh) => samplePoints(transformShape(t, sh), 10));
              expect(pts.some((pt) => pk.front.some((f) => contains(f, pt)))).toBe(false);
            }
            // 隠れている胴体を押しても見つからない／見えている目を押せば見つかる
            const s = newSession(sc.id, 'normal', pls, 'trial', 0);
            const i = pls.indexOf(p);
            const t = { tx: pk.x, ty: pk.y, s: pk.s };
            const bodyCenter = transformPt(t, { x: 0, y: -50 });
            if (peekHides(pk, bodyCenter)) expect(hitTest(sc, s, bodyCenter)).not.toBe(i);
            const eyes = [-16, 16].map((x) => transformPt(t, { x, y: -142 })).filter((e) => !peekHides(pk, e));
            expect(eyes.length).toBeGreaterThan(0);
            expect(hitTest(sc, s, eyes[0])).toBe(i);
          }
          for (const p of normal) {
            const spot = getSpot(sc, p.spot);
            expect(p.variant).toBe('exact');
            expect(p.acc?.umbrella).toBeUndefined();
            // 顔の片方を隠す物を、ちょうど1つ
            expect(!!p.acc?.deep !== !!p.acc?.glasses).toBe(true);
            if (p.acc?.deep) {
              stats.deep++;
              expect(accessoryFits(sc, spot, p.char, 'hat', 'camo', p.acc.deep).problems).toEqual([]);
            } else stats.glasses++;
          }
          stats.peeks += peeks.length;
          stats.rounds++;
          if (seed <= 3) expect(hardestRound(sc, remaining, seed * 31 + remaining)).toEqual(pls);
        }
      }
      expect(hardestRound(sc, 0, 1)).toEqual([]);
      // ほぼ毎回、1人はのぞき場所
      expect(stats.peeks / stats.rounds).toBeGreaterThan(0.9);
      expect(stats.glasses).toBeGreaterThan(0);
      console.log(`${id}: peek ${(stats.peeks / stats.rounds).toFixed(2)}, deep hats ${stats.deep}, glasses ${stats.glasses}`);
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
