const CACHE_NAME = "gonfle-cache-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./assets/surface-conditions.webp",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png"
];

// Installation du Service Worker et mise en cache des ressources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Stratégie Stale-While-Revalidate : réponse rapide via le cache, mise à jour en tâche de fond
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes qui ne sont pas de type GET (par exemple les requêtes d'outils de dev)
  if (event.request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes provenant d'autres domaines ou protocoles non supportés (chrome-extension, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Échec silencieux si hors-ligne
          });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});
