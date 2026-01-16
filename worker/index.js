import { sendOTP, verifyOTP } from "./auth.js";
import { json, getCookie } from "./utils.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }

    if (url.pathname === "/auth/send") return sendOTP(req, env);
    if (url.pathname === "/auth/verify") return verifyOTP(req, env);

    const session = getCookie(req, "session");
    if (!session || !(await env.SESSIONS.get(session))) {
      return json({ error: "Unauthorized" }, 401);
    }

    return json({ ok: true });
  }
};
