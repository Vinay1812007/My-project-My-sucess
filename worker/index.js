export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only allow API routes
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not Found", { status: 404 });
    }

    if (url.pathname === "/api/ai") {
      return Response.json({ reply: "AI working ✅" });
    }

    if (url.pathname === "/api/music") {
      return Response.json({
        tracks: ["Song A", "Song B"]
      });
    }

    return new Response("API not found", { status: 404 });
  }
};
