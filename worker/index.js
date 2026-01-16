export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --------------------
    // CORS (REQUIRED)
    // --------------------
    if (request.method === "OPTIONS") {
      return cors();
    }

    // --------------------
    // ROOT (FIX)
    // --------------------
    if (url.pathname === "/") {
      return json({
        name: "Chatgram API",
        status: "running",
        endpoints: [
          "/health",
          "/chat/global"
        ]
      });
    }

    // --------------------
    // HEALTH CHECK
    // --------------------
    if (url.pathname === "/health") {
      return json({ status: "ok" });
    }

    // --------------------
    // TEMP MEMORY STORE
    // --------------------
    if (!globalThis.messages) {
      globalThis.messages = [];
    }

    // --------------------
    // GET MESSAGES
    // --------------------
    if (url.pathname === "/chat/global" && request.method === "GET") {
      return json(globalThis.messages);
    }

    // --------------------
    // POST MESSAGE
    // --------------------
    if (url.pathname === "/chat/global" && request.method === "POST") {
      const body = await request.json();

      globalThis.messages.push({
        user: body.user || "Anonymous",
        text: body.text || "",
        time: Date.now()
      });

      return json({ success: true });
    }

    // --------------------
    // 404
    // --------------------
    return new Response("Not Found", { status: 404 });
  }
};

// --------------------
// HELPERS
// --------------------
function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function cors() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
