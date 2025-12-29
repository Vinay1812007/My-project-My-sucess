// api/ai.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message, model } = req.body;

    if (!message || !model) {
      return res.json({ reply: "Invalid request" });
    }

    /* =========================
       GROQ (WORKING)
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
        reply: d?.choices?.[0]?.message?.content || "Groq had no output.",
      });
    }

    /* =========================
       GEMINI (FIXED FOR REAL)
    ========================= */
    if (model === "gemini") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
              temperature: 0.7,
              maxOutputTokens: 512,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUAL_CONTENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }
      );

      const d = await r.json();

      // 🔒 Gemini SAFE TEXT EXTRACTION
      let reply = "";

      if (d?.candidates?.length) {
        const parts = d.candidates[0]?.content?.parts || [];
        reply = parts.map(p => p.text).join(" ").trim();
      }

      if (!reply) {
        reply = "Gemini did not generate a response.";
      }

      return res.json({ reply });
    }

    return res.json({ reply: "Unknown model" });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.json({ reply: "Server error. Check logs." });
  }
}
