import { sendOTP } from "./auth.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/auth/send") {
      return sendOTP(req, env);
    }

    return new Response("Not found", { status: 404 });
  }
};
