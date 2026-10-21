// シールちょう：遊ぶともらえるシール（買うものではない）。
// コースをクリアすると1枚ずつ（10枚）、見つけた合計回数でも5枚。ガチャやランダムはなし（何をするともらえるか、いつも分かる）。
import type { CharacterId } from './characters';
import type { SceneId } from './scene';
import { SCENES, SCENE_IDS } from './scenes';

export type Motif = 'shell' | 'floatring' | 'shavedice' | 'crab' | 'ball' | 'cushion' | 'cloud' | 'flower' | 'cake' | 'leaf' | 'heart' | 'moon' | 'crown' | 'rainbow' | 'star' | 'fish' | 'bread' | 'balloon' | 'present' | 'mushroom' | 'acorn' | 'lantern' | 'squirrel' | 'jellyfish' | 'dolphin' | 'treasure' | 'penguin' | 'firefly' | 'frog' | 'dragonfly' | 'dino-egg' | 'footprint' | 'tricera' | 'ammonite' | 'brachio';

export interface StickerDef {
  id: string;
  /** 子ども向けの名前（ひらがな） */
  name: string;
  kind: 'course' | 'finds' | 'scene';
  /** course：このコースをクリア / finds：見つけた合計回数 / scene：その背景で見つけた回数 */
  need: number;
  /** kind が scene のときの背景（背景パック） */
  scene?: SceneId;
  char: CharacterId;
  motif: Motif;
  /** シールの地の色（くすみパステル） */
  color: string;
}

