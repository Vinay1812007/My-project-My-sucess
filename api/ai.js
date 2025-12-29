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
    if (model === "gemini") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const j = await r.json();
      return new Response(
        JSON.stringify({
          reply:
            j?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response"
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ reply: "Model not supported" }),
      { status: 200 }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ reply: "Server error" }),
      { status: 200 }
    );
  }
}
