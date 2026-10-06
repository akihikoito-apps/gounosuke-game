// 自動生成（vite.config.ts の serviceWorkerPlugin）。同一オリジンの静的資産だけをキャッシュする。
const VERSION = '__VERSION__';
const CACHE = 'moyou-kakurenbo-' + VERSION;
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
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('moyou-kakurenbo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部へは関与しない（そもそも外部通信はしない）
  if (req.mode === 'navigate') {
    // ページ：まずネット、だめならキャッシュ（オフライン起動用）
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic' && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./', copy));
          }
          return res;
        })
        .catch(() => caches.match('./', { ignoreSearch: true }).then((r) => r || caches.match(req))),
    );
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
