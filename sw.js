/// <reference lib="webworker" />

/**
 * SNOW IR: Service Worker for Tile & Asset Caching
 * -------------------------------------------------
 * Intercepts network requests for map tiles, 3D textures, and API data.
 * Implements a "stale-while-revalidate" strategy to ensure 60fps.
 */

const CACHE_NAME = 'snow-ir-v2';
const TILE_CACHE = 'snow-ir-tiles';
const API_CACHE = 'snow-ir-api';

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const TILE_ORIGINS = [
  'basemaps.cartocdn.com',
  'tile.openstreetmap.org',
  'server.arcgisonline.com',
];

declare const self: ServiceWorkerGlobalScope;

// Install: Pre-cache static shell
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== TILE_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Route to the right caching strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Map tiles: Cache-first (tiles rarely change)
  if (TILE_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(cacheFirst(event.request, TILE_CACHE));
    return;
  }

  // API calls: Network-first with fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Everything else: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(cacheName).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}

export {};
