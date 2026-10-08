// キャラクターの描画。art/ に絵があればそれを重ね、無ければコードの絵。
// どちらの場合も、服には背景と同じ座標の柄（fillId）が入る。
import { type CharacterDef, characterMarkup, faceIconMarkup, fullIconMarkup } from '../core/characters';
import { CHAR_FRAME, characterArt } from '../art/registry';

const F = CHAR_FRAME;
const img = (href: string, extra = '') =>
  `<image href="${href}" x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;

/** shade：服の陰影の濃さ（最難関だけ 0.5。通常は 1） */
export function charArtMarkup(c: CharacterDef, o: { fillId: string; outline: number; found?: boolean; shade?: number }): string {
  const a = characterArt(c.id);
  if (!a) return characterMarkup(c, o);
  const m = `m-${o.fillId}`;
  const outline = Math.max(0.25, o.outline);
  return (
    `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}">${img(a.clothesMask)}</mask></defs>` +
    `<g class="char-body">` +
    (a.back ? img(a.back) : '') +
    `<rect class="clothes" x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="url(#${o.fillId})" mask="url(#${m})"/>` +
    (a.clothesShade ? img(a.clothesShade, `style="mix-blend-mode:multiply"${o.shade !== undefined && o.shade < 1 ? ` opacity="${o.shade}"` : ''}`) : '') +
    (a.clothesLine ? img(a.clothesLine, `opacity="${outline}"`) : '') +
    `</g>` +
    `<g class="char-head">${img(o.found && a.frontFound ? a.frontFound : a.front)}</g>`
  );
}

export function faceIcon(c: CharacterDef): string {
  const a = characterArt(c.id);
  if (!a) return faceIconMarkup(c);
  return `<svg viewBox="-70 -215 140 120" aria-hidden="true" focusable="false">${img(a.front)}</svg>`;
}

export function fullIcon(c: CharacterDef, patternDefs: string, fillId: string): string {
  if (!characterArt(c.id)) return fullIconMarkup(c, patternDefs, fillId);
  return `<svg viewBox="-90 -225 180 240" aria-hidden="true" focusable="false"><defs>${patternDefs}</defs>${charArtMarkup(c, { fillId, outline: 1 })}</svg>`;
}