export const STICKERS: StickerDef[] = [
  { id: 'c1', name: 'ころと ボール', kind: 'course', need: 1, char: 'koro', motif: 'ball', color: '#F6D7B8' },
  { id: 'c2', name: 'みみと クッション', kind: 'course', need: 2, char: 'mimi', motif: 'cushion', color: '#CFE9D6' },
  { id: 'c3', name: 'もこと くも', kind: 'course', need: 3, char: 'moko', motif: 'cloud', color: '#E4D9F4' },
  { id: 'c4', name: 'ころと はな', kind: 'course', need: 4, char: 'koro', motif: 'flower', color: '#F7D3DA' },
  { id: 'c5', name: 'ぽぽが きたよ', kind: 'course', need: 5, char: 'popo', motif: 'present', color: '#F2DCD8' },
  { id: 'c6', name: 'みみと ケーキ', kind: 'course', need: 6, char: 'mimi', motif: 'cake', color: '#F6E2C4' },
  { id: 'c7', name: 'もこと おつきさま', kind: 'course', need: 7, char: 'moko', motif: 'moon', color: '#D9D6EE' },
  { id: 'c8', name: 'にゃこと さかな', kind: 'course', need: 8, char: 'nyako', motif: 'fish', color: '#CFE3EE' },
  { id: 'c9', name: 'ころと にじ', kind: 'course', need: 9, char: 'koro', motif: 'rainbow', color: '#F3E7C6' },
  { id: 'c10', name: 'おうが きたよ', kind: 'course', need: 10, char: 'ou', motif: 'crown', color: '#F6E3A8' },
  { id: 'f10', name: '10かい みつけた', kind: 'finds', need: 10, char: 'mimi', motif: 'leaf', color: '#D6EBCB' },
  { id: 'f30', name: '30かい みつけた', kind: 'finds', need: 30, char: 'koro', motif: 'bread', color: '#F1DDC2' },
  { id: 'f60', name: '60かい みつけた', kind: 'finds', need: 60, char: 'moko', motif: 'heart', color: '#F5D5DE' },
  { id: 'f100', name: '100かい みつけた', kind: 'finds', need: 100, char: 'nyako', motif: 'balloon', color: '#D8E4F2' },
  { id: 'f150', name: '150かい みつけた', kind: 'finds', need: 150, char: 'mimi', motif: 'star', color: '#F4E6B4' },
  // 背景パック1「うみべ」
  { id: 'b1', name: 'ちょきが きたよ', kind: 'scene', scene: 'beach', need: 1, char: 'choki', motif: 'shell', color: '#F6DCD3' },
  { id: 'b5', name: 'うみべで 5かい', kind: 'scene', scene: 'beach', need: 5, char: 'mimi', motif: 'shavedice', color: '#E2F0CB' },
  { id: 'b10', name: 'うみべで 10かい', kind: 'scene', scene: 'beach', need: 10, char: 'koro', motif: 'floatring', color: '#D7ECF3' },
  { id: 'b30', name: 'うみべで 30かい', kind: 'scene', scene: 'beach', need: 30, char: 'choki', motif: 'star', color: '#F3E6C2' },
  { id: 'b50', name: 'うみべで 50かい', kind: 'scene', scene: 'beach', need: 50, char: 'choki', motif: 'crab', color: '#F5DFC6' },
  // 背景パック2「きのこの もり」
  { id: 'f-s1', name: 'ぴのが きたよ', kind: 'scene', scene: 'forest', need: 1, char: 'pino', motif: 'mushroom', color: '#E8D9B8' },
  { id: 'f-s5', name: 'きのこの もりで 5かい', kind: 'scene', scene: 'forest', need: 5, char: 'koro', motif: 'acorn', color: '#E5D3B8' },
  { id: 'f-s15', name: 'きのこの もりで 15かい', kind: 'scene', scene: 'forest', need: 15, char: 'pino', motif: 'lantern', color: '#F3DFB6' },
  { id: 'f-s30', name: 'きのこの もりで 30かい', kind: 'scene', scene: 'forest', need: 30, char: 'mimi', motif: 'mushroom', color: '#DAE8CE' },
  { id: 'f-s50', name: 'きのこの もりで 50かい', kind: 'scene', scene: 'forest', need: 50, char: 'pino', motif: 'squirrel', color: '#EBD6BE' },
  // 背景パック3「すいぞくかん」
  { id: 'a-s1', name: 'ぷかが きたよ', kind: 'scene', scene: 'aquarium', need: 1, char: 'puka', motif: 'shell', color: '#F5DCE8' },
  { id: 'a-s5', name: 'すいぞくかんで 5かい', kind: 'scene', scene: 'aquarium', need: 5, char: 'moko', motif: 'jellyfish', color: '#DCD8F4' },
  { id: 'a-s15', name: 'すいぞくかんで 15かい', kind: 'scene', scene: 'aquarium', need: 15, char: 'puka', motif: 'dolphin', color: '#CFE8F6' },
  { id: 'a-s30', name: 'すいぞくかんで 30かい', kind: 'scene', scene: 'aquarium', need: 30, char: 'koro', motif: 'treasure', color: '#F6E4B8' },
  { id: 'a-s50', name: 'すいぞくかんで 50かい', kind: 'scene', scene: 'aquarium', need: 50, char: 'puka', motif: 'penguin', color: '#D4ECE8' },
  // 背景パック4「ほたるの かわべ」
  { id: 'n-s1', name: 'ひかが きたよ', kind: 'scene', scene: 'night', need: 1, char: 'hika', motif: 'firefly', color: '#DCE8D8' },
  { id: 'n-s5', name: 'かわべで 5かい', kind: 'scene', scene: 'night', need: 5, char: 'koro', motif: 'lantern', color: '#F5E6C8' },
  { id: 'n-s15', name: 'かわべで 15かい', kind: 'scene', scene: 'night', need: 15, char: 'hika', motif: 'frog', color: '#D4EBD8' },
  { id: 'n-s30', name: 'かわべで 30かい', kind: 'scene', scene: 'night', need: 30, char: 'moko', motif: 'dragonfly', color: '#D8E4F4' },
  { id: 'n-s50', name: 'かわべで 50かい', kind: 'scene', scene: 'night', need: 50, char: 'hika', motif: 'moon', color: '#F6EAB8' },
  // 背景パック5「きょうりゅうの たに」
  { id: 'd-s1', name: 'がおが きたよ', kind: 'scene', scene: 'dino', need: 1, char: 'gao', motif: 'dino-egg', color: '#E2F0D4' },
  { id: 'd-s5', name: 'たにで 5かい', kind: 'scene', scene: 'dino', need: 5, char: 'koro', motif: 'footprint', color: '#F4E2C6' },
  { id: 'd-s15', name: 'たにで 15かい', kind: 'scene', scene: 'dino', need: 15, char: 'gao', motif: 'tricera', color: '#F5D8C8' },
  { id: 'd-s30', name: 'たにで 30かい', kind: 'scene', scene: 'dino', need: 30, char: 'popo', motif: 'ammonite', color: '#DCE8F2' },
  { id: 'd-s50', name: 'きょうりゅう はかせ', kind: 'scene', scene: 'dino', need: 50, char: 'gao', motif: 'brachio', color: '#D6ECD8' },
];

export interface Progress {
  cleared: number;
  totalFinds: number;
  sceneFinds?: Partial<Record<SceneId, number>>;
}

export function hasSticker(s: StickerDef, cleared: number, totalFinds: number, sceneFinds: Partial<Record<SceneId, number>> = {}): boolean {
  if (s.kind === 'course') return cleared >= s.need;
  if (s.kind === 'scene') return (sceneFinds[s.scene as SceneId] ?? 0) >= s.need;
  return totalFinds >= s.need;
}

export function earnedStickers(cleared: number, totalFinds: number, sceneFinds: Partial<Record<SceneId, number>> = {}): StickerDef[] {
  return STICKERS.filter((s) => hasSticker(s, cleared, totalFinds, sceneFinds));
}

