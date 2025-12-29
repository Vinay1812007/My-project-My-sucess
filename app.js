const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const historyList = document.getElementById("historyList");

let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChat = null;

/* ---------- UTIL ---------- */
function renderHistory() {
  historyList.innerHTML = "";
  chats.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = c.title;
    div.onclick = () => loadChat(i);
    historyList.appendChild(div);
  });
}

function addMessage(text, role) {
  if (!text) return;

  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  currentChat.messages.push({ role, text });
  save();
}

/* ---------- CHAT ---------- */
function newChat() {
  currentChat = {
    title: "New Chat",
    messages: []
  };
  chats.push(currentChat);
  save();
  chat.innerHTML = "";
  renderHistory();
}

function loadChat(index) {
  currentChat = chats[index];
  chat.innerHTML = "";
  currentChat.messages.forEach(m => addMessage(m.text, m.role));
}

/* ---------- SEND ---------- */
async function send() {
  const text = input.value;
  if (!text.trim()) return;

  input.value = ""; // FIX: clear AFTER read

  addMessage(text, "user");

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      message: text,
      model: document.getElementById("model").value
    })
  });

  const data = await res.json();
  addMessage(data.reply || "No response", "ai");
}

/* ---------- EVENTS ---------- */
sendBtn.onclick = send;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

/* ---------- VOICE INPUT ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const rec = new SR();
  rec.lang = "en-US";
  micBtn.onclick = () => rec.start();
  rec.onresult = e => input.value += e.results[0][0].transcript;
}

/* ---------- SAVE ---------- */
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/* ---------- INIT ---------- */
if (!chats.length) newChat();
else loadChat(0);
renderHistory();
