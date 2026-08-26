// service-worker.js — Cache "app shell" pour un fonctionnement hors ligne.
// Stratégie simple et robuste pour une V1 : cache-first pour les fichiers
// de l'app, avec repli réseau si un fichier manque au cache.

const CACHE_NAME = 'humidor-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/utils.js',
  './js/icons.js',
  './js/screens/home.js',
  './js/screens/humidor.js',
  './js/screens/addCigar.js',
  './js/screens/editCigar.js',
  './js/screens/detail.js',
  './js/screens/placeholder.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
