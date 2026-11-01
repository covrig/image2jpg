/* Quick Share service worker — offline app shell */
const VERSION = 'IMAGE2JPG-v1.6';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// Libraries hosted in this project (vendor/ folder). Cached at install so HEIC decoding,
// ZIP building and Auto crop's jscanify part work offline straight away.
const VENDOR = [
  './vendor/libheif-bundle.js',
  './vendor/jszip.min.js',
  './vendor/jscanify.js'
];

// OpenCV.js is ~10 MB and only needed for Auto crop, so it is NOT fetched at install.
// It is stored the first time Auto crop runs, in a cache that survives VERSION changes
// so the big download is not repeated after every app update.
const LAZY_CACHE = 'IMAGE2JPG-lazy-v1';
const LAZY_URLS = [
  new URL('./vendor/opencv.js', self.location).href
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Cache items individually so one bad URL cannot fail the whole install.
    await Promise.allSettled(CORE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    await Promise.allSettled(VENDOR.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== LAZY_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigations: try the network first so updates land, fall back to the cached shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) (await caches.open(VERSION)).put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true }))
            || (await caches.match('./image_converter_share.html'))
            || (await caches.match('./'))
            || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first, then network (and store what comes back).
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === 'opaque')) {
        const cache = await caches.open(LAZY_URLS.includes(req.url) ? LAZY_CACHE : VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
