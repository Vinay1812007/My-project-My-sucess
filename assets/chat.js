import { currentRoom } from "./rooms.js";

const BASE_API = "https://chatgram-api.vinaybava.workers.dev/chat";

export async function loadMessages() {
  const res = await fetch(`${BASE_API}/${currentRoom}`);
  const messages = await res.json();

  const box = document.getElementById("messages");
  box.innerHTML = "";

  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<b>${m.user}</b>: ${m.text}`;
    box.appendChild(div);
  });
}

export async function sendMessage(text) {
  await fetch(`${BASE_API}/${currentRoom}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: "Vinay", text })
  });
  loadMessages();
}
