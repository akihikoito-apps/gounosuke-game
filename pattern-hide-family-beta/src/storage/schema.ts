// 端末内保存のスキーマ。子どもの氏名・誕生日・写真・音声・端末IDは持たない。
import { CHARACTER_IDS, type CharacterId } from '../core/characters';
import type { Difficulty, Placement } from '../core/placement';
import type { SceneId } from '../core/scene';
import { SCENES, SCENE_IDS } from '../core/scenes';
import { ROOMS, type RoomId, type RoomLayouts, validLayouts } from '../core/myroom';
import { STICKERS, earnedStickers } from '../core/stickers';

export const STORAGE_KEY = 'moyou-kakurenbo-beta';
export const SCHEMA_VERSION = 1;

export interface Settings {
  sound: boolean;
  difficulty: Difficulty;
  tutorialSeen: boolean;
  /** コースの うごくもの（保護者が切れる。初期値 ON） */
  movers: boolean;
  /** テスト用：追加パックを ためす（購入の仕組みができるまでの確認用。購入の証明ではない） */
  trialAllPacks?: boolean;
  /** 「あたらしく なったよ」を最後に見た版（無ければ はじめて入れた人） */
  newsSeen?: number;
}

export interface ResumeState {
  sceneId: SceneId;
  difficulty: Difficulty;
  placements: Placement[];
  found: boolean[];
  origin: 'search' | 'hide';
}

export interface PlaytestCounters {
  searchStarted: number;
  searchCompleted: number;
  hintsUsed: number;
  hideRounds: number;
  /** 1回のプレイ時間のおおまかな区分（秒は残さない） */
  durationUnder1m: number;
  duration1to3m: number;
  durationOver3m: number;
}

export interface SaveData {
  schema: typeof SCHEMA_VERSION;
  settings: Settings;
  resume: ResumeState | null;
  playtest: { enabled: boolean; counters: PlaytestCounters };
  course: CourseProgress;
  /** シールちょう用：見つけた合計回数（コース・さがす・かくして わたす。おためしは数えない）と、すでに見たシールID */
  collection: { totalFinds: number; sceneFinds: Partial<Record<SceneId, number>>; seenStickers: string[] };
  /** じぶんの へや：部屋ごとの置き方と、いま開いている部屋 */
  myroom: { layouts: RoomLayouts; current: RoomId };
}

/** コースの進み具合。cleared：クリアした最後のコース（0〜10）。current の finds：そのコースで見つけた回数 */
export interface CourseProgress {
  cleared: number;
  current: number;
  finds: number;
}

export const COURSE_COUNT = 10;
export const COURSE_FINDS = 10;

export function emptyCourse(): CourseProgress {
  return { cleared: 0, current: 1, finds: 0 };
}

const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

/** 壊れた値は使える範囲に直す。遊べるのは「クリアした次」まで */
export function validateCourse(v: unknown): { course: CourseProgress; repaired: boolean } {
  if (v === undefined) return { course: emptyCourse(), repaired: false }; // 以前の保存データ（コース追加前）
  if (typeof v !== 'object' || v === null) return { course: emptyCourse(), repaired: true };
  const o = v as Record<string, unknown>;
  if (!isInt(o.cleared, 0, COURSE_COUNT) || !isInt(o.current, 1, COURSE_COUNT) || !isInt(o.finds, 0, COURSE_FINDS - 1)) {
    return { course: emptyCourse(), repaired: true };
  }
  if (o.current > Math.min(COURSE_COUNT, o.cleared + 1)) return { course: { cleared: o.cleared, current: Math.min(COURSE_COUNT, o.cleared + 1), finds: 0 }, repaired: true };
  return { course: { cleared: o.cleared, current: o.current, finds: o.finds }, repaired: false };
}

export const COUNTER_MAX = 9999;

export function emptyCounters(): PlaytestCounters {
  return { searchStarted: 0, searchCompleted: 0, hintsUsed: 0, hideRounds: 0, durationUnder1m: 0, duration1to3m: 0, durationOver3m: 0 };
}

