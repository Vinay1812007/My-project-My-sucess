export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, model } = req.body;

  if (!message || !model) {
    return res.json({ reply: "Invalid request" });
  }

  try {
    /* =========================
       GROQ (STABLE)
    ========================= */
    if (model === "groq") {
      const r = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: message }],
            temperature: 0.7,
          }),
        }
      );

      const d = await r.json();

      return res.json({
        reply:
          d?.choices?.[0]?.message?.content ||
          "Groq did not return text.",
      });
    }

    /* =========================
       GEMINI (FINAL FIX)
    ========================= */
    if (model === "gemini") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: message }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      const d = await r.json();

      console.log("GEMINI RAW:", JSON.stringify(d));

      let reply = "";

      if (d?.candidates?.length) {
        const parts = d.candidates[0]?.content?.parts || [];
        reply = parts.map(p => p.text).join(" ").trim();
      }

      if (!reply) {
        reply =
          "⚠️ Gemini is unavailable right now. Please try again or switch to Groq.";
      }

      return res.json({ reply });
    }

    return res.json({ reply: "Unknown model selected." });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.json({
      reply: "Server error. Check Vercel logs.",
    });
  }
}
