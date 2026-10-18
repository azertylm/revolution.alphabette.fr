/* ==========================================================================
   Révolution — service worker (prompt 10).

   Objectif : l'application s'installe et reste utilisable même sans réseau.
   Rien de magique, rien de secret : on met en cache ce qui a déjà été vu, et
   on sert la version en cache quand le réseau est absent.

   Règle : les requêtes /api (données vivantes du hub) ne sont JAMAIS mises en
   cache. On ne sert jamais un résultat figé à la place d'un résultat frais.
   ========================================================================== */

const CACHE = 'revolution-v1';
const COQUILLE = ['/', '/index.html', '/manifest.webmanifest', '/icone.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(COQUILLE))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
      .catch(() => undefined),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Navigation : réseau d'abord, cache en secours (jamais de page figée).
  if (requete.mode === 'navigate') {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copie)).catch(() => undefined);
          return reponse;
        })
        .catch(() => caches.match('/index.html').then((cache) => cache || caches.match('/'))),
    );
    return;
  }

  // Ressources statiques : cache d'abord, puis mise à jour en arrière-plan.
  event.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(requete, copie)).catch(() => undefined);
          return reponse;
        })
        .catch(() => enCache);
      return enCache || reseau;
    }),
  );
});
