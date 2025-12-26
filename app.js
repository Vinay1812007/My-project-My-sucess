const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const modelSelect = document.getElementById("modelSelect");
const fileInput = document.getElementById("fileInput");

let sessionId = localStorage.getItem("session") || crypto.randomUUID();
localStorage.setItem("session", sessionId);

send.onclick = sendMsg;
input.onkeydown = e => e.key === "Enter" && sendMsg();

function add(role, text) {
  const d = document.createElement("div");
  d.className = `msg ${role}`;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function typing(on=true){
  if(on){
    const d=document.createElement("div");
    d.id="typing"; d.className="msg bot";
    d.innerHTML='<div class="typing"><span></span><span></span><span></span></div>';
    chat.appendChild(d);
  } else {
    document.getElementById("typing")?.remove();
  }
}

async function sendMsg(extra={}) {
  const text = input.value.trim();
  if (!text && !extra.imageBase64) return;

  if(text) add("user", text);
  input.value = "";
  typing(true);

  const res = await fetch("/api/router", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      model: modelSelect.value,
      message: text,
      sessionId,
      ...extra
    })
  });

  const data = await res.json();
  typing(false);

  if(data.image) chat.innerHTML += `<img src="${data.image}"/>`;
  else if(data.video) chat.innerHTML += `<video src="${data.video}" controls></video>`;
  else add("bot", data.reply);
}

// VOICE INPUT
document.getElementById("voiceBtn").onclick = () => {
  const rec = new (webkitSpeechRecognition || SpeechRecognition)();
  rec.onresult = e => { input.value = e.results[0][0].transcript; sendMsg(); };
  rec.start();
};

// UPLOAD IMAGE → OCR
document.getElementById("uploadBtn").onclick = ()=> fileInput.click();
fileInput.onchange = () => {
  const r = new FileReader();
  r.onload = () => sendMsg({ imageBase64: r.result.split(",")[1] });
  r.readAsDataURL(fileInput.files[0]);
};

function openCanvas() {
  window.open("canvas.html","canvas","width=600,height=700");
}
