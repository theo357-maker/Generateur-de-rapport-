const CACHE_NAME = 'rapports-repetition-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/gestionnaire.html',
  'R.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation terminée');
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation en cours');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation terminée');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-HTTP/HTTPS (comme les extensions chrome://)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne la ressource en cache si disponible
        if (response) {
          return response;
        }

        // Sinon, fait la requête réseau
        return fetch(event.request)
          .then(response => {
            // Vérifie si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone la réponse pour la mettre en cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Met en cache les nouvelles ressources
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Service Worker: Erreur de fetch', error);
            // Pour les pages, on peut retourner une page d'erreur personnalisée
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Gestion des messages (pour les mises à jour)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});