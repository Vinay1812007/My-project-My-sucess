export async function sendOTP(email, env) {
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
      subject: "Your Chatgram OTP",
      html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
    })
  });

  if (!res.ok) {
    throw new Error("Email failed");
  }
}
