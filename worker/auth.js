import { json, otp } from "./utils.js";
import { getUser, createUser } from "./users.js";
import { createSession } from "./sessions.js";

export async function sendOTP(req, env) {
  const { email } = await req.json();
  if (!email) return json({ error: "Email required" }, 400);

  const code = otp();
  await env.USERS.put(`otp:${email}`, code, { expirationTtl: 300 });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Chatgram OTP",
      html: `<h2>Your OTP: ${code}</h2>`,
    }),
  });

  return json({ success: true });
}

export async function verifyOTP(req, env) {
  const { email, code } = await req.json();
  const saved = await env.USERS.get(`otp:${email}`);
  if (saved !== code) return json({ error: "Invalid OTP" }, 401);

  let user = await getUser(env, email);
  if (!user) await createUser(env, email);

  const token = await createSession(env, email);

  return json(
    { success: true },
    200,
    [`session=${token}; Path=/; HttpOnly; Max-Age=604800`]
  );
}
