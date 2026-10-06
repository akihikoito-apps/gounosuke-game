// 隠れ場所の前に置く小物（前景の遮蔽物）。
// shapes は可視判定に使い、markup は同じ寸法で描く。
import { type Pt, type Shape, quadPoints, r1 } from './geometry';

/** 太さのある取っ手（2次曲線）を多角形にする。描画の線と判定を一致させる */
function arcBand(p0: Pt, c: Pt, p1: Pt, width: number): Shape {
  const mid = [p0, ...quadPoints(p0, c, p1, 12)];
  const half = width / 2;
  const up = mid.map((p) => ({ x: p.x, y: p.y - half }));
  const down = mid.map((p) => ({ x: p.x, y: p.y + half })).reverse();
  return { kind: 'poly', pts: [...up, ...down] };
}

export interface Prop {
  shapes: Shape[];
  markup: string;
}

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

export function toyBox(cx: number, top: number, w = 150, h = 76): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 8 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="8" fill="#E9785F" ${L}/>` +
      `<rect x="${x - 6}" y="${top - 4}" width="${w + 12}" height="20" rx="7" fill="#F29A7E" ${L}/>` +
      `<circle cx="${cx - 34}" cy="${top + 46}" r="11" fill="#FFE08A"/><path d="M${cx + 22} ${top + 36} l12 20 h-24z" fill="#9ED4F0"/>`,
  };
}

export function pot(cx: number, top: number, w = 116, h = 74, color = '#D9895B'): Prop {
  const pts = [
    { x: cx - w / 2, y: top },
    { x: cx + w / 2, y: top },
    { x: cx + w / 2 - 14, y: top + h },
    { x: cx - w / 2 + 14, y: top + h },
  ];
  const leaves = [-1, 1]
    .map(
      (d) =>
        `<path d="M${cx + d * (w / 2 - 8)} ${top + 4} q${d * 34} -46 ${d * 52} -40 q${d * -6} 34 ${d * -52} 40z" fill="#6DB36B" ${L}/>`,
    )
    .join('');
  return {
    shapes: [{ kind: 'poly', pts }],
    markup:
      leaves +
      `<polygon points="${pts.map((p) => `${r1(p.x)},${r1(p.y)}`).join(' ')}" fill="${color}" ${L}/>` +
      `<rect x="${cx - w / 2 - 6}" y="${top - 6}" width="${w + 12}" height="18" rx="6" fill="${color}" ${L}/>`,
  };
}

export function cushion(cx: number, cy: number, rx = 76, ry = 42, color = '#FFD66B'): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" ${L}/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 14}" ry="${ry - 12}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="6 7"/>`,
  };
}

export function blanket(cx: number, top: number, w = 150, h = 62, color = '#8CCB9B'): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 20 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="20" fill="${color}" ${L}/>` +
      `<path d="M${x + 10} ${top + h / 2} H${x + w - 10}" stroke="#fff" stroke-opacity="0.6" stroke-width="4"/>`,
  };
}

export function blocks(cx: number, bottom: number): Prop {
  const s = 54;
  const cubes = [
    { x: cx - s - 4, y: bottom - s, c: '#7FB8F0' },
    { x: cx + 4, y: bottom - s, c: '#F6A5B8' },
    { x: cx - s / 2, y: bottom - 2 * s - 4, c: '#FFD66B' },
  ];
  return {
    shapes: cubes.map((q) => ({ kind: 'rect', x: q.x, y: q.y, w: s, h: s, rx: 6 }) as Shape),
    markup: cubes
      .map(
        (q, i) =>
          `<rect x="${q.x}" y="${q.y}" width="${s}" height="${s}" rx="6" fill="${q.c}" ${L}/>` +
          (i === 0
            ? `<circle cx="${q.x + s / 2}" cy="${q.y + s / 2}" r="12" fill="#fff"/>`
            : i === 1
              ? `<path d="M${q.x + s / 2} ${q.y + 14} l14 26 h-28z" fill="#fff"/>`
              : `<rect x="${q.x + 15}" y="${q.y + 15}" width="24" height="24" fill="#fff"/>`),
      )
      .join(''),
  };
}

export function ball(cx: number, cy: number, r = 54): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx: r, ry: r }],
    markup:
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" ${L}/>` +
      `<path d="M${cx} ${cy - r} Q${cx - r * 0.7} ${cy} ${cx} ${cy + r} Q${cx - r * 0.25} ${cy} ${cx} ${cy - r}z" fill="#F07D7D"/>` +
      `<path d="M${cx} ${cy - r} Q${cx + r * 0.7} ${cy} ${cx} ${cy + r} Q${cx + r * 0.25} ${cy} ${cx} ${cy - r}z" fill="#6FB6E8"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${L}/>`,
  };
}

