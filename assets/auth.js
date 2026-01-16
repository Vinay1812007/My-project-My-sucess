const API_BASE = "https://chatgram-api.vinaybava.workers.dev";

const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const sendBtn = document.getElementById("sendOtpBtn");
const verifyBtn = document.getElementById("verifyOtpBtn");

// 🔔 toast (top-right, auto-hide)
function toast(msg, ok = true) {
  const el = document.createElement("div");
  el.className = `toast ${ok ? "ok" : "err"}`;
  el.innerText = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ✅ SEND OTP
sendBtn.onclick = async () => {
  const email = emailInput.value.trim();
  if (!email) {
    toast("Enter email", false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!res.ok) throw new Error();

    toast("OTP sent successfully");
  } catch {
    toast("Failed to send OTP", false);
  }
};

// ✅ VERIFY OTP
verifyBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) {
    toast("Enter OTP", false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    if (!res.ok) throw new Error();

    window.location.href = "/chatgram";
  } catch {
    toast("Invalid OTP", false);
  }
};
