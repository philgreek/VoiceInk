const CACHE_NAME = 'voiceink-v3'; // Incremented version
const URLS_TO_CACHE = [
  '.',
  'index.html',
  'icon.svg',
  'icon.png'
];

// On install, cache the app shell and other critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force the new service worker to activate
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

// On fetch, use a robust strategy for navigation and assets
self.addEventListener('fetch', event => {
  // For navigation requests, use a "Network falling back to Cache" strategy.
  // This ensures users get the latest version of the app shell if they are online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If the network request fails (e.g., offline),
          // serve the main app shell from the cache.
          return caches.match('./');
        })
    );
    return;
  }

  // For all other requests (assets like scripts, icons),
  // use a "Cache first, falling back to Network" strategy.
  // This is fast and efficient for assets that don't change often.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});