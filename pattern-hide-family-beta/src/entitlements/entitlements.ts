// 将来の「買い切りの追加背景・衣装」との境界。
// このベータでは課金を実装しない。ここにある値は購入の証明ではない。
// 本番で購入を扱う場合は、StoreKit / Google Play Billing など正規の決済経路の
// 検証結果だけを根拠にし、端末内のフラグ（localStorage等）を購入証明にしてはいけない。
import type { SceneId } from '../core/scene';

export type ContentId = `scene:${SceneId}` | `costume-pack:${string}`;

export interface EntitlementSource {
  /** 'beta-all-unlocked' はベータの全開放であり、購入状態ではない */
  readonly kind: 'beta-all-unlocked';
  canPlay(id: ContentId): boolean;
}

export const betaEntitlements: EntitlementSource = {
  kind: 'beta-all-unlocked',
  canPlay: () => true,
};
