// 自動生成（vite.config.ts の serviceWorkerPlugin）。同一オリジンの静的資産だけをキャッシュする。
const VERSION = '__VERSION__';
// 同じホストの別パスに置いた版のキャッシュを消さないよう、スコープもキャッシュ名に含める
const PREFIX = 'moyou-kakurenbo-' + self.registration.scope + '-';
const CACHE = PREFIX + VERSION;
const ASSETS = __ASSETS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部へは関与しない（そもそも外部通信はしない）
  if (req.mode === 'navigate') {
    // ページ：まずネット、だめならこの版のキャッシュ（オフライン起動用）。
    // 新しい版の HTML でこの版のキャッシュを上書きしない（HTML と JS/CSS の組がずれるため）
    event.respondWith(
      fetch(req).catch(() =>
        caches.open(CACHE).then((c) => c.match('./', { ignoreSearch: true }).then((r) => r || c.match(req, { ignoreSearch: true }))),
      ),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE)
      .then((c) => c.match(req, { ignoreSearch: true }))
      .then((r) => r || fetch(req)),
  );
});
