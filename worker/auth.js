export async function sendOTP(req, env) {
  try {
    const { email } = await req.json();
    if (!email) {
      return json({ error: "Email required" }, 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP (5 minutes)
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
        subject: "Your Chatgram OTP",
        html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: err }, 500);
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function verifyOTP(req, env) {
  const { email, otp } = await req.json();

  const stored = await env.OTP_STORE.get(email);
  if (!stored || stored !== otp) {
    return json({ error: "Invalid OTP" }, 401);
  }

  await env.OTP_STORE.delete(email);

  return json({ success: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
