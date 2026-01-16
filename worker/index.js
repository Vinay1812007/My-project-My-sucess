import { sendOTP, verifyOTP } from "./auth";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (req.method === "POST" && url.pathname === "/auth/send") {
      return sendOTP(req, env);
    }

    if (req.method === "POST" && url.pathname === "/auth/verify") {
      return verifyOTP(req, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};
