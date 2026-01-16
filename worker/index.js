import { sendOTP, verifyOTP } from "./auth.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/auth/send") {
      return sendOTP(req, env);
    }

    if (req.method === "POST" && url.pathname === "/auth/verify") {
      return verifyOTP(req, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};
