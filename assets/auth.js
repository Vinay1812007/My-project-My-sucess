async function sendOTP() {
  const email = emailInput.value;
  await fetch("/auth/send", {
    method: "POST",
    body: JSON.stringify({ email })
  });
  alert("OTP sent");
}

async function verifyOTP() {
  const email = emailInput.value;
  const code = otpInput.value;
  const r = await fetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
  if (r.ok) location.href = "/chatgram.html";
  else alert("Invalid OTP");
}
