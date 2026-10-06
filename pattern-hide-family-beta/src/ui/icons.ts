// ボタン用の独自アイコン（文字を読まなくても分かる絵）
const S = (body: string, vb = '0 0 64 64') =>
  `<svg class="icon" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const L = 'stroke="#4A3A40" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';

export const ICONS = {
  search: S(`<circle cx="27" cy="27" r="16" fill="#FFFFFF" ${L}/><circle cx="22" cy="25" r="3.5" fill="#4A3A40"/><circle cx="32" cy="25" r="3.5" fill="#4A3A40"/><path d="M39 39 L54 54" ${L} stroke-width="8"/>`),
  hide: S(`<rect x="8" y="30" width="48" height="26" rx="6" fill="#F29A7E" ${L}/><circle cx="32" cy="22" r="13" fill="#F5C58E" ${L}/><circle cx="27" cy="21" r="2.5" fill="#4A3A40"/><circle cx="37" cy="21" r="2.5" fill="#4A3A40"/><path d="M14 30 Q32 40 50 30" fill="none" ${L}/>`),
  hint: S(`<path d="M32 8 C20 8 14 17 14 25 C14 33 21 37 23 44 H41 C43 37 50 33 50 25 C50 17 44 8 32 8Z" fill="#FFE07A" ${L}/><rect x="23" y="46" width="18" height="8" rx="3" fill="#DCCBF4" ${L}/><path d="M28 30 L32 36 L36 30" fill="none" ${L}/>`),
  home: S(`<path d="M10 30 L32 11 L54 30" fill="none" ${L}/><path d="M16 27 V53 H48 V27" fill="#FFF6DC" ${L}/><rect x="27" y="37" width="10" height="16" fill="#F2A9B8" ${L}/>`),
  undo: S(`<path d="M20 22 H38 C47 22 52 29 52 36 C52 44 46 50 38 50 H24" fill="none" ${L} stroke-width="6"/><path d="M26 12 L14 22 L26 32" fill="none" ${L} stroke-width="6"/>`),
  done: S(`<circle cx="32" cy="32" r="24" fill="#8CCB9B" ${L}/><path d="M20 33 L29 42 L45 24" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  again: S(`<path d="M48 22 A19 19 0 1 0 51 36" fill="none" ${L} stroke-width="6"/><path d="M50 10 V24 H36" fill="none" ${L} stroke-width="6"/>`),
  swap: S(`<path d="M12 22 H48 M38 12 L48 22 L38 32" fill="none" ${L} stroke-width="6"/><path d="M52 44 H16 M26 34 L16 44 L26 54" fill="none" ${L} stroke-width="6"/>`),
  bye: S(`<path d="M22 50 C14 42 12 30 18 24 L24 30 L22 14 C22 10 28 10 28 14 L30 26 L32 10 C32 6 38 6 38 10 L38 26 L42 12 C42 8 48 8 48 12 L46 30 L50 24 C54 20 58 24 56 28 C52 38 48 48 38 54 Z" fill="#F5C58E" ${L}/>`),
  back: S(`<path d="M40 12 L20 32 L40 52" fill="none" ${L} stroke-width="7"/>`),
  next: S(`<path d="M24 12 L44 32 L24 52" fill="none" ${L} stroke-width="7"/>`),
  play: S(`<path d="M22 12 L50 32 L22 52Z" fill="#8CCB9B" ${L}/>`),
  ready: S(`<circle cx="32" cy="32" r="24" fill="#FFE07A" ${L}/><circle cx="24" cy="28" r="3.5" fill="#4A3A40"/><circle cx="40" cy="28" r="3.5" fill="#4A3A40"/><path d="M22 38 Q32 48 42 38" fill="none" ${L}/>`),
  multi: S(`<circle cx="22" cy="30" r="12" fill="#F5C58E" ${L}/><circle cx="42" cy="30" r="12" fill="#BFE6CB" ${L}/><path d="M32 50 V62 M26 56 H38" ${L}/>`),
  costume: S(`<path d="M20 12 L32 18 L44 12 L56 24 L48 32 L46 28 V54 H18 V28 L16 32 L8 24 Z" fill="#7EA6DA" ${L}/><circle cx="26" cy="36" r="3" fill="#fff"/><circle cx="38" cy="44" r="3" fill="#fff"/><circle cx="36" cy="30" r="3" fill="#fff"/>`),
  question: S(`<circle cx="32" cy="32" r="24" fill="#FFFFFF" ${L}/><path d="M25 25 C25 18 39 18 39 25 C39 31 32 31 32 38" fill="none" ${L} stroke-width="5"/><circle cx="32" cy="46" r="3" fill="#4A3A40"/>`),
  parent: S(`<rect x="14" y="28" width="36" height="26" rx="6" fill="#DCCBF4" ${L}/><path d="M22 28 V20 C22 10 42 10 42 20 V28" fill="none" ${L}/><circle cx="32" cy="40" r="4" fill="#4A3A40"/>`),
  easy: S(`<circle cx="32" cy="32" r="16" fill="#F5C58E" ${L}/><circle cx="26" cy="30" r="2.5" fill="#4A3A40"/><circle cx="38" cy="30" r="2.5" fill="#4A3A40"/><path d="M26 37 Q32 42 38 37" fill="none" ${L} stroke-width="3"/>`),
  normal: S(
    [
      [16, '#F5C58E'],
      [32, '#BFE6CB'],
      [48, '#DCCBF4'],
    ]
      .map(([x, c]) => `<circle cx="${x}" cy="34" r="11" fill="${c}" stroke="#4A3A40" stroke-width="3"/><circle cx="${(x as number) - 4}" cy="33" r="2" fill="#4A3A40"/><circle cx="${(x as number) + 4}" cy="33" r="2" fill="#4A3A40"/>`)
      .join(''),
  ),
};
