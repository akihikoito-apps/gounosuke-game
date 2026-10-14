// つぎの ごほうび：「あと なんコースで だれが なかまに／どのシール」を、前もって見せるための計算。
// 突然「なかまに なったよ」と出るのではなく、目標が見えて、近づいていくのが分かるようにする（ご本人の要望 2026-10-15）。
import { FRIEND_UNLOCKS, type CharacterId } from './characters';
import { type CanPlay, canPlayCourse, visibleStickers } from './access';
import type { SceneId } from './scene';
import { type StickerDef, hasSticker } from './stickers';
import { ROOMS, type RoomDef } from './myroom';

export type UpcomingReward =
  /** コース at をクリアすると、なかまが ふえる。remaining：あと何コース */
  | { kind: 'friend'; char: CharacterId; at: number; remaining: number }
  /** コース at をクリアすると、シール */
  | { kind: 'courseSticker'; sticker: StickerDef; at: number; remaining: number }
  /** 見つけた合計が at 回になると、シール。done：いまの回数 */
  | { kind: 'findsSticker'; sticker: StickerDef; at: number; remaining: number; done: number }
  /** コース at をクリアすると、じぶんの へや に部屋が ふえる */
  | { kind: 'room'; room: RoomDef; at: number; remaining: number };

export interface RewardProgress {
  cleared: number;
  totalFinds: number;
  sceneFinds?: Partial<Record<SceneId, number>>;
}

/** つぎに もらえる ごほうび（なかま・コースのシール・回数のシール の順に、それぞれいちばん近いもの） */
export function upcomingRewards(p: RewardProgress, can: CanPlay): UpcomingReward[] {
  const out: UpcomingReward[] = [];
  const friend = FRIEND_UNLOCKS.filter((f) => f.course > p.cleared && can(`char:${f.char}`) && canPlayCourse(f.course, can)).sort((a, b) => a.course - b.course)[0];
  if (friend) out.push({ kind: 'friend', char: friend.char, at: friend.course, remaining: friend.course - p.cleared });
  const stickers = visibleStickers(can).filter((s) => !hasSticker(s, p.cleared, p.totalFinds, p.sceneFinds));
  const cs = stickers.filter((s) => s.kind === 'course' && canPlayCourse(s.need, can)).sort((a, b) => a.need - b.need)[0];
  if (cs) out.push({ kind: 'courseSticker', sticker: cs, at: cs.need, remaining: cs.need - p.cleared });
  const fs = stickers.filter((s) => s.kind === 'finds').sort((a, b) => a.need - b.need)[0];
  if (fs) out.push({ kind: 'findsSticker', sticker: fs, at: fs.need, remaining: fs.need - p.totalFinds, done: p.totalFinds });
  const room = ROOMS.filter((r) => r.needCleared > p.cleared && can(r.content) && canPlayCourse(r.needCleared, can)).sort((a, b) => a.needCleared - b.needCleared)[0];
  if (room) out.push({ kind: 'room', room, at: room.needCleared, remaining: room.needCleared - p.cleared });
  return out;
}

/** コース no をクリアすると なかまに なる友だち（コースのタイルに顔を出す） */
export function friendAtCourse(no: number, can: CanPlay): CharacterId | null {
  const f = FRIEND_UNLOCKS.find((x) => x.course === no && can(`char:${x.char}`));
  return f ? f.char : null;
}
