// すいぞくかん（背景パック3）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
import { type Shape, r1 } from './geometry';
import type { Prop } from './props';

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

/** ウミガメの解説パネル */
export function turtleBoard(cx: number, top: number, w = 124, h = 72): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 2}" rx="34" ry="16" fill="#78B898" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#C99A68" ${L}/>` +
      `<rect x="${x + 10}" y="${top + 10}" width="${w - 20}" height="${h - 20}" rx="8" fill="#BCE4D8" ${L}/>` +
      `<ellipse cx="${cx}" cy="${r1(top + h / 2)}" rx="24" ry="16" fill="#68A888" ${L}/>` +
      `<circle cx="${cx + 28}" cy="${r1(top + h / 2 - 2)}" r="8" fill="#88C4A4" ${L}/>`,
  };
}

/** サンゴの展示モデル */
export function coralDisplay(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 },
      { kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx - 28}" cy="${top + 6}" rx="26" ry="16" fill="#F4989C" ${L}/>` +
      `<ellipse cx="${cx + 28}" cy="${top + 6}" rx="26" ry="16" fill="#FFE082" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#E8DCC8" ${L}/>` +
      `<ellipse cx="${cx - 26}" cy="${top + 26}" rx="22" ry="14" fill="#F4989C" ${L}/>` +
      `<ellipse cx="${cx + 24}" cy="${top + 28}" rx="20" ry="13" fill="#88D4C8" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 42}" r="10" fill="#FFF8EE" ${L}/>`,
  };
}

/** クラゲの案内スタンド */
export function guideStand(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 8, w, h: h - 8, rx: 16 },
      { kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 6}" rx="38" ry="18" fill="#C8CEF4" ${L}/>` +
      `<rect x="${x}" y="${top + 8}" width="${w}" height="${h - 8}" rx="16" fill="#9AA4E0" ${L}/>` +
      `<rect x="${x + 12}" y="${top + 18}" width="${w - 24}" height="${h - 28}" rx="10" fill="#EEF0FC"/>` +
      `<path d="M${cx - 20} ${top + 38} Q${cx} ${top + 20} ${cx + 20} ${top + 38} Z" fill="#B8C0EE" ${L}/>`,
  };
}

/** 丸いアクアベンチ */
export function bubbleBench(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  const puffs: [number, number, number, number, string][] = [
    [cx - 38, top + 24, 30, 18, '#9AD4E8'],
    [cx + 38, top + 26, 28, 18, '#B2E0F0'],
    [cx, top + 16, 34, 20, '#82C4DC'],
  ];
  return {
    shapes: [
      { kind: 'rect', x: x + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 },
      ...puffs.map(([px, py, rx, ry]) => ({ kind: 'ellipse' as const, cx: px, cy: py, rx, ry })),
    ],
    markup:
      `<rect x="${x + 8}" y="${top + 18}" width="${w - 16}" height="${h - 18}" rx="10" fill="#B88B58" ${L}/>` +
      puffs
        .map(
          ([px, py, rx, ry, c]) =>
            `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>` +
            `<circle cx="${px - 8}" cy="${py - 4}" r="4" fill="#FFFFFF" opacity="0.8"/>`,
        )
        .join(''),
  };
}

/** 貝がらクッション */
export function shellCushion(cx: number, cy: number, rx = 76, ry = 40): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F7C6D0" ${L}/>` +
      `<path d="M${cx} ${cy + ry - 8} L${cx - 36} ${cy - ry + 12} M${cx} ${cy + ry - 8} V${cy - ry + 8} M${cx} ${cy + ry - 8} L${cx + 36} ${cy - ry + 12}" stroke="#E09AA8" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="${cx}" cy="${cy + 12}" r="9" fill="#FFFDF6" ${L}/>`,
  };
}

/** 真珠貝のおもちゃ群 */
export function pearlClams(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 44, 28, '#D6CBEF'],
    [cx + 38, cy + 8, 42, 26, '#C2E6DC'],
    [cx, cy - 8, 48, 30, '#F5D6E0'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts.map(([x, y]) => `<circle cx="${x}" cy="${r1(y - 2)}" r="8" fill="#FFFDF8" ${L}/>`).join(''),
  };
}

/** イルカのぬいぐるみ */
export function dolphinPlush(cx: number, top: number, w = 138, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 22 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="#88C4E0" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + h - 14}" rx="${r1(w * 0.36)}" ry="12" fill="#FFFDF8"/>` +
      `<circle cx="${x + 28}" cy="${top + 26}" r="4.5" fill="#4A3A40"/>` +
      `<ellipse cx="${x + 38}" cy="${top + 34}" rx="7" ry="4" fill="#F4A6B8" opacity="0.7"/>`,
  };
}

/** おみやげワゴン */
export function souvenirCart(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 14, w, h: h - 14, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 14}" rx="36" ry="22" fill="#F4A698" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 16}" rx="18" ry="12" fill="#FFFDF6"/>` +
      `<rect x="${x}" y="${top + 14}" width="${w}" height="${h - 14}" rx="14" fill="#E8C69E" ${L}/>` +
      `<circle cx="${x + 28}" cy="${top + h - 10}" r="11" fill="#7AA8C8" ${L}/>` +
      `<circle cx="${x + w - 28}" cy="${top + h - 10}" r="11" fill="#7AA8C8" ${L}/>`,
  };
}

/** ペンギン案内ボード */
export function penguinSign(cx: number, top: number, w = 126, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 18 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#7AA8C8" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 38}" rx="28" ry="22" fill="#FFFDF8" ${L}/>` +
      `<circle cx="${cx - 10}" cy="${top + 22}" r="3.5" fill="#4A3A40"/>` +
      `<circle cx="${cx + 10}" cy="${top + 22}" r="3.5" fill="#4A3A40"/>` +
      `<path d="M${cx - 7} ${top + 28} L${cx + 7} ${top + 28} L${cx} ${top + 35} Z" fill="#F6C85F" ${L}/>`,
  };
}
