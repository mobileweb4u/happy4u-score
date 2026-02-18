// ==========================================
// --- SERVICE WORKER VERSION CONTROL ---
// ==========================================
// IMPORTANT: Every time you change script.js, update this name 
// (e.g., 'happy4u-v2.3.1') to force the browser to update.
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
  // Explicitly adding all Drills for offline access
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

// 1. Install Event - Saving files to cache
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 PWA: Caching new scoreboard assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // Delete any cache that doesn't match the current CACHE_NAME
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log('✅ PWA: Old cache cleared, version ' + CACHE_NAME + ' active!');
      return self.clients.claim(); // Immediately take control of all open tabs
    })
  );
});

// 3. Fetch Event - Offline Support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file (offline), or try to get it from network (online)
      return cachedResponse || fetch(event.request);
    })
  );
});
