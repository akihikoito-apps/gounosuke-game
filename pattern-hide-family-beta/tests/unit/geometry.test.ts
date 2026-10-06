import { describe, expect, it } from 'vitest';
import { applyInverse, contains, distanceTo, meetMatrix, pointInPolygon } from '../../src/core/geometry';

describe('geometry', () => {
  it('contains: rect / ellipse / poly', () => {
    expect(contains({ kind: 'rect', x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5 })).toBe(true);
    expect(contains({ kind: 'ellipse', cx: 0, cy: 0, rx: 10, ry: 5 }, { x: 9, y: 0 })).toBe(true);
    expect(contains({ kind: 'ellipse', cx: 0, cy: 0, rx: 10, ry: 5 }, { x: 0, y: 6 })).toBe(false);
    expect(pointInPolygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], { x: 2, y: 2 })).toBe(true);
    expect(pointInPolygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], { x: 8, y: 8 })).toBe(false);
  });

  it('distanceTo is 0 inside and grows outside', () => {
    const r = { kind: 'rect', x: 0, y: 0, w: 10, h: 10 } as const;
    expect(distanceTo(r, { x: 5, y: 5 })).toBe(0);
    expect(distanceTo(r, { x: 13, y: 14 })).toBeCloseTo(5);
    const e = { kind: 'ellipse', cx: 0, cy: 0, rx: 10, ry: 10 } as const;
    expect(distanceTo(e, { x: 15, y: 0 })).toBeCloseTo(5);
  });

  // 画面サイズ・向きが変わっても、画面座標→シーン座標がずれないこと
  it.each([
    [375, 667],
    [390, 844],
    [768, 1024],
    [844, 390],
    [667, 375],
  ])('meet transform round-trips at %ix%i', (w, h) => {
    const m = meetMatrix({ left: 0, top: 80, width: w, height: h - 80 });
    for (const p of [{ x: 0, y: 0 }, { x: 500, y: 500 }, { x: 1000, y: 1000 }, { x: 123, y: 877 }]) {
      const screen = { x: m.a * p.x + m.e, y: m.d * p.y + m.f };
      const back = applyInverse(m, screen);
      expect(back.x).toBeCloseTo(p.x, 6);
      expect(back.y).toBeCloseTo(p.y, 6);
    }
    // シーンは画面内に収まる
    expect(m.e).toBeGreaterThanOrEqual(0);
    expect(m.a * 1000 + m.e).toBeLessThanOrEqual(w + 1e-9);
  });
});
