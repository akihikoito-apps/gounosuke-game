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
    case 'squirrel':
      return `<ellipse cx="0" cy="-2" rx="44" ry="5" fill="#4A3A40" opacity="0.1"/><path d="M-24 -28 Q-64 -34 -56 -72 Q-48 -98 -22 -76 Q-14 -56 -24 -28 Z" fill="#C97E48" ${L}/><ellipse cx="2" cy="-32" rx="28" ry="20" fill="#D89458" ${L}/><circle cx="28" cy="-54" r="18" fill="#D89458" ${L}/><path d="M22 -68 L26 -80 L32 -68" fill="#D89458" ${L}/><circle cx="33" cy="-56" r="3" fill="#4A3A40"/>`;
    case 'owl':
      return `<path d="M-42 -42 Q-20 -68 0 -44 Q20 -68 42 -42" fill="#B58E6B" ${L}/><ellipse cx="0" cy="-38" rx="18" ry="16" fill="#C8A27E" ${L}/><circle cx="-6" cy="-40" r="5" fill="#FFFDF6" ${L}/><circle cx="6" cy="-40" r="5" fill="#FFFDF6" ${L}/><circle cx="-6" cy="-40" r="2" fill="#4A3A40"/><circle cx="6" cy="-40" r="2" fill="#4A3A40"/>`;
    case 'falling-leaf':
      return `<path d="M-22 -24 Q-4 -48 22 -28 Q6 -6 -22 -24 Z" fill="#D88A52" ${L}/><path d="M-26 -22 L18 -27" ${L}/>`;
  }
}

function art(kind: MoverKind): string {
  const f = moverArtFile(kind);
  return f ? `<image href="${f}" x="-150" y="-300" width="300" height="300"/>` : fallback(kind);
}

const FLY: MoverKind[] = ['bird', 'seagull', 'butterfly', 'balloon', 'owl', 'falling-leaf'];

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

/** 絵の実際の範囲（x, y, 幅, 高さ。art/movers を測った値）。選ぶボタンで大きく見せるため */
const BOX: Record<MoverKind, [number, number, number, number]> = {
  balloon: [-34, -128, 67, 127],
  bird: [-32, -58, 66, 55],
  butterfly: [-30, -42, 60, 43],
  cat: [-63, -75, 127, 75],
  cloud: [-119, -91, 238, 90],
  crab: [-44, -51, 87, 51],
  puppy: [-57, -69, 116, 69],
  sailboat: [-53, -103, 106, 101],
  seagull: [-44, -62, 88, 60],
  ball: [-30, -62, 60, 62],
  squirrel: [-55, -75, 110, 75],
  owl: [-44, -66, 88, 64],
  'falling-leaf': [-28, -48, 56, 48],
};

/** 選ぶボタン用の絵（その絵の大きさに合わせて切り取る） */
export function moverIcon(kind: MoverKind): string {
  const [x, y, w, h] = BOX[kind];
  const size = Math.max(w, h) * 1.15;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `<svg viewBox="${cx - size / 2} ${cy - size / 2} ${size} ${size}" aria-hidden="true" focusable="false">${art(kind)}</svg>`;
}

export function moversMarkup(P: string, movers: MoverDef[], elapsed: number): { back: string; front: string } {
  return {
    back: movers.filter((m) => m.layer === 'back').map((m) => one(P, m, elapsed)).join(''),
    front: movers.filter((m) => m.layer === 'front').map((m) => one(P, m, elapsed)).join(''),
  };
}
