/* ===============================
   GLOBAL UI + NAVIGATION LOGIC
   =============================== */

function go(page) {
  document.body.style.opacity = "0.7";
  setTimeout(() => {
    window.location.href = "/" + page;
  }, 120);
}

/* ---------- Active Tab Highlight ---------- */
(function () {
  const tabs = document.querySelectorAll(".tab-item");
  const path = location.pathname;

  tabs.forEach(tab => {
    if (tab.textContent.toLowerCase() === path.replace("/", "").replace(".html", "")) {
      tab.classList.add("active");
    }
  });
})();

/* ---------- PWA Install ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

/* ---------- Subtle Neon Cursor Effect (Desktop) ---------- */
document.addEventListener("mousemove", e => {
  document.documentElement.style.setProperty(
    "--cursor-x", e.clientX + "px"
  );
  document.documentElement.style.setProperty(
    "--cursor-y", e.clientY + "px"
  );
});
