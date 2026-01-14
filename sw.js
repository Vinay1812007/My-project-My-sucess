self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("vinay-v2").then(c => c.addAll([
      "/","/index.html","/ai.html","/music.html",
      "/videodownloader.html","/style.css","/script.js"
    ]))
  );
});
