// うごくもの の描画。動きは CSS（styles.css の mv-）でつける。
// 画面を描き直しても位置が飛ばないよう、出題の開始時刻からの経過で animation-delay を負にする。
import { moverArtFile } from '../art/registry';
import type { MoverDef, MoverKind } from '../core/movers';

const L = 'stroke="#4A3A40" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';

/** art/movers が無いときの、コードで描いた かんたんな絵（枠 -150 -300 300 300、足もと中央が 0,0） */
function fallback(kind: MoverKind): string {
  switch (kind) {
    case 'bird':
      return `<path d="M-34 -40 Q-16 -62 0 -42 Q16 -62 34 -40" fill="none" ${L}/><ellipse cx="0" cy="-36" rx="16" ry="10" fill="#F2B880" ${L}/><path d="M14 -38 L24 -34 L14 -32 Z" fill="#E9A23B"/>`;
    case 'seagull':
      return `<path d="M-46 -44 Q-22 -70 0 -44 Q22 -70 46 -44" fill="#FFFFFF" ${L}/><ellipse cx="0" cy="-40" rx="14" ry="8" fill="#FFFFFF" ${L}/>`;
    case 'butterfly':
      return `<ellipse cx="-14" cy="-46" rx="15" ry="20" fill="#F7C6CF" ${L}/><ellipse cx="14" cy="-46" rx="15" ry="20" fill="#F7C6CF" ${L}/><ellipse cx="-11" cy="-22" rx="10" ry="12" fill="#F6D7B8" ${L}/><ellipse cx="11" cy="-22" rx="10" ry="12" fill="#F6D7B8" ${L}/><path d="M0 -60 V-14" ${L}/>`;
    case 'cloud':
      return `<path d="M-110 -30 Q-120 -70 -78 -72 Q-66 -112 -18 -100 Q14 -130 52 -98 Q100 -104 104 -66 Q130 -50 110 -30 Z" fill="#FFFDF6" stroke="#E8DCCB" stroke-width="4"/>`;
    case 'cat':
    case 'puppy': {
      const c = kind === 'cat' ? '#F2C08A' : '#E8D2B4';
      const ears = kind === 'cat' ? `<path d="M30 -96 L36 -122 L50 -100 M54 -98 L66 -120 L70 -94" fill="${c}" ${L}/>` : `<path d="M28 -98 Q22 -76 34 -74 M68 -98 Q78 -78 66 -74" fill="${c}" ${L}/>`;
      return `<ellipse cx="0" cy="-2" rx="54" ry="6" fill="#4A3A40" opacity="0.1"/><path d="M-40 -6 V-36 M-20 -6 V-36 M14 -6 V-36 M32 -6 V-36" ${L}/><ellipse cx="-4" cy="-48" rx="50" ry="24" fill="${c}" ${L}/><path d="M-52 -54 Q-74 -80 -60 -96" fill="none" ${L}/>${ears}<circle cx="50" cy="-82" r="26" fill="${c}" ${L}/><circle cx="44" cy="-84" r="3.5" fill="#4A3A40"/><circle cx="60" cy="-84" r="3.5" fill="#4A3A40"/>`;
    }
    case 'balloon':
      return `<path d="M0 0 Q-8 -30 0 -60" fill="none" stroke="#4A3A40" stroke-width="3"/><ellipse cx="0" cy="-96" rx="30" ry="36" fill="#F4A6A6" ${L}/><path d="M-4 -60 L4 -60 L0 -66 Z" fill="#F4A6A6" ${L}/>`;
    case 'sailboat':
      return `<path d="M-50 -20 H50 L36 0 H-36 Z" fill="#E9967A" ${L}/><path d="M0 -22 V-120 L44 -30 Z" fill="#FFFFFF" ${L}/><path d="M-4 -110 L-40 -30 H-4 Z" fill="#A9D3E8" ${L}/>`;
    case 'crab':
      return `<ellipse cx="0" cy="-4" rx="40" ry="5" fill="#4A3A40" opacity="0.1"/><path d="M-26 -14 L-40 -2 M-14 -12 L-24 0 M26 -14 L40 -2 M14 -12 L24 0" ${L}/><ellipse cx="0" cy="-26" rx="32" ry="20" fill="#F08C78" ${L}/><path d="M-30 -36 Q-50 -60 -36 -66 Q-28 -56 -40 -50 M30 -36 Q50 -60 36 -66 Q28 -56 40 -50" fill="#F08C78" ${L}/><circle cx="-10" cy="-30" r="3.5" fill="#4A3A40"/><circle cx="10" cy="-30" r="3.5" fill="#4A3A40"/>`;
    case 'ball':
      return `<ellipse cx="0" cy="-2" rx="26" ry="5" fill="#4A3A40" opacity="0.1"/><circle cx="0" cy="-32" r="30" fill="#FFF6E8" ${L}/><path d="M-10 -60 Q-22 -32 -10 -4 M10 -60 Q22 -32 10 -4" fill="none" stroke="#E07B7B" stroke-width="7"/>`;
  }
}

function art(kind: MoverKind): string {
  const f = moverArtFile(kind);
  return f ? `<image href="${f}" x="-150" y="-300" width="300" height="300"/>` : fallback(kind);
}

const FLY: MoverKind[] = ['bird', 'seagull', 'butterfly', 'balloon'];

/** うごくもの1つ。elapsed：出題が始まってからの秒数 */
function one(P: string, m: MoverDef, elapsed: number): string {
  const period = m.move === 'patrol' ? m.sec * 2 : m.sec;
  const right = m.to.x >= m.from.x;
  const vars = [
    `--x0:${m.from.x}px`,
    `--y0:${m.from.y}px`,
    `--x1:${m.to.x}px`,
    `--y1:${m.to.y}px`,
    `--f0:${right ? 1 : -1}`,
    `--f1:${right ? -1 : 1}`,
    `--period:${period}s`,
    `--delay:${-(elapsed % period).toFixed(2)}s`,
  ].join(';');
  const inner = `<g class="mv-inner${FLY.includes(m.kind) ? ' fly' : m.kind === 'cloud' || m.kind === 'sailboat' ? ' drift' : ' step'}"><g transform="scale(${m.scale})">${art(m.kind)}</g></g>`;
  const g = `<g class="mv mv-${m.move}" data-mover="${m.id}" style="${vars}" aria-hidden="true">${inner}</g>`;
  if (!m.clip) return g;
  const id = `${P}mvclip-${m.id}`;
  return `<clipPath id="${id}"><rect x="${m.clip.x}" y="${m.clip.y}" width="${m.clip.w}" height="${m.clip.h}"/></clipPath><g clip-path="url(#${id})">${g}</g>`;
}

export function moversMarkup(P: string, movers: MoverDef[], elapsed: number): { back: string; front: string } {
  return {
    back: movers.filter((m) => m.layer === 'back').map((m) => one(P, m, elapsed)).join(''),
    front: movers.filter((m) => m.layer === 'front').map((m) => one(P, m, elapsed)).join(''),
  };
}
