// ==========================================
// --- SERVICE WORKER MASTER VERSION v4.5.4 ---
// ==========================================
const CACHE_NAME = 'happy4u-v4.5.4';

// Use relative paths (./) to ensure compatibility with GitHub Pages subfolders
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './player-list.html',
  './ChampionsLeague.html',
  './Division(Red).html',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
   // Sponsors
  './ads/sponsor1.png',
  './ads/sponsor2.png',
  './ads/sponsor3.png',
  './ads/sponsor4.png',
  './ads/sponsor5.png',
  './ads/sponsor6.png',
  './ads/sponsor7.png',
  './ads/sponsor8.png',
  './ads/sponsor9.png',
  './ads/sponsor10.png',
  './ads/sponsor11.png',
  './ads/sponsor12.png',
  './ads/sponsor13.png',
  './ads/sponsor14.png',
  './ads/sponsor15.png',
  './ads/sponsor16.png',
  './ads/sponsor17.png',
  './ads/sponsor18.png',
  './ads/sponsor19.png',
  // Practice Drills
  './Drill/drill1.png',
  './Drill/drill2.png',
  './Drill/drill3.png',
  './Drill/drill4.png',
  './Drill/drill5.png',
  './Drill/drill6.png',
  './Drill/drill7.png',
  './Drill/drill8.png',
  './Drill/drill9.png',
  // Note: Large videos over 50MB may fail to cache on some mobile browsers
  './videos/local-video.mp4',
];

// 1. INSTALL: Pre-cache assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`🛠️ PWA: Pre-caching ${CACHE_NAME} Assets`);
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.error(`❌ Failed to cache: ${url}`, err));
        })
      );
    })
  );
});

// 2. ACTIVATE: Cleanup old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log(`✅ PWA: ${CACHE_NAME} Activated`);
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Cache-First Strategy
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});