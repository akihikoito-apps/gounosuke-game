// どの形で動いているか。アプリ版（iPhone・iPad／Android）は `vite build --mode native`（native/build-www.mjs）で作る。
/** アプリ版のときだけ true（iPhone・iPad と Android で同じ www を使う） */
export const NATIVE = import.meta.env.MODE === 'native';

/** アプリ版の売り場。Android は Google Play、それ以外のアプリ版は App Store。ウェブ版は null */
export type StoreKind = 'apple' | 'google';
export function storeKind(): StoreKind | null {
  if (!NATIVE) return null;
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() === 'android' ? 'google' : 'apple';
}

/** 保護者の画面で売り場ごとに変える言葉 */
export const STORE_WORDS: Record<StoreKind, { store: string; company: string; account: string; pending: string }> = {
  apple: {
    store: 'App Store',
    company: 'Apple',
    account: 'Apple ID',
    pending: '保護者の 承認待ちです（ファミリー共有の「承認と購入のリクエスト」）。承認されると 使えるように なります。',
  },
  google: {
    store: 'Google Play',
    company: 'Google',
    account: 'Google アカウント',
    pending: '保護者の 承認待ち、または お支払いの 完了待ちです（ファミリー リンクの承認・コンビニ払いなど）。済むと 使えるように なります。',
  },
};
/** アプリ版の売り場の言葉。ウェブ版では App Store のものを返す（ウェブ版では購入の画面を出さない） */
export function storeWords() {
  return STORE_WORDS[storeKind() ?? 'apple'];
}
