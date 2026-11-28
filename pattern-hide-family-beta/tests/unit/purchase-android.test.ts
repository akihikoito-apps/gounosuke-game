import { describe, expect, it } from 'vitest';
import { packsFromProducts, paidPurchases } from '../../src/purchase/store';

describe('Android の購入状態', () => {
  const P = 'com.akihikoito.moyoukakurenbo.';
  it('支払い待ち（purchaseState "0"）は、まだ使えない', () => {
    const paid = paidPurchases([
      { productIdentifier: `${P}beach`, purchaseState: '0' },
      { productIdentifier: `${P}forest`, purchaseState: '1' },
    ]);
    expect(packsFromProducts(paid.map((x) => x.productIdentifier))).toEqual(['forest']);
  });
  it('iOS の購入（purchaseState が無い）は、そのまま使える', () => {
    expect(paidPurchases([{ productIdentifier: `${P}dino` }])).toHaveLength(1);
  });
});
