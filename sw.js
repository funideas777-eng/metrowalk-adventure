const CACHE_NAME = 'metrowalk-v1';
const STATIC_ASSETS = [
  '/metrowalk-adventure/index.html','/metrowalk-adventure/map.html','/metrowalk-adventure/game.html',
  '/metrowalk-adventure/photo-task.html','/metrowalk-adventure/scoreboard.html','/metrowalk-adventure/admin.html',
  '/metrowalk-adventure/css/common.css','/metrowalk-adventure/manifest.json',
  '/metrowalk-adventure/js/config.js','/metrowalk-adventure/js/auth.js','/metrowalk-adventure/js/api.js',
  '/metrowalk-adventure/js/audio.js','/metrowalk-adventure/js/gps.js','/metrowalk-adventure/js/broadcast.js',
  '/metrowalk-adventure/js/chat.js','/metrowalk-adventure/js/scoreboard-engine.js',
  '/metrowalk-adventure/js/games/pacman.js','/metrowalk-adventure/js/games/snake.js',
  '/metrowalk-adventure/js/games/whack.js','/metrowalk-adventure/js/games/memory.js',
  '/metrowalk-adventure/js/games/quiz.js','/metrowalk-adventure/js/games/catch.js',
  '/metrowalk-adventure/js/games/breaker.js','/metrowalk-adventure/js/games/shooter.js',
  '/metrowalk-adventure/js/games/dodge.js','/metrowalk-adventure/js/games/reaction.js',
  '/metrowalk-adventure/js/games/rhythm.js','/metrowalk-adventure/js/games/puzzle.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (new URL(e.request.url).hostname === 'script.google.com') { e.respondWith(fetch(e.request)); return; }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(r => { if (r.ok && e.request.method === 'GET') { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); } return r; })));
});
