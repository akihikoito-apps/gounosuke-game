// オリジナルキャラクター3体。形（輪郭）・顔・色・性格がそれぞれ違う。
// ローカル座標：足もと中央が原点、上が -y。高さ約200。
import { type Pt, type Shape, quadPoints, shapeToSvg } from './geometry';

export type CharacterId = 'koro' | 'mimi' | 'moko' | 'nyako' | 'popo' | 'choki';
import type { SceneId } from './scene';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  /** 保護者・制作向けの説明（画面では読まなくても遊べる） */
  personality: string;
  skin: string;
  /** 輪郭（当たり判定・可視判定・ヒント・描画で共有） */
  silhouette: Shape[];
  /** 顔の要点（目・口）。どの難易度でも隠さない */
  facePoints: Pt[];
}

const B = (p0: Pt, c: Pt, p1: Pt) => quadPoints(p0, c, p1, 8);

/** 回転した楕円を多角形にする（描画の rotate と同じ形を判定にも使う） */
function rotEllipse(cx: number, cy: number, rx: number, ry: number, deg: number, ox: number, oy: number): Shape {
  const a = (deg * Math.PI) / 180;
  const pts: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const x = cx + rx * Math.cos(t) - ox;
    const y = cy + ry * Math.sin(t) - oy;
    pts.push({ x: ox + x * Math.cos(a) - y * Math.sin(a), y: oy + x * Math.sin(a) + y * Math.cos(a) });
  }
  return { kind: 'poly', pts };
}

/** 服（からだ）の多角形。3体共通の形で、柄が主役になる。 */
export const BODY_POLY: Pt[] = [
  { x: -58, y: 0 },
  ...B({ x: -58, y: 0 }, { x: -64, y: -62 }, { x: -34, y: -94 }),
  ...B({ x: -34, y: -94 }, { x: 0, y: -108 }, { x: 34, y: -94 }),
  ...B({ x: 34, y: -94 }, { x: 64, y: -62 }, { x: 58, y: 0 }),
  ...B({ x: 58, y: 0 }, { x: 0, y: 9 }, { x: -58, y: 0 }).slice(0, -1),
];
export const BODY: Shape = { kind: 'poly', pts: BODY_POLY };

const HEAD: Shape = { kind: 'ellipse', cx: 0, cy: -142, rx: 48, ry: 45 };
/** にゃこの三角の耳 */
const EAR_L: Pt[] = [
  { x: -46, y: -158 },
  { x: -44, y: -214 },
  { x: -10, y: -184 },
];
const EAR_R: Pt[] = EAR_L.map((p) => ({ x: -p.x, y: p.y })).reverse();
const FACE: Pt[] = [
  { x: -16, y: -142 },
  { x: 16, y: -142 },
  { x: 0, y: -125 },
];

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  koro: {
    id: 'koro',
    name: 'ころ',
    personality: 'げんきで くいしんぼう。あたまの くるんとした け が めじるし。',
    skin: '#F5C58E',
    silhouette: [BODY, HEAD, { kind: 'ellipse', cx: 4, cy: -192, rx: 14, ry: 12 }],
    facePoints: FACE,
  },
  mimi: {
    id: 'mimi',
    name: 'みみ',
    personality: 'ものしりで のんびりや。たれた ながい みみ が めじるし。',
    skin: '#BFE6CB',
    silhouette: [
      BODY,
      HEAD,
      rotEllipse(-50, -126, 16, 36, 18, -46, -158),
      rotEllipse(50, -126, 16, 36, -18, 46, -158),
    ],
    facePoints: FACE,
  },
  moko: {
    id: 'moko',
    name: 'もこ',
    personality: 'ふわふわで はずかしがりや。くもの かたちの あたまと ほしの かみどめ が めじるし。',
    skin: '#DCCBF4',
    silhouette: [
      BODY,
      { kind: 'ellipse', cx: 0, cy: -142, rx: 56, ry: 48 },
      { kind: 'ellipse', cx: 36, cy: -184, rx: 13, ry: 13 },
    ],
    facePoints: FACE,
  },
  // コース1をクリアすると仲間になる、4体目
  nyako: {
    id: 'nyako',
    name: 'にゃこ',
    personality: 'きままで あそびずき。ぴんと たった さんかくの みみ が めじるし。',
    skin: '#BCCDE4',
    silhouette: [BODY, HEAD, { kind: 'poly', pts: EAR_L }, { kind: 'poly', pts: EAR_R }],
    facePoints: FACE,
  },
  // コース5をクリアすると仲間になる、5体目
  popo: {
    id: 'popo',
    name: 'ぽぽ',
    personality: 'やさしくて ちからもち。あたまの まあるい みみ が めじるし。',
    skin: '#E6C3BE',
    silhouette: [
      BODY,
      HEAD,
      { kind: 'ellipse', cx: -36, cy: -180, rx: 15, ry: 15 },
      { kind: 'ellipse', cx: 36, cy: -180, rx: 15, ry: 15 },
    ],
    facePoints: FACE,
  },
  // 背景パック1「うみべ」の友だち。うみべで初めて誰かを見つけると仲間になる
  choki: {
    id: 'choki',
    name: 'ちょき',
    personality: 'ほがらかで よこあるきが とくい。あたまの よこで あげた はさみ が めじるし。',
    skin: '#E9A797',
    silhouette: [
      BODY,
      HEAD,
      { kind: 'ellipse', cx: -54, cy: -184, rx: 16, ry: 20 },
      { kind: 'ellipse', cx: 54, cy: -184, rx: 16, ry: 20 },
    ],
    facePoints: FACE,
  },
};

