/**
 * Cache-first service worker. The app makes no network calls of its own, so once
 * installed it works completely offline — on a train, with no signal, at 6 a.m.
 */

const CACHE = 'preptrack-v3';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/config.js',
  './js/sync/googleAuth.js',
  './js/sync/driveClient.js',
  './js/sync/merge.js',
  './js/sync/syncEngine.js',
  './js/views/gate.js',
  './js/data/phases.js',
  './js/data/curriculum.js',
  './js/data/topics.js',
  './js/data/resources.js',
  './js/state/store.js',
  './js/state/actions.js',
  './js/state/selectors.js',
  './js/state/persist.js',
  './js/views/week.js',
  './assets/fonts/manrope-var.woff2',
  './assets/fonts/plexmono-400.woff2',
  './assets/fonts/plexmono-600.woff2',
  './js/views/today.js',
  './js/views/plan.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './js/components/blockCard.js',
  './js/components/icons.js',
  './js/utils/dom.js',
  './js/utils/ui.js',
  './js/utils/dates.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // NEVER intercept cross-origin traffic. Google Identity Services and the Drive
  // API must reach the network untouched — and critically, the offline fallback
  // below must never answer a Drive `alt=media` request with an HTML document,
  // which would explode inside JSON.parse with a nonsense error.
  if (new URL(event.request.url).origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(hit => {
      if (hit) return hit;
      return fetch(event.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(event.request, copy));
          }
          return res;
        })
        // Navigation requests get the app shell; everything else fails honestly.
        .catch(() => (event.request.mode === 'navigate'
          ? caches.match('./index.html')
          : Response.error()));
    })
  );
});
