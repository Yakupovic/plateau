const CACHE = "plateau-v1788207633577";
const CORE = ["./", "./index.html", "./app.js?v=1788207633577", "./app.css?v=1788207633577", "./react.js?v=1788207633577", "./react-dom.js?v=1788207633577",
              "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", (e) => {
  // Pas de .catch ici, VOLONTAIREMENT : si une seule ressource manque (4G qui saute,
  // portail captif du wifi de la salle), l'install doit ECHOUER. Sinon on active un
  // cache incomplet et "activate" supprime l'ancien, qui lui marchait -> app morte
  // hors ligne. Un install rate laisse simplement l'ancienne version en place.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = e.request.url;
  if (!url.startsWith(self.location.origin) && !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url)) return;
  // Réseau d'abord pour la page : jamais bloqué sur une vieille version
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request).then((h) => h || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(e.request, c)); }
      return r;
    }))
  );
});
