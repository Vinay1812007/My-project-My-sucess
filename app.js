const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");

send.onclick = sendMsg;
input.onkeydown = e => e.key === "Enter" && sendMsg();

function model() {
  return document.querySelector("input[name=model]:checked").value;
}

async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  add("user", text);
  input.value = "";

  const res = await fetch("/api/router", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model(),
      message: text,
      sessionId: "vinay"
    })
  });

  const data = await res.json();

  if (data.image) {
    add("bot", "");
    chat.innerHTML += `<img src="${data.image}" width="300"/>`;
  } else if (data.video) {
    chat.innerHTML += `<video src="${data.video}" controls width="300"></video>`;
  } else {
    add("bot", data.reply);
  }
}

function add(role, text) {
  const d = document.createElement("div");
  d.className = `msg ${role}`;
  d.textContent = `${role === "user" ? "You" : "AI"}: ${text}`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
