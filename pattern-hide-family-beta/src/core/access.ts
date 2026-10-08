// 遊べるかどうかを一か所で決める（Codex 総合レビュー指摘1〜4）。
// 進み具合（クリア数・見つけた回数）と、パックの利用権限（canPlay）の両方を満たすものだけを出す。
// 保存データの進み具合は購入の証明ではない。canPlay は本番では正規の購入確認だけを根拠にすること。
import { type CharacterId, unlockedCharacters } from './characters';
import type { Placement } from './placement';
import type { SceneId } from './scene';
import { STICKERS, type StickerDef } from './stickers';
import type { ContentId } from '../entitlements/entitlements';

export type CanPlay = (id: ContentId) => boolean;

/** 進み具合で仲間になっていて、しかもパックで遊べる友だち */
export function availableCharacters(cleared: number, sceneFinds: Partial<Record<SceneId, number>>, can: CanPlay): CharacterId[] {
  return unlockedCharacters(cleared, sceneFinds).filter((c) => can(`char:${c}`));
}

export function canPlayCourse(no: number, can: CanPlay): boolean {
  return can(`course:${no}`);
}

/** シールが属するパックの中身（それを遊べないなら、シールちょうに出さない） */
export function stickerRequires(s: StickerDef): ContentId[] {
  const need: ContentId[] = [`char:${s.char}`];
  if (s.kind === 'course') need.push(`course:${s.need}`);
  if (s.kind === 'scene' && s.scene) need.push(`scene:${s.scene}`);
  return need;
}

export function visibleStickers(can: CanPlay): StickerDef[] {
  return STICKERS.filter((s) => stickerRequires(s).every(can));
}

/** つづきから：背景と、置かれた全員がいま遊べるときだけ */
export function canResume(r: { sceneId: SceneId; placements: Placement[] }, can: CanPlay): boolean {
  return can(`scene:${r.sceneId}`) && r.placements.every((p) => can(`char:${p.char}`));
}
