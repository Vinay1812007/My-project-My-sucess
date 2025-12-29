const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chat = document.getElementById("chat");

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `msg ${type}`;
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "msg bot";
  typing.textContent = "Thinking...";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });

    const data = await res.json();
    typing.textContent = data.reply || "No response.";

  } catch {
    typing.textContent = "Network error.";
  }
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
