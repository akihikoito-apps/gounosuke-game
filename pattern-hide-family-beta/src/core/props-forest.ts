// きのこの もり（背景パック2）の小物。shapes は可視判定に使い、markup は同じ寸法で描く。
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

/** キャンプランタン */
export function lantern(cx: number, top: number, w = 118, h = 72): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 14 },
      arcBand({ x: cx - 34, y: top + 2 }, { x: cx, y: top - 36 }, { x: cx + 34, y: top + 2 }, 6),
    ],
    markup:
      `<path d="M${cx - 34} ${top + 2} Q${cx} ${top - 36} ${cx + 34} ${top + 2}" fill="none" stroke="#5E5256" stroke-width="5.5" stroke-linecap="round"/>` +
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="#E27D6A" ${L}/>` +
      `<rect x="${x + 8}" y="${top + 4}" width="${w - 16}" height="12" rx="5" fill="#C96452"/>` +
      `<rect x="${x + 6}" y="${top + h - 14}" width="${w - 12}" height="10" rx="4" fill="#C96452"/>` +
      `<rect x="${cx - 30}" y="${top + 16}" width="60" height="${h - 30}" rx="10" fill="#FFE898" ${L}/>` +
      `<circle cx="${cx}" cy="${r1(top + h / 2 + 2)}" r="11" fill="#FFF8D6"/>`,
  };
}

/** 丸太のミニテーブル */
export function logTable(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top, w, h, rx: 10 },
      { kind: 'ellipse', cx, cy: top + 10, rx: w / 2, ry: 12 },
    ],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="#B88352" ${L}/>` +
      `<path d="M${x + 24} ${top + 18} V${top + h - 6} M${cx} ${top + 20} V${top + h - 6} M${x + w - 24} ${top + 18} V${top + h - 6}" stroke="#8E5E33" stroke-width="3" stroke-linecap="round"/>` +
      `<ellipse cx="${cx}" cy="${top + 10}" rx="${w / 2}" ry="12" fill="#E8C896" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 10}" rx="${r1(w * 0.28)}" ry="6" fill="none" stroke="#C49A64" stroke-width="2.5"/>`,
  };
}

/** どんぐりのかご */
export function acornBasket(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 8, w, h: h - 8, rx: 16 },
      { kind: 'ellipse', cx: cx - 26, cy: top + 8, rx: 28, ry: 14 },
      { kind: 'ellipse', cx: cx + 26, cy: top + 8, rx: 28, ry: 14 },
      arcBand({ x: x + 22, y: top + 10 }, { x: cx, y: top - 38 }, { x: x + w - 22, y: top + 10 }, 8),
    ],
    markup:
      `<path d="M${x + 22} ${top + 10} Q${cx} ${top - 38} ${x + w - 22} ${top + 10}" fill="none" stroke="#9E6E3B" stroke-width="7.5" stroke-linecap="round"/>` +
      `<ellipse cx="${cx - 26}" cy="${top + 8}" rx="28" ry="14" fill="#B87A44" ${L}/>` +
      `<ellipse cx="${cx + 26}" cy="${top + 8}" rx="28" ry="14" fill="#9E6332" ${L}/>` +
      `<rect x="${x}" y="${top + 8}" width="${w}" height="${h - 8}" rx="16" fill="#D49E5D" ${L}/>` +
      `<path d="M${x + 6} ${top + 28} H${x + w - 6} M${x + 6} ${top + 48} H${x + w - 6}" stroke="#A87439" stroke-width="3"/>`,
  };
}

/** ちいさなきのこ株 */
export function miniMushrooms(cx: number, top: number, w = 136, h = 68): Prop {
  const x = cx - w / 2;
  const caps: [number, number, number, number, string][] = [
    [cx - 38, top + 24, 30, 18, '#F0A878'],
    [cx + 38, top + 26, 28, 18, '#EBC468'],
    [cx, top + 16, 34, 20, '#E68A82'],
  ];
  return {
    shapes: [
      { kind: 'rect', x: x + 8, y: top + 18, w: w - 16, h: h - 18, rx: 10 },
      ...caps.map(([mx, my, rx, ry]) => ({ kind: 'ellipse' as const, cx: mx, cy: my, rx, ry })),
    ],
    markup:
      `<rect x="${x + 8}" y="${top + 18}" width="${w - 16}" height="${h - 18}" rx="10" fill="#F5E8D0" ${L}/>` +
      `<path d="M${cx - 18} ${top + 28} V${top + h - 4} M${cx + 18} ${top + 28} V${top + h - 4}" stroke="#D8C8AC" stroke-width="3" stroke-linecap="round"/>` +
      caps
        .map(
          ([mx, my, rx, ry, c]) =>
            `<ellipse cx="${mx}" cy="${my}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>` +
            `<circle cx="${mx - 8}" cy="${my - 4}" r="4" fill="#FFF6EE"/>` +
            `<circle cx="${mx + 9}" cy="${my + 2}" r="3.5" fill="#FFF6EE"/>`,
        )
        .join(''),
  };
}

