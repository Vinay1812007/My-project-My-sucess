import { json, error, uid } from "./utils.js";

export async function requestOTP(env, email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await env.OTP_KV.put(`otp:${email}`, otp, { expirationTtl: 300 });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `Chatgram <${env.FROM_EMAIL}>`,
      to: email,
      subject: "Your Chatgram OTP",
      html: `<h2>Your OTP</h2><b>${otp}</b><p>Valid for 5 minutes</p>`
    })
  });

  return true;
}

export async function verifyOTP(env, email, otp) {
  const saved = await env.OTP_KV.get(`otp:${email}`);
  if (!saved || saved !== otp) return null;

  let user = await env.USERS_KV.get(`user:${email}`, "json");

  if (!user) {
    user = { id: uid(), email, createdAt: Date.now() };
    await env.USERS_KV.put(`user:${email}`, JSON.stringify(user));
  }

  const token = uid();
  await env.SESSIONS_KV.put(
    `session:${token}`,
    JSON.stringify({ userId: user.id, email }),
    { expirationTtl: 86400 }
  );

  return token;
}
