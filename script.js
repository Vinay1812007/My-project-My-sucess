const nav = document.createElement("div");
nav.className = "nav";
nav.innerHTML = `
  <a href="/">🏠 Home</a>
  <a href="/music">🎵 Music</a>
  <a href="/videodownloder">🎬 Video</a>
  <a href="/chat.ai">🤖 AI</a>
  <a href="/VI Messeger">💬 Chat</a>
`;
document.body.appendChild(nav);
/* =========================================================
   GLOBAL SCRIPT — PRODUCTION RUNTIME
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------
     UTILITIES
  ------------------------- */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const safeJSON = (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  /* -------------------------
     THEME MANAGEMENT
     light | dark | auto
  ------------------------- */

  const THEME_KEY = "theme-preference";

  function applyTheme(mode) {
    document.documentElement.dataset.theme = mode;
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const theme = stored || "auto";

    if (theme === "auto") {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(theme);
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (localStorage.getItem(THEME_KEY) === "auto") {
        applyTheme(getSystemTheme());
      }
    });
  }

  window.setTheme = (mode) => {
    localStorage.setItem(THEME_KEY, mode);
    initTheme();
  };

  /* -------------------------
     SPA NAVIGATION
  ------------------------- */

  function navigate(url) {
    history.pushState(null, "", url);
    highlightNav();
  }

  function highlightNav() {
    const path = location.pathname;
    $$(".navbar a").forEach(a => {
      a.classList.toggle("active", a.getAttribute("href") === path);
    });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;

    e.preventDefault();
    navigate(href);
    window.location.href = href;
  });

  window.addEventListener("popstate", highlightNav);

  /* -------------------------
     DYNAMIC GREETING
  ------------------------- */

  function updateGreeting() {
    const el = $("#greeting");
    if (!el) return;

    const hour = new Date().getHours();
    let text = "Welcome";

    if (hour < 12) text = "Good morning";
    else if (hour < 18) text = "Good afternoon";
    else text = "Good evening";

    el.textContent = text;
  }

  /* -------------------------
     SERVICE WORKER (PWA)
  ------------------------- */

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (err) {
      // Silent fail — never break production
    }
  }

  /* -------------------------
     NETWORK STATUS
  ------------------------- */

  function initNetworkStatus() {
    const el = $("#network-status");
    if (!el) return;

    const update = () => {
      el.textContent = navigator.onLine ? "Online" : "Offline";
      el.classList.toggle("offline", !navigator.onLine);
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  }

  /* -------------------------
     INIT
  ------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    highlightNav();
    updateGreeting();
    initNetworkStatus();
    registerServiceWorker();
  });

})();
