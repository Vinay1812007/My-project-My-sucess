// api/ai.js
export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  // ---------- METHOD CHECK ----------
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    // ---------- PARSE BODY ----------
    const body = await req.json();
    const model = body?.model;
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ reply: "⚠️ No message received" }),
        { status: 200 }
      );
    }

    // ======================================================
    // ======================= GROQ =========================
    // ======================================================
    if (model === "groq") {
      if (!process.env.GROQ_API_KEY) {
        return new Response(
          JSON.stringify({ reply: "❌ GROQ_API_KEY missing" }),
          { status: 200 }
        );
      }

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are a helpful AI assistant." },
              { role: "user", content: message }
            ]
          })
        }
      );

      const groqJson = await groqRes.json();

      const groqReply =
        groqJson?.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({
          reply: groqReply || "⚠️ Groq returned no text"
        }),
        { status: 200 }
      );
    }

    // ======================================================
    // ====================== GEMINI ========================
    // ======================================================
    if (model === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ reply: "❌ GEMINI_API_KEY missing" }),
          { status: 200 }
        );
      }

      const geminiURL =
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY;

      const geminiRes = await fetch(geminiURL, {
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

      const geminiJson = await geminiRes.json();

      const geminiReply =
        geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      return new Response(
        JSON.stringify({
          reply: geminiReply || "⚠️ Gemini returned no text"
        }),
        { status: 200 }
      );
    }

    // ======================================================
    // ================== FALLBACK ==========================
    // ======================================================
    return new Response(
      JSON.stringify({
        reply: "⚠️ Model not supported"
      }),
      { status: 200 }
    );

  } catch (err) {
    // ---------- HARD FAIL SAFE ----------
    return new Response(
      JSON.stringify({
        reply: "❌ Server error",
        error: err?.message || "unknown"
      }),
      { status: 200 }
    );
  }
}
