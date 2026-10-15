// ほたるの かわべ（背景パック4）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
// 夏の夜の川べりに似合う、やさしい絵本調の小物（ほたるかご・うちわ・すいれん・ささぶね・すいか・はっぱの舟・たけのベンチ・かえるの置きもの・ちょうちん）。
import { type Shape, r1 } from './geometry';
import type { Prop } from './props';

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

/** ほたるかご */
export function fireflyCage(cx: number, top: number, w = 124, h = 72): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 2}" rx="34" ry="16" fill="#78A870" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#46665C" ${L}/>` +
      `<circle cx="${cx - 20}" cy="${top + 34}" r="14" fill="#FFF099" fill-opacity="0.45"/>` +
      `<circle cx="${cx - 20}" cy="${top + 34}" r="6" fill="#FFFBE0"/>` +
      `<circle cx="${cx + 22}" cy="${top + 42}" r="12" fill="#FFF099" fill-opacity="0.45"/>` +
      `<circle cx="${cx + 22}" cy="${top + 42}" r="5" fill="#FFFBE0"/>` +
      `<path d="M${cx - 32} ${top + 10} V${top + h - 10} M${cx} ${top + 10} V${top + h - 10} M${cx + 32} ${top + 10} V${top + h - 10}" stroke="#8CC084" stroke-width="3"/>` +
      `<rect x="${x + 6}" y="${top + h - 14}" width="${w - 12}" height="12" rx="5" fill="#78A870" ${L}/>`,
  };
}

/** うちわ（竹かごに入った夏のうちわ2本） */
export function uchiwaFan(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 },
      { kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx - 28}" cy="${top + 6}" rx="26" ry="16" fill="#F29A8E" ${L}/>` +
      `<ellipse cx="${cx + 28}" cy="${top + 6}" rx="26" ry="16" fill="#7FB8E6" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#C89E68" ${L}/>` +
      `<circle cx="${cx - 26}" cy="${top + 28}" r="16" fill="#F29A8E" ${L}/>` +
      `<circle cx="${cx + 26}" cy="${top + 28}" r="16" fill="#7FB8E6" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 44}" r="9" fill="#FFF099" ${L}/>`,
  };
}

/** すいれん（丸い葉っぱと すいれんの花） */
export function waterlily(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 8, w, h: h - 8, rx: 16 },
      { kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 },
    ],
    markup:
      `<rect x="${x}" y="${top + 8}" width="${w}" height="${h - 8}" rx="22" fill="#589A78" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 6}" rx="38" ry="18" fill="#F7C6D4" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 6}" rx="22" ry="11" fill="#FFF6E8" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 6}" r="6" fill="#FFE07A"/>` +
      `<ellipse cx="${cx}" cy="${top + 42}" rx="38" ry="14" fill="#74B890" ${L}/>`,
  };
}

/** ささぶね（水辺に浮かぶ笹舟） */
export function bambooBoat(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  const puffs: [number, number, number, number, string][] = [
    [cx - 38, top + 24, 30, 18, '#82B878'],
    [cx + 38, top + 26, 28, 18, '#98CC8E'],
    [cx, top + 16, 34, 20, '#6CA464'],
  ];
  return {
    shapes: [
      { kind: 'rect', x: x + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 },
      ...puffs.map(([px, py, rx, ry]) => ({ kind: 'ellipse' as const, cx: px, cy: py, rx, ry })),
    ],
    markup:
      `<rect x="${x + 8}" y="${top + 18}" width="${w - 16}" height="${h - 18}" rx="10" fill="#587CA0" ${L}/>` +
      puffs
        .map(
          ([px, py, rx, ry, c]) =>
            `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>` +
            `<circle cx="${px}" cy="${py - 2}" r="4.5" fill="#FFF099"/>`,
        )
        .join(''),
  };
}

/** すいか（しましまの丸いすいか） */
export function watermelon(cx: number, cy: number, rx = 76, ry = 40): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#68B068" ${L}/>` +
      `<ellipse cx="${cx - 30}" cy="${cy}" rx="18" ry="28" fill="#4A8A50"/>` +
      `<ellipse cx="${cx + 30}" cy="${cy}" rx="18" ry="28" fill="#4A8A50"/>` +
      `<path d="M${cx - 28} ${cy + 6} L${cx + 28} ${cy + 6} A28 22 0 0 1 ${cx - 28} ${cy + 6} Z" fill="#F07878" ${L}/>`,
  };
}

/** はっぱの 舟（水鉢に浮かぶ葉っぱの舟） */
export function leafBoat(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 44, 28, '#78B488'],
    [cx + 38, cy + 8, 42, 26, '#8CC498'],
    [cx, cy - 8, 48, 30, '#6AA47A'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts.map(([x, y]) => `<circle cx="${x}" cy="${r1(y - 2)}" r="8" fill="#FFF099" ${L}/>`).join(''),
  };
}

/** たけの ベンチ（川べりの低い竹ベンチ） */
export function bambooBenchProp(cx: number, top: number, w = 138, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 22 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="#78A868" ${L}/>` +
      `<rect x="${x + 12}" y="${top + 12}" width="${w - 24}" height="${h - 24}" rx="12" fill="#98C882" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 34}" r="12" fill="#F29A8E" ${L}/>`,
  };
}

/** かえるの 置きもの */
export function frogStatue(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 14, w, h: h - 14, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 },
    ],
    markup:
      `<rect x="${x}" y="${top + 14}" width="${w}" height="${h - 14}" rx="14" fill="#949FB2" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 14}" rx="36" ry="22" fill="#88C88E" ${L}/>` +
      `<circle cx="${cx - 14}" cy="${top + 6}" r="7" fill="#88C88E" ${L}/>` +
      `<circle cx="${cx + 14}" cy="${top + 6}" r="7" fill="#88C88E" ${L}/>` +
      `<circle cx="${cx - 14}" cy="${top + 6}" r="2.8" fill="#4A3A40"/>` +
      `<circle cx="${cx + 14}" cy="${top + 6}" r="2.8" fill="#4A3A40"/>` +
      `<path d="M${cx - 8} ${top + 18} Q${cx} ${top + 24} ${cx + 8} ${top + 18}" fill="none" ${L}/>`,
  };
}

/** ちょうちん（川べりの灯り台） */
export function paperLanternProp(cx: number, top: number, w = 126, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 18 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#8A6448" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 34}" rx="32" ry="22" fill="#FFE89E" ${L}/>` +
      `<path d="M${cx - 28} ${top + 28} H${cx + 28} M${cx - 28} ${top + 40} H${cx + 28}" stroke="#E59A54" stroke-width="2.5"/>` +
      `<circle cx="${cx}" cy="${top + 34}" r="8" fill="#FFFDF4"/>`,
  };
}
