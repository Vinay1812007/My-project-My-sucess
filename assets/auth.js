const API = "https://chatgram-api.vinaybava.workers.dev";

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = "toast " + (ok ? "ok" : "err");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

async function sendOTP() {
  const email = document.getElementById("email").value;

  const res = await fetch(API + "/auth/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  data.success
    ? toast("OTP sent successfully ✅")
    : toast("Failed to send OTP ❌", false);
}

async function verifyOTP() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;

  const res = await fetch(API + "/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();
  data.success
    ? (toast("Login successful 🎉"), setTimeout(() => location.href = "/chatgram.html", 1000))
    : toast("Invalid OTP ❌", false);
}
