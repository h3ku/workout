const CACHE_NAME = 'workout-tracker-v1';
const urlsToCache = [
  '/workout/',
  '/workout/index.html',
  '/workout/styles.css',
  '/workout/main.js',
  '/workout/modules/events.js',
  '/workout/modules/parser.js',
  '/workout/modules/storage.js',
  '/workout/modules/timer.js',
  '/workout/modules/ui.js',
  '/workout/workout.csv',
  '/workout/manifest.json',
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