import { checkRateLimit } from "./rate-limit.js";

const ALLOWED_TYPES = [
  "video/mp4",
  "application/vnd.apple.mpegurl",
  "application/x-mpegURL"
];

export async function handler(event) {
  const ip = event.headers["x-forwarded-for"] || "unknown";

  if (!checkRateLimit(ip)) {
    return { statusCode: 429, body: "Rate limit exceeded" };
  }

  const target = event.queryStringParameters?.url;
  if (!target) {
    return { statusCode: 400, body: "Missing URL" };
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return { statusCode: 400, body: "Invalid URL" };
  }

  const res = await fetch(parsed.toString(), { method: "HEAD" });
  const type = res.headers.get("content-type") || "";

  if (!ALLOWED_TYPES.some(t => type.includes(t))) {
    return { statusCode: 415, body: "Unsupported media type" };
  }

  const stream = await fetch(parsed.toString());

  return {
    statusCode: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "no-store"
    },
    body: stream.body
  };
}
