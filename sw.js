// ════════════════════════════════════════
//  AG · Agenda Gioffrè — Service Worker
//  Versione: 2.1.0
// ════════════════════════════════════════
const CACHE_NAME = 'ag-cache-v1';

// File da mettere in cache per uso offline
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap'
];

// Installazione: mette in cache le risorse principali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Attivazione: rimuove cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve dalla cache se offline, altrimenti dalla rete
self.addEventListener('fetch', event => {
  // Ignora richieste Firebase (sempre online)
  if(event.request.url.includes('firebase') ||
     event.request.url.includes('firestore') ||
     event.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache con la risposta fresca
        if(response && response.status === 200 && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve dalla cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
