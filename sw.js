const CACHE_NAME = 'metrowalk-v15';
const STATIC_ASSETS = [
  '/metrowalk-adventure/index.html',
  '/metrowalk-adventure/map.html',
  '/metrowalk-adventure/game.html',
  '/metrowalk-adventure/photo-task.html',
  '/metrowalk-adventure/scoreboard.html',
  '/metrowalk-adventure/admin.html',
  '/metrowalk-adventure/info.html',
  '/metrowalk-adventure/css/common.css',
  '/metrowalk-adventure/manifest.json',
  '/metrowalk-adventure/js/config.js',
  '/metrowalk-adventure/js/auth.js',
  '/metrowalk-adventure/js/api.js',
  '/metrowalk-adventure/js/audio.js',
  '/metrowalk-adventure/js/gps.js',
  '/metrowalk-adventure/js/broadcast.js',
  '/metrowalk-adventure/js/chat.js',
  '/metrowalk-adventure/js/scoreboard-engine.js',
  '/metrowalk-adventure/js/dialogue.js',
  '/metrowalk-adventure/js/dialogue-scripts.js',
  '/metrowalk-adventure/js/sw-manager.js',
  '/metrowalk-adventure/js/presence.js',
  '/metrowalk-adventure/js/gatekeeper.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      // 清除舊快取
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      // 強制接管所有分頁
      await self.clients.claim();
      // 通知所有分頁重新載入（取得新版本）
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME }));
    })()
  );
});

// 支援從前端觸發 skipWaiting
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // GAS API 直接走網路
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  // 遊戲 JS 帶 cache-busting 參數的一律走網路優先
  if (url.pathname.includes('/js/games/') || url.search.includes('v=')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML 和 CSS：網路優先，失敗才用快取
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 其他資源（圖片等）：快取優先，失敗則走網路
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
