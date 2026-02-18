const CACHE_NAME = 'happy4u-v2'; // Incrementing version to force browser update
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
  // force the waiting service worker to become the active service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching all scoreboard assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event - This is what makes it work OFFLINE
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file (offline), or try to get it from network (online)
      return cachedResponse || fetch(event.request);
    })
  );
});
