export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return new Response(
      JSON.stringify({ error: "Missing search query" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiURL =
    "https://api.music.apple.com/v1/catalog/us/search" +
    "?types=songs&limit=12&term=" +
    encodeURIComponent(q);

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
