export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    const { model, message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "No message received" }),
        { status: 200 }
      );
    }

    // ===== GROQ =====
    if (model === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: message }]
        })
      });

      const j = await r.json();
      return new Response(
        JSON.stringify({
          reply: j?.choices?.[0]?.message?.content || "No response"
        }),
        { status: 200 }
      );
    }

    // ===== GEMINI =====
// ===== GEMINI (FIXED) =====
if (model === "gemini") {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
    process.env.GEMINI_API_KEY;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ]
    })
  });

  const j = await r.json();

  const reply =
    j?.candidates?.[0]?.content?.parts?.[0]?.text;

  return new Response(
    JSON.stringify({
      reply: reply || "⚠️ Gemini returned no text"
    }),
    { status: 200 }
  );
}
