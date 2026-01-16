document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".card, .nav a").forEach((el) => {
    el.addEventListener("touchstart", () => {
      el.style.transform = "scale(0.97)";
    });
    el.addEventListener("touchend", () => {
      el.style.transform = "";
    });
  });
});
