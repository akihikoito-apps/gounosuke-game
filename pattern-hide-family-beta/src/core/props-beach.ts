// うみべ（背景パック1）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
import { type Pt, type Shape, quadPoints, r1 } from './geometry';
import type { Prop } from './props';

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

/** 太さのある取っ手（2次曲線）を多角形にする */
function arcBand(p0: Pt, c: Pt, p1: Pt, width: number): Shape {
  const mid = [p0, ...quadPoints(p0, c, p1, 12)];
  const half = width / 2;
  const up = mid.map((p) => ({ x: p.x, y: p.y - half }));
  const down = mid.map((p) => ({ x: p.x, y: p.y + half })).reverse();
  return { kind: 'poly', pts: [...up, ...down] };
}

export function sandcastle(cx: number, top: number, w = 140, h = 88): Prop {
  const x = cx - w / 2;
  const base: Pt[] = [
    { x, y: top + h },
    { x: x + 10, y: top + 26 },
    { x: x + w - 10, y: top + 26 },
    { x: x + w, y: top + h },
  ];
  const tower = (tx: number, tw: number, th: number) => ({ x: tx - tw / 2, y: top + 26 - th, w: tw, h: th + 2 });
  const towers = [tower(cx - 38, 34, 26), tower(cx, 40, 40), tower(cx + 38, 34, 26)];
  return {
    shapes: [{ kind: 'poly', pts: base }, ...towers.map((t) => ({ kind: 'rect' as const, x: t.x, y: t.y, w: t.w, h: t.h, rx: 3 }))],
    markup:
      towers.map((t) => `<rect x="${r1(t.x)}" y="${r1(t.y)}" width="${t.w}" height="${t.h}" rx="3" fill="#E9CC94" ${L}/>`).join('') +
      `<polygon points="${base.map((p) => `${r1(p.x)},${r1(p.y)}`).join(' ')}" fill="#EED7A4" ${L}/>` +
      `<path d="M${cx} ${top - 14} V${top - 34} L${cx + 18} ${top - 27} L${cx} ${top - 20}" fill="#F29AAE" stroke="#4A3A40" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<rect x="${cx - 12}" y="${top + h - 30}" width="24" height="30" rx="12" fill="#C9A86E"/>`,
  };
}

export function floatRing(cx: number, cy: number, rx = 74, ry = 40): Prop {
  const segs = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a0 = (i / 6) * Math.PI * 2;
      const a1 = ((i + 0.5) / 6) * Math.PI * 2;
      const P = (a: number, k: number, kk: number) => `${r1(cx + Math.cos(a) * rx * k)} ${r1(cy + Math.sin(a) * ry * kk)}`;
      return `<path d="M${P(a0, 1, 1)} A${rx} ${ry} 0 0 1 ${P(a1, 1, 1)} L${P(a1, 0.55, 0.5)} A${r1(rx * 0.55)} ${r1(ry * 0.5)} 0 0 0 ${P(a0, 0.55, 0.5)}Z" fill="#F07D7D"/>`;
    })
    .join('');
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFFFF" ${L}/>` +
      segs +
      `<ellipse cx="${cx}" cy="${cy}" rx="${r1(rx * 0.55)}" ry="${r1(ry * 0.5)}" fill="#BFE3EE" ${L}/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${L}/>`,
  };
}

export function cooler(cx: number, top: number, w = 140, h = 82): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 10 },
      { kind: 'rect', x: cx - 30, y: top - 22, w: 60, h: 24, rx: 6 },
    ],
    markup:
      `<path d="M${cx - 30} ${top + 2} V${top - 16} Q${cx - 30} ${top - 22} ${cx - 24} ${top - 22} H${cx + 24} Q${cx + 30} ${top - 22} ${cx + 30} ${top - 16} V${top + 2}" fill="none" stroke="#4A3A40" stroke-width="6"/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="#8EC4E6" ${L}/>` +
      `<rect x="${x - 4}" y="${top - 2}" width="${w + 8}" height="22" rx="8" fill="#FFFFFF" ${L}/>`,
  };
}

export function shellPile(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 40, 26, '#F6D3C8'],
    [cx + 38, cy + 8, 38, 24, '#F7E3C2'],
    [cx, cy - 8, 46, 30, '#FBE7E1'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts
        .map(([x, y, rx]) => `<path d="M${r1(x - rx * 0.5)} ${y + 6} Q${x} ${y - 16} ${r1(x + rx * 0.5)} ${y + 6} M${x} ${y + 8} V${y - 12}" fill="none" stroke="#C9A39A" stroke-width="2"/>`)
        .join(''),
  };
}

export function sandBucket(cx: number, top: number, w = 118, h = 78): Prop {
  const pts = [
    { x: cx - w / 2, y: top },
    { x: cx + w / 2, y: top },
    { x: cx + w / 2 - 12, y: top + h },
    { x: cx - w / 2 + 12, y: top + h },
  ];
  return {
    shapes: [
      { kind: 'poly', pts },
      { kind: 'ellipse', cx, cy: top, rx: w / 2, ry: 9 },
      arcBand({ x: cx - w / 2 + 6, y: top }, { x: cx, y: top - 54 }, { x: cx + w / 2 - 6, y: top }, 6),
    ],
    markup:
      `<path d="M${cx - w / 2 + 6} ${top} Q${cx} ${top - 54} ${cx + w / 2 - 6} ${top}" fill="none" stroke="#5E6A7A" stroke-width="5"/>` +
      `<polygon points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="#FFD66B" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="9" fill="#F0B94B" ${L}/>` +
      `<path d="M${cx + 20} ${top + 14} l26 -46" stroke="#E97B6B" stroke-width="6" stroke-linecap="round"/>` +
      `<ellipse cx="${cx + 48}" cy="${top - 38}" rx="10" ry="14" transform="rotate(30 ${cx + 48} ${top - 38})" fill="#E97B6B" ${L}/>`,
  };
}
