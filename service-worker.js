/* MBG Storefront v2 — Service Worker
 * Cache-first for CSS/JS/fonts/manifest.
 * Stale-while-revalidate for images.
 * Network-first for HTML and Supabase/edge calls.
 */

const VERSION    = 'mbg-v2-2026-05-10-3d-upgrade';
const CORE_CACHE = `mbg-core-${VERSION}`;
const IMG_CACHE  = `mbg-images-${VERSION}`;
const DATA_CACHE = `mbg-data-${VERSION}`;

const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/layout.css',
  './css/components.css',
  './js/core/config.js',
  './js/core/supabase.js',
  './js/core/utils.js',
  './js/core/auth.js',
  './js/modules/banners.js',
  './js/modules/products.js',
  './js/modules/cart.js',
  './js/modules/checkout.js',
  './js/modules/tracking.js',
  './js/modules/restock.js',
  './js/modules/tiers.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE_CACHE)
      .then(c => c.addAll(CORE_FILES.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[sw] install precache failed', err))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('mbg-') && ![CORE_CACHE, IMG_CACHE, DATA_CACHE].includes(k))
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return; // never cache POSTs etc.

  // Supabase / edge functions — network only (don't cache live data)
  if (url.hostname.endsWith('supabase.co')) {
    return;
  }

  // Google Fonts — cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(cacheFirst(CORE_CACHE, req));
    return;
  }

  // Image — stale-while-revalidate
  if (req.destination === 'image' || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(IMG_CACHE, req));
    return;
  }

  // HTML — network-first, fallback to cached index for offline shell
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(networkFirstHTML(req));
    return;
  }

  // CSS/JS/fonts/manifest — cache-first
  e.respondWith(cacheFirst(CORE_CACHE, req));
});

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200 && res.type !== 'opaque') {
      cache.put(req, res.clone());
    }
    return res;
  } catch(e) {
    return new Response('', { status: 504 });
  }
}

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetcher = fetch(req).then(res => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || fetcher || new Response('', { status: 504 });
}

async function networkFirstHTML(req) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const cache = await caches.open(CORE_CACHE);
      cache.put('./index.html', res.clone());
    }
    return res;
  } catch(_) {
    const cache = await caches.open(CORE_CACHE);
    return (await cache.match('./index.html')) || new Response('Offline', { status: 504 });
  }
}

// Allow page to push offline product data into cache
self.addEventListener('message', async (e) => {
  if (e.data?.type === 'cache-products' && e.data.payload) {
    try {
      const cache = await caches.open(DATA_CACHE);
      await cache.put('mbg-products-cache', new Response(JSON.stringify(e.data.payload), {
        headers: { 'Content-Type': 'application/json' }
      }));
    } catch(_) {}
  }
});
