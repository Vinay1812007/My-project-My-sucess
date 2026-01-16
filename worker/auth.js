export async function sendOTP(req, env) {
  const { email } = await req.json();
  if (!email) {
    return json({ error: 'Email required' }, 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await env.OTP_STORE.put(email, otp, { expirationTtl: 300 });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Chatgram <onboarding@resend.dev>',
      to: email,
      subject: 'Your Chatgram OTP',
      html: `<h2>Your OTP</h2><p><b>${otp}</b></p>`
    })
  });

  if (!res.ok) {
    return json({ error: 'Email failed' }, 500);
  }

  return json({ success: true });
}

export async function verifyOTP(req, env) {
  const { email, otp } = await req.json();

  const saved = await env.OTP_STORE.get(email);
  if (!saved || saved !== otp) {
    return json({ error: 'Invalid OTP' }, 401);
  }

  await env.OTP_STORE.delete(email);

  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': `session=${crypto.randomUUID()}; HttpOnly; Path=/; Max-Age=86400`
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
