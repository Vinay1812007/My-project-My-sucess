export async function sendOTP(req, env) {
  try {
    const { email } = await req.json();
    if (!email) throw "Missing email";

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // store OTP in KV (5 min)
    await env.OTP_STORE.put(email, otp, { expirationTtl: 300 });

    // Send email via Resend
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

    if (!res.ok) throw "Email failed";

    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: e.toString() }, 500);
  }
}

export async function verifyOTP(req, env) {
  const { email, otp } = await req.json();

  const saved = await env.OTP_STORE.get(email);
  if (saved !== otp) {
    return json({ success: false }, 401);
  }

  await env.OTP_STORE.delete(email);
  return json({ success: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
