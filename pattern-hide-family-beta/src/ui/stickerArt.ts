// シールの絵。art/stickers/{id}.png があればそれを使い、無ければコードで描く（白いふちの丸いシール＋キャラクター＋モチーフ）。
import { CHARACTERS } from '../core/characters';
import type { Motif, StickerDef, StickerPageId } from '../core/stickers';
import { faceIcon } from './charArt';
import { stickerArtFile } from '../art/registry';

const L = 'stroke="#4A3A40" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';

/** モチーフ（中心 0,0・半径およそ 16 の範囲） */
function motif(m: Motif): string {
  switch (m) {
    case 'shell':
      return `<path d="M-15 10 Q-16 -14 0 -15 Q16 -14 15 10 Z" fill="#FBE3DC" ${L}/><path d="M-8 9 L-4 -10 M0 10 V-13 M8 9 L4 -10" stroke="#C9A39A" stroke-width="2"/>`;
    case 'floatring':
      return `<circle r="15" fill="#F07D7D" ${L}/><circle r="7" fill="#D7ECF3" ${L}/><path d="M0 -15 V-7 M0 7 V15 M-15 0 H-7 M7 0 H15" stroke="#FFFFFF" stroke-width="4"/>`;
    case 'shavedice':
      return `<path d="M-13 2 Q0 -18 13 2 Z" fill="#FFFDF8" ${L}/><path d="M-10 -2 Q0 -15 10 -2 Z" fill="#F29AAE" ${L}/><path d="M-14 2 H14 L9 14 H-9 Z" fill="#9FC0E2" ${L}/>`;
    case 'crab':
      return `<path d="M-12 6 Q-14 -12 2 -13 Q15 -10 12 6 Z" fill="#E5B869" ${L}/><ellipse cx="-4" cy="8" rx="9" ry="6" fill="#E88B72" ${L}/><circle cx="-8" cy="6" r="1.6" fill="#4A3A40"/><circle cx="-2" cy="6" r="1.6" fill="#4A3A40"/>`;
    case 'ball':
      return `<circle r="15" fill="#FFF7EA" ${L}/><path d="M-15 0 Q0 -8 15 0" fill="none" stroke="#E07B7B" stroke-width="4"/><path d="M0 -15 Q-7 0 0 15" fill="none" stroke="#7EA6DA" stroke-width="4"/>`;
    case 'cushion':
      return `<rect x="-17" y="-11" width="34" height="22" rx="9" fill="#9FD2AF" ${L}/><path d="M-10 0 H10" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>`;
    case 'cloud':
      return `<path d="M-16 6 a8 8 0 0 1 4-14 a10 10 0 0 1 18-2 a8 8 0 0 1 8 16Z" fill="#FFFFFF" ${L}/>`;
    case 'flower':
      return [0, 72, 144, 216, 288].map((a) => `<ellipse rx="6" ry="9" cy="-9" transform="rotate(${a})" fill="#F4AFC4" ${L}/>`).join('') + `<circle r="6" fill="#FFD66B" ${L}/>`;
    case 'cake':
      return `<path d="M-15 12 V-2 H15 V12Z" fill="#FFF3D6" ${L}/><path d="M-15 -2 Q-8 4 0 -2 Q8 4 15 -2" fill="#F7C6CF" ${L}/><circle cy="-8" r="4" fill="#E07B7B" ${L}/>`;
    case 'leaf':
      return `<path d="M0 15 Q-16 0 0 -16 Q16 0 0 15Z" fill="#8CCB9B" ${L}/><path d="M0 12 V-12" stroke="#4A3A40" stroke-width="1.8"/>`;
    case 'heart':
      return `<path d="M0 13 C-18 0 -12 -16 0 -7 C12 -16 18 0 0 13Z" fill="#F29AAE" ${L}/>`;
    case 'moon':
      return `<path d="M5 -15 A15 15 0 1 0 12 9 A12 12 0 1 1 5 -15Z" fill="#FFE07A" ${L}/>`;
    case 'crown':
      return `<path d="M-16 10 L-16 -8 L-8 0 L0 -12 L8 0 L16 -8 L16 10Z" fill="#FFD45C" ${L}/><circle cy="3" r="2.6" fill="#E07B7B"/>`;
    case 'rainbow':
      return ['#E9A0A0', '#F6D58A', '#A8CF9A', '#9FC0E2'].map((c, i) => `<path d="M${-17 + i * 4} 10 A${17 - i * 4} ${17 - i * 4} 0 0 1 ${17 - i * 4} 10" fill="none" stroke="${c}" stroke-width="4"/>`).join('');
    case 'star':
      return `<path d="M0 -16 L4.7 -5 L16 -5 L7 2 L10 14 L0 7 L-10 14 L-7 2 L-16 -5 L-4.7 -5Z" fill="#FFD45C" ${L}/>`;
    case 'fish':
      return `<path d="M-12 0 Q0 -12 12 0 Q0 12 -12 0Z" fill="#9FC0E2" ${L}/><path d="M12 0 L18 -7 L18 7Z" fill="#9FC0E2" ${L}/><circle cx="-5" cy="-2" r="1.8" fill="#4A3A40"/>`;
    case 'bread':
      return `<path d="M-16 8 Q-18 -10 0 -12 Q18 -10 16 8Z" fill="#E7B67A" ${L}/><path d="M-7 -6 L-3 2 M3 -7 L7 1" stroke="#B7864F" stroke-width="2"/>`;
    case 'balloon':
      return `<ellipse cy="-4" rx="11" ry="13" fill="#F29AAE" ${L}/><path d="M0 9 Q-4 14 2 18" fill="none" stroke="#4A3A40" stroke-width="1.8"/>`;
    case 'present':
      return `<rect x="-14" y="-8" width="28" height="22" rx="3" fill="#F7C6CF" ${L}/><path d="M0 -8 V14 M-14 2 H14" stroke="#E07B7B" stroke-width="3"/><path d="M0 -8 Q-10 -18 -6 -9 M0 -8 Q10 -18 6 -9" fill="none" ${L}/>`;
    case 'mushroom':
      return `<rect x="-6" y="0" width="12" height="14" rx="5" fill="#F5EBD6" ${L}/><path d="M-16 2 Q-16 -15 0 -15 Q16 -15 16 2 Z" fill="#D98A6C" ${L}/><circle cx="-6" cy="-6" r="2.5" fill="#FFFDF6"/><circle cx="5" cy="-8" r="2" fill="#FFFDF6"/>`;
    case 'acorn':
      return `<ellipse cx="0" cy="4" rx="11" ry="12" fill="#C88B52" ${L}/><path d="M-13 -2 Q-13 -12 0 -12 Q13 -12 13 -2 Z" fill="#8C5A32" ${L}/><path d="M0 -12 V-16" ${L}/>`;
    case 'lantern':
      return `<path d="M-5 -12 Q0 -18 5 -12" fill="none" ${L}/><rect x="-10" y="-8" width="20" height="22" rx="4" fill="#FFE082" ${L}/><rect x="-12" y="-10" width="24" height="4" rx="2" fill="#7A5A46" ${L}/><rect x="-12" y="12" width="24" height="4" rx="2" fill="#7A5A46" ${L}/>`;
    case 'squirrel':
      return `<path d="M4 10 Q18 10 16 -6 Q14 -16 6 -8" fill="#D89458" ${L}/><ellipse cx="-3" cy="4" rx="9" ry="10" fill="#D89458" ${L}/><circle cx="-5" cy="-7" r="7" fill="#D89458" ${L}/><circle cx="-7" cy="-8" r="1.6" fill="#4A3A40"/>`;
    case 'jellyfish':
      return `<path d="M-15 0 Q-15 -15 0 -15 Q15 -15 15 0 Z" fill="#C8CEF4" ${L}/><path d="M-8 0 Q-10 8 -6 14 M0 0 Q-2 8 2 14 M8 0 Q6 8 10 14" fill="none" ${L}/>`;
    case 'dolphin':
      return `<path d="M-15 6 Q-6 -14 14 -4 Q6 8 -15 6 Z" fill="#88C4E0" ${L}/><path d="M-2 -6 L2 -14 L6 -5 Z" fill="#88C4E0" ${L}/><circle cx="7" cy="-3" r="1.6" fill="#4A3A40"/>`;
    case 'treasure':
      return `<rect x="-14" y="-4" width="28" height="16" rx="3" fill="#C98A54" ${L}/><path d="M-14 -4 Q0 -14 14 -4 Z" fill="#E5B869" ${L}/><circle cx="0" cy="-2" r="3" fill="#FFE082" ${L}/>`;
    case 'penguin':
      return `<ellipse cx="0" cy="1" rx="11" ry="14" fill="#5E7A96" ${L}/><ellipse cx="0" cy="4" rx="7" ry="10" fill="#FFFDF8"/><circle cx="-4" cy="-6" r="1.6" fill="#4A3A40"/><circle cx="4" cy="-6" r="1.6" fill="#4A3A40"/><path d="M-3 -3 L3 -3 L0 1 Z" fill="#F6C85F"/>`;
    case 'firefly':
      return `<circle cx="4" cy="4" r="10" fill="#FFF3B0" opacity="0.7"/><ellipse cx="-3" cy="-2" rx="9" ry="7" fill="#7AB87E" ${L}/><ellipse cx="-6" cy="-9" rx="6" ry="4" fill="#DCECF8" ${L}/><circle cx="5" cy="3" r="6" fill="#FFE066" ${L}/>`;
    case 'frog':
      return `<ellipse cx="0" cy="3" rx="13" ry="10" fill="#88C88E" ${L}/><circle cx="-7" cy="-6" r="5" fill="#88C88E" ${L}/><circle cx="7" cy="-6" r="5" fill="#88C88E" ${L}/><circle cx="-7" cy="-6" r="2" fill="#4A3A40"/><circle cx="7" cy="-6" r="2" fill="#4A3A40"/><path d="M-5 4 Q0 8 5 4" fill="none" ${L}/>`;
    case 'dragonfly':
      return `<ellipse cx="-7" cy="-3" rx="9" ry="4" fill="#CFE8F6" ${L}/><ellipse cx="7" cy="-3" rx="9" ry="4" fill="#CFE8F6" ${L}/><path d="M0 -10 V12" stroke="#6BA8A0" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-10" r="4" fill="#6BA8A0" ${L}/>`;
    case 'dino-egg':
      return `<ellipse cx="0" cy="2" rx="12" ry="15" fill="#FFF6E6" ${L}/><circle cx="-4" cy="-2" r="3" fill="#88C894"/><circle cx="5" cy="4" r="3.5" fill="#F2A488"/><circle cx="-2" cy="8" r="2.5" fill="#88C894"/>`;
    case 'footprint':
      return `<ellipse cx="0" cy="5" rx="9" ry="7" fill="#D99B78" ${L}/><circle cx="-8" cy="-5" r="3.5" fill="#D99B78" ${L}/><circle cx="0" cy="-8" r="4" fill="#D99B78" ${L}/><circle cx="8" cy="-5" r="3.5" fill="#D99B78" ${L}/>`;
    case 'tricera':
      return `<circle cx="-3" cy="-2" r="11" fill="#D99B78" ${L}/><ellipse cx="3" cy="3" rx="10" ry="8" fill="#F4E4CE" ${L}/><circle cx="2" cy="-7" r="3" fill="#FFF6E8" ${L}/><circle cx="10" cy="-3" r="3" fill="#FFF6E8" ${L}/><circle cx="6" cy="2" r="1.8" fill="#4A3A40"/>`;
    case 'ammonite':
      return `<circle cx="0" cy="0" r="13" fill="#F2DEC4" ${L}/><path d="M0 0 m-3 0 a3 3 0 1 0 6 0 a6 6 0 1 0 -10 -2" fill="none" stroke="#8C684C" stroke-width="2.4" stroke-linecap="round"/>`;
    case 'brachio':
      return `<ellipse cx="-4" cy="6" rx="10" ry="7" fill="#78B888" ${L}/><path d="M2 2 Q6 -8 8 -11" fill="none" stroke="#78B888" stroke-width="6" stroke-linecap="round"/><circle cx="9" cy="-11" r="5" fill="#78B888" ${L}/><circle cx="10.5" cy="-12" r="1.5" fill="#4A3A40"/>`;
  }
}

