// 追加パックの購入（Apple の アプリ内課金・買い切り）。
// iPhone アプリ版だけで動く。購入の確認は端末の StoreKit 2 の結果だけを使い、外部のサーバーには何も送らない。
// 保存データ（localStorage）の値を購入の証明にはしない（毎回 StoreKit に聞く。StoreKit は通信なしでも購入済みを返せる）。
import type { PackId } from '../entitlements/entitlements';
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

const P = 'com.akihikoito.moyoukakurenbo.';
export const PRODUCTS: ProductDef[] = [
  { id: `${P}morecourses`, packs: ['more-courses'], name: 'つづきの コース', summary: 'コース6〜10・最難関モード・友だち「おう」・へや「しんしつ」・おもちゃと家具7つ・シール5枚' },
  { id: `${P}beach`, packs: ['beach'], name: 'うみべ パック', summary: '背景「うみべ」・友だち「ちょき」・へや「うみべの デッキ」・おもちゃと家具6つ・シール5枚' },
  { id: `${P}forest`, packs: ['forest'], name: 'きのこの もり パック', summary: '背景「きのこの もり」・友だち「ぴの」・へや「もりの ひろば」・おもちゃと家具8つ・シール5枚' },
  { id: `${P}aquarium`, packs: ['aquarium'], name: 'すいぞくかん パック', summary: '背景「すいぞくかん」・友だち「ぷか」・へや「すいぞくかんの へや」・おもちゃと家具6つ・シール5枚' },
  { id: `${P}night`, packs: ['night'], name: 'ほたるの かわべ パック', summary: '背景「ほたるの かわべ」・友だち「ひか」・へや「ほたるの えんがわ」・おもちゃと家具6つ・シール5枚' },
  { id: `${P}dino`, packs: ['dino'], name: 'きょうりゅうの たに パック', summary: '背景「きょうりゅうの たに」・動く恐竜5体・友だち「がお」・へや「きょうりゅうの ひろば」・おもちゃと家具8つ・シール5枚' },
  { id: `${P}allpacks`, packs: ['more-courses', 'beach', 'forest', 'aquarium', 'night', 'dino'], name: 'ぜんぶ いり', summary: '上の6つ すべて（まとめて お得）' },
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
  if (!NATIVE) return null;
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
