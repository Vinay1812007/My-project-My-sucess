/* ❄️ Snow */
const snow = document.getElementById("snow");

setInterval(() => {
  const s = document.createElement("div");
  s.innerHTML = "❄";
  s.style.position = "absolute";
  s.style.left = Math.random() * window.innerWidth + "px";
  s.style.top = "-10px";
  s.style.opacity = Math.random();
  s.style.fontSize = Math.random() * 20 + 10 + "px";
  s.style.animation = "fall linear 8s";
  snow.appendChild(s);
  setTimeout(() => s.remove(), 8000);
}, 200);

/* 🎵 Music */
const music = document.getElementById("bgMusic");
const btn = document.getElementById("musicToggle");
let playing = false;

btn.onclick = () => {
  playing ? music.pause() : music.play();
  playing = !playing;
};

/* ✨ Scroll Reveal */
const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
});

/* ❄️ Fall Animation */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fall {
  to { transform: translateY(110vh); }
}`;
document.head.appendChild(style);
