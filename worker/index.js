import { json, getCookie } from "./utils.js";
import { sendOTP, verifyOTP } from "./auth.js";
import { getSession } from "./sessions.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/auth/send") return sendOTP(req, env);
    if (url.pathname === "/auth/verify") return verifyOTP(req, env);

    const token = getCookie(req, "session");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const email = await getSession(env, token);
    if (!email) return json({ error: "Invalid session" }, 401);

    return json({ email });
  },
};
