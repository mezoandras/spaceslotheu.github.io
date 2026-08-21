/* Felirat Stúdió — offline service worker
   Helye: ugyanabban a mappában, mint az index.html (pl. /sun/sw.js).
   Minden hivatkozás relatív, így a mappa bárhova másolható.
   Frissítéskor emeld a VERSION számot, különben a telefon a régit tartja meg. */

const VERSION = "felirat-v4";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, {cache:"reload"})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  const home = new URL("./", self.registration.scope).toString();

  // Oldalletöltés: előbb a hálózat (hogy a friss verzió jöjjön), offline esetén a cache.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(home, copy));
          return res;
        })
        .catch(() => caches.match(home).then(r => r || caches.match(req)))
    );
    return;
  }

  // Minden más (ikonok, manifest): előbb a cache, aztán a hálózat.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    }))
  );
});
