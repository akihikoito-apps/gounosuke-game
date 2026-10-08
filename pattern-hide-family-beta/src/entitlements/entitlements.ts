// 将来の「追加パック（買い切り）」との境界。方針：strategy/MONETIZATION.md
// このベータでは課金を実装しない。ここにある値は購入の証明ではない。
// 本番で購入を扱う場合は、StoreKit / Google Play Billing など正規の決済経路の
// 検証結果だけを根拠にし、端末内のフラグ（localStorage等）を購入証明にしてはいけない。
import type { CharacterId } from '../core/characters';
import type { SceneId } from '../core/scene';

export type ContentId = `scene:${SceneId}` | `course:${number}` | `char:${CharacterId}` | 'trial:hardest' | `costume-pack:${string}`;

export type PackId = 'base' | 'more-courses';

export interface PackDef {
  id: PackId;
  /** 保護者の画面などで使う名前 */
  name: string;
  /** 無料（最初から遊べる） */
  free: boolean;
  contents: ContentId[];
}

const courses = (from: number, to: number): ContentId[] => Array.from({ length: to - from + 1 }, (_, i) => `course:${from + i}` as ContentId);

/**
 * パックの一覧。どの中身も、ちょうど1つのパックに入る。
 * 基本（無料）には「最初のごほうび（コース1で仲間になる にゃこ）」まで必ず入れる。
 * 追加パックは、新しい背景＋新しい友だち＋シール、の形で足していく。
 */
export const PACKS: PackDef[] = [
  {
    id: 'base',
    name: 'きほん',
    free: true,
    contents: ['scene:room', 'scene:garden', 'scene:shop', ...courses(1, 5), 'char:koro', 'char:mimi', 'char:moko', 'char:nyako'],
  },
  {
    id: 'more-courses',
    name: 'つづきの コース',
    free: false,
    contents: [...courses(6, 10), 'trial:hardest', 'char:popo'],
  },
];

export function packOf(id: ContentId): PackDef | undefined {
  return PACKS.find((p) => p.contents.includes(id));
}

export interface EntitlementSource {
  /** 'beta-all-unlocked' はベータの全開放であり、購入状態ではない */
  readonly kind: 'beta-all-unlocked';
  canPlay(id: ContentId): boolean;
}

export const betaEntitlements: EntitlementSource = {
  kind: 'beta-all-unlocked',
  canPlay: () => true,
};
