// 追加パックの購入（Apple の アプリ内課金・買い切り）。
// iPhone アプリ版だけで動く。購入の確認は端末の StoreKit 2 の結果だけを使い、外部のサーバーには何も送らない。
// 保存データ（localStorage）の値を購入の証明にはしない（毎回 StoreKit に聞く。StoreKit は通信なしでも購入済みを返せる）。
import { stickerRequires } from '../core/access';
import { CHARACTERS, type CharacterId } from '../core/characters';
import { MOVERS } from '../core/movers';
import { ITEMS, ROOMS, type RoomId } from '../core/myroom';
import type { SceneId } from '../core/scene';
import { SCENES } from '../core/scenes';
import { STICKERS } from '../core/stickers';
import { PACKS, type PackId } from '../entitlements/entitlements';
import { NATIVE } from '../ui/platform';

export interface ProductDef {
  /** App Store Connect に登録する 製品ID */
  id: string;
  packs: PackId[];
  /** 保護者の画面での名前 */
  name: string;
  /** 中身の説明（保護者向け） */
  summary: string;
}

/** コードの定義（パック・背景・友だち・へや・家具・シール・うごくもの）から説明文を作る */
function packSummary(packId: PackId): string {
  const pack = PACKS.find((p) => p.id === packId)!;
  const parts: string[] = [];
  const courses = pack.contents
    .filter((c) => c.startsWith('course:'))
    .map((c) => Number(c.slice(7)))
    .sort((a, b) => a - b);
  if (courses.length) parts.push(`コース${courses[0]}〜${courses[courses.length - 1]}`);
  if (pack.contents.includes('trial:hardest')) parts.push('最難関モード');
  const sceneId = pack.contents.find((c): c is `scene:${SceneId}` => c.startsWith('scene:'))?.slice(6) as SceneId | undefined;
  if (sceneId) {
    parts.push(`背景「${SCENES[sceneId].name}」`);
    if (sceneId === 'dino') parts.push(`動く恐竜${MOVERS.dino.length}体`);
  }
  const charId = pack.contents.find((c): c is `char:${CharacterId}` => c.startsWith('char:'))?.slice(5) as CharacterId | undefined;
  if (charId) parts.push(`友だち「${CHARACTERS[charId].name}」`);
  const roomId = pack.contents.find((c) => c.startsWith('room:'))?.slice(5) as RoomId | undefined;
  const room = roomId ? ROOMS.find((r) => r.id === roomId) : undefined;
  if (room) parts.push(`へや「${room.name}」`);
  const stickers = STICKERS.filter((s) => stickerRequires(s).some((req) => pack.contents.includes(req)));
  const stickerIds = new Set(stickers.map((s) => s.id));
  const items = ITEMS.filter(
    (it) => !it.legacy && ((it.content && pack.contents.includes(it.content)) || (it.sticker !== null && stickerIds.has(it.sticker))),
  );
  if (items.length) parts.push(`おもちゃと家具${items.length}つ`);
  if (stickers.length) parts.push(`シール${stickers.length}枚`);
  return parts.join('・');
}

const PAID_PACK_IDS: PackId[] = ['more-courses', 'beach', 'forest', 'aquarium', 'night', 'dino'];

const P = 'com.akihikoito.moyoukakurenbo.';
export const PRODUCTS: ProductDef[] = [
  { id: `${P}morecourses`, packs: ['more-courses'], name: 'つづきの コース', summary: packSummary('more-courses') },
  { id: `${P}beach`, packs: ['beach'], name: 'うみべ パック', summary: packSummary('beach') },
  { id: `${P}forest`, packs: ['forest'], name: 'きのこの もり パック', summary: packSummary('forest') },
  { id: `${P}aquarium`, packs: ['aquarium'], name: 'すいぞくかん パック', summary: packSummary('aquarium') },
  { id: `${P}night`, packs: ['night'], name: 'ほたるの かわべ パック', summary: packSummary('night') },
  { id: `${P}dino`, packs: ['dino'], name: 'きょうりゅうの たに パック', summary: packSummary('dino') },
  { id: `${P}allpacks`, packs: PAID_PACK_IDS, name: 'ぜんぶ いり', summary: `上の${PAID_PACK_IDS.length}つ すべて（まとめて お得）` },
];

