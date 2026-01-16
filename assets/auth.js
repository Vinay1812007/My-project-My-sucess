const API = 'https://chatgram-api.vinaybava.workers.dev';

function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'ok' : 'err'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

async function sendOTP() {
  const email = emailInput.value;
  const r = await fetch(`${API}/auth/send`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  if (r.ok) toast('OTP sent successfully');
  else toast('Failed to send OTP', false);
}

async function verifyOTP() {
  const email = emailInput.value;
  const otp = otpInput.value;

  const r = await fetch(`${API}/auth/verify`, {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });

  if (r.ok) location.href = '/chatgram';
  else toast('Invalid OTP', false);
}
