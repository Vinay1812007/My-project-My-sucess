const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const modelSelect = document.getElementById("modelSelect");

send.onclick = sendMessage;
input.onkeydown = e => e.key === "Enter" && sendMessage();

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typing";
  div.innerHTML = `
    <div class="typing">
      <span></span><span></span><span></span>
    </div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  addTyping();

  try {
    const res = await fetch("/api/router", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelSelect.value,
        message: text
      })
    });

    const data = await res.json();
    removeTyping();

    if (data.image) {
      const img = document.createElement("img");
      img.src = data.image;
      img.style.maxWidth = "100%";
      chat.appendChild(img);
    } else if (data.video) {
      const v = document.createElement("video");
      v.src = data.video;
      v.controls = true;
      v.style.maxWidth = "100%";
      chat.appendChild(v);
    } else {
      addMessage("bot", data.reply || "No response");
    }
  } catch {
    removeTyping();
    addMessage("bot", "Error connecting to AI");
  }
}
