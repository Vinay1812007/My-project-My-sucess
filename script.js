function setPrompt(text) {
  document.getElementById("aiPrompt").value = text;
}

function sendAI() {
  const input = document.getElementById("aiPrompt");
  const chat = document.getElementById("chatContainer");

  const msg = document.createElement("div");
  msg.innerText = input.value;
  chat.appendChild(msg);
  input.value = "";
}

/* ❄️ Snow */
const snowContainer = document.getElementById("snow-container");
setInterval(() => {
  const s = document.createElement("div");
  s.className = "snowflake";
  s.innerHTML = "❄";
  s.style.left = Math.random() * window.innerWidth + "px";
  s.style.animationDuration = 3 + Math.random() * 5 + "s";
  snowContainer.appendChild(s);
  setTimeout(() => s.remove(), 8000);
}, 200);
