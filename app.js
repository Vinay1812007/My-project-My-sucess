const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const model = document.getElementById("model");

let memory = [];

function add(role, text) {
  const d = document.createElement("div");
  d.className = `msg ${role}`;
  d.innerText = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

send.onclick = sendMsg;
input.onkeydown = e => e.key === "Enter" && sendMsg();

async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  add("user", text);
  memory.push(text);
  add("bot", "…");

  const botBubble = chat.lastChild;

  const r = await fetch("/api/router", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      model: model.value,
      memory
    })
  });

  const j = await r.json();
  botBubble.innerText = j.reply || "No response.";

  if (j.image) {
    const img = document.createElement("img");
    img.src = j.image;
    chat.appendChild(img);
  }
}
