// コースモード：10回みつけると1コースクリア、10コースで100回。
// あとのコースほど、柄が背景に近づき・ふち線が薄くなり・人数が増え・ニット帽や傘が加わる。
import { type AccStyle, type Accessories, HAT_COLORS, accessoryFits, accessoryShapes } from './accessories';
import { CHARACTER_IDS, type CharacterId } from './characters';
import { bbox, bboxOverlap, transformShape, unionBBox } from './geometry';
import { type Placement, type SpotReport, analyzeSpot, costumeForRegion, silhouetteBBox, spotsConflict } from './placement';
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

// ---------- 最難関（大人向けのおためし。通常コースとは別。Codex との議論で決めた仕様：audit/codex/hardest-course-r2.md） ----------

export const HARDEST = {
  finds: 10,
  outline: 0.25,
  /** 服の陰影の濃さ（通常は 1） */
  shade: 0.5,
  maxChars: 3,
} as const;

/** 見つけにくい場所の「優先帯」 */
export const HARDEST_BAND = { match: 0.9, bodyMin: 0.25, bodyMax: 0.4, visible: 0.5 } as const;

interface HardCand {
  spot: SpotDef;
  char: CharacterId;
  match: number;
  body: number;
  hatOk: boolean;
  hatMatch: number;
  key: number;
  /** 帽子・からだの外枠（重なりの判定用に先に計算） */
  hatBox: ReturnType<typeof bbox> | null;
  bodyBox: ReturnType<typeof bbox>;
}

export function inHardestBand(r: SpotReport): boolean {
  const b = HARDEST_BAND;
  return r.ok && r.regionMatch >= b.match && r.bodyVisible >= b.bodyMin && r.bodyVisible <= b.bodyMax && r.visible >= b.visible;
}

/** 組み合わせの中で、帽子をかぶれる子（ほかの子に帽子が重ならない） */
function hatsFor(combo: HardCand[]): boolean[] {
  return combo.map((c, i) => {
    if (!c.hatOk || !c.hatBox) return false;
    const hb = c.hatBox;
    return combo.every((o, j) => j === i || !bboxOverlap(hb, o.bodyBox, 4));
  });
}

function better(a: { r: number; m: number; b: number; h: number; k: number }, z: { r: number; m: number; b: number; h: number; k: number }): boolean {
  const e = 1e-9;
  if (a.r !== z.r) return a.r < z.r; // 前に使った場所が少ない
  if (Math.abs(a.m - z.m) > e) return a.m > z.m; // 服の背景一致が高い
  if (Math.abs(a.b - z.b) > e) return a.b < z.b; // 服の見える割合が低い
  if (a.h !== z.h) return a.h > z.h; // 背景にとけこむ帽子が多い
  return a.k < z.k; // 残りの同点はシードで
}

function bestCombo(pool: HardCand[], n: number, clash: (a: SpotDef, b: SpotDef) => boolean, avoid: readonly string[]): HardCand[] | null {
  let best: HardCand[] | null = null;
  let bs = { r: 0, m: 0, b: 0, h: 0, k: 0 };
  const pick = (start: number, cur: HardCand[]) => {
    if (cur.length === n) {
      const hats = hatsFor(cur);
      const s = {
        r: cur.filter((c) => avoid.includes(c.spot.id)).length,
        m: cur.reduce((t, c) => t + c.match, 0),
        b: cur.reduce((t, c) => t + c.body, 0),
        h: cur.filter((c, i) => hats[i] && c.hatMatch >= 0.9).length,
        k: cur.reduce((t, c) => t + c.key, 0),
      };
      if (!best || better(s, bs)) {
        best = cur.slice();
        bs = s;
      }
      return;
    }
    for (let i = start; i < pool.length; i++) {
      const c = pool[i];
      if (cur.some((o) => o.char === c.char || clash(o.spot, c.spot))) continue;
      cur.push(c);
      pick(i + 1, cur);
      cur.pop();
    }
  };
  pick(0, []);
  return best;
}

const candCache = new WeakMap<SceneDef, { all: HardCand[]; inBand: boolean[]; clash: (a: SpotDef, b: SpotDef) => boolean }>();

function hardCandidates(scene: SceneDef): { all: HardCand[]; inBand: boolean[]; clash: (a: SpotDef, b: SpotDef) => boolean } {
  const hit = candCache.get(scene);
  if (hit) return hit;
  const all: HardCand[] = [];
  const inBand: boolean[] = [];
  for (const sp of scene.spots) {
    for (const ch of CHARACTER_IDS) {
      const r = analyzeSpot(scene, sp, ch);
      if (!r.ok) continue;
      const hat = accessoryFits(scene, sp, ch, 'hat', 'camo');
      all.push({
        spot: sp,
        char: ch,
        match: r.regionMatch,
        body: r.bodyVisible,
        hatOk: hat.ok,
        hatMatch: hat.match,
        key: 0,
        hatBox: hat.ok ? unionBBox(worldShapes(sp, { hat: 'camo' }).map(bbox)) : null,
        bodyBox: silhouetteBBox(ch, sp),
      });
      inBand.push(inHardestBand(r));
    }
  }
  // 場所どうしの重なりも先に表にしておく（組み合わせ探索で何度も使う）

  const table = new Map<string, boolean>();
  for (const a of scene.spots) for (const b of scene.spots) table.set(`${a.id}|${b.id}`, spotsConflict(a, b));
  const clash = (a: SpotDef, b: SpotDef) => table.get(`${a.id}|${b.id}`) ?? spotsConflict(a, b);

  const v = { all, inBand, clash };
  candCache.set(scene, v);
  return v;
}

/**
 * 最難関の1回分。優先帯の中で置ける最大の人数（3人まで・残り回数まで）を、すべての組み合わせから選ぶ。
 * 帯の中で1人も置けないときだけ、安全な場所全体でやり直す。それでも無ければ空（出題しない）。
 * avoid：このおためしで前に使った場所。人数が減らない限り避ける（同じ場所を覚えるだけにしない）。
 */
export function hardestRound(scene: SceneDef, remaining: number, seed: number, avoid: readonly string[] = []): Placement[] {
  if (remaining <= 0) return [];
  const rng = mulberry32(seed);
  // 場所ごとの測定はシードに関係ないので背景ごとに1回だけ。順番の同点決めだけシードで
  const base = hardCandidates(scene);
  const keyed = base.all.map((c) => ({ ...c, key: rng() }));
  const all = keyed;
  const band = keyed.filter((_, i) => base.inBand[i]);
  const want = Math.min(HARDEST.maxChars, remaining);
  for (const pool of [band, all]) {
    for (let n = want; n >= 1; n--) {
      const combo = bestCombo(pool, n, base.clash, avoid);
      if (!combo) continue;
      const hats = hatsFor(combo);
      return combo.map((c, i) => {
        const p: Placement = { char: c.char, spot: c.spot.id, costume: costumeForRegion(scene, c.spot.region), variant: 'exact' };
        if (hats[i]) p.acc = { hat: 'camo' };
        return p;
      });
    }
  }
  return [];
}