export function basket(cx: number, top: number, w = 150, h = 72, color = '#D8A65F', handle = 70): Prop {
  const x = cx - w / 2;
  const lines = [1, 2, 3]
    .map((i) => `<path d="M${x + 4} ${top + (h * i) / 4} H${x + w - 4}" stroke="#A8783B" stroke-width="3"/>`)
    .join('');
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 16 }, arcBand({ x: x + 20, y: top + 4 }, { x: cx, y: top - handle }, { x: x + w - 20, y: top + 4 }, 10)],
    markup:
      `<path d="M${x + 20} ${top + 4} Q${cx} ${top - handle} ${x + w - 20} ${top + 4}" fill="none" stroke="#A8783B" stroke-width="9" stroke-linecap="round"/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="16" fill="${color}" ${L}/>` +
      lines,
  };
}

export function stones(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 38, cy + 6, 46, 30, '#B9B4C4'],
    [cx + 36, cy + 8, 44, 28, '#A9A3B6'],
    [cx, cy - 10, 50, 34, '#C9C4D2'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup: parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join(''),
  };
}

export function bucket(cx: number, top: number, w = 120, h = 80): Prop {
  const pts = [
    { x: cx - w / 2, y: top },
    { x: cx + w / 2, y: top },
    { x: cx + w / 2 - 12, y: top + h },
    { x: cx - w / 2 + 12, y: top + h },
  ];
  return {
    shapes: [{ kind: 'poly', pts }, { kind: 'ellipse', cx, cy: top, rx: w / 2, ry: 9 }, arcBand({ x: cx - w / 2 + 6, y: top }, { x: cx, y: top - 56 }, { x: cx + w / 2 - 6, y: top }, 6)],
    markup:
      `<path d="M${cx - w / 2 + 6} ${top} Q${cx} ${top - 56} ${cx + w / 2 - 6} ${top}" fill="none" stroke="#5E6A7A" stroke-width="5"/>` +
      `<polygon points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="#7FC4E8" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="9" fill="#5FA8D0" ${L}/>`,
  };
}

export function crate(cx: number, top: number, w = 150, h = 80): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 4 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="4" fill="#C98F5A" ${L}/>` +
      `<path d="M${x} ${top + h / 2} H${x + w} M${x + 10} ${top + 6} L${x + w - 10} ${top + h - 6}" stroke="#8E5E33" stroke-width="5"/>`,
  };
}

export function flowerClump(cx: number, cy: number, rx = 78, ry = 40): Prop {
  const fl = [-48, -16, 18, 50]
    .map((dx, i) => {
      const c = ['#FFD45C', '#FFFFFF', '#F7A8C4', '#FFD45C'][i];
      const y = cy - 18 + (i % 2) * 10;
      return `<circle cx="${cx + dx}" cy="${y}" r="11" fill="${c}" ${L}/><circle cx="${cx + dx}" cy="${y}" r="4" fill="#E8894A"/>`;
    })
    .join('');
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup: `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#4E9A55" ${L}/>` + fl,
  };
}

export function stump(cx: number, top: number, w = 130, h = 84): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 10 },
      { kind: 'ellipse', cx, cy: top, rx: w / 2, ry: 16 },
    ],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="#A9774A" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="16" fill="#E8C690" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${w / 4}" ry="7" fill="none" stroke="#B88A55" stroke-width="3"/>`,
  };
}

export function wateringCan(cx: number, top: number): Prop {
  const w = 120;
  const h = 76;
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 14 }],
    markup:
      `<path d="M${x + w - 6} ${top + 30} L${x + w + 44} ${top - 6}" stroke="#4A3A40" stroke-width="15" stroke-linecap="round"/>` +
      `<path d="M${x + w - 6} ${top + 30} L${x + w + 44} ${top - 6}" stroke="#7FB8F0" stroke-width="9" stroke-linecap="round"/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#7FB8F0" ${L}/>`,
  };
}

