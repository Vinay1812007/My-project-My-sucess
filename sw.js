const CACHE = "my-success-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/chatgram.html",
  "/music.html",
  "/ai.html",
  "/videodownloader.html",
  "/style.css",
  "/script.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetcher = fetch(e.request).then(r => {
        caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      });
      return cached || fetcher;
    })
  );
});
