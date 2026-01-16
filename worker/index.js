import { sendOTP } from "./auth.js";

export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("Not allowed", { status: 405 });
    }

    const url = new URL(req.url);

    if (url.pathname === "/auth/request-otp") {
      const { email } = await req.json();

      if (!email || !email.includes("@")) {
        return new Response("Invalid email", { status: 400 });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await env.OTP_KV.put(`otp:${email}`, otp, {
        expirationTtl: 300
      });

      await sendOTP(env, email, otp);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
