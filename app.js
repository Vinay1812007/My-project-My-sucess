const chat = document.getElementById("chat");
const input = document.getElementById("prompt");
const send = document.getElementById("send");
const speakBtn = document.getElementById("speak");
const provider = document.getElementById("provider");

let memory = [];

function addMsg(text, cls) {
  const d = document.createElement("div");
  d.className = `msg ${cls}`;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

send.onclick = async () => {
  if (!input.value.trim()) return;

  const text = input.value;
  input.value = "";
  addMsg(text, "user");

  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: text,
      provider: provider.value
    })
  });

  const d = await r.json();
  addMsg(d.text, "bot");
};

speakBtn.onclick = () => {
  const last = document.querySelector(".bot:last-child");
  if (!last) return;

  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(last.textContent);
  u.voice = speechSynthesis.getVoices().find(v => v.name.includes("Google")) || null;
  speechSynthesis.speak(u);
};
