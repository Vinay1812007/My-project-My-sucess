import { checkRateLimit } from "./rate-limit.js";

export async function handler(event) {
  const ip = event.headers["x-forwarded-for"] || "unknown";

  if (!checkRateLimit(ip)) {
    return { statusCode: 429, body: "Rate limit exceeded" };
  }

  const query = event.queryStringParameters?.q;
  if (!query) {
    return { statusCode: 400, body: "Missing query" };
  }

  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("media", "music");
  url.searchParams.set("limit", "25");

  const res = await fetch(url.toString());
  const data = await res.json();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    },
    body: JSON.stringify(data)
  };
}
