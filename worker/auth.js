export async function sendOTP(env, email, otp) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `Chatgram <onboarding@resend.dev>`,
      to: email,
      subject: "Your Chatgram OTP",
      html: `
        <div style="font-family:sans-serif">
          <h2>Chatgram Login</h2>
          <p>Your OTP:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Email failed: " + err);
  }
}
