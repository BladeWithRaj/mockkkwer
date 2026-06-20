// ============================================
// SERVICE WORKER — MockTestPro PWA
// Cache-first for static, network-first for API
// ============================================

const CACHE_NAME = 'mtp-v23';
const STATIC_CACHE = 'mtp-static-v20';
const API_CACHE = 'mtp-api-v20';

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/pages.css',
  '/css/gamification.css',
  '/css/battle.css',
  '/css/username-modal.css',
  '/css/in-exam.css',
  '/css/cbt.css',
  '/js/config.js',
  '/js/supabaseClient.js',
  '/js/auth.js',
  '/js/utils/helpers.js',
  '/js/utils/storage.js',
  '/js/engine/testEngine.js',
  '/js/engine/examPresets.js',
  '/js/engine/daily.js',
  '/js/engine/gamification.js',
  '/js/engine/rivals.js',
  '/js/engine/rivalEngine.js',
  '/js/utils/tracker.js',
  '/js/engine/analytics.js',
  '/js/lang.js',
  '/js/pages/home.js',
  '/js/pages/boardPage.js',
  '/css/homepage-v5.css',
  '/css/cbtEngine.css',
  '/js/pages/setup.js',
  '/js/engine/examProctor.js',
  '/js/renderers/RendererBase.js',
  '/js/renderers/RendererRouter.js',
  '/js/renderers/SSCRenderer.js',
  '/js/renderers/RailwayRenderer.js',
  '/js/renderers/BankingRenderer.js',
  '/js/renderers/UPSCRenderer.js',
  '/js/renderers/RivalBattleRenderer.js',
  '/js/engine/cbtRenderer.js',
  '/js/pages/test.js',
  '/css/renderers/ssc.css',
  '/css/renderers/railway.css',
  '/css/renderers/banking.css',
  '/css/renderers/upsc.css',
  '/css/qlang.css',
  '/css/mobile.css',
  '/js/engine/progressEngine.js',
  '/js/pages/result.js',
  '/js/pages/analysis.js',
  '/js/pages/dashboard.js',
  '/js/pages/leaderboard.js',
  '/js/pages/analytics.js',
  '/js/pages/profile.js',
  '/js/pages/battleMode.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALL: Precache static assets ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Precache failed (non-critical):', err);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: Clean old caches ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: Smart caching strategy ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase realtime and external CDNs from caching
  if (url.hostname.includes('supabase') ||
    url.hostname.includes('cdn.jsdelivr.net')) {
    return; // Let browser handle these normally
  }

  // API calls: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Static assets: Cache-first, fallback to network
  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

// ── STRATEGIES ──

async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline fallback
    const cached = await caches.match(request);
    if (cached) return cached;

    // If it's a navigation request, serve index.html
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
