async function send() {
  const provider = document.getElementById("provider").value;
  const text = document.getElementById("input").value;
  const chat = document.getElementById("chat");

  chat.innerHTML += `<div class="msg user">${text}</div>`;

  let url = "/api/groq/chat";
  if (provider === "gemini") url = "/api/gemini/chat";
  if (provider === "pollinations") {
    chat.innerHTML += `<img src="https://image.pollinations.ai/prompt/${text}">`;
    return;
  }

  const res = await fetch(url, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ message:text, prompt:text })
  });

  const data = await res.json();
  chat.innerHTML += `<div class="msg bot">${data.reply}</div>`;
}
