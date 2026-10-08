// 隠れ場所の検証と自動配置。描画・当たり判定と同じ形状定義を使う。
import { CHARACTERS, BODY, type CharacterId, CHARACTER_IDS, BASE_CHARACTER_IDS } from './characters';
import {
  type BBox,
  type Pt,
  type Shape,
  SCENE_SIZE,
  bbox,
  bboxOverlap,
  contains,
  samplePoints,
  transformPt,
  transformShape,
  unionBBox,
} from './geometry';
import { type Rng, mulberry32, shuffle } from './rng';
import type { SceneDef, SpotDef } from './scene';
import type { Accessories } from './accessories';
import { findPeek } from './peeks';

export type Difficulty = 'easy' | 'normal';

export interface Placement {
  char: CharacterId;
  spot: string;
  costume: string;
  /** exact: 背景と同じ柄 / soft: 同じ種類で少し違う柄 */
  variant: 'exact' | 'soft';
  /** コースだけ：ニット帽・傘 */
  acc?: Accessories;
}

export const LIMITS = {
  /** 画面の端から最低これだけ内側 */
  margin: 6,
  /** キャラクター全体のうち見えている割合の下限（全面を隠さない） */
  minVisible: 0.45,
  /** からだ（服）が少しは隠れている */
  maxBodyVisible: 0.92,
  /** からだ（服）が見えている割合の下限（柄を選ぶ意味を残す） */
  minBodyVisible: 0.2,
  /** 見えている服の後ろが、狙った柄の領域である割合 */
  minRegionMatch: 0.7,
  /** シーン座標での最小の高さ（極端に小さくしない） */
  minHeight: 170,
  /** 複数体の間のすきま */
  gap: 4,
};

const STEP = 6;

export function spotTransform(spot: SpotDef) {
  return { tx: spot.x, ty: spot.y, s: spot.s };
}

export function silhouetteWorld(char: CharacterId, spot: SpotDef): Shape[] {
  const t = spotTransform(spot);
  return CHARACTERS[char].silhouette.map((s) => transformShape(t, s));
}

export function silhouetteBBox(char: CharacterId, spot: SpotDef): BBox {
  return unionBBox(silhouetteWorld(char, spot).map(bbox));
}

/** どのキャラクターが来ても入る外枠 */
export function spotBBox(spot: SpotDef): BBox {
  return unionBBox(CHARACTER_IDS.map((c) => silhouetteBBox(c, spot)));
}

export function regionAt(scene: SceneDef, p: Pt): string | null {
  for (let i = scene.regions.length - 1; i >= 0; i--) {
    if (scene.regions[i].shapes.some((s) => contains(s, p))) return scene.regions[i].id;
  }
  return null;
}

function occluded(scene: SceneDef, p: Pt): boolean {
  return scene.spots.some((sp) => sp.prop.shapes.some((s) => contains(s, p)));
}

export interface SpotReport {
  spot: string;
  char: CharacterId;
  visible: number;
  bodyVisible: number;
  faceVisible: boolean;
  inBounds: boolean;
  height: number;
  regionMatch: number;
  ok: boolean;
  problems: string[];
}

export function analyzeSpot(scene: SceneDef, spot: SpotDef, char: CharacterId): SpotReport {
  const t = spotTransform(spot);
  const shapes = silhouetteWorld(char, spot);
  // 重なりを数えないよう、全形状のサンプル点を一意化
  const seen = new Set<string>();
  const pts: Pt[] = [];
  for (const s of shapes) {
    for (const p of samplePoints(s, STEP)) {
      const k = `${Math.round(p.x)}:${Math.round(p.y)}`;
      if (!seen.has(k)) {
        seen.add(k);
        pts.push(p);
      }
    }
  }
  const visiblePts = pts.filter((p) => !occluded(scene, p));
  const body = samplePoints(transformShape(t, BODY), STEP);
  const bodyVis = body.filter((p) => !occluded(scene, p));
  const face = CHARACTERS[char].facePoints.map((p) => transformPt(t, p));
  const faceVisible = face.every((p) => !occluded(scene, p));
  const b = unionBBox(shapes.map(bbox));
  const m = LIMITS.margin;
  const inBounds = b.x0 >= m && b.y0 >= m && b.x1 <= SCENE_SIZE - m && b.y1 <= SCENE_SIZE - m;
  const regionMatch = bodyVis.length === 0 ? 0 : bodyVis.filter((p) => regionAt(scene, p) === spot.region).length / bodyVis.length;
  const visible = visiblePts.length / pts.length;
  const bodyVisible = bodyVis.length / body.length;
  const height = b.y1 - b.y0;
  const problems: string[] = [];
  if (visible < LIMITS.minVisible) problems.push(`visible ${visible.toFixed(2)} < ${LIMITS.minVisible}`);
  if (bodyVisible > LIMITS.maxBodyVisible) problems.push(`bodyVisible ${bodyVisible.toFixed(2)} > ${LIMITS.maxBodyVisible}`);
  if (bodyVisible < LIMITS.minBodyVisible) problems.push(`bodyVisible ${bodyVisible.toFixed(2)} < ${LIMITS.minBodyVisible}`);
  if (!faceVisible) problems.push('face hidden');
  if (!inBounds) problems.push('out of bounds');
  if (height < LIMITS.minHeight) problems.push(`height ${height.toFixed(0)} < ${LIMITS.minHeight}`);
  if (regionMatch < LIMITS.minRegionMatch) problems.push(`regionMatch ${regionMatch.toFixed(2)} < ${LIMITS.minRegionMatch}`);
  return { spot: spot.id, char, visible, bodyVisible, faceVisible, inBounds, height, regionMatch, ok: problems.length === 0, problems };
}

