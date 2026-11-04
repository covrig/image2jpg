/* IMAGE2JPG service worker: offline app shell */
const VERSION = 'IMAGE2JPG-v1.8.8';
// Photos shared into the app wait here until the page picks them up (see loadSharedFiles).
const SHARE_CACHE = 'IMAGE2JPG-share';
const SHARE_MAX_FILES = 200;

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
    await Promise.all(keys.filter((k) => k !== VERSION && k !== SHARE_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Share target (see manifest "share_target"): keep the shared images, then open the app.
  // Only image files are kept, at most SHARE_MAX_FILES; nothing else in the request is used.
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const form = await req.formData();
        const files = form.getAll('images')
          .filter((f) => f && typeof f === 'object' && typeof f.size === 'number' && f.size > 0)
          .filter((f) => !f.type || f.type.startsWith('image/') || /\.(heic|heif|hif)$/i.test(f.name || ''))
          .slice(0, SHARE_MAX_FILES);
        await caches.delete(SHARE_CACHE);
        const cache = await caches.open(SHARE_CACHE);
        await Promise.all(files.map((f, i) => cache.put(
          new Request(`./shared/${i}`),
          new Response(f, { headers: {
            'Content-Type': f.type || 'application/octet-stream',
            'X-File-Name': encodeURIComponent(f.name || `shared_${i + 1}`),
            'X-Last-Modified': String(f.lastModified || Date.now())
          } })
        )));
      } catch (e) {
        console.warn('SW: could not keep the shared files', e);
      }
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }

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
