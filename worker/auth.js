import { json } from "./utils.js";

export async function sendOTP(req, env) {
  const { email } = await req.json();
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP temporarily (KV / memory for now)
  env.OTP_STORE.set(email, code, { expirationTtl: 300 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Chatgram <onboarding@resend.dev>",
      to: email,
      subject: "Your Chatgram OTP",
      html: `<h2>Your OTP</h2><p><strong>${code}</strong></p>`
    })
  });

  if (!res.ok) {
    return json({ error: "Email failed" }, 500);
  }

  return json({ success: true });
}