export function jar(cx: number, top: number, w = 112, h = 76): Prop {
  const x = cx - w / 2;
  const candies = [0, 1, 2, 3, 4]
    .map((i) => {
      const c = ['#F07D7D', '#FFD45C', '#7FB8F0', '#8CCB9B', '#F6A5B8'][i];
      return `<circle cx="${x + 18 + i * 19}" cy="${top + h - 20 - (i % 2) * 14}" r="10" fill="${c}"/>`;
    })
    .join('');
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 18 },
      { kind: 'rect', x: x + 12, y: top - 14, w: w - 24, h: 18, rx: 6 },
    ],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#EAF6FB" ${L}/>` +
      candies +
      `<rect x="${x + 12}" y="${top - 14}" width="${w - 24}" height="18" rx="6" fill="#F6A5B8" ${L}/>`,
  };
}

export function cakeStand(cx: number, top: number): Prop {
  const w = 130;
  return {
    shapes: [
      { kind: 'rect', x: cx - w / 2, y: top + 18, w, h: 48, rx: 10 },
      { kind: 'rect', x: cx - 20, y: top + 64, w: 40, h: 16 },
    ],
    markup:
      `<rect x="${cx - 20}" y="${top + 64}" width="40" height="16" fill="#F4F0E8" ${L}/>` +
      `<rect x="${cx - w / 2}" y="${top + 18}" width="${w}" height="48" rx="10" fill="#F8D6A8" ${L}/>` +
      `<path d="M${cx - w / 2} ${top + 30} q16 16 32 0 q16 16 32 0 q16 16 33 0 q16 16 33 0" fill="#FFFFFF" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 10}" r="10" fill="#F07D7D" ${L}/>`,
  };
}

export function breadBasket(cx: number, top: number): Prop {
  const p = basket(cx, top, 140, 62, '#E0B271', 40);
  const breads =
    `<ellipse cx="${cx - 30}" cy="${top + 2}" rx="30" ry="16" fill="#D4924C" ${L}/>` +
    `<ellipse cx="${cx + 28}" cy="${top}" rx="30" ry="16" fill="#C9833E" ${L}/>`;
  return {
    shapes: [...p.shapes, { kind: 'ellipse', cx: cx - 30, cy: top + 2, rx: 30, ry: 16 }, { kind: 'ellipse', cx: cx + 28, cy: top, rx: 30, ry: 16 }],
    markup: breads + p.markup,
  };
}

export function stool(cx: number, top: number): Prop {
  const w = 120;
  return {
    shapes: [
      { kind: 'rect', x: cx - w / 2, y: top, w, h: 26, rx: 12 },
      { kind: 'rect', x: cx - 46, y: top + 22, w: 92, h: 70 },
    ],
    markup:
      `<path d="M${cx - 40} ${top + 20} L${cx - 50} ${top + 92} M${cx + 40} ${top + 20} L${cx + 50} ${top + 92} M${cx - 44} ${top + 62} H${cx + 44}" stroke="#4A3A40" stroke-width="13" stroke-linecap="round"/>` +
      `<path d="M${cx - 40} ${top + 20} L${cx - 50} ${top + 92} M${cx + 40} ${top + 20} L${cx + 50} ${top + 92} M${cx - 44} ${top + 62} H${cx + 44}" stroke="#E8B04B" stroke-width="7" stroke-linecap="round"/>` +
      `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="26" rx="12" fill="#F07D7D" ${L}/>`,
  };
}

export function sack(cx: number, top: number): Prop {
  const w = 128;
  const h = 84;
  const d = `M${cx - w / 2 + 10} ${top + h} Q${cx - w / 2 - 8} ${top + 30} ${cx - 30} ${top + 6} L${cx + 30} ${top + 6} Q${cx + w / 2 + 8} ${top + 30} ${cx + w / 2 - 10} ${top + h}Z`;
  return {
    shapes: [{ kind: 'rect', x: cx - w / 2, y: top + 6, w, h: h - 6, rx: 24 }],
    markup:
      `<path d="${d}" fill="#F2E3C6" ${L}/>` +
      `<path d="M${cx - 34} ${top + 10} Q${cx} ${top - 16} ${cx + 34} ${top + 10}" fill="#F2E3C6" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 52}" r="14" fill="#E8B04B"/>`,
  };
}
