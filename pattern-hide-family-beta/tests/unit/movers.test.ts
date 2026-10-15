import { describe, expect, it } from 'vitest';
import { COURSE_MOVERS, FRONT_FROM_COURSE, MOVERS, type MoverKind, moverPos, pickMovers } from '../../src/core/movers';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';

// 絵の大きさのめやす（ART：art/movers の横幅、高さ）
const SIZE: Record<MoverKind, { w: number; h: number }> = {
  bird: { w: 70, h: 60 },
  seagull: { w: 90, h: 60 },
  butterfly: { w: 60, h: 60 },
  cloud: { w: 240, h: 120 },
  cat: { w: 130, h: 120 },
  puppy: { w: 120, h: 110 },
  balloon: { w: 70, h: 140 },
  sailboat: { w: 110, h: 120 },
  crab: { w: 90, h: 70 },
  ball: { w: 64, h: 64 },
  squirrel: { w: 110, h: 75 },
  owl: { w: 90, h: 65 },
  'falling-leaf': { w: 56, h: 48 },
  'tropical-fish': { w: 96, h: 56 },
  jellyfish: { w: 72, h: 80 },
  penguin: { w: 84, h: 86 },
  bubble: { w: 56, h: 60 },
  ghost: { w: 80, h: 84 },
  bat: { w: 88, h: 56 },
  candle: { w: 56, h: 76 },
};

describe('うごくもの', () => {
  it('コース1は なし、あとのコースほど増える（同じシードなら同じ）', () => {
    for (const id of SCENE_IDS) {
      expect(pickMovers(id, 1, 5)).toEqual([]);
      for (let c = 2; c <= 10; c++) {
        const ms = pickMovers(id, c, c * 13);
        expect(ms.length, `${id} course ${c}`).toBe(COURSE_MOVERS[c - 1]);
        expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length);
        expect(pickMovers(id, c, c * 13)).toEqual(ms);
        // 前を通るのは コース6から
        if (c < FRONT_FROM_COURSE) expect(ms.every((m) => m.layer === 'back')).toBe(true);
        else expect(ms.some((m) => m.layer === 'front')).toBe(true);
      }
    }
  });

  it('前を通るものは、どの隠れ場所の顔も 3秒より長く隠さない', () => {
    for (const id of SCENE_IDS) {
      for (const m of MOVERS[id].filter((x) => x.layer === 'front')) {
        const { w, h } = SIZE[m.kind];
        const period = m.move === 'patrol' ? m.sec * 2 : m.sec;
        for (const sp of SCENES[id].spots) {
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
    }
  });

  it('前を通るものは、ときどき どこかの友だちの前を ほんとうに横切る', () => {
    for (const id of SCENE_IDS) {
      let crossings = 0;
      for (const m of MOVERS[id].filter((x) => x.layer === 'front')) {
        const { w, h } = SIZE[m.kind];
        for (const sp of SCENES[id].spots) {
          const body = { x: sp.x, y: sp.y - 80 * sp.s };
          for (let t = 0; t < m.sec * 2; t += 0.1) {
            const p = moverPos(m, t);
            if (Math.abs(body.x - p.x) < (w * m.scale) / 2 && body.y < p.y && body.y > p.y - h * m.scale) { crossings++; break; }
          }
        }
      }
      expect(crossings, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('通り道は 画面の中を通る（窓の中だけのものは窓を通る）', () => {
    for (const id of SCENE_IDS) {
      for (const m of MOVERS[id]) {
        const mid = moverPos(m, m.sec / 2);
        expect(mid.x).toBeGreaterThan(0);
        expect(mid.x).toBeLessThan(1000);
        expect(mid.y).toBeGreaterThan(0);
        expect(mid.y).toBeLessThanOrEqual(1000);
        if (m.clip) {
          expect(mid.x).toBeGreaterThan(m.clip.x);
          expect(mid.x).toBeLessThan(m.clip.x + m.clip.w);
        }
      }
    }
  });
});
