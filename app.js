const messagesEl = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const speakBtn = document.getElementById("speakBtn");
const chatList = document.getElementById("chatList");

let chat = [];

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMessage(text, "user");

  chat.push({ role: "user", content: text });

  addMessage("Thinking…", "bot");

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chat })
  });

  const data = await res.json();

  messagesEl.lastChild.remove();

  const reply = data.reply || "⚠️ No response.";
  addMessage(reply, "bot");
  chat.push({ role: "assistant", content: reply });
}

// ENTER TO SEND (FIXED)
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// BUTTON
sendBtn.onclick = sendMessage;

// AUTO-RESIZE INPUT
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

// TTS (ChatGPT-style browser voice)
speakBtn.onclick = () => {
  const last = [...messagesEl.children].reverse()
    .find(m => m.classList.contains("bot"));

  if (!last) return;

  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(last.textContent);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
};
