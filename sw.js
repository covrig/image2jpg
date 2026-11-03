/* IMAGE2JPG service worker: offline app shell */
const VERSION = 'IMAGE2JPG-v1.8.3';

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

// Every library in the vendor/ folder, cached at install so HEIC decoding, ZIP building
// and Auto crop (jscanify + OpenCV.js, ~10 MB) all work offline straight away.
// The filenames must match the <script> / loader URLs in the page exactly.
const VENDOR = [
  './vendor/libheif-bundle.js',
  './vendor/jszip.min.js',
  './vendor/jscanify.min.js',
  './vendor/opencv.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const urls = [...CORE, ...VENDOR];
    // Cache items individually so one bad URL cannot fail the whole install.
    const results = await Promise.allSettled(
      urls.map((url) => cache.add(new Request(url, { cache: 'reload' })))
    );
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.warn('SW: not cached:', urls[i]);
    });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigations: network first so updates land, fall back to the cached shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          const copy = fresh.clone();
          // waitUntil keeps the worker alive until the copy is stored.
          event.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}));
        }
        return fresh;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true }))
            || (await caches.match('./index.html'))
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
        const copy = fresh.clone();
        event.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}));
      }
      return fresh;
    } catch (e) {
      return Response.error();
    }
  })());
});
