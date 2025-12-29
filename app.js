const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const modelSel = document.getElementById("model");
const personaSel = document.getElementById("persona");
const canvas = document.getElementById("canvas");

let speaking = null;

/* ---------- MEMORY ---------- */
function save(role, text) {
  const mem = JSON.parse(localStorage.getItem("memory") || "[]");
  mem.push({ role, text });
  localStorage.setItem("memory", JSON.stringify(mem.slice(-50)));
}

function loadMemory() {
  JSON.parse(localStorage.getItem("memory") || "[]")
    .forEach(m => addMessage(m.text, m.role));
}

/* ---------- UI ---------- */
function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `
    ${text}
    ${role === "ai" ? `<button class="speak-btn" onclick="speak(this)">🔊</button>` : ""}
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function speak(btn) {
  speechSynthesis.cancel();
  const t = btn.parentElement.innerText.replace("🔊", "");
  const u = new SpeechSynthesisUtterance(t);
  speaking = u;
  speechSynthesis.speak(u);
}

/* Stop sound while typing */
input.addEventListener("input", () => speechSynthesis.cancel());

/* ---------- SEND ---------- */
sendBtn.onclick = send;
input.onkeydown = e => e.key === "Enter" && send();

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  addMessage(text, "user");
  save("user", text);

  const persona = personaSel.value
    ? `You are a ${personaSel.value}. Respond accordingly.\n\n${text}`
    : text;

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: persona,
      model: modelSel.value
    })
  });

  const data = await res.json();
  const reply = data.reply || "No response";

  addMessage(reply, "ai");
  save("ai", reply);

  if (reply.length > 500) {
    canvas.innerText = reply;
    canvas.classList.remove("hidden");
  }
}

/* ---------- VOICE INPUT ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const rec = new SR();
  rec.lang = "en-US";
  micBtn.onclick = () => rec.start();
  rec.onresult = e => input.value += e.results[0][0].transcript;
}

/* ---------- EXPORT ---------- */
function exportChat() {
  const blob = new Blob([localStorage.getItem("memory")], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat.json";
  a.click();
}

/* ---------- INIT ---------- */
loadMemory();
