/* ==========================================================================
   ごうのすけのゲーム  —  サービスワーカー

   やくわり
     ・ゲームの ファイルを ばしょに とっておく → ネットが なくても あそべる
     ・あたらしい ばんが でたら がめんに おしらせを だす

   ★ あたらしい ばんを こうかいする ときは、したの APP_VERSION と
     js/main.js の GAME_VERSION の 2つを おなじ すうじに あげてください。
     （この ファイルの なかみが かわらないと ブラウザが こうしんに きづきません）
   ========================================================================== */

const APP_VERSION = '5.3';
const CACHE_NAME  = 'gounosuke-' + APP_VERSION;

/* ネットが なくても あそべるように とっておく ファイル */
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/data.js',
  './js/bg-photo.js',
  './js/draw.js',
  './js/game.js',
  './js/main.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

/* --- インストール：ファイルを とっておく --- */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => { /* 1つでも とれなくても インストールは つづける */ })
  );
});

/* --- ゆうこうか：ふるい キャッシュを すてる --- */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('gounosuke-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* --- よみこみ：まず ネット、だめなら とっておいた ぶん ---
   ネットを さきに みるので、リロードすれば いつでも さいしんばんに なります */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});

/* --- がめんの「こうしんする」ボタンから よばれる --- */
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
