const CACHE_NAME = 'workout-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/src/main.js',
  '/src/modules/events.js',
  '/src/modules/parser.js',
  '/src/modules/storage.js',
  '/src/modules/timer.js',
  '/src/modules/ui.js',
  '/workout.csv',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
}); 