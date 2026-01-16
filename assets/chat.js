fetch("/").then(r => {
  if (!r.ok) location.href = "/login.html";
});
