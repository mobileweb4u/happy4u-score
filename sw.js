// ==========================================
// --- SERVICE WORKER MASTER VERSION v2.4.0 ---
// ==========================================
const CACHE_NAME = 'happy4u-v2.4.0'; 

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
  // Forces this new service worker to become the active one immediately
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("🛠️ PWA: Pre-caching v2.4.0 Assets");
      return cache.addAll(ASSETS).catch(err => {
        console.error("❌ PWA: Asset caching failed", err);
      });
    })
  );
});

// 2. ACTIVATE: The "Uninstaller" - Deletes any cache that isn't v2.4.0
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // This logic searches for and destroys any old versions (v2.3.1, etc.)
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log("✅ PWA: v2.4.0 Activated and Old Caches Cleared");
      // Ensures that the new version takes control of the website right now
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Standard Cache-First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Returns the cached version for speed, otherwise goes to the internet
      return cachedResponse || fetch(event.request);
    })
  );
});
