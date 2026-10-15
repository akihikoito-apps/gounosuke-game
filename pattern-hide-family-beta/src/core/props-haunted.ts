// おばけやしき（背景パック4）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
// 3〜6歳向けに「暗いけれど、こわくない・かわいい」絵本調（にっこり笑顔のかぼちゃ・まるいおばけ・あたたかい灯り）。
import { type Shape, r1 } from './geometry';
import type { Prop } from './props';

const L = 'stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"';

/** にっこり かぼちゃランタン */
export function smilePumpkin(cx: number, top: number, w = 124, h = 72): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 2, rx: 34, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 2}" rx="34" ry="16" fill="#7A9E68" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="26" fill="#F29A52" ${L}/>` +
      `<ellipse cx="${cx}" cy="${r1(top + h / 2)}" rx="${r1(w * 0.28)}" ry="${r1(h * 0.44)}" fill="#F6AC66" ${L}/>` +
      `<circle cx="${cx - 20}" cy="${top + 28}" r="7" fill="#FFF0A8" ${L}/>` +
      `<circle cx="${cx + 20}" cy="${top + 28}" r="7" fill="#FFF0A8" ${L}/>` +
      `<path d="M${cx - 22} ${top + 44} Q${cx} ${top + 58} ${cx + 22} ${top + 44} Z" fill="#FFF0A8" ${L}/>`,
  };
}

/** まるい ろうそくたて */
export function candleStand(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      { kind: 'ellipse', cx: cx - 28, cy: top + 6, rx: 26, ry: 16 },
      { kind: 'ellipse', cx: cx + 28, cy: top + 6, rx: 26, ry: 16 },
    ],
    markup:
      `<ellipse cx="${cx - 28}" cy="${top + 6}" rx="26" ry="16" fill="#FFE082" ${L}/>` +
      `<ellipse cx="${cx + 28}" cy="${top + 6}" rx="26" ry="16" fill="#FFE082" ${L}/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#D8B46C" ${L}/>` +
      `<rect x="${cx - 42}" y="${top + 12}" width="28" height="36" rx="8" fill="#FFFDF4" ${L}/>` +
      `<rect x="${cx + 14}" y="${top + 12}" width="28" height="36" rx="8" fill="#FFFDF4" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 38}" r="10" fill="#FFE898" ${L}/>`,
  };
}

/** まるい おばけクッション */
export function ghostPlush(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 8, w, h: h - 8, rx: 16 },
      { kind: 'ellipse', cx, cy: top + 6, rx: 38, ry: 18 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 6}" rx="38" ry="18" fill="#F8F6FF" ${L}/>` +
      `<rect x="${x}" y="${top + 8}" width="${w}" height="${h - 8}" rx="22" fill="#F8F6FF" ${L}/>` +
      `<circle cx="${cx - 14}" cy="${top + 24}" r="3.5" fill="#4A3A40"/>` +
      `<circle cx="${cx + 14}" cy="${top + 24}" r="3.5" fill="#4A3A40"/>` +
      `<path d="M${cx - 8} ${top + 32} Q${cx} ${top + 39} ${cx + 8} ${top + 32}" fill="none" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 48}" rx="16" ry="8" fill="#B89EE0" ${L}/>`,
  };
}

/** ほしの えほんと ぼうし */
export function magicBooks(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  const puffs: [number, number, number, number, string][] = [
    [cx - 38, top + 24, 30, 18, '#B89EE0'],
    [cx + 38, top + 26, 28, 18, '#88C4B8'],
    [cx, top + 16, 34, 20, '#9A84C8'],
  ];
  return {
    shapes: [
      { kind: 'rect', x: x + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 },
      ...puffs.map(([px, py, rx, ry]) => ({ kind: 'ellipse' as const, cx: px, cy: py, rx, ry })),
    ],
    markup:
      `<rect x="${x + 8}" y="${top + 18}" width="${w - 16}" height="${h - 18}" rx="10" fill="#C99A68" ${L}/>` +
      puffs
        .map(
          ([px, py, rx, ry, c]) =>
            `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>` +
            `<circle cx="${px}" cy="${py - 2}" r="4.5" fill="#FFE082"/>`,
        )
        .join(''),
  };
}

/** こうもり クッション */
export function batCushion(cx: number, cy: number, rx = 76, ry = 40): Prop {
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#B89EE0" ${L}/>` +
      `<ellipse cx="${cx - 34}" cy="${cy}" rx="20" ry="14" fill="#9A82C4" ${L}/>` +
      `<ellipse cx="${cx + 34}" cy="${cy}" rx="20" ry="14" fill="#9A82C4" ${L}/>` +
      `<circle cx="${cx}" cy="${cy}" r="11" fill="#FFE082" ${L}/>`,
  };
}

/** おかしと キャンディの つぼ */
export function candyPots(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 44, 28, '#F2A668'],
    [cx + 38, cy + 8, 42, 26, '#C4B0E4'],
    [cx, cy - 8, 48, 30, '#E89AB8'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts.map(([x, y]) => `<circle cx="${x}" cy="${r1(y - 2)}" r="8" fill="#FFFDF6" ${L}/>`).join(''),
  };
}

/** おつきさまの オルゴール箱 */
export function musicBox(cx: number, top: number, w = 138, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 22 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="#A87C68" ${L}/>` +
      `<rect x="${x + 12}" y="${top + 12}" width="${w - 24}" height="${h - 24}" rx="12" fill="#E8C67A" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 34}" r="12" fill="#FFF3B0" ${L}/>`,
  };
}

/** おばけの ティーワゴン */
export function teaCart(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 14, w, h: h - 14, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 14}" rx="36" ry="22" fill="#F8F6FF" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 14}" r="10" fill="#E6DAF5"/>` +
      `<rect x="${x}" y="${top + 14}" width="${w}" height="${h - 14}" rx="14" fill="#B898C8" ${L}/>` +
      `<circle cx="${x + 28}" cy="${top + h - 10}" r="11" fill="#D8B46C" ${L}/>` +
      `<circle cx="${x + w - 28}" cy="${top + h - 10}" r="11" fill="#D8B46C" ${L}/>`,
  };
}

/** ほしあかりの ランタン台 */
export function lanternPost(cx: number, top: number, w = 126, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 18 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#7A6898" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 34}" rx="28" ry="20" fill="#FFE898" ${L}/>` +
      `<circle cx="${cx}" cy="${top + 34}" r="9" fill="#FFFDF4"/>`,
  };
}