/** 購入記録（製品IDの一覧）→ 持っているパック。セットは中身のパックすべて。どれかを返金しても ほかの購入は消さない */
export function packsFromProducts(productIds: readonly string[]): PackId[] {
  const set = new Set<PackId>();
  for (const id of productIds) for (const p of PRODUCTS.find((x) => x.id === id)?.packs ?? []) set.add(p);
  return [...set];
}

export type BuyResult = 'ok' | 'cancelled' | 'pending' | 'error' | 'unavailable';

interface Plugin {
  getPurchases(o: { productType: string }): Promise<{ purchases: { productIdentifier: string }[] }>;
  getProducts(o: { productIdentifiers: string[]; productType: string }): Promise<{ products: { identifier: string; priceString: string }[] }>;
  purchaseProduct(o: { productIdentifier: string; productType: string }): Promise<{ productIdentifier?: string }>;
  restorePurchases(): Promise<void>;
}

function plugin(): Plugin | null {
  if (!NATIVE && import.meta.env.MODE !== 'e2e') return null;
  const p = (window as unknown as { Capacitor?: { Plugins?: { NativePurchases?: Plugin } } }).Capacitor?.Plugins?.NativePurchases;
  return p ?? null;
}

export class PurchaseStore {
  /** 持っているパック（StoreKit の答え）。まだ聞いていない／聞けなかったときは null */
  private ownedPacks: PackId[] | null = null;
  private prices = new Map<string, string>();

  constructor(private onChange: () => void) {}

  available(): boolean {
    return !!plugin();
  }

  owned(): PackId[] {
    return this.ownedPacks ?? [];
  }

  /** 状態が分からない（まだ確認中・失敗）ときに「買っていない」と決めつけないため */
  known(): boolean {
    return this.ownedPacks !== null;
  }

  price(productId: string): string | undefined {
    return this.prices.get(productId);
  }

  /** 起動時・復元後・購入後に呼ぶ。失敗しても前の答えは消さない */
  async refresh(): Promise<void> {
    const p = plugin();
    if (!p) return;
    try {
      const { purchases } = await p.getPurchases({ productType: 'inapp' });
      const next = packsFromProducts(purchases.map((x) => x.productIdentifier));
      const changed = JSON.stringify(next) !== JSON.stringify(this.ownedPacks);
      this.ownedPacks = next;
      if (changed) this.onChange();
    } catch {
      /* 通信やストアの不調。前の答えのまま */
    }
  }

  async loadPrices(): Promise<void> {
    const p = plugin();
    if (!p) return;
    try {
      const { products } = await p.getProducts({ productIdentifiers: PRODUCTS.map((x) => x.id), productType: 'inapp' });
      for (const x of products) this.prices.set(x.identifier, x.priceString);
    } catch {
      /* 価格が取れないときは、購入ボタンを押せないようにする */
    }
  }

  async buy(productId: string): Promise<BuyResult> {
    const p = plugin();
    if (!p || !PRODUCTS.some((x) => x.id === productId)) return 'unavailable';
    try {
      await p.purchaseProduct({ productIdentifier: productId, productType: 'inapp' });
      await this.refresh();
      const want = PRODUCTS.find((x) => x.id === productId)!.packs;
      return want.every((pk) => this.owned().includes(pk)) ? 'ok' : 'pending';
    } catch (e) {
      const msg = String((e as { message?: string; code?: string })?.message ?? e).toLowerCase();
      if (msg.includes('cancel')) return 'cancelled';
      // 「承認と購入のリクエスト」（ファミリー共有）で保護者の承認待ち
      if (msg.includes('pending') || msg.includes('deferred')) return 'pending';
      return 'error';
    }
  }

  async restore(): Promise<boolean> {
    const p = plugin();
    if (!p) return false;
    try {
      await p.restorePurchases();
      await this.refresh();
      return true;
    } catch {
      return false;
    }
  }
}
