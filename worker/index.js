import { json, error } from "./utils.js";
import { createUser, getUserByEmail } from "./users.js";
import { createSession } from "./sessions.js";
import { sendOTP, verifyOTP } from "./auth.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    /* HEALTH */
    if (url.pathname === "/health") {
      return json({ status: "ok", service: "chatgram-api" });
    }

    /* STEP 1 — REQUEST OTP */
    if (url.pathname === "/auth/request-otp" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) return error("Email required");

      await sendOTP(env, email);
      return json({ success: true });
    }

    /* STEP 2 — VERIFY OTP */
    if (url.pathname === "/auth/verify-otp" && req.method === "POST") {
      const { email, code } = await req.json();
      if (!email || !code) return error("Invalid request");

      const valid = await verifyOTP(env, email, code);
      if (!valid) return error("Invalid or expired OTP", 401);

      let user = await getUserByEmail(env, email);
      if (!user) user = await createUser(env, email);

      const token = await createSession(env, user.id);
      return json({ token, user });
    }

    return error("Route not found", 404);
  }
};
