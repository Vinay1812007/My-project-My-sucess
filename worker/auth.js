export async function sendOTP(req, env) {
  const { email } = await req.json();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await env.OTP_STORE.put(email, otp, { expirationTtl: 300 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Chatgram <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP",
      html: `<h2>${otp}</h2>`
    })
  });

  if (!res.ok) return new Response("Email error", { status: 500 });
  return new Response("OK");
}

export async function verifyOTP(req, env) {
  const { email, otp } = await req.json();
  const saved = await env.OTP_STORE.get(email);

  if (saved !== otp) return new Response("Invalid", { status: 401 });

  await env.OTP_STORE.delete(email);
  return new Response("OK", {
    headers: {
      "Set-Cookie": `session=${crypto.randomUUID()}; HttpOnly; Path=/`
    }
  });
}
