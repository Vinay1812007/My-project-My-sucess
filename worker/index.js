export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ❌ Never touch frontend pages
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not Found", { status: 404 });
    }

    // ✅ AI demo endpoint
    if (url.pathname === "/api/ai") {
      return Response.json({
        reply: "AI endpoint working ✅"
      });
    }

    // ✅ Music demo endpoint
    if (url.pathname === "/api/music") {
      return Response.json({
        tracks: [
          { title: "Track One", artist: "Demo Artist" },
          { title: "Track Two", artist: "Demo Artist" }
        ]
      });
    }

    return new Response("API route not found", { status: 404 });
  }
};
