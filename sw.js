// ==========================================
// --- SERVICE WORKER MASTER VERSION v4.4.0 ---
// ==========================================
const CACHE_NAME = 'happy4u-v4.4.0';

// All assets required for the scoreboard to work offline
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'player-list.html',
  'ChampionsLeague.html',
  'Division(Red).html',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  // Sponsors
  'ads/sponsor1.png',
  'ads/sponsor2.png',
  'ads/sponsor3.png',
  'ads/sponsor4.png',
  'ads/sponsor5.png',
  'ads/sponsor6.png',
  'ads/sponsor7.png',
  'ads/sponsor8.png',
  'ads/sponsor9.png',
  'ads/sponsor10.png',
  'ads/sponsor11.png',
  // Practice Drills
  'Drill/drill1.png',
  'Drill/drill2.png',
  'Drill/drill3.png',
  'Drill/drill4.png',
  'Drill/drill5.png',
  'Drill/drill6.png',
  'Drill/drill7.png',
  'Drill/drill8.png',
  'Drill/drill9.png',
  // video  
  'videos/local-video.mp4',
];

// 1. INSTALL: Resilient Pre-caching
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("🛠️ PWA: Pre-caching v4.2.0 Assets");
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.error(`❌ Failed to cache: ${url}`, err));
        })
      );
    })
  );
});

// 2. ACTIVATE: Cleanup old versions (This deletes v4.4.0 and frees space)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log("✅ PWA: v4.4.0 Activated");
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Network-First strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
