/* ==========================================================================
   Révolution — service worker (prompt 10).

   Objectif : l'application s'installe et reste utilisable même sans réseau.
   Rien de magique, rien de secret : on met en cache ce qui a déjà été vu, et
   on sert la version en cache quand le réseau est absent.

   Règle : les requêtes /api (données vivantes du hub) ne sont JAMAIS mises en
   cache. On ne sert jamais un résultat figé à la place d'un résultat frais.
   ========================================================================== */

const CACHE = 'revolution-v3';
const COQUILLE = ['./', './index.html', './manifest.webmanifest', './icone.svg'];

// Fichiers construits (JS, CSS) cités par la page : mis en cache dès l'installation.
// Sans cela, la première visite n'en garde aucun et la page reste blanche hors ligne.
async function precacherActifs(cache) {
  const page = await cache.match('./');
  if (!page) return;
  const html = await page.text();
  const actifs = [...new Set([...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1]))];
  await Promise.all(actifs.map((a) => cache.add(a).catch(() => undefined)));
  // Morceaux chargés à la demande (écrans « lazy ») : listés par Vite dans __vite__mapDeps du script principal.
  for (const a of actifs.filter((x) => x.endsWith('.js'))) {
    const script = await cache.match(a);
    if (!script) continue;
    const js = await script.text();
    const debut = js.indexOf('__vite__mapDeps');
    const liste = debut < 0 ? null : js.slice(debut).match(/\[([^\]]*)\]/);
    if (!liste) continue;
    const base = new URL(a, self.location.href);
    const morceaux = [...liste[1].matchAll(/"([^"]+\.(?:js|css))"/g)].map((m) => new URL(m[1], base).href);
    await Promise.all(morceaux.map((m) => cache.add(m).catch(() => undefined)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(COQUILLE).then(() => precacherActifs(cache)))
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
  if (url.pathname.includes('/api/')) return;
  // L'actualité change toutes les 3 heures : jamais servie depuis le cache.
  if (url.pathname.endsWith('/actu.json')) return;

  // Navigation : réseau d'abord, cache en secours (jamais de page figée).
  if (requete.mode === 'navigate') {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copie)).catch(() => undefined);
          return reponse;
        })
        .catch(() => caches.match('./index.html').then((cache) => cache || caches.match('./'))),
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
