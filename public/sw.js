// Hors ligne : la page est demandée au réseau d'abord (pour avoir la dernière version),
// les fichiers de l'app sont servis depuis le cache. L'app ne contacte aucun autre site.
const CACHE = 'gaby-v4'; // changer ce nom vide la mémoire hors ligne de tous les appareils

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }) // toujours revérifier la page auprès du serveur
        .then((rep) => { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put('./', copie)); return rep; })
        .catch(() => caches.match('./')),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cache) => cache || fetch(req).then((rep) => {
      if (rep.ok) {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(req, copie));
      }
      return rep;
    })),
  );
});
