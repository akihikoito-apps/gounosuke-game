// コース：全コース・多数のシードで、配置が安全（顔が見える・画面内・重ならない）で、10回でちょうど終わること
import { describe, expect, it } from 'vitest';
import { COURSES, FINDS_PER_COURSE, courseRound, courseScene } from '../../src/core/courses';
import { accessoryFits, accessoryShapes } from '../../src/core/accessories';
import { getSpot, silhouetteBBox, validateLayout } from '../../src/core/placement';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { bbox, bboxOverlap, transformShape, unionBBox } from '../../src/core/geometry';

describe('courses', () => {
  it('has 10 courses that get harder', () => {
    expect(COURSES).toHaveLength(10);
    for (let i = 1; i < COURSES.length; i++) expect(COURSES[i].outline).toBeLessThanOrEqual(COURSES[i - 1].outline);
    expect(COURSES.slice(0, 3).every((c) => !c.hat && !c.umbrella)).toBe(true);
  });

  for (const c of COURSES) {
    it(`course ${c.no}: every round is a safe layout and the course ends at exactly ${FINDS_PER_COURSE}`, () => {
      const usage = { hat: 0, umbrella: 0, chars: 0 };
      for (let seed = 1; seed <= 40; seed++) {
        let found = 0;
        let round = 0;
        while (found < FINDS_PER_COURSE) {
          const scene = SCENES[courseScene(c.no, round, SCENE_IDS)];
          const pls = courseRound(scene, c.no, FINDS_PER_COURSE - found, seed * 97 + round);
          expect(pls.length).toBeGreaterThan(0);
          expect(pls.length).toBeLessThanOrEqual(Math.min(c.maxChars, FINDS_PER_COURSE - found));
          const v = validateLayout(scene, pls);
          expect(v.problems).toEqual([]);
          for (const p of pls) {
            const spot = getSpot(scene, p.spot);
            if (c.spots === 'easy') expect(spot.easy).toBe(true);
            expect(p.variant).toBe(c.variant);
            if (p.acc?.hat) {
              usage.hat++;
              expect(accessoryFits(scene, spot, p.char, 'hat', p.acc.hat).problems).toEqual([]);
            }
            if (p.acc?.umbrella) {
              usage.umbrella++;
              expect(accessoryFits(scene, spot, p.char, 'umbrella', p.acc.umbrella).problems).toEqual([]);
              // 傘がほかの子に重ならない
              const t = { tx: spot.x, ty: spot.y, s: spot.s };
              const ub = unionBBox(accessoryShapes({ umbrella: p.acc.umbrella }).map((s) => bbox(transformShape(t, s))));
              for (const q of pls) if (q !== p) expect(bboxOverlap(ub, silhouetteBBox(q.char, getSpot(scene, q.spot)), 4)).toBe(false);
            }
          }
          usage.chars += pls.length;
          found += pls.length;
          round++;
          expect(round).toBeLessThanOrEqual(FINDS_PER_COURSE);
        }
        expect(found).toBe(FINDS_PER_COURSE);
      }
      // 帽子・傘を使うコースでは、実際にそれなりの回数出てくる
      if (c.hat) expect(usage.hat / usage.chars).toBeGreaterThan(c.hat.rate * 0.35);
      if (c.umbrella) expect(usage.umbrella / usage.chars).toBeGreaterThan(c.umbrella.rate * 0.25);
      console.log(`course ${c.no}: hat ${(usage.hat / usage.chars).toFixed(2)} umbrella ${(usage.umbrella / usage.chars).toFixed(2)} chars/round avg`);
    });
  }

  it('lists which spots allow each accessory', () => {
    const rows: string[] = [];
    for (const id of SCENE_IDS) {
      for (const sp of SCENES[id].spots) {
        const f = (k: 'hat' | 'umbrella', s: 'color' | 'camo') => (accessoryFits(SCENES[id], sp, 'moko', k, s).ok ? 'o' : '-');
        rows.push(`${sp.id.padEnd(18)} hat:${f('hat', 'color')}${f('hat', 'camo')} umb:${f('umbrella', 'camo')} ${accessoryFits(SCENES[id], sp, 'moko', 'umbrella', 'camo').problems.join(',')}`);
      }
    }
    console.log(rows.join('\n'));
  });
});

import { validate, validateCourse } from '../../src/storage/schema';
describe('course progress in the save data', () => {
  it('old saves without course get a fresh start without being marked repaired', () => {
    const r = validate({ schema: 1, settings: { sound: true, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } });
    expect(r.data.course).toEqual({ cleared: 0, current: 1, finds: 0 });
  });
  it('broken or out-of-range values are repaired', () => {
    expect(validateCourse({ cleared: 'x', current: 1, finds: 0 }).repaired).toBe(true);
    expect(validateCourse({ cleared: 2, current: 1, finds: 10 }).repaired).toBe(true);
    // まだ開いていないコースは選べない
    expect(validateCourse({ cleared: 1, current: 9, finds: 5 })).toEqual({ course: { cleared: 1, current: 2, finds: 0 }, repaired: true });
    expect(validateCourse({ cleared: 10, current: 10, finds: 9 })).toEqual({ course: { cleared: 10, current: 10, finds: 9 }, repaired: false });
  });
});

import { CHARACTER_IDS as ALL_CHARS } from '../../src/core/characters';
describe('courses with all six friends', { timeout: 120_000 }, () => {
  for (const c of COURSES) {
    it(`course ${c.no}: safe layouts when all six friends can appear`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        let found = 0;
        let round = 0;
        while (found < FINDS_PER_COURSE) {
          const scene = SCENES[courseScene(c.no, round, SCENE_IDS)];
          const pls = courseRound(scene, c.no, FINDS_PER_COURSE - found, seed * 131 + round, ALL_CHARS);
          expect(pls.length).toBeGreaterThan(0);
          expect(validateLayout(scene, pls).problems).toEqual([]);
          for (const p of pls) {
            const spot = getSpot(scene, p.spot);
            if (p.acc?.hat) expect(accessoryFits(scene, spot, p.char, 'hat', p.acc.hat).problems).toEqual([]);
            if (p.acc?.umbrella) expect(accessoryFits(scene, spot, p.char, 'umbrella', p.acc.umbrella).problems).toEqual([]);
          }
          found += pls.length;
          round++;
        }
      }
    });
  }
});
