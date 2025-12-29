// api/ai.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message, model } = req.body;

    if (!message) {
      return res.json({ reply: "Empty message" });
    }

    /* ==========================
       GROQ
    ========================== */
    if (model === "groq") {
      const groqRes = await fetch(
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
          }),
        }
      );

      const groqData = await groqRes.json();

      const reply =
        groqData?.choices?.[0]?.message?.content ||
        "Groq returned no response.";

      return res.json({ reply });
    }

    /* ==========================
       GEMINI (FIXED)
    ========================== */
    if (model === "gemini") {
      const geminiRes = await fetch(
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
          }),
        }
      );

      const geminiData = await geminiRes.json();

      // 🔥 SAFE EXTRACTION (NO CRASH)
      const reply =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Gemini returned no text.";

      return res.json({ reply });
    }

    /* ==========================
       UNKNOWN MODEL
    ========================== */
    return res.json({ reply: "Unknown model selected." });

  } catch (err) {
    console.error("AI API ERROR:", err);
    return res.json({ reply: "Server error. Check logs." });
  }
}