export function spotsConflict(a: SpotDef, b: SpotDef): boolean {
  return a.id === b.id || bboxOverlap(spotBBox(a), spotBBox(b), LIMITS.gap);
}

export function getSpot(scene: SceneDef, id: string): SpotDef {
  // 最難関の「のぞき場所」も同じ名前空間で探す
  const s = scene.spots.find((sp) => sp.id === id) ?? findPeek(scene.id, id);
  if (!s) throw new Error(`unknown spot ${id}`);
  return s;
}

export function costumeForRegion(scene: SceneDef, region: string): string {
  const r = scene.regions.find((x) => x.id === region);
  if (!r) throw new Error(`unknown region ${region}`);
  return r.costume;
}

export interface LayoutCheck {
  ok: boolean;
  problems: string[];
}

export function validateLayout(scene: SceneDef, placements: Placement[]): LayoutCheck {
  const problems: string[] = [];
  if (placements.length < 1 || placements.length > 3) problems.push(`count ${placements.length}`);
  const chars = new Set(placements.map((p) => p.char));
  if (chars.size !== placements.length) problems.push('duplicate character');
  for (const p of placements) {
    const spot = scene.spots.find((s) => s.id === p.spot);
    if (!spot) {
      problems.push(`unknown spot ${p.spot}`);
      continue;
    }
    if (!scene.costumes.some((c) => c.id === p.costume)) problems.push(`unknown costume ${p.costume}`);
    const r = analyzeSpot(scene, spot, p.char);
    if (!r.ok) problems.push(`${p.char}@${p.spot}: ${r.problems.join(', ')}`);
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = scene.spots.find((s) => s.id === placements[i].spot);
      const b = scene.spots.find((s) => s.id === placements[j].spot);
      if (a && b && spotsConflict(a, b)) problems.push(`overlap ${a.id} / ${b.id}`);
    }
  }
  return { ok: problems.length === 0, problems };
}

/** 「さがす」モードの自動配置。シードが同じなら同じ結果。 */
/** chars：出てよいキャラクター（にゃこは仲間になってから） */
export function autoLayout(scene: SceneDef, difficulty: Difficulty, seed: number, chars0: readonly CharacterId[] = BASE_CHARACTER_IDS): Placement[] {
  const rng: Rng = mulberry32(seed);
  const count = difficulty === 'easy' ? 1 : rng() < 0.5 ? 2 : 3;
  const chars = shuffle(rng, chars0).slice(0, count);
  const pool = shuffle(
    rng,
    scene.spots.filter((s) => difficulty === 'normal' || s.easy),
  );
  const chosen: SpotDef[] = [];
  for (const sp of pool) {
    if (chosen.length === count) break;
    if (chosen.some((c) => spotsConflict(c, sp))) continue;
    chosen.push(sp);
  }
  return chosen.map((sp, i) => ({
    char: chars[i],
    spot: sp.id,
    costume: costumeForRegion(scene, sp.region),
    variant: difficulty === 'easy' ? 'soft' : 'exact',
  }));
}

/** 体の中心（スナップの基準点） */
export function spotAnchor(spot: SpotDef): Pt {
  return { x: spot.x, y: spot.y - 100 * spot.s };
}

/**
 * 指を離した場所に近い、空いている隠れ場所を返す。
 * シーンの外や無効な場所でも、いちばん近い安全な候補に戻す。
 */
export function snapToSpot(scene: SceneDef, p: Pt, occupied: string[]): SpotDef | null {
  const occ = occupied.map((id) => getSpot(scene, id));
  const free = scene.spots.filter((s) => !occ.some((o) => spotsConflict(o, s)));
  if (free.length === 0) return null;
  const cx = Math.min(SCENE_SIZE, Math.max(0, p.x));
  const cy = Math.min(SCENE_SIZE, Math.max(0, p.y));
  let best = free[0];
  let bd = Infinity;
  for (const s of free) {
    const a = spotAnchor(s);
    const d = Math.hypot(a.x - cx, a.y - cy);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/** 置ける候補（編集中だけ表示） */
export function freeSpots(scene: SceneDef, occupied: string[]): SpotDef[] {
  const occ = occupied.map((id) => getSpot(scene, id));
  return scene.spots.filter((s) => !occ.some((o) => spotsConflict(o, s)));
}
