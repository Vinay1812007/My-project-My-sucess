import { uid } from "./utils.js";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(env, email) {
  const otp = generateOTP();

  await env.OTP_KV.put(
    `otp:${email}`,
    otp,
    { expirationTtl: 300 } // 5 minutes
  );

  await env.EMAIL.send({
    to: email,
    subject: "Your Chatgram Login Code",
    text: `Your Chatgram verification code is: ${otp}\n\nThis code expires in 5 minutes.`
  });

  return true;
}

export async function verifyOTP(env, email, code) {
  const saved = await env.OTP_KV.get(`otp:${email}`);
  if (!saved) return false;
  return saved === code;
}
