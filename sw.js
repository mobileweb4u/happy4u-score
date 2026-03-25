// ==========================================
// --- SERVICE WORKER MASTER VERSION v3.8.2 ---
// ==========================================
const CACHE_NAME = 'happy4u-v3.8.2';

// All assets required for the scoreboard to work offline
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  // Sponsors
  'ads/sponsor1.png',
  'ads/sponsor2.png',
  'ads/sponsor3.png',
  'ads/sponsor4.png',
  // Practice Drills
  'Drill/drill1.png',
  'Drill/drill2.png',
  'Drill/drill3.png',
  'Drill/drill4.png',
  'Drill/drill5.png',
  'Drill/drill6.png',
  'Drill/drill7.png',
  'Drill/drill8.png',
  'Drill/drill9.png'
];

// 1. INSTALL: Resilient Pre-caching
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("🛠️ PWA: Pre-caching v3.8.2 Assets");
      // Use map to catch individual file errors so one missing file doesn't kill the install
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.error(`❌ Failed to cache: ${url}`, err));
        })
      );
    })
  );
});

// 2. ACTIVATE: Cleanup old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log("✅ PWA: v3.8.2 Activated");
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Network-First strategy
// This allows the scoreboard to stay "live" if online, but use cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});