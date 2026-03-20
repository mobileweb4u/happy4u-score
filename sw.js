// ==========================================
// --- SERVICE WORKER MASTER VERSION v3.5.0 ---
// ==========================================
const CACHE_NAME = 'happy4u-v3.5.0'; // BUMPED VERSION TO FORCE UPDATE

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './Drill/drill1.png',
  './Drill/drill2.png',
  './Drill/drill3.png',
  './Drill/drill4.png',
  './Drill/drill5.png',
  './Drill/drill6.png',
  './Drill/drill7.png',
  './Drill/drill8.png',
  './Drill/drill9.png'
];

// 1. INSTALL: Pre-cache all files and force immediate takeover
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("🛠️ PWA: Pre-caching v3.5.0 Assets");
      return cache.addAll(ASSETS).catch(err => {
        console.error("❌ PWA: Asset caching failed", err);
      });
    })
  );
});

// 2. ACTIVATE: Deletes old caches (v3.5.0) and takes control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log("✅ PWA: v3.5.0 Activated and Old Caches Cleared");
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Standard Cache-First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
