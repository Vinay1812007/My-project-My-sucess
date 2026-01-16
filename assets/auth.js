const API = "https://chatgram-api.vinaybava.workers.dev";

function toast(message, success = true) {
  const t = document.createElement("div");
  t.className = `toast ${success ? "ok" : "err"}`;
  t.innerText = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

document.getElementById("sendBtn").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) return toast("Enter email", false);

  const res = await fetch(API + "/auth/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  data.success
    ? toast("OTP sent successfully ✅")
    : toast("Failed to send OTP ❌", false);
};

document.getElementById("verifyBtn").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();

  if (!otp) return toast("Enter OTP", false);

  const res = await fetch(API + "/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();
  data.success
    ? (toast("Login successful 🎉"), setTimeout(() => location.href = "/chatgram.html", 1000))
    : toast("Invalid OTP ❌", false);
};
