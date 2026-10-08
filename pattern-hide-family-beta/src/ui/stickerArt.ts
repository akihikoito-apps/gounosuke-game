// シールの絵。art/stickers/{id}.png があればそれを使い、無ければコードで描く（白いふちの丸いシール＋キャラクター＋モチーフ）。
import { CHARACTERS } from '../core/characters';
import type { Motif, StickerDef } from '../core/stickers';
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