/** 進み具合が before → after に変わったときに、新しくもらえたシール */
export function newStickers(before: Progress, after: Progress): StickerDef[] {
  return STICKERS.filter(
    (s) => !hasSticker(s, before.cleared, before.totalFinds, before.sceneFinds) && hasSticker(s, after.cleared, after.totalFinds, after.sceneFinds),
  );
}

/** まだのシールの「どうすればもらえるか」 */
export function stickerHint(s: StickerDef): string {
  if (s.kind === 'course') return `コース${s.need} クリアで`;
  if (s.kind === 'scene') {
    const sceneName = SCENES[s.scene ?? 'beach'].name;
    return s.need === 1 ? `${sceneName}で みつけたら` : `${sceneName}で ${s.need}かい`;
  }
  return `${s.need}かい みつけたら`;
}

/** まだのシールの短い条件（「コース7」「あと 12かい」「うみべで あと 3かい」など、いまの進み具合に合わせる） */
export function stickerProgressHint(s: StickerDef, p: Progress): string {
  if (s.kind === 'course') return `コース${s.need}`;
  if (s.kind === 'scene') {
    const sc = s.scene ?? 'beach';
    const done = p.sceneFinds?.[sc] ?? 0;
    const rem = Math.max(1, s.need - done);
    return `${SCENES[sc].name}で あと ${rem}かい`;
  }
  const rem = Math.max(1, s.need - p.totalFinds);
  return `あと ${rem}かい`;
}

export type StickerPageId = 'course' | 'finds' | SceneId;

export interface StickerPageDef {
  id: StickerPageId;
  name: string;
  stickers: StickerDef[];
}

/** シールちょうのページ一覧（見せるシール visibleStickers の範囲だけ） */
export function stickerPages(visible: readonly StickerDef[]): StickerPageDef[] {
  const out: StickerPageDef[] = [];
  const course = visible.filter((s) => s.kind === 'course');
  if (course.length) out.push({ id: 'course', name: 'コース', stickers: course });
  const finds = visible.filter((s) => s.kind === 'finds');
  if (finds.length) out.push({ id: 'finds', name: 'みつけた かず', stickers: finds });
  for (const sc of SCENE_IDS) {
    const list = visible.filter((s) => s.kind === 'scene' && s.scene === sc);
    if (list.length) out.push({ id: sc, name: SCENES[sc].name, stickers: list });
  }
  return out;
}

/** そのページで つぎに もらえる（いちばん近い）まだのシール */
export function nextStickerOnPage(page: StickerPageDef, p: Progress): StickerDef | null {
  return page.stickers.find((s) => !hasSticker(s, p.cleared, p.totalFinds, p.sceneFinds)) ?? null;
}

/** もらったシールのうち、まだシールちょうで見ていないもの */
export function unseenEarnedStickers(visible: readonly StickerDef[], p: Progress, seenIds: readonly string[]): StickerDef[] {
  const seen = new Set(seenIds);
  return visible.filter((s) => hasSticker(s, p.cleared, p.totalFinds, p.sceneFinds) && !seen.has(s.id));
}

/**
 * シールちょうを開いたときに出すページ：
 * 1) あたらしい（まだ見ていない）シールがあるページ
 * 2) なければ、つぎに もらえそうなシールがあるページ
 */
export function initialStickerPage(
  pages: readonly StickerPageDef[],
  p: Progress & { courseCurrent?: number; courseFinds?: number },
  seenIds: readonly string[],
): StickerPageId {
  if (pages.length === 0) return 'course';
  const seen = new Set(seenIds);
  const withNew = pages.find((pg) => pg.stickers.some((s) => hasSticker(s, p.cleared, p.totalFinds, p.sceneFinds) && !seen.has(s.id)));
  if (withNew) return withNew.id;

  let best: { id: StickerPageId; tier: number; rem: number; idx: number } | null = null;
  pages.forEach((pg, idx) => {
    const next = nextStickerOnPage(pg, p);
    if (!next) return;
    let tier = 0;
    let rem = 9999;
    if (next.kind === 'course') {
      const coursesLeft = Math.max(1, next.need - p.cleared);
      const curFinds = p.courseCurrent === next.need ? (p.courseFinds ?? 0) : 0;
      rem = Math.max(1, coursesLeft * 10 - curFinds);
    } else if (next.kind === 'finds') {
      rem = Math.max(1, next.need - p.totalFinds);
    } else if (next.kind === 'scene') {
      const sc = next.scene ?? 'beach';
      const done = p.sceneFinds?.[sc] ?? 0;
      tier = done >= 1 ? 0 : 1;
      rem = Math.max(1, next.need - done);
    }
    if (!best || tier < best.tier || (tier === best.tier && (rem < best.rem || (rem === best.rem && idx < best.idx)))) {
      best = { id: pg.id, tier, rem, idx };
    }
  });
  return best ? (best as { id: StickerPageId }).id : pages[0].id;
}
