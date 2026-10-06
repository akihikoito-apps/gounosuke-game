// 服と背景で共有する柄の定義。SVG <pattern> を userSpaceOnUse で作るので、
// 背景と服で座標をそろえると継ぎ目なく溶け込む（＝隠れる）。
import { r1 } from './geometry';

export type PatternKind = 'plain' | 'stripes' | 'dots' | 'check' | 'leaf' | 'wood';

export interface PatternSpec {
  kind: PatternKind;
  /** 地の色 */
  bg: string;
  /** 柄の色 */
  fg: string;
  /** 柄の大きさ（1周期の長さ） */
  size: number;
  /** しま の向き（度） */
  angle?: number;
}

export function patternMarkup(id: string, p: PatternSpec, transform = ''): string {
  const s = p.size;
  const tf = transform ? ` patternTransform="${transform}"` : '';
  const head = `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${r1(s)}" height="${r1(s)}"${tf}>`;
  let body = '';
  switch (p.kind) {
    case 'plain':
      body = `<rect width="${s}" height="${s}" fill="${p.bg}"/>`;
      break;
    case 'stripes':
      body = `<rect width="${s}" height="${s}" fill="${p.bg}"/><rect width="${r1(s / 2)}" height="${s}" fill="${p.fg}"/>`;
      break;
    case 'dots':
      body =
        `<rect width="${s}" height="${s}" fill="${p.bg}"/>` +
        `<circle cx="${r1(s / 4)}" cy="${r1(s / 4)}" r="${r1(s * 0.13)}" fill="${p.fg}"/>` +
        `<circle cx="${r1((s * 3) / 4)}" cy="${r1((s * 3) / 4)}" r="${r1(s * 0.13)}" fill="${p.fg}"/>`;
      break;
    case 'check':
      body =
        `<rect width="${s}" height="${s}" fill="${p.bg}"/>` +
        `<rect width="${r1(s / 2)}" height="${s}" fill="${p.fg}" opacity="0.5"/>` +
        `<rect width="${s}" height="${r1(s / 2)}" fill="${p.fg}" opacity="0.5"/>`;
      break;
    case 'leaf': {
      const leaf = (cx: number, cy: number, rot: number) =>
        `<path transform="translate(${r1(cx)} ${r1(cy)}) rotate(${rot})" d="M0 ${r1(-s * 0.2)} Q${r1(s * 0.13)} 0 0 ${r1(s * 0.2)} Q${r1(-s * 0.13)} 0 0 ${r1(-s * 0.2)}Z" fill="${p.fg}"/>`;
      body = `<rect width="${s}" height="${s}" fill="${p.bg}"/>` + leaf(s * 0.27, s * 0.27, 35) + leaf(s * 0.75, s * 0.72, -40);
      break;
    }
    case 'wood':
      body =
        `<rect width="${s}" height="${s}" fill="${p.bg}"/>` +
        `<path d="M0 ${r1(s * 0.3)} Q${r1(s * 0.5)} ${r1(s * 0.22)} ${s} ${r1(s * 0.3)}" stroke="${p.fg}" stroke-width="${r1(s * 0.04)}" fill="none"/>` +
        `<path d="M0 ${r1(s * 0.75)} Q${r1(s * 0.5)} ${r1(s * 0.85)} ${s} ${r1(s * 0.75)}" stroke="${p.fg}" stroke-width="${r1(s * 0.03)}" fill="none"/>`;
      break;
  }
  const rot = p.kind === 'stripes' && p.angle ? `<g transform="rotate(${p.angle} ${r1(s / 2)} ${r1(s / 2)})">` : '';
  if (rot) {
    // 回転したしまは patternTransform で表現する（タイルの継ぎ目を出さないため）
    const tf2 = `${transform} rotate(${p.angle})`.trim();
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${r1(s)}" height="${r1(s)}" patternTransform="${tf2}">${body}</pattern>`;
  }
  return head + body + '</pattern>';
}

/** 色の明るさを変える（-1..1） */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  r = f(r);
  g = f(g);
  b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * 「やさしい」用の少し違う柄。同じ種類の柄だが、大きさと色が少し違うので
 * 背景にまぎれつつも見分けやすい。
 */
export function softVariant(p: PatternSpec): PatternSpec {
  return { ...p, size: p.size * 1.45, bg: shade(p.bg, -0.14), fg: shade(p.fg, -0.18) };
}
