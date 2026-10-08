// どの形で動いているか。iPhone アプリ版は `vite build --mode native`（native/build-www.mjs）で作る。
/** iPhone アプリ版のときだけ true */
export const NATIVE = import.meta.env.MODE === 'native';
