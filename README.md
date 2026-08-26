
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
  <title>HUMIDOR</title>
  <meta name="description" content="Votre humidor virtuel et carnet de dégustation">

  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#1a1512">

  <!-- Réglages iOS pour l'ajout à l'écran d'accueil -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="HUMIDOR">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="icon" href="icons/icon-192.png">

  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>

{
  "name": "HUMIDOR",
  "short_name": "HUMIDOR",
  "description": "Votre humidor virtuel et carnet de dégustation",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1512",
  "theme_color": "#1a1512",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}

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
