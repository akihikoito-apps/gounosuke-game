// 「かくしてわたす」の編集状態（純粋関数）
import type { CharacterId } from './characters';
import { type Placement, freeSpots, getSpot, snapToSpot } from './placement';
import type { Pt } from './geometry';
import type { SceneDef, SceneId } from './scene';

export type HideStep = 'scene' | 'chars' | 'place';

export interface HideDraft {
  sceneId: SceneId | null;
  chars: CharacterId[];
  /** キャラクターごとの服の柄 */
  costumes: Partial<Record<CharacterId, string>>;
  placed: Partial<Record<CharacterId, string>>;
  /** 選択中（タップ→タップで置くため） */
  selected: CharacterId | null;
  /** 取り消し用の履歴（全消去はしない） */
  history: Partial<Record<CharacterId, string>>[];
}

export function emptyDraft(): HideDraft {
  return { sceneId: null, chars: [], costumes: {}, placed: {}, selected: null, history: [] };
}

export function chooseScene(_d: HideDraft, id: SceneId): HideDraft {
  return { ...emptyDraft(), sceneId: id };
}

export function setChars(d: HideDraft, chars: CharacterId[], scene: SceneDef): HideDraft {
  const uniq = Array.from(new Set(chars)).slice(0, 3);
  const costumes: Partial<Record<CharacterId, string>> = {};
  for (const c of uniq) costumes[c] = d.costumes[c] ?? scene.costumes[0].id;
  return { ...d, chars: uniq, costumes, placed: {}, history: [], selected: uniq[0] ?? null };
}

export function select(d: HideDraft, c: CharacterId | null): HideDraft {
  if (c !== null && !d.chars.includes(c)) return d;
  return { ...d, selected: c };
}

export function setCostume(d: HideDraft, c: CharacterId, costume: string, scene: SceneDef): HideDraft {
  if (!d.chars.includes(c) || !scene.costumes.some((x) => x.id === costume)) return d;
  return { ...d, costumes: { ...d.costumes, [c]: costume } };
}

function occupiedExcept(d: HideDraft, c: CharacterId): string[] {
  return Object.entries(d.placed)
    .filter(([k, v]) => k !== c && v)
    .map(([, v]) => v as string);
}

/** 指定点の近くの空いた場所へ置く（無効な場所なら近い安全な候補へ）。 */
export function placeAt(d: HideDraft, c: CharacterId, p: Pt, scene: SceneDef): HideDraft {
  if (!d.chars.includes(c)) return d;
  const spot = snapToSpot(scene, p, occupiedExcept(d, c));
  if (!spot) return d;
  return placeOnSpot(d, c, spot.id, scene);
}

export function placeOnSpot(d: HideDraft, c: CharacterId, spotId: string, scene: SceneDef): HideDraft {
  if (!d.chars.includes(c)) return d;
  const free = freeSpots(scene, occupiedExcept(d, c));
  if (!free.some((s) => s.id === spotId)) return d;
  getSpot(scene, spotId);
  const next = { ...d.placed, [c]: spotId };
  // 次にまだ置いていない子を選んでおく
  const nextSel = d.chars.find((x) => !next[x]) ?? c;
  return { ...d, placed: next, history: [...d.history, d.placed], selected: nextSel };
}

export function undo(d: HideDraft): HideDraft {
  if (d.history.length === 0) return d;
  const prev = d.history[d.history.length - 1];
  return { ...d, placed: prev, history: d.history.slice(0, -1) };
}

export function allPlaced(d: HideDraft): boolean {
  return d.chars.length > 0 && d.chars.every((c) => !!d.placed[c]);
}

export function toPlacements(d: HideDraft): Placement[] {
  return d.chars.map((c) => ({
    char: c,
    spot: d.placed[c] as string,
    costume: d.costumes[c] as string,
    variant: 'exact' as const,
  }));
}
