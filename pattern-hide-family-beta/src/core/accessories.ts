// コースで使う身につける物（ニット帽・傘）。形はローカル座標（足もと中央が原点、上が -y）。
// 顔（目と口）にはどちらも重ねない。形は当たり判定・配置の検証・描画で共有する。
import { type Pt, type Shape, SCENE_SIZE, bbox, contains, quadPoints, samplePoints, transformPt, transformShape, unionBBox } from './geometry';
import { CHARACTERS, type CharacterId } from './characters';
import type { SceneDef, SpotDef } from './scene';
import { regionAt } from './placement';

/** color：色つき（頭の目印を隠す） / camo：うしろの背景と同じ柄 */
export type AccStyle = 'color' | 'camo';

export interface Accessories {
  hat?: AccStyle;
  umbrella?: AccStyle;
  /** 色つきのときの色（HAT_COLORS / UMBRELLA_COLORS の番号） */
  tone?: number;
  /** 最難関だけ：帽子を斜めに深くかぶり、片目（l=左 / r=右）を隠す */
  deep?: Side;
  /** 最難関だけ：サングラスを斜めにかけ、片目（l / r）を隠す。もう片方の目は必ず見える */
  glasses?: Side;
}

export type Side = 'l' | 'r';

/** 帽子を深くかぶるときの動かし方（左を隠すなら左に傾けて下げる） */
export function deepHatTransform(side: Side): { dy: number; deg: number; cx: number; cy: number } {
  return side === 'l' ? { dy: 0, deg: -38, cx: 20, cy: -162 } : { dy: 0, deg: 38, cx: -20, cy: -162 };
}

/** サングラス：隠す目の上にレンズ、もう片方のレンズはおでこへ跳ね上がる */
export const GLASSES_LENS_R = 13;
export function glassesTransform(side: Side): { deg: number; cx: number; cy: number } {
  return side === 'l' ? { deg: -42, cx: -16, cy: -142 } : { deg: 42, cx: 16, cy: -142 };
}

function rot(p: Pt, cx: number, cy: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const x = p.x - cx;
  const y = p.y - cy;
  return { x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) };
}

function circlePts(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 24 }, (_, i) => ({ x: cx + Math.cos((i / 24) * Math.PI * 2) * r, y: cy + Math.sin((i / 24) * Math.PI * 2) * r }));
}

export function deepHatShapes(side: Side): Shape[] {
  const t = deepHatTransform(side);
  const mv = (p: Pt) => {
    const q = rot(p, t.cx, t.cy, t.deg);
    return { x: q.x, y: q.y + t.dy };
  };
  return [
    { kind: 'poly', pts: HAT_POLY.map(mv) },
    { kind: 'poly', pts: circlePts(HAT_POMPOM.cx, HAT_POMPOM.cy, HAT_POMPOM.r).map(mv) },
  ];
}

export function glassesShapes(side: Side): Shape[] {
  const t = glassesTransform(side);
  return [-16, 16].map((x) => ({ kind: 'poly' as const, pts: circlePts(x, -142, GLASSES_LENS_R).map((p) => rot(p, t.cx, t.cy, t.deg)) }));
}

/** くすみのある毛糸の色（地の色・編み目の色） */
export const HAT_COLORS: [string, string][] = [
  ['#E59A86', '#C97A68'],
  ['#8DB7D9', '#6E98BC'],
  ['#EFC66A', '#D4A84C'],
  ['#A8CF9A', '#86B077'],
];

const B = (p0: Pt, c: Pt, p1: Pt) => quadPoints(p0, c, p1, 10);

/** ニット帽：耳の付け根より上だけを覆う（目の上端 y=-150 より上） */
export const HAT_POLY: Pt[] = [
  { x: -54, y: -162 },
  ...B({ x: -54, y: -162 }, { x: -60, y: -222 }, { x: 0, y: -226 }),
  ...B({ x: 0, y: -226 }, { x: 60, y: -222 }, { x: 54, y: -162 }),
  ...B({ x: 54, y: -162 }, { x: 0, y: -154 }, { x: -54, y: -162 }).slice(0, -1),
];
export const HAT_POMPOM = { cx: 0, cy: -228, r: 13 };

