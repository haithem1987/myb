const CACHE_NAME = 'myb-app-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('myb-app-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Authentication and application data must always go to the network.
  if (url.origin !== self.location.origin || request.headers.has('Authorization') ||
      /^\/(auth|api)(\/|$)/i.test(url.pathname) || /graphql/i.test(url.pathname)) return;

  // Translation files change independently from hashed JS bundles. Always let
  // the browser revalidate them so a stale dictionary cannot expose raw keys.
  if (/\/assets\/i18n\/[^/]+\.json$/i.test(url.pathname)) return;

  // Let the browser handle byte-range and media requests directly. Cache
  // Storage cannot store 206 Partial Content responses, and intercepting video
  // ranges also delays higher-priority route bundles on slow connections.
  const mediaRequest = request.destination === 'audio' ||
    request.destination === 'video' ||
    /\.(mp3|m4a|ogg|wav|mp4|webm)$/i.test(url.pathname);
  if (request.headers.has('range') || mediaRequest) return;

  // Hashed scripts and styles already have a one-year immutable HTTP cache.
  // Keeping them out of the service worker avoids delaying lazy route loading.
  if (request.destination === 'script' || request.destination === 'style') return;

  // Cache only public, static assets. Never cache login pages or route HTML.
  const publicAsset = /^\/(admin\/)?assets\//.test(url.pathname) ||
    /^\/(admin\/)?[^/]+\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname) ||
    url.pathname === '/manifest.webmanifest';
  if (!publicAsset || request.mode === 'navigate') return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.status === 200 && !response.redirected) {
        const copy = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, copy))
          .catch(error => console.warn('MYB asset cache write failed', error));
      }
      return response;
    }))
  );
});
