import { json, randomOTP, uuid } from "./utils.js";

export async function sendOTP(req, env) {
  const { email } = await req.json();
  const otp = randomOTP();

  await env.USERS.put(email, JSON.stringify({
    email,
    otp,
    expires: Date.now() + 5 * 60 * 1000
  }));

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Chatgram <onboarding@resend.dev>",
      to: email,
      subject: "Your Chatgram OTP",
      html: `<h2>${otp}</h2><p>Valid for 5 minutes</p>`
    })
  });

  return json({ success: true });
}

export async function verifyOTP(req, env) {
  const { email, otp } = await req.json();
  const user = JSON.parse(await env.USERS.get(email));

  if (!user || user.otp !== otp || Date.now() > user.expires) {
    return json({ error: "Invalid OTP" }, 401);
  }

  const session = uuid();
  await env.SESSIONS.put(session, email, { expirationTtl: 86400 });

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Set-Cookie": `session=${session}; HttpOnly; Secure; SameSite=None; Path=/`,
      "Content-Type": "application/json"
    }
  });
}
