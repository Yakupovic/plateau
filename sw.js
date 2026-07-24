const CACHE = "plateau-v1784848621207";
const CORE = ["./", "./index.html", "./app.js?v=1784848621207", "./app.css?v=1784848621207", "./react.js?v=1784848621207", "./react-dom.js?v=1784848621207",
              "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
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
