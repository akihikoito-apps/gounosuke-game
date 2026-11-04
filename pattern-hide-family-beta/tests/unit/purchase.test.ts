import { describe, expect, it } from 'vitest';
import { PRODUCTS, packsFromProducts } from '../../src/purchase/store';
import { PACKS } from '../../src/entitlements/entitlements';
import { packDetails } from '../../src/ui/packPreview';
import { ITEMS } from '../../src/core/myroom';
import { STICKERS } from '../../src/core/stickers';
import { stickerRequires } from '../../src/core/access';

describe('追加パックの購入（StoreKit の製品ID → パック）', () => {
  it('有料パックは どれも 単品で買える。ぜんぶ いり は 有料パック すべて', () => {
    const paid = PACKS.filter((p) => !p.free).map((p) => p.id).sort();
    const singles = PRODUCTS.filter((p) => p.packs.length === 1).flatMap((p) => p.packs).sort();
    expect(singles).toEqual(paid);
    expect(PRODUCTS.find((p) => p.id.endsWith('allpacks'))!.packs.slice().sort()).toEqual(paid);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    for (const p of PRODUCTS) expect(p.id.startsWith('com.akihikoito.moyoukakurenbo.')).toBe(true);
  });

  it('買った製品から、持っているパックを出す（知らない製品IDは無視、重なりは1つに）', () => {
    expect(packsFromProducts([])).toEqual([]);
    expect(packsFromProducts(['com.akihikoito.moyoukakurenbo.forest'])).toEqual(['forest']);
    expect(packsFromProducts(['com.akihikoito.moyoukakurenbo.forest', 'com.akihikoito.moyoukakurenbo.allpacks']).sort()).toEqual(PACKS.filter((p) => !p.free).map((p) => p.id).sort());
    expect(packsFromProducts(['com.example.other'])).toEqual([]);
  });

  it('packDetails の家具・おもちゃ・シール数は コード定義と一致する', () => {
    for (const pk of PACKS.filter((p) => !p.free)) {
      const d = packDetails(pk.id);
      const expectedStickers = STICKERS.filter((s) => stickerRequires(s).some((req) => pk.contents.includes(req)));
      const stickerIds = new Set(expectedStickers.map((s) => s.id));
      const expectedItems = ITEMS.filter(
        (it) => !it.legacy && ((it.content && pk.contents.includes(it.content)) || (it.sticker !== null && stickerIds.has(it.sticker))),
      );
      expect(d.stickers.map((s) => s.id)).toEqual(expectedStickers.map((s) => s.id));
      expect(d.items.map((i) => i.id)).toEqual(expectedItems.map((i) => i.id));
    }
  });
});
