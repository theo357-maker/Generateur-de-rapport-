// Changez le nom du dépôt si le vôtre est différent
const REPO_NAME = '/generateur-rapport'; 
const CACHE_VERSION = 'v3'; // Changez ce numéro à chaque mise à jour majeure
const CACHE_NAME = `rapports-app-cache-${CACHE_VERSION}`;

// Liste de TOUS les fichiers que l'application doit pouvoir utiliser hors ligne
const urlsToCache = [
  // Pages principales
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/gestionnaire.html`,
  
  // Fichiers de configuration PWA
  `${REPO_NAME}/manifest.json`,
  
  // Images
  `${REPO_NAME}/R.png`,
  
  // Librairies externes (elles doivent aussi être mises en cache)
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Installation du Service Worker et mise en cache des fichiers
self.addEventListener('install', event => {
  self.skipWaiting( ); // Force l'activation immédiate du nouveau Service Worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert. Mise en cache des fichiers de base.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Échec de la mise en cache lors de l\'installation :', error);
      })
  );
});

// Activation du Service Worker et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Prend le contrôle de toutes les pages ouvertes
});

// Interception des requêtes réseau (stratégie "Cache d'abord")
self.addEventListener('fetch', event => {
  // On ne met pas en cache les requêtes autres que GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si la ressource est dans le cache, on la retourne
        if (cachedResponse) {
          return cachedResponse;
        }
        // Sinon, on la récupère sur le réseau
        return fetch(event.request).then(networkResponse => {
            // Optionnel : on peut cloner la réponse et la mettre en cache pour la prochaine fois
            // let responseToCache = networkResponse.clone();
            // caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            return networkResponse;
        });
      })
  );
});