/** 傘の布（左手で持ち、頭の上をおおう） */
export const UMBRELLA_CANOPY: Pt[] = [
  { x: -128, y: -232 },
  ...B({ x: -128, y: -232 }, { x: -116, y: -318 }, { x: -6, y: -322 }),
  ...B({ x: -6, y: -322 }, { x: 104, y: -318 }, { x: 116, y: -232 }),
  // すそは小さな波（4つ）
  ...B({ x: 116, y: -232 }, { x: 86, y: -246 }, { x: 55, y: -232 }).slice(1),
  ...B({ x: 55, y: -232 }, { x: 25, y: -246 }, { x: -6, y: -232 }).slice(1),
  ...B({ x: -6, y: -232 }, { x: -37, y: -246 }, { x: -67, y: -232 }).slice(1),
  ...B({ x: -67, y: -232 }, { x: -98, y: -246 }, { x: -128, y: -232 }).slice(1, -1),
];
/** 柄（手の位置から上へ） */
export const UMBRELLA_SHAFT = { x: -58, y0: -40, y1: -322 };

export function hatShapes(): Shape[] {
  return [
    { kind: 'poly', pts: HAT_POLY },
    { kind: 'ellipse', cx: HAT_POMPOM.cx, cy: HAT_POMPOM.cy, rx: HAT_POMPOM.r, ry: HAT_POMPOM.r },
  ];
}

export function umbrellaShapes(): Shape[] {
  return [{ kind: 'poly', pts: UMBRELLA_CANOPY }];
}

export function accessoryShapes(acc: Accessories | undefined): Shape[] {
  if (!acc) return [];
  return [
    ...(acc.umbrella ? umbrellaShapes() : []),
    ...(acc.hat ? (acc.deep ? deepHatShapes(acc.deep) : hatShapes()) : []),
    ...(acc.glasses ? glassesShapes(acc.glasses) : []),
  ];
}

/** 迷彩の柄を合わせる基準点（ローカル座標）。その点のうしろの領域の柄を使う */
export const HAT_ANCHOR: Pt = { x: 0, y: -196 };
export const UMBRELLA_ANCHOR: Pt = { x: -6, y: -276 };

export interface AccFit {
  ok: boolean;
  /** 迷彩に使う領域（camo のとき） */
  region: string | null;
  /** camo のとき、うしろが同じ柄の領域である割合（color は 1） */
  match: number;
  problems: string[];
}

/**
 * その隠れ場所で身につけ物が使えるか。
 * 画面の内側に収まること・顔を隠さないこと。camo なら、うしろの 7 割以上が同じ柄の領域であること。
 */
export function accessoryFits(scene: SceneDef, spot: SpotDef, char: CharacterId, kind: 'hat' | 'umbrella', style: AccStyle, deep?: Side): AccFit {
  const t = { tx: spot.x, ty: spot.y, s: spot.s };
  const shapes = (kind === 'hat' ? (deep ? deepHatShapes(deep) : hatShapes()) : umbrellaShapes()).map((s) => transformShape(t, s));
  const problems: string[] = [];
  const b = unionBBox(shapes.map(bbox));
  const m = 6;
  if (b.x0 < m || b.y0 < m || b.x1 > SCENE_SIZE - m || b.y1 > SCENE_SIZE - m) problems.push('out of bounds');
  // 深くかぶる帽子は、隠す側の目だけは覆ってよい（もう片方の目と口は必ず見える）
  const fp = CHARACTERS[char].facePoints.filter((p) => !deep || (deep === 'l' ? p.x >= 0 : p.x <= 0) || p.x === 0);
  const face = fp.map((p) => transformPt(t, p));
  if (face.some((p) => shapes.some((s) => contains(s, p)))) problems.push('covers face');
  let region: string | null = null;
  let match = 1;
  if (style === 'camo') {
    const anchor = transformPt(t, kind === 'hat' ? HAT_ANCHOR : UMBRELLA_ANCHOR);
    region = regionAt(scene, anchor);
    const pts = shapes.flatMap((s) => samplePoints(s, 8));
    match = region === null || pts.length === 0 ? 0 : pts.filter((p) => regionAt(scene, p) === region).length / pts.length;
    if (match < 0.7) problems.push(`camo match ${match.toFixed(2)}`);
  }
  // ほかの隠れ場所の小物（手前に描かれる）と重なると、奥にある物が傘の上に乗って見えるので使わない
  const others = scene.spots.filter((sp) => sp.id !== spot.id);
  const pts = shapes.flatMap((s) => samplePoints(s, 8));
  if (pts.some((p) => others.some((o) => o.prop.shapes.some((s) => contains(s, p))))) problems.push('under another prop');
  return { ok: problems.length === 0, region, match, problems };
}
