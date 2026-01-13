import { checkRateLimit } from "./rate-limit.js";

export async function handler(event) {
  const ip = event.headers["x-forwarded-for"] || "unknown";

  if (!checkRateLimit(ip)) {
    return { statusCode: 429, body: "Rate limit exceeded" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { messages, model, temperature } = JSON.parse(event.body || "{}");

  if (!Array.isArray(messages)) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || "llama3-8b-8192",
      messages,
      temperature: temperature ?? 0.7,
      stream: true
    })
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store"
    },
    body: res.body
  };
}
