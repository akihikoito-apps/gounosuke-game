// 1回の「さがす」プレイの状態（純粋関数）。表示とは分けてある。
import { type Pt, bbox, distanceTo, transformShape, unionBBox } from './geometry';
import { accessoryShapes } from './accessories';
import { type Difficulty, type Placement, getSpot, silhouetteWorld, spotTransform } from './placement';
import type { SceneDef, SceneId } from './scene';

/** 見える形より少しだけ広い当たり判定（シーン座標）。巨大な矩形にはしない。 */
export const HIT_TOLERANCE = 22;
/** チャタリング防止（罰ではない） */
export const TAP_DEBOUNCE_MS = 120;
export const MAX_HINT = 3;

export interface PlaySession {
  sceneId: SceneId;
  difficulty: Difficulty;
  placements: Placement[];
  found: boolean[];
  /** 0: ヒントなし / 1: このあたり / 2: ちょっと うごく / 3: りんかく */
  hintLevel: number;
  hintsUsed: number;
  origin: 'search' | 'hide' | 'course' | 'trial';
  startedAt: number;
}

export function newSession(
  sceneId: SceneId,
  difficulty: Difficulty,
  placements: Placement[],
  origin: 'search' | 'hide' | 'course' | 'trial',
  now: number,
): PlaySession {
  return {
    sceneId,
    difficulty,
    placements: placements.map((p) => ({ ...p, ...(p.acc ? { acc: { ...p.acc } } : {}) })),
    found: placements.map(() => false),
    hintLevel: 0,
    hintsUsed: 0,
    origin,
    startedAt: now,
  };
}

export function isComplete(s: PlaySession): boolean {
  return s.found.length > 0 && s.found.every(Boolean);
}

/** タップ位置にいる、まだ見つかっていないキャラクターの番号。いなければ -1。 */
export function hitTest(scene: SceneDef, s: PlaySession, p: Pt, tol = HIT_TOLERANCE): number {
  let best = -1;
  let bd = Infinity;
  s.placements.forEach((pl, i) => {
    if (s.found[i]) return;
    const spot = getSpot(scene, pl.spot);
    // 帽子や傘をタッチしても見つけたことにする
    const shapes = [...silhouetteWorld(pl.char, spot), ...accessoryShapes(pl.acc).map((sh) => transformShape(spotTransform(spot), sh))];
    const d = Math.min(...shapes.map((sh) => distanceTo(sh, p)));
    if (d <= tol && d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

export interface TapResult {
  session: PlaySession;
  foundIndex: number;
}

export function tap(scene: SceneDef, s: PlaySession, p: Pt): TapResult {
  const i = hitTest(scene, s, p);
  if (i < 0) return { session: s, foundIndex: -1 }; // 外れても何も減らない
  const found = s.found.slice();
  found[i] = true;
  return { session: { ...s, found, hintLevel: 0 }, foundIndex: i };
}

export function nextHint(s: PlaySession): PlaySession {
  if (isComplete(s)) return s;
  return { ...s, hintLevel: Math.min(MAX_HINT, s.hintLevel + 1), hintsUsed: s.hintsUsed + 1 };
}

export interface HintInfo {
  level: number;
  index: number;
  /** レベル1：おおまかな まる（中心は対象から少しずらす） */
  area: { cx: number; cy: number; r: number };
}

export function currentHint(scene: SceneDef, s: PlaySession): HintInfo | null {
  if (s.hintLevel === 0) return null;
  const index = s.found.findIndex((f) => !f);
  if (index < 0) return null;
  const pl = s.placements[index];
  const b = unionBBox(silhouetteWorld(pl.char, getSpot(scene, pl.spot)).map(bbox));
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  // 対象がちょうど中心にならないよう、位置から決まる量だけずらす（毎回同じ）
  const ang = ((pl.spot.length * 37 + index * 101) % 360) * (Math.PI / 180);
  const r = 230;
  const off = 70;
  return {
    level: s.hintLevel,
    index,
    area: {
      cx: Math.min(1000 - 40, Math.max(40, cx + Math.cos(ang) * off)),
      cy: Math.min(1000 - 40, Math.max(40, cy + Math.sin(ang) * off)),
      r,
    },
  };
}

export function sceneOf(scenes: Record<SceneId, SceneDef>, s: PlaySession): SceneDef {
  return scenes[s.sceneId];
}