export const CHARACTER_IDS: CharacterId[] = ['koro', 'mimi', 'moko', 'nyako', 'popo', 'choki'];
/** 最初からいる3体 */
export const BASE_CHARACTER_IDS: CharacterId[] = ['koro', 'mimi', 'moko'];
/** 新しい友だちが仲間になるコース（このコースをクリアしたら）。最初のクリアで1体目が来る */
export const FRIEND_UNLOCKS: { course: number; char: CharacterId }[] = [
  { course: 1, char: 'nyako' },
  { course: 5, char: 'popo' },
];

/** 背景パックの友だち：その背景で初めて誰かを見つけると仲間になる */
export const SCENE_FRIENDS: { scene: SceneId; char: CharacterId }[] = [{ scene: 'beach', char: 'choki' }];

/** いま遊べるキャラクター（コースの進み具合と、背景パックで見つけた回数で増える） */
export function unlockedCharacters(cleared: number, sceneFinds: Partial<Record<SceneId, number>> = {}): CharacterId[] {
  return [
    ...BASE_CHARACTER_IDS,
    ...FRIEND_UNLOCKS.filter((f) => cleared >= f.course).map((f) => f.char),
    ...SCENE_FRIENDS.filter((f) => (sceneFinds[f.scene] ?? 0) >= 1).map((f) => f.char),
  ];
}

const LINE = '#4A3A40';

function eyes(): string {
  return [-16, 16]
    .map(
      (x) =>
        `<ellipse class="eye" cx="${x}" cy="-142" rx="6.5" ry="8" fill="#3B2F35"/>` +
        `<circle cx="${x - 2}" cy="-145.5" r="2.4" fill="#fff"/>`,
    )
    .join('');
}

function cheeks(): string {
  return `<ellipse cx="-31" cy="-126" rx="9" ry="6" fill="#F28B8B" opacity="0.55"/><ellipse cx="31" cy="-126" rx="9" ry="6" fill="#F28B8B" opacity="0.55"/>`;
}

function headMarkup(c: CharacterDef): string {
  const st = `stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"`;
  switch (c.id) {
    case 'koro':
      return (
        `<ellipse cx="0" cy="-142" rx="48" ry="45" fill="${c.skin}" ${st}/>` +
        `<path d="M-4 -186 C-12 -202 6 -212 16 -200 C22 -192 12 -184 6 -190 C2 -194 8 -199 11 -196" fill="none" stroke="#8A5A3B" stroke-width="6" stroke-linecap="round"/>` +
        eyes() +
        cheeks() +
        `<path d="M-8 -126 Q0 -117 8 -126" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>`
      );
    case 'mimi':
      return (
        `<g transform="rotate(18 -46 -158)"><ellipse cx="-50" cy="-126" rx="15" ry="35" fill="#9FD2AF" ${st}/><ellipse cx="-50" cy="-120" rx="7" ry="22" fill="#F7C6CF"/></g>` +
        `<g transform="rotate(-18 46 -158)"><ellipse cx="50" cy="-126" rx="15" ry="35" fill="#9FD2AF" ${st}/><ellipse cx="50" cy="-120" rx="7" ry="22" fill="#F7C6CF"/></g>` +
        `<ellipse cx="0" cy="-142" rx="46" ry="44" fill="${c.skin}" ${st}/>` +
        eyes() +
        cheeks() +
        `<path d="M-9 -127 Q-4.5 -120 0 -126 Q4.5 -120 9 -127" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>`
      );
    case 'nyako': {
      const ear = (sx: number) =>
        `<path d="M${-46 * sx} -158 L${-44 * sx} -214 L${-10 * sx} -184 Z" fill="${c.skin}" ${st}/>` +
        `<path d="M${-40 * sx} -168 L${-39 * sx} -200 L${-20 * sx} -184 Z" fill="#F7C6CF"/>`;
      const whisk = (sx: number) =>
        `<path d="M${30 * sx} -130 L${54 * sx} -134 M${30 * sx} -124 L${54 * sx} -122" stroke="#6E6070" stroke-width="2" stroke-linecap="round"/>`;
      return (
        ear(1) +
        ear(-1) +
        `<ellipse cx="0" cy="-142" rx="48" ry="45" fill="${c.skin}" ${st}/>` +
        eyes() +
        cheeks() +
        `<path d="M-3 -131 L3 -131 L0 -127 Z" fill="#E79AAA"/>` +
        `<path d="M-9 -124 Q-4.5 -119 0 -124 Q4.5 -119 9 -124" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>` +
        whisk(1) +
        whisk(-1)
      );
    }
    case 'choki': {
      // 頭の横に上げたはさみ（切れこみのある丸）
      const claw = (sx: number) =>
        `<path d="M${-54 * sx} -164 C${-74 * sx} -170 ${-72 * sx} -200 ${-58 * sx} -204 L${-50 * sx} -186 L${-42 * sx} -202 C${-30 * sx} -196 ${-34 * sx} -168 ${-54 * sx} -164 Z" fill="${c.skin}" ${st}/>` +
        `<path d="M${-48 * sx} -158 L${-52 * sx} -168" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>`;
      return (
        claw(1) +
        claw(-1) +
        `<ellipse cx="0" cy="-142" rx="48" ry="45" fill="${c.skin}" ${st}/>` +
        eyes() +
        cheeks() +
        `<path d="M-8 -126 Q0 -118 8 -126" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>`
      );
    }
    case 'popo': {
      const ear = (x: number) => `<circle cx="${x}" cy="-180" r="15" fill="${c.skin}" ${st}/><circle cx="${x}" cy="-179" r="8" fill="#F2D6D2"/>`;
      return (
        ear(-36) +
        ear(36) +
        `<ellipse cx="0" cy="-142" rx="48" ry="45" fill="${c.skin}" ${st}/>` +
        `<ellipse cx="0" cy="-126" rx="17" ry="12" fill="#F6E3DE"/>` +
        eyes() +
        cheeks() +
        `<ellipse cx="0" cy="-132" rx="5" ry="3.6" fill="#6B4E4A"/>` +
        `<path d="M-7 -124 Q0 -117 7 -124" fill="none" stroke="#3B2F35" stroke-width="3" stroke-linecap="round"/>`
      );
    }
    case 'moko': {
      const puffs: [number, number, number][] = [
        [0, -160, 34],
        [-32, -146, 28],
        [32, -146, 28],
        [-24, -118, 26],
        [24, -118, 26],
        [0, -136, 40],
      ];
      const outline = puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.skin}" ${st}/>`).join('');
      const fill = puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.8}" fill="${c.skin}"/>`).join('');
      return (
        outline +
        fill +
        `<path transform="translate(36 -184)" d="M0 -13 L3.8 -4 L13 -4 L5.6 2 L8.4 11.5 L0 6 L-8.4 11.5 L-5.6 2 L-13 -4 L-3.8 -4Z" fill="#FFD45C" ${st.replace('3.5', '2.5')}/>` +
        eyes() +
        cheeks() +
        `<ellipse cx="0" cy="-124" rx="4.5" ry="5.5" fill="#C0616F"/>`
      );
    }
  }
}