export function defaults(): SaveData {
  return {
    schema: SCHEMA_VERSION,
    settings: { sound: true, difficulty: 'easy', tutorialSeen: false, movers: true },
    resume: null,
    playtest: { enabled: false, counters: emptyCounters() },
    course: emptyCourse(),
    collection: { totalFinds: 0, sceneFinds: {}, seenStickers: [] },
    myroom: { layouts: {}, current: 'living' },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isDiff = (v: unknown): v is Difficulty => v === 'easy' || v === 'normal';

function validPlacement(sceneId: SceneId, v: unknown): v is Placement {
  if (!isObj(v)) return false;
  const scene = SCENES[sceneId];
  return (
    CHARACTER_IDS.includes(v.char as CharacterId) &&
    typeof v.spot === 'string' &&
    scene.spots.some((s) => s.id === v.spot) &&
    typeof v.costume === 'string' &&
    scene.costumes.some((c) => c.id === v.costume) &&
    (v.variant === 'exact' || v.variant === 'soft')
  );
}

export function validateResume(v: unknown): ResumeState | null {
  if (!isObj(v)) return null;
  if (!SCENE_IDS.includes(v.sceneId as SceneId)) return null;
  const sceneId = v.sceneId as SceneId;
  if (!isDiff(v.difficulty)) return null;
  if (v.origin !== 'search' && v.origin !== 'hide') return null;
  if (!Array.isArray(v.placements) || v.placements.length < 1 || v.placements.length > 3) return null;
  if (!v.placements.every((p) => validPlacement(sceneId, p))) return null;
  if (!Array.isArray(v.found) || v.found.length !== v.placements.length || !v.found.every(isBool)) return null;
  const chars = new Set((v.placements as Placement[]).map((p) => p.char));
  const spots = new Set((v.placements as Placement[]).map((p) => p.spot));
  if (chars.size !== v.placements.length || spots.size !== v.placements.length) return null;
  return {
    sceneId,
    difficulty: v.difficulty,
    origin: v.origin,
    placements: (v.placements as Placement[]).map((p) => ({ char: p.char, spot: p.spot, costume: p.costume, variant: p.variant })),
    found: (v.found as boolean[]).slice(),
  };
}

function validCount(v: unknown): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? Math.min(v, COUNTER_MAX) : 0;
}

/**
 * 読み込んだ値を検証する。部分的に壊れていても、使える部分だけ残して既定値で補う。
 * 返り値の repaired が true なら何かを直した。
 */
export function validate(raw: unknown): { data: SaveData; repaired: boolean } {
  const d = defaults();
  if (!isObj(raw) || raw.schema !== SCHEMA_VERSION) return { data: d, repaired: true };
  let repaired = false;
  const s = raw.settings;
  if (isObj(s)) {
    if (isBool(s.sound)) d.settings.sound = s.sound;
    else repaired = true;
    if (isDiff(s.difficulty)) d.settings.difficulty = s.difficulty;
    else repaired = true;
    if (isBool(s.tutorialSeen)) d.settings.tutorialSeen = s.tutorialSeen;
    else repaired = true;
    // 以前の保存データには無い（そのときは ON のまま）
    if (isBool(s.movers)) d.settings.movers = s.movers;
    else if (s.movers !== undefined) repaired = true;
    if (isBool(s.trialAllPacks)) d.settings.trialAllPacks = s.trialAllPacks;
    if (typeof s.newsSeen === 'number' && Number.isInteger(s.newsSeen) && s.newsSeen >= 0 && s.newsSeen < 10000) d.settings.newsSeen = s.newsSeen;
  } else repaired = true;
  if (raw.resume !== null && raw.resume !== undefined) {
    const r = validateResume(raw.resume);
    if (r) d.resume = r;
    else repaired = true;
  }
  const p = raw.playtest;
  if (isObj(p) && isBool(p.enabled) && isObj(p.counters)) {
    d.playtest.enabled = p.enabled;
    const c = p.counters;
    for (const k of Object.keys(d.playtest.counters) as (keyof PlaytestCounters)[]) {
      const v = validCount(c[k]);
      if (v !== c[k]) repaired = true;
      d.playtest.counters[k] = v;
    }
    // OFF のときは集計を持たない
    if (!d.playtest.enabled) d.playtest.counters = emptyCounters();
  } else if (p !== undefined) repaired = true;
  const course = validateCourse(raw.course);
  d.course = course.course;
  if (course.repaired) repaired = true;
  const col = raw.collection;
  if (col !== undefined) {
    const tf = typeof col === 'object' && col !== null ? (col as Record<string, unknown>).totalFinds : undefined;
    const v = validCount(tf);
    if (v !== tf) repaired = true;
    d.collection.totalFinds = v;
    const sf = typeof col === 'object' && col !== null ? (col as Record<string, unknown>).sceneFinds : undefined;
    if (sf !== undefined) {
      if (typeof sf !== 'object' || sf === null) repaired = true;
      else
        for (const [k, n] of Object.entries(sf as Record<string, unknown>)) {
          if (!SCENE_IDS.includes(k as SceneId)) {
            repaired = true;
            continue;
          }
          const c = validCount(n);
          if (c !== n) repaired = true;
          d.collection.sceneFinds[k as SceneId] = c;
        }
    }
  }
  const validStickerIds = new Set(STICKERS.map((st) => st.id));
  const ss = typeof col === 'object' && col !== null ? (col as Record<string, unknown>).seenStickers : undefined;
  if (ss === undefined) {
    // 以前の保存データ（seenStickers 追加前）は、すでに持っているシールを「見た」扱いにする
    d.collection.seenStickers = earnedStickers(d.course.cleared, d.collection.totalFinds, d.collection.sceneFinds).map((st) => st.id);
  } else if (!Array.isArray(ss)) {
    repaired = true;
    d.collection.seenStickers = earnedStickers(d.course.cleared, d.collection.totalFinds, d.collection.sceneFinds).map((st) => st.id);
  } else {
    const seenSet = new Set<string>();
    for (const id of ss) {
      if (typeof id === 'string' && validStickerIds.has(id)) seenSet.add(id);
      else repaired = true;
    }
    d.collection.seenStickers = [...seenSet];
  }
  // じぶんの へや：壊れた部屋だけ消す（ほかの部屋と進み具合は残す）
  if (raw.myroom !== undefined) {
    const m = raw.myroom;
    if (isObj(m)) {
      d.myroom.layouts = validLayouts(m.layouts, CHARACTER_IDS);
      if (isObj(m.layouts) && Object.keys(m.layouts).length !== Object.keys(d.myroom.layouts).length) repaired = true;
      if (ROOMS.some((r) => r.id === m.current)) d.myroom.current = m.current as RoomId;
      else if (m.current !== undefined) repaired = true;
    } else repaired = true;
  }
  return { data: d, repaired };
}
