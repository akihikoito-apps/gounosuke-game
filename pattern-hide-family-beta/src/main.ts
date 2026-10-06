import './ui/styles.css';
import { App } from './ui/app';
import { Store } from './storage/storage';

const store = Store.fromWindow();
store.load();
const root = document.getElementById('app') as HTMLElement;
const app = new App(root, store);
app.start();

// 自動テスト用の読み取り窓口。開発時と e2e 用ビルド（--mode e2e）だけに入る。
// 通常のビルドには含めない（受け渡し中に隠れ場所を読めてしまうため）。
if (import.meta.env.DEV || import.meta.env.MODE === 'e2e') {
  (window as unknown as { __game: unknown }).__game = { state: () => app.debugState(), storeStatus: () => store.status };
}

// オフライン用 Service Worker：本番ビルドかつ安全なコンテキスト（HTTPS/localhost）のときだけ
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
