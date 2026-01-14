self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("vinay-v1").then(c =>
      c.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/script.js",
        "/music.html",
        "/ai.html",
        "/videodownloader.html"
      ])
    )
  );
});