export interface DrawOpts {
  /** 服の柄（pattern 要素の id） */
  fillId: string;
  /** 服のふちの濃さ。0 にはしない（不可視にしない） */
  outline: number;
  /** 見つかった（手をふる） */
  found?: boolean;
}

/** キャラクター本体（ローカル座標）。服の柄は fillId で受け取る。 */
export function characterMarkup(c: CharacterDef, o: DrawOpts): string {
  const outline = Math.max(0.25, o.outline);
  const body =
    `<ellipse cx="-24" cy="2" rx="17" ry="8" fill="#6B5B60"/><ellipse cx="24" cy="2" rx="17" ry="8" fill="#6B5B60"/>` +
    shapeToSvg(BODY, `class="clothes" fill="url(#${o.fillId})" stroke="${LINE}" stroke-opacity="${outline}" stroke-width="3.5" stroke-linejoin="round"`) +
    // えり（服の上に少しだけ顔の色をのぞかせる）
    `<path d="M-22 -98 Q0 -84 22 -98" fill="none" stroke="${LINE}" stroke-opacity="${outline}" stroke-width="3"/>`;
  const hands = o.found
    ? `<circle cx="-50" cy="-46" r="11" fill="${c.skin}" stroke="${LINE}" stroke-width="3"/>` +
      `<g class="wave"><path d="M40 -80 Q60 -100 64 -124" stroke="${LINE}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M40 -80 Q60 -100 64 -124" stroke="${c.skin}" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="64" cy="-128" r="12" fill="${c.skin}" stroke="${LINE}" stroke-width="3"/></g>`
    : `<circle cx="-50" cy="-46" r="11" fill="${c.skin}" stroke="${LINE}" stroke-width="3"/><circle cx="50" cy="-46" r="11" fill="${c.skin}" stroke="${LINE}" stroke-width="3"/>`;
  return `<g class="char-body">${body}${hands}</g><g class="char-head">${headMarkup(c)}</g>`;
}

/** 探す対象の表示用（顔だけ） */
export function faceIconMarkup(c: CharacterDef): string {
  return `<svg viewBox="-70 -215 140 120" aria-hidden="true" focusable="false">${headMarkup(c)}</svg>`;
}

/** 選択画面・チュートリアル用の全身アイコン */
export function fullIconMarkup(c: CharacterDef, patternDefs: string, fillId: string): string {
  return `<svg viewBox="-90 -225 180 240" aria-hidden="true" focusable="false"><defs>${patternDefs}</defs>${characterMarkup(c, { fillId, outline: 1 })}</svg>`;
}
