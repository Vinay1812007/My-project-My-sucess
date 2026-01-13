export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---------- STATIC ASSETS ----------
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // ---------- ROUTER ----------
    switch (url.pathname) {
      case "/api/health":
        return json({ status: "ok", ts: Date.now() });

      case "/api/music-proxy":
        return musicProxy(url);

      case "/api/video-proxy":
        return videoProxy(url);

      case "/api/ai-stream":
        return aiStream(request, env);

      default:
        return new Response("Not Found", { status: 404 });
    }
  }
};

/* ============================
   HELPERS
============================ */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

/* ============================
   MUSIC (iTunes API)
============================ */

async function musicProxy(url) {
  const q = url.searchParams.get("q");
  if (!q) return json({ error: "Missing query" }, 400);

  const api = `https://itunes.apple.com/search?media=music&limit=25&term=${encodeURIComponent(q)}`;
  const res = await fetch(api);
  return new Response(res.body, {
    headers: { "Content-Type": "application/json" }
  });
}

/* ============================
   VIDEO (LEGAL MP4 / M3U8)
============================ */

async function videoProxy(url) {
  const target = url.searchParams.get("url");
  if (!target) return new Response("Missing URL", { status: 400 });

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const head = await fetch(parsed.toString(), { method: "HEAD" });
  const type = head.headers.get("content-type") || "";

  if (!type.includes("video/mp4") && !type.includes("mpegurl")) {
    return new Response("Unsupported media type", { status: 415 });
  }

  return fetch(parsed.toString());
}

/* ============================
   AI STREAM (GROQ)
============================ */

async function aiStream(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await request.json();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: body.model || "llama3-8b-8192",
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      stream: true
    })
  });

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store"
    }
  });
}
