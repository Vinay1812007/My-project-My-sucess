self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("chatgram").then(c => c.addAll([
      "/", "/chatgram.html", "/style.css", "/script.js"
    ]))
  );
});