/** シール1枚（viewBox 0 0 120 120） */
export function stickerSvg(s: StickerDef): string {
  const file = stickerArtFile(s.id);
  if (file) return `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><image href="${file}" width="120" height="120"/></svg>`;
  const face = faceIcon(CHARACTERS[s.char]).replace('<svg ', '<svg x="22" y="34" width="62" height="54" ');
  return (
    `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">` +
    `<ellipse cx="60" cy="112" rx="40" ry="5" fill="#4A3A40" opacity="0.12"/>` +
    `<circle cx="60" cy="58" r="54" fill="#FFFFFF" stroke="#E8DCCB" stroke-width="2"/>` +
    `<circle cx="60" cy="58" r="47" fill="${s.color}"/>` +
    `<path d="M24 40 A42 42 0 0 1 60 16" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="5" stroke-linecap="round"/>` +
    face +
    `<g transform="translate(86 36)">${motif(s.motif)}</g>` +
    `</svg>`
  );
}

/** シールちょうのページタブ用の小さな絵 */
export function stickerPageIcon(id: StickerPageId): string {
  const m: Motif =
    id === 'course'
      ? 'crown'
      : id === 'finds'
        ? 'star'
        : id === 'beach'
          ? 'shell'
          : id === 'forest'
            ? 'mushroom'
            : id === 'aquarium'
              ? 'dolphin'
              : id === 'night'
                ? 'firefly'
                : id === 'dino'
                  ? 'tricera'
                  : 'flower';
  return `<svg viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">${motif(m)}</svg>`;
}

/** シールちょうのページタブ用の短いひらがな */
export function stickerPageShortName(id: StickerPageId, fallback: string): string {
  if (id === 'course') return 'コース';
  if (id === 'finds') return 'みつけた';
  if (id === 'beach') return 'うみべ';
  if (id === 'forest') return 'もり';
  if (id === 'aquarium') return 'すいぞくかん';
  if (id === 'night') return 'かわべ';
  if (id === 'dino') return 'きょうりゅう';
  return fallback;
}

/** ページが ぜんぶ そろったときの はなまる・おうかん スタンプ */
export function completeStampSvg(): string {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `<circle cx="0" cy="-18" r="9" transform="rotate(${a})" fill="#FFF1DC" stroke="#E26D5A" stroke-width="2.4"/>`)
    .join('');
  return (
    `<svg viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">` +
    petals +
    `<circle r="17" fill="#FFFDF8" stroke="#E26D5A" stroke-width="2.4"/>` +
    `<g transform="scale(0.75)">${motif('crown')}</g>` +
    `</svg>`
  );
}
