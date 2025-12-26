const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const voice = document.getElementById("voice");

const model = document.getElementById("model");
const persona = document.getElementById("persona");

let memory = JSON.parse(localStorage.getItem("memory")||"[]");

// FIX INPUT NOT TYPING
input.addEventListener("input",()=>{});

// SEND
send.onclick = sendMsg;
input.addEventListener("keydown",e=>{
  if(e.key==="Enter") sendMsg();
});

function add(role,text){
  const d=document.createElement("div");
  d.className="msg "+role;
  d.textContent=text;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

async function sendMsg(){
  const text=input.value.trim();
  if(!text) return;

  add("user",text);
  input.value="";

  const payload={
    message:text,
    model:model.value,
    persona:persona.value,
    memory
  };

  const r=await fetch("/api/router",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });

  const j=await r.json();
  add("bot",j.reply);

  // MEMORY
  memory.push({q:text,a:j.reply});
  localStorage.setItem("memory",JSON.stringify(memory));

  // TTS
  speechSynthesis.speak(new SpeechSynthesisUtterance(j.reply));
}

// VOICE INPUT
voice.onclick=()=>{
  const rec=new(window.SpeechRecognition||webkitSpeechRecognition)();
  rec.onresult=e=>{
    input.value=e.results[0][0].transcript;
  };
  rec.start();
};
