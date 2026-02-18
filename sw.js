// ==========================================
// --- SERVICE WORKER VERSION CONTROL ---
// ==========================================
const CACHE_NAME = 'happy4u-v2.3.1'; 

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

// 1. INSTALL: Pre-cache all files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use "addAll" but catch errors if a file is missing
      return cache.addAll(ASSETS).catch(err => {
        console.error("❌ PWA: Failed to cache some assets. Check file paths!", err);
      });
    })
  );
});

// 2. ACTIVATE: Purge old versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      // Ensures the new SW controls the page without a reload
      return self.clients.claim();
    })
  );
});

// 3. FETCH: "Cache First, then Network" Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return from cache OR fetch from web and update cache
      return cachedResponse || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          // Only cache valid GET requests (prevents errors with analytics/external APIs)
          if (event.request.url.startsWith('http') && event.request.method === 'GET') {
             cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
        // If offline and file isn't in cache, you could return an offline page here
    })
  );
});
