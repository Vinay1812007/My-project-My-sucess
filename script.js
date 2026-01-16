// PWA registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

// Navigation helper (NO auto redirects)
function go(page) {
  window.location.href = page;
}

// Install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
});

window.installApp = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
};

// Theme persistence
const theme = localStorage.getItem("theme") || "dark";
document.documentElement.dataset.theme = theme;

window.toggleTheme = () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  localStorage.setItem("theme", t);
};
