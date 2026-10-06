// 描画・配置・当たり判定・ヒントで共有する形状定義。
// シーン座標は 0..1000 の正方形（viewBox="0 0 1000 1000"）。

export interface Pt {
  x: number;
  y: number;
}

export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'poly'; pts: Pt[] };

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const SCENE_SIZE = 1000;

export function contains(s: Shape, p: Pt): boolean {
  switch (s.kind) {
    case 'rect':
      return p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
    case 'ellipse': {
      const dx = (p.x - s.cx) / s.rx;
      const dy = (p.y - s.cy) / s.ry;
      return dx * dx + dy * dy <= 1;
    }
    case 'poly':
      return pointInPolygon(s.pts, p);
  }
}

export function pointInPolygon(pts: Pt[], p: Pt): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function bbox(s: Shape): BBox {
  switch (s.kind) {
    case 'rect':
      return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
    case 'ellipse':
      return { x0: s.cx - s.rx, y0: s.cy - s.ry, x1: s.cx + s.rx, y1: s.cy + s.ry };
    case 'poly': {
      const xs = s.pts.map((p) => p.x);
      const ys = s.pts.map((p) => p.y);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    }
  }
}

export function unionBBox(boxes: BBox[]): BBox {
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
}

export function bboxOverlap(a: BBox, b: BBox, gap = 0): boolean {
  return a.x0 - gap < b.x1 && b.x0 - gap < a.x1 && a.y0 - gap < b.y1 && b.y0 - gap < a.y1;
}

/** 平行移動＋拡大（キャラクターのローカル座標→シーン座標） */
export interface Placement2D {
  tx: number;
  ty: number;
  s: number;
}

export function transformPt(t: Placement2D, p: Pt): Pt {
  return { x: t.tx + p.x * t.s, y: t.ty + p.y * t.s };
}

export function transformShape(t: Placement2D, s: Shape): Shape {
  switch (s.kind) {
    case 'rect':
      return {
        kind: 'rect',
        x: t.tx + s.x * t.s,
        y: t.ty + s.y * t.s,
        w: s.w * t.s,
        h: s.h * t.s,
        rx: s.rx === undefined ? undefined : s.rx * t.s,
      };
    case 'ellipse':
      return { kind: 'ellipse', cx: t.tx + s.cx * t.s, cy: t.ty + s.cy * t.s, rx: s.rx * t.s, ry: s.ry * t.s };
    case 'poly':
      return { kind: 'poly', pts: s.pts.map((p) => transformPt(t, p)) };
  }
}

/** 形状内部の格子サンプル点（可視率の計算に使う） */
export function samplePoints(s: Shape, step: number): Pt[] {
  const b = bbox(s);
  const out: Pt[] = [];
  for (let y = b.y0 + step / 2; y < b.y1; y += step) {
    for (let x = b.x0 + step / 2; x < b.x1; x += step) {
      const p = { x, y };
      if (contains(s, p)) out.push(p);
    }
  }
  return out;
}

/** 点から形状までの近似距離（内部なら0）。当たり判定の「少し寛容」に使う。 */
export function distanceTo(s: Shape, p: Pt): number {
  if (contains(s, p)) return 0;
  switch (s.kind) {
    case 'rect': {
      const dx = Math.max(s.x - p.x, 0, p.x - (s.x + s.w));
      const dy = Math.max(s.y - p.y, 0, p.y - (s.y + s.h));
      return Math.hypot(dx, dy);
    }
    case 'ellipse': {
      // 正規化半径からの近似（十分に小さい許容幅で使う前提）
      const dx = p.x - s.cx;
      const dy = p.y - s.cy;
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const r = (s.rx * s.ry) / Math.hypot(s.ry * Math.cos(ang), s.rx * Math.sin(ang));
      return Math.max(0, d - r);
    }
    case 'poly': {
      let best = Infinity;
      for (let i = 0, j = s.pts.length - 1; i < s.pts.length; j = i++) {
        best = Math.min(best, segDist(s.pts[j], s.pts[i], p));
      }
      return best;
    }
  }
}

function segDist(a: Pt, b: Pt, p: Pt): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

/** 2次ベジェを折れ線にする（描画と判定で同じ多角形を使うため） */
export function quadPoints(p0: Pt, c: Pt, p1: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y });
  }
  return out;
}

export function shapeToSvg(s: Shape, attrs = ''): string {
  switch (s.kind) {
    case 'rect':
      return `<rect x="${r1(s.x)}" y="${r1(s.y)}" width="${r1(s.w)}" height="${r1(s.h)}"${s.rx ? ` rx="${r1(s.rx)}"` : ''} ${attrs}/>`;
    case 'ellipse':
      return `<ellipse cx="${r1(s.cx)}" cy="${r1(s.cy)}" rx="${r1(s.rx)}" ry="${r1(s.ry)}" ${attrs}/>`;
    case 'poly':
      return `<polygon points="${s.pts.map((p) => `${r1(p.x)},${r1(p.y)}`).join(' ')}" ${attrs}/>`;
  }
}

export function r1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** 画面座標→シーン座標。DOMMatrix相当の2x3行列（a,b,c,d,e,f）の逆変換。 */
export interface Mat {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export function applyInverse(m: Mat, p: Pt): Pt {
  const det = m.a * m.d - m.b * m.c;
  const x = p.x - m.e;
  const y = p.y - m.f;
  return { x: (m.d * x - m.c * y) / det, y: (-m.b * x + m.a * y) / det };
}

/** preserveAspectRatio="xMidYMid meet" の viewBox 0..size 正方形に対する変換行列 */
export function meetMatrix(rect: { left: number; top: number; width: number; height: number }, size = SCENE_SIZE): Mat {
  const scale = Math.min(rect.width, rect.height) / size;
  const ox = rect.left + (rect.width - size * scale) / 2;
  const oy = rect.top + (rect.height - size * scale) / 2;
  return { a: scale, b: 0, c: 0, d: scale, e: ox, f: oy };
}
