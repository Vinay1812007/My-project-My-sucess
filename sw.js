const CACHE = "sirimilla-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        "/",
        "/index.html",
        "/chatgram.html",
        "/music.html",
        "/ai.html",
        "/videodownloader.html",
        "/style.css",
        "/script.js"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
