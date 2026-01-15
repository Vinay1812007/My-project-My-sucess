/* ===============================
   GLOBAL APP LOGIC
================================ */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("installBtn");
  if (btn) btn.hidden = false;
});

document.addEventListener("click", async (e) => {
  if (e.target?.id === "installBtn" && deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    e.target.hidden = true;
  }
});

/* ===============================
   SERVICE WORKER
================================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

/* ===============================
   UTILITIES
================================ */
export function qs(id) {
  return document.getElementById(id);
}

export function uid() {
  return crypto.randomUUID();
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
