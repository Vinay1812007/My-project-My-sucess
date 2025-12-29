export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, provider } = req.body;
  if (!prompt) return res.json({ text: "Empty prompt" });

  try {
    // -------- GROQ (PRIMARY) --------
    if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const d = await r.json();
      return res.json({
        text: d?.choices?.[0]?.message?.content || "Groq returned no text"
      });
    }

    // -------- GEMINI (FALLBACK) --------
    const g = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const gd = await g.json();
    return res.json({
      text:
        gd?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Gemini unavailable. Switch to Groq."
    });

  } catch (e) {
    return res.json({ text: "AI error. Try again." });
  }
}
