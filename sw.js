// Service worker: офлайн-работа + автообновление (network-first)
// При каждом деплое можно поднять версию кэша, чтобы гарантированно обновить precache.
var CACHE = "tacheo-pwa-stable";
var ASSETS = [
  "app.html",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

// Сеть в приоритете: онлайн всегда отдаём свежую версию и кладём в кэш,
// офлайн — отдаём из кэша. Так приложение обновляется само.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) {
        return m || caches.match("app.html");
      });
    })
  );
});
