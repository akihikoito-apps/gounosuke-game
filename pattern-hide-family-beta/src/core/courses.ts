// コースモード：10回みつけると1コースクリア、10コースで100回。
// あとのコースほど、柄が背景に近づき・ふち線が薄くなり・人数が増え・ニット帽や傘が加わる。
import { type AccStyle, type Accessories, HAT_COLORS, accessoryFits, accessoryShapes } from './accessories';
import { CHARACTER_IDS, type CharacterId } from './characters';
import { bbox, bboxOverlap, transformShape, unionBBox } from './geometry';
import { type Placement, costumeForRegion, silhouetteBBox, spotsConflict } from './placement';
import { type Rng, mulberry32, shuffle } from './rng';
import type { SceneDef, SceneId, SpotDef } from './scene';

export const FINDS_PER_COURSE = 10;

export interface CourseDef {
  no: number;
  /** easy：見えやすい場所だけ / all：すべての場所 */
  spots: 'easy' | 'all';
  /** soft：少し違う柄 / exact：背景と同じ柄 */
  variant: 'soft' | 'exact';
  /** 服のふち線の濃さ */
  outline: number;
  /** 1回に隠れる最大の人数 */
  maxChars: 1 | 2 | 3;
  /** rate：1人ごとにかぶる割合 */
  hat: { rate: number; style: AccStyle } | null;
  umbrella: { rate: number; style: AccStyle } | null;
}

export const COURSES: CourseDef[] = [
  { no: 1, spots: 'easy', variant: 'soft', outline: 0.72, maxChars: 1, hat: null, umbrella: null },
  { no: 2, spots: 'easy', variant: 'soft', outline: 0.62, maxChars: 1, hat: null, umbrella: null },
  { no: 3, spots: 'all', variant: 'soft', outline: 0.56, maxChars: 1, hat: null, umbrella: null },
  // ニット帽のはじまり：色つきの帽子で、頭の目印（くるん毛・耳・星）が見えにくくなる
  { no: 4, spots: 'easy', variant: 'soft', outline: 0.56, maxChars: 1, hat: { rate: 1, style: 'color' }, umbrella: null },
  { no: 5, spots: 'all', variant: 'soft', outline: 0.5, maxChars: 2, hat: { rate: 0.8, style: 'color' }, umbrella: null },
  // 傘のはじまり：うしろの背景と同じ柄の傘
  { no: 6, spots: 'easy', variant: 'soft', outline: 0.5, maxChars: 1, hat: null, umbrella: { rate: 1, style: 'camo' } },
  { no: 7, spots: 'all', variant: 'exact', outline: 0.44, maxChars: 2, hat: { rate: 0.7, style: 'color' }, umbrella: { rate: 0.6, style: 'camo' } },
  // 帽子も背景の柄に
  { no: 8, spots: 'all', variant: 'exact', outline: 0.4, maxChars: 2, hat: { rate: 0.8, style: 'camo' }, umbrella: { rate: 0.6, style: 'camo' } },
  { no: 9, spots: 'all', variant: 'exact', outline: 0.36, maxChars: 3, hat: { rate: 0.8, style: 'camo' }, umbrella: { rate: 0.7, style: 'camo' } },
  { no: 10, spots: 'all', variant: 'exact', outline: 0.32, maxChars: 3, hat: { rate: 0.9, style: 'camo' }, umbrella: { rate: 0.8, style: 'camo' } },
];

export function courseDef(no: number): CourseDef {
  return COURSES[Math.min(COURSES.length, Math.max(1, Math.floor(no))) - 1];
}

/** 何回目の出題で、どの背景を使うか（同じ背景が続かないよう順番に回す） */
export function courseScene(no: number, round: number, sceneIds: SceneId[]): SceneId {
  return sceneIds[(no - 1 + round) % sceneIds.length];
}

function worldShapes(spot: SpotDef, acc: Accessories) {
  const t = { tx: spot.x, ty: spot.y, s: spot.s };
  return accessoryShapes(acc).map((s) => transformShape(t, s));
}

/**
 * コースの1回分の配置。remaining（このコースで残りの「みつける」回数）を超えない人数にする。
 * シードが同じなら同じ結果。
 */
export function courseRound(scene: SceneDef, no: number, remaining: number, seed: number): Placement[] {
  const c = courseDef(no);
  const rng: Rng = mulberry32(seed);
  const want = Math.max(1, Math.min(remaining, 1 + Math.floor(rng() * c.maxChars)));
  const chars = shuffle(rng, CHARACTER_IDS).slice(0, want);
  const pool = shuffle(
    rng,
    scene.spots.filter((s) => c.spots === 'all' || s.easy),
  );
  // 初めて帽子・傘が出るコース（割合 1）は、それが使える場所から先に選ぶ
  const first = (sp: SpotDef, ch: CharacterId) =>
    (c.hat?.rate === 1 && accessoryFits(scene, sp, ch, 'hat', c.hat.style).ok) ||
    (c.umbrella?.rate === 1 && accessoryFits(scene, sp, ch, 'umbrella', c.umbrella.style).ok);
  const out: Placement[] = [];
  const used: SpotDef[] = [];
  const accBoxes: ReturnType<typeof bbox>[] = [];
  for (const ch of chars) {
    const ordered = [...pool.filter((sp) => first(sp, ch)), ...pool.filter((sp) => !first(sp, ch))];
    let placed = false;
    for (const sp of ordered) {
      if (used.some((u) => spotsConflict(u, sp))) continue;
      const charBox = silhouetteBBox(ch, sp);
      // ほかの子の傘の下に入らない
      if (accBoxes.some((b) => bboxOverlap(b, charBox, 4))) continue;
      const acc: Accessories = {};
      if (c.hat && rng() < c.hat.rate && accessoryFits(scene, sp, ch, 'hat', c.hat.style).ok) acc.hat = c.hat.style;
      if (c.umbrella && rng() < c.umbrella.rate && accessoryFits(scene, sp, ch, 'umbrella', c.umbrella.style).ok) {
        // 傘がほかの子に重ならないときだけ
        const ub = unionBBox(worldShapes(sp, { umbrella: c.umbrella.style }).map(bbox));
        if (!used.some((u, k) => bboxOverlap(ub, silhouetteBBox(out[k].char, u), 4))) acc.umbrella = c.umbrella.style;
      }
      if (acc.hat === 'color' || acc.umbrella === 'color') acc.tone = Math.floor(rng() * HAT_COLORS.length);
      const p: Placement = { char: ch, spot: sp.id, costume: costumeForRegion(scene, sp.region), variant: c.variant };
      if (acc.hat || acc.umbrella) {
        p.acc = acc;
        const shapes = worldShapes(sp, acc);
        if (shapes.length) accBoxes.push(unionBBox(shapes.map(bbox)));
      }
      out.push(p);
      used.push(sp);
      placed = true;
      break;
    }
    if (!placed) break;
  }
  return out;
}