/** 赤い木の実のしげみ */
export function berryClump(cx: number, cy: number, rx = 76, ry = 40): Prop {
  const berries: [number, number][] = [
    [-42, -8],
    [-14, -16],
    [16, -12],
    [44, -6],
    [0, 8],
  ];
  return {
    shapes: [{ kind: 'ellipse', cx, cy, rx, ry }],
    markup:
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#559E5C" ${L}/>` +
      berries
        .map(
          ([dx, dy], i) =>
            `<circle cx="${cx + dx}" cy="${cy + dy}" r="9" fill="${i % 2 === 0 ? '#E87474' : '#F0908A'}" ${L}/>` +
            `<circle cx="${cx + dx - 2.5}" cy="${cy + dy - 2.5}" r="2.2" fill="#FFF6EE"/>`,
        )
        .join(''),
  };
}

/** 苔むした丸い石の山 */
export function mossRocks(cx: number, cy: number): Prop {
  const parts: [number, number, number, number, string][] = [
    [cx - 40, cy + 6, 44, 28, '#B8B4AE'],
    [cx + 38, cy + 8, 42, 26, '#ABA7A1'],
    [cx, cy - 8, 48, 30, '#C8C4BE'],
  ];
  return {
    shapes: parts.map(([x, y, rx, ry]) => ({ kind: 'ellipse', cx: x, cy: y, rx, ry }) as Shape),
    markup:
      parts.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${L}/>`).join('') +
      parts
        .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${r1(y - ry * 0.42)}" rx="${r1(rx * 0.65)}" ry="${r1(ry * 0.38)}" fill="#8CC47E"/>`)
        .join(''),
  };
}

/** 横たわった丸太 */
export function hollowLog(cx: number, top: number, w = 138, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 22 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="#9E6E44" ${L}/>` +
      `<ellipse cx="${x + 22}" cy="${top + h / 2}" rx="16" ry="${h / 2 - 4}" fill="#E5C594" ${L}/>` +
      `<ellipse cx="${x + 22}" cy="${top + h / 2}" rx="7" ry="12" fill="#6E4B2E"/>` +
      `<path d="M${x + 48} ${top + 20} H${x + w - 18} M${x + 54} ${top + h - 18} H${x + w - 24}" stroke="#7A5230" stroke-width="3.5" stroke-linecap="round"/>`,
  };
}

/** 森のたきび台（安全な丸い灯り） */
export function campfire(cx: number, top: number, w = 134, h = 70): Prop {
  const x = cx - w / 2;
  return {
    shapes: [
      { kind: 'rect', x, y: top + 14, w, h: h - 14, rx: 14 },
      { kind: 'ellipse', cx, cy: top + 14, rx: 36, ry: 22 },
    ],
    markup:
      `<ellipse cx="${cx}" cy="${top + 14}" rx="36" ry="22" fill="#F6A468" ${L}/>` +
      `<ellipse cx="${cx}" cy="${top + 16}" rx="20" ry="13" fill="#FFE282"/>` +
      `<rect x="${x}" y="${top + 14}" width="${w}" height="${h - 14}" rx="14" fill="#9E6E44" ${L}/>` +
      `<circle cx="${x + 24}" cy="${top + h - 14}" r="12" fill="#B8B4AE" ${L}/>` +
      `<circle cx="${cx}" cy="${top + h - 12}" r="13" fill="#C8C4BE" ${L}/>` +
      `<circle cx="${x + w - 24}" cy="${top + h - 14}" r="12" fill="#B8B4AE" ${L}/>`,
  };
}

/** 探検リュックサック */
export function rucksack(cx: number, top: number, w = 126, h = 68): Prop {
  const x = cx - w / 2;
  return {
    shapes: [{ kind: 'rect', x, y: top, w, h, rx: 18 }],
    markup:
      `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="#7EB092" ${L}/>` +
      `<rect x="${x + 8}" y="${top + 4}" width="${w - 16}" height="28" rx="12" fill="#C98A54" ${L}/>` +
      `<rect x="${cx - 28}" y="${top + 22}" width="10" height="24" rx="4" fill="#F5E8D0" ${L}/>` +
      `<rect x="${cx + 18}" y="${top + 22}" width="10" height="24" rx="4" fill="#F5E8D0" ${L}/>`,
  };
}
