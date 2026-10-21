// きょうりゅうの たに（背景パック5）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
import { type Shape, r1 } from './geometry';
import type { Prop } from './props';

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

/** アンモナイトの化石岩 */
export function ammoniteRock(cx: number, top: number, w = 124, h = 72): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 2}" rx="34" ry="16" fill="#C89E78" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#D8B48E" ${L}/>` +
      `<circle cx="${cx}" cy="${r1(top + h / 2)}" r="22" fill="#F2DEC4" ${L}/>` +
      `<path d="M${cx} ${r1(top + h / 2)} m-6 0 a6 6 0 1 0 12 0 a12 12 0 1 0 -20 -4" fill="none" stroke="#8C684C" stroke-width="3.5" stroke-linecap="round"/>`,
  };
}

/** まるい骨のトンネル岩 */
export function ribArch(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 },
      { kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx - 28}" cy="${top + 6}" rx="26" ry="16" fill="#F5EDE0" ${L}/>` +
      `<ellipse cx="${cx + 28}" cy="${top + 6}" rx="26" ry="16" fill="#F5EDE0" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#C9A27E" ${L}/>` +
      `<path d="M${x + 18} ${top + h - 8} Q${cx} ${top + 8} ${x + w - 18} ${top + h - 8}" fill="none" stroke="#FFF9EE" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M${x + 18} ${top + h - 8} Q${cx} ${top + 8} ${x + w - 18} ${top + h - 8}" fill="none" stroke="#4A3A40" stroke-width="3.5" stroke-linecap="round"/>`,
  };
}

/** ソテツのきりかぶ */
export function cycadStump(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 8, w, h: h - 8, rx: 16 },
      { kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 6}" rx="38" ry="18" fill="#6EB874" ${L}/>` +
      `<rect x="${x}" y="${top + 8}" width="${w}" height="${h - 8}" rx="16" fill="#9E7452" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 16}" rx="46" ry="10" fill="#D8B68C" ${L}/>`,
  };
}

/** ぽこぽこ間欠泉の岩場 */
export function geyserPool(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  const puffs: [number, number, number, number, string][] = [
    [cx - 38, top + 24, 30, 18, '#B8E8F4'],
    [cx + 38, top + 26, 28, 18, '#D2F2FA'],
    [cx, top + 16, 34, 20, '#98D8EA'],
  ];
  return {
    shapes: [
      { kind: 'rect', x: x + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 },
      ...puffs.map(([px, py, rx, ry]) => ({ kind: 'ellipse' as const, cx: px, cy: py, rx, ry })),
    ],
    markup:
      `<rect x="${x + 8}" y="${top + 18}" width="${w - 16}" height="${h - 18}" rx="10" fill="#B29A86" ${L}/>` +
      puffs
        .map(
          ([px, py, rx, ry, c]) =>
            `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>` +
            `<circle cx="${px - 8}" cy="${py - 4}" r="4" fill="#FFFFFF" opacity="0.8"/>`,
        )
        .join(''),
  };
}

/** 大きな水玉たまご */
export function spottedEgg(cx: number, cy: number, rx = 76, ry = 40): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFF6E6" ${L}/>` +
      `<circle cx="${cx - 26}" cy="${cy - 6}" r="11" fill="#88C894"/>` +
      `<circle cx="${cx + 22}" cy="${cy - 10}" r="9" fill="#F2A488"/>` +
      `<circle cx="${cx + 4}" cy="${cy + 10}" r="12" fill="#88C894"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${L}/>`,
  };
}

/** われたたまごのから */
export function eggShells(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 44, 28, '#FFF2DC'],
    [cx + 38, cy + 8, 42, 26, '#FCE4D6'],
    [cx, cy - 8, 48, 30, '#E8F4DC'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts.map(([x, y]) => `<circle cx="${x}" cy="${r1(y - 2)}" r="8" fill="#88C894"/>`).join(''),
  };
}

/** シダの葉クッション */
export function fernCushion(cx: number, top: number, w = 138, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 22 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="#68B278" ${L}/>` +
      `<path d="M${x + 20} ${top + h / 2} H${x + w - 20}" stroke="#C8ECC4" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="${cx - 26}" cy="${top + 22}" r="7" fill="#A6DC9E"/>` +
      `<circle cx="${cx}" cy="${top + 22}" r="7" fill="#A6DC9E"/>` +
      `<circle cx="${cx + 26}" cy="${top + 22}" r="7" fill="#A6DC9E"/>`,
  };
}

/** あしあと化石の石 */
export function footprintStone(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 14, w, h: h - 14, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 14}" rx="36" ry="22" fill="#D4BA98" ${L}/>` +
      `<rect x="${x}" y="${top + 14}" width="${w}" height="${h - 14}" rx="14" fill="#C4A682" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 46}" rx="16" ry="11" fill="#8E7254"/>` +
      `<circle cx="${cx - 16}" cy="${top + 30}" r="6" fill="#8E7254"/>` +
      `<circle cx="${cx}" cy="${top + 26}" r="6.5" fill="#8E7254"/>` +
      `<circle cx="${cx + 16}" cy="${top + 30}" r="6" fill="#8E7254"/>`,
  };
}

/** たんけん木箱 */
export function explorerCrate(cx: number, top: number, w = 126, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 18 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#C89664" ${L}/>` +
      `<rect x="${x + 12}" y="${top + 12}" width="${w - 24}" height="${h - 24}" rx="10" fill="#E2B888" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 34}" r="12" fill="#FFF2D6" ${L}/>`,
  };
}
