// 最難関（大人向けおためし）だけで使う「のぞき場所」。物の裏から顔の一部だけが見える。
// 物（ソファ・カーテン・カウンター等）の形 front の中は、背景をキャラクターの前に描き直す（同じ絵なので継ぎ目なし）。
// 窓は clip（ガラスの内側）でキャラクターを切り抜き、front（枠・桟）を前に描き直す。
// 守る最低線（Codex 第3回）：片目がまるごと見える／頭の 20% 以上・全身の 5% 以上が見える／色以外の目印が1つ見える。
import { BODY, CHARACTERS, type CharacterId } from './characters';
import { type Pt, type Shape, SCENE_SIZE, contains, samplePoints, transformPt, transformShape } from './geometry';
import type { SceneDef, SceneId, SpotDef } from './scene';

export interface PeekDef extends SpotDef {
  kind: 'peek' | 'window';
  /** キャラクターの前に描き直す物の形（シーン座標） */
  front: Shape[];
  /** キャラクターが見えてよい範囲（窓ガラス）。無ければ全体 */
  clip?: Shape[];
}

const none = { markup: '', shapes: [] as Shape[] };
const R = (x: number, y: number, w: number, h: number, rx = 0): Shape => ({ kind: 'rect', x, y, w, h, rx });

// へや：ソファ（背・肘・角の縁まで少し広く）、カーテン（ひだの外縁まで）、窓
const SOFA: Shape[] = [R(352, 392, 416, 256, 48), R(318, 472, 86, 206, 34), R(716, 472, 86, 206, 34)];
const CURTAIN: Shape[] = [
  {
    kind: 'poly',
    pts: [
      { x: 16, y: 34 },
      { x: 226, y: 34 },
      { x: 234, y: 650 },
      { x: 8, y: 650 },
    ],
  },
];
const GLASS: Shape[] = [R(258, 88, 234, 214)];
const WINDOW_FRAME: Shape[] = [
  R(240, 70, 270, 18), // 上
  R(240, 70, 18, 250), // 左
  R(492, 70, 18, 250), // 右
  R(232, 298, 286, 30), // 下の枠と窓台
  R(369, 86, 12, 216), // 縦の桟
  R(256, 189, 238, 12), // 横の桟
];

// にわ：生け垣（葉先まで少し上に）、柵
const hedgeFront: Shape = (() => {
  const pts: Pt[] = [{ x: 0, y: 670 }];
  for (let x = 0; x <= 570; x += 57) pts.push({ x, y: (x % 114 === 0 ? 300 : 278) - 8 });
  pts.push({ x: 576, y: 670 });
  return { kind: 'poly', pts };
})();
const fenceFront: Shape = (() => {
  const pts: Pt[] = [{ x: 566, y: 670 }];
  for (let x = 570; x < 1000; x += 40) pts.push({ x, y: 374 }, { x: x + 20, y: 350 });
  pts.push({ x: 1000, y: 374 }, { x: 1000, y: 670 });
  return { kind: 'poly', pts };
})();

// みせ：カウンター（天板 y=572 から）、テーブル（天板とクロス）
const COUNTER: Shape[] = [R(36, 568, 928, 236, 8)];
const TABLE: Shape[] = [
  R(620, 712, 360, 28, 8),
  {
    kind: 'poly',
    pts: [
      { x: 636, y: 726 },
      { x: 964, y: 726 },
      { x: 986, y: 980 },
      { x: 614, y: 980 },
    ],
  },
];

// うみべ：海の家（壁と屋根の下まで）、風よけ（布と柱）
const HUT: Shape[] = [R(22, 240, 318, 426)];
const WINDBREAK: Shape[] = [R(590, 436, 400, 230, 6)];

const peek = (id: string, x: number, y: number, s: number, region: string, front: Shape[], kind: 'peek' | 'window' = 'peek', clip?: Shape[]): PeekDef => ({
  id,
  x,
  y,
  s,
  region,
  prop: none,
  easy: false,
  kind,
  front,
  clip,
});

