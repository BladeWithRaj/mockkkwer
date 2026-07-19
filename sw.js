// ============================================
// SERVICE WORKER — MockTestPro PWA
// Cache-first for static, network-first for API
// ============================================

const CACHE_NAME = 'mtp-v30';
const STATIC_CACHE = 'mtp-static-v27';
const API_CACHE = 'mtp-api-v27';

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
  '/css/homepage-v5.css',
  '/css/cbtEngine.css',
  '/css/renderers/ssc.css',
  '/css/renderers/railway.css',
  '/css/renderers/banking.css',
  '/css/renderers/upsc.css',
  '/css/qlang.css',
  '/css/mobile.css',
  '/css/result-page.css',
  '/css/firebase-auth.css',
  // Core JS
  '/js/config.js',
  '/js/supabaseClient.js',
  '/js/firebase-auth.js',
  '/js/auth.js',
  // Utils
  '/js/utils/helpers.js',
  '/js/utils/icons.js',
  '/js/utils/storage.js',
  '/js/utils/tracker.js',
  // Engines
  '/js/engine/testEngine.js',
  '/js/engine/examPresets.js',
  '/js/engine/daily.js',
  '/js/engine/analytics.js',
  '/js/engine/examProctor.js',
  '/js/engine/cbtEngine.js',
  '/js/engine/progressEngine.js',
  '/js/engine/search.js',
  '/js/engine/shortcuts.js',
  '/js/engine/learningProfile.js',
  '/js/engine/aiCoach.js',
  '/js/engine/flashcards.js',
  '/js/engine/eventBus.js',
  '/js/engine/missionEngine.js',
  '/js/engine/featureFlags.js',
  '/js/engine/recommendationEngine.js',
  '/js/engine/learningIntelligence.js',
  '/js/engine/behaviourEngine.js',
  '/js/engine/mistakeDNA.js',
  '/js/engine/correctionEngine.js',
  '/js/engine/predictiveEngine.js',
  '/js/engine/digitalTwin.js',
  '/js/engine/learningOrchestrator.js',
  '/js/engine/adaptiveAssessmentEngine.js',
  '/js/engine/gamification.js',
  '/js/engine/rivals.js',
  '/js/engine/rivalEngine.js',
  '/js/engine/cbtRenderer.js',
  '/js/engine/experimentEngine.js',
  // Services
  '/js/services/syncService.js',
  '/js/services/aiGateway.js',
  // Lang
  '/js/lang.js',
  // Renderers
  '/js/renderers/RendererBase.js',
  '/js/renderers/RendererRouter.js',
  '/js/renderers/SSCRenderer.js',
  '/js/renderers/RailwayRenderer.js',
  '/js/renderers/BankingRenderer.js',
  '/js/renderers/UPSCRenderer.js',
  '/js/renderers/RivalBattleRenderer.js',
  // Pages
  '/js/pages/home.js',
  '/js/pages/boardPage.js',
  '/js/pages/setup.js',
  '/js/pages/test.js',
  '/js/pages/result.js',
  '/js/pages/analysis.js',
  '/js/pages/dashboard.js',
  '/js/pages/leaderboard.js',
  '/js/pages/analytics.js',
  '/js/pages/profile.js',
  '/js/pages/examDetail.js',
  '/js/pages/polytechnic.js',
  '/js/pages/aptitude.js',
  '/js/pages/aiCoachPage.js',
  '/js/pages/pricingPage.js',
  '/js/pages/showcasePage.js',
  '/js/pages/battleMode.js',
  // Components
  '/js/components/breadcrumb.js',
  '/js/components/commandPalette.js',
  // App (last)
  '/js/app.js',
  // Icons
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

  // Skip Supabase realtime, external CDNs, and Firebase CDN from caching
  if (url.hostname.includes('supabase') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com')) {
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
