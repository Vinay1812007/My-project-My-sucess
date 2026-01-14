   // --- Apple Music Search API ---
    if (url.pathname === "/api/apple/search") {
      const term = url.searchParams.get("q");
      if (!term) {
        return new Response("Missing search query", { status: 400 });
      }

      const apiURL =
        `https://api.music.apple.com/v1/catalog/us/search?types=songs&limit=10&term=` +
        encodeURIComponent(term);

      const res = await fetch(apiURL, {
        headers: {
          Authorization: `Bearer ${env.APPLE_MUSIC_TOKEN}`
        }
      });

      return new Response(res.body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }
