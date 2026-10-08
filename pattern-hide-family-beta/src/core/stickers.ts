// シールちょう：遊ぶともらえるシール（買うものではない）。
// コースをクリアすると1枚ずつ（10枚）、見つけた合計回数でも5枚。ガチャやランダムはなし（何をするともらえるか、いつも分かる）。
import type { CharacterId } from './characters';

export type Motif = 'ball' | 'cushion' | 'cloud' | 'flower' | 'cake' | 'leaf' | 'heart' | 'moon' | 'crown' | 'rainbow' | 'star' | 'fish' | 'bread' | 'balloon' | 'present';

export interface StickerDef {
  id: string;
  /** 子ども向けの名前（ひらがな） */
  name: string;
  kind: 'course' | 'finds';
  /** course：このコースをクリア / finds：見つけた合計回数 */
  need: number;
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
  { id: 'c10', name: 'みんなの おうかん', kind: 'course', need: 10, char: 'moko', motif: 'crown', color: '#F6E3A8' },
  { id: 'f10', name: '10かい みつけた', kind: 'finds', need: 10, char: 'mimi', motif: 'leaf', color: '#D6EBCB' },
  { id: 'f30', name: '30かい みつけた', kind: 'finds', need: 30, char: 'koro', motif: 'bread', color: '#F1DDC2' },
  { id: 'f60', name: '60かい みつけた', kind: 'finds', need: 60, char: 'moko', motif: 'heart', color: '#F5D5DE' },
  { id: 'f100', name: '100かい みつけた', kind: 'finds', need: 100, char: 'nyako', motif: 'balloon', color: '#D8E4F2' },
  { id: 'f150', name: '150かい みつけた', kind: 'finds', need: 150, char: 'mimi', motif: 'star', color: '#F4E6B4' },
];

export function hasSticker(s: StickerDef, cleared: number, totalFinds: number): boolean {
  return s.kind === 'course' ? cleared >= s.need : totalFinds >= s.need;
}

export function earnedStickers(cleared: number, totalFinds: number): StickerDef[] {
  return STICKERS.filter((s) => hasSticker(s, cleared, totalFinds));
}

/** 進み具合が before → after に変わったときに、新しくもらえたシール */
export function newStickers(before: { cleared: number; totalFinds: number }, after: { cleared: number; totalFinds: number }): StickerDef[] {
  return STICKERS.filter((s) => !hasSticker(s, before.cleared, before.totalFinds) && hasSticker(s, after.cleared, after.totalFinds));
}

/** まだのシールの「どうすればもらえるか」 */
export function stickerHint(s: StickerDef): string {
  return s.kind === 'course' ? `コース${s.need} クリアで` : `${s.need}かい みつけたら`;
}
