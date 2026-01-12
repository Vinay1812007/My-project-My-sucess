function download(){
  alert("Backend required. UI ready.");
}

// CHAT
async function send(){
  const msgBox = document.getElementById("messages");
  const input = document.getElementById("prompt");

  msgBox.innerHTML += `<p>🧑 ${input.value}</p>`;

  const res = await fetch("/api/groq",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({prompt:input.value})
  });

  const data = await res.json();
  msgBox.innerHTML += `<p>🤖 ${data.result}</p>`;
  input.value="";
}