export const PEEKS: Record<SceneId, PeekDef[]> = {
  room: [
    peek('room-peek-sofa-1', 470, 506, 0.9, 'wall', SOFA),
    peek('room-peek-sofa-2', 650, 506, 0.9, 'wall', SOFA),
    peek('room-peek-curtain', 236, 646, 1, 'wall', CURTAIN),
    peek('room-window-1', 314, 344, 0.6, 'wall', WINDOW_FRAME, 'window', GLASS),
    peek('room-window-2', 436, 344, 0.6, 'wall', WINDOW_FRAME, 'window', GLASS),
  ],
  garden: [
    peek('garden-peek-hedge-1', 200, 394, 0.9, 'hedge', [hedgeFront]),
    peek('garden-peek-hedge-2', 420, 394, 0.9, 'hedge', [hedgeFront]),
    peek('garden-peek-fence', 790, 462, 0.9, 'fence', [fenceFront]),
  ],
  shop: [
    peek('shop-peek-counter-1', 330, 686, 0.9, 'counter', COUNTER),
    peek('shop-peek-counter-2', 625, 686, 0.9, 'counter', COUNTER),
    peek('shop-peek-table', 800, 830, 0.9, 'counter', TABLE),
  ],
  beach: [
    peek('beach-peek-hut', 342, 652, 1, 'sand', HUT),
    peek('beach-peek-wind-1', 700, 550, 0.9, 'windbreak', WINDBREAK),
    peek('beach-peek-wind-2', 880, 550, 0.9, 'windbreak', WINDBREAK),
  ],
};

export function findPeek(sceneId: SceneId, id: string): PeekDef | undefined {
  return PEEKS[sceneId].find((p) => p.id === id);
}

export function isPeek(spot: SpotDef): spot is PeekDef {
  return (spot as PeekDef).front !== undefined;
}

/** その点が、物の裏（または窓の外）で見えないか */
export function peekHides(pk: PeekDef, p: Pt): boolean {
  if (pk.front.some((s) => contains(s, p))) return true;
  if (pk.clip && !pk.clip.some((s) => contains(s, p))) return true;
  return false;
}

const EYES: Pt[] = [
  { x: -16, y: -142 },
  { x: 16, y: -142 },
];

/** 目のまわり（楕円 rx6.5 ry8 ＋ ふち 2）の点 */
function eyeRing(c: Pt): Pt[] {
  const pts: Pt[] = [c];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push({ x: c.x + Math.cos(a) * 8.5, y: c.y + Math.sin(a) * 10 });
  }
  return pts;
}

export interface PeekReport {
  ok: boolean;
  /** まるごと見える目の数 */
  eyes: number;
  headFrac: number;
  totalFrac: number;
  /** 色以外の目印（くるん毛・耳・星）が見える割合 */
  featureFrac: number;
  problems: string[];
}

export function analyzePeek(scene: SceneDef, pk: PeekDef, char: CharacterId): PeekReport {
  void scene;
  const t = { tx: pk.x, ty: pk.y, s: pk.s };
  const c = CHARACTERS[char];
  const sil = c.silhouette.map((s) => transformShape(t, s));
  const hidden = (p: Pt) => peekHides(pk, p);
  const eyes = EYES.filter((e) => eyeRing(e).every((p) => !hidden(transformPt(t, p)))).length;
  const head = samplePoints(sil[1], 4);
  const headFrac = head.filter((p) => !hidden(p)).length / head.length;
  const seen = new Set<string>();
  const all: Pt[] = [];
  for (const s of sil) for (const p of samplePoints(s, 5)) {
    const k = `${Math.round(p.x)}:${Math.round(p.y)}`;
    if (!seen.has(k)) {
      seen.add(k);
      all.push(p);
    }
  }
  const totalFrac = all.filter((p) => !hidden(p)).length / all.length;
  const feat = sil.slice(2).flatMap((s) => samplePoints(s, 3));
  const featureFrac = feat.length ? feat.filter((p) => !hidden(p)).length / feat.length : 0;
  const body = samplePoints(transformShape(t, BODY), 6);
  void body;
  const problems: string[] = [];
  if (eyes < 1) problems.push('no fully visible eye');
  if (headFrac < 0.2) problems.push(`head ${headFrac.toFixed(2)} < 0.2`);
  if (totalFrac < 0.05) problems.push(`total ${totalFrac.toFixed(2)} < 0.05`);
  if (featureFrac < 0.15) problems.push(`feature ${featureFrac.toFixed(2)} < 0.15`);
  const inBounds = all.every((p) => p.x >= 0 && p.y >= 0 && p.x <= SCENE_SIZE && p.y <= SCENE_SIZE);
  if (!inBounds) problems.push('out of bounds');
  return { ok: problems.length === 0, eyes, headFrac, totalFrac, featureFrac, problems };
}
