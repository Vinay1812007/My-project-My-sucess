// assets/auth.js

function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.className = `toast ${success ? "success" : "error"}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

async function sendOTP() {
  const email = document.getElementById("emailInput").value.trim();
  if (!email) {
    showToast("Enter email", false);
    return;
  }

  const res = await fetch("/auth/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  if (res.ok) {
    showToast("OTP sent successfully");
  } else {
    showToast("Failed to send OTP", false);
  }
}

async function verifyOTP() {
  const email = document.getElementById("emailInput").value.trim();
  const code = document.getElementById("otpInput").value.trim();

  if (!code) {
    showToast("Enter OTP", false);
    return;
  }

  const res = await fetch("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, code })
  });

  if (res.ok) {
    showToast("Login successful");
    setTimeout(() => {
      window.location.href = "/chatgram.html";
    }, 800);
  } else {
    showToast("Invalid OTP", false);
  }
}
