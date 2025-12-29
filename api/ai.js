export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { model, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message" });
    }

    // ---------- GROQ ----------
    if (model === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: message }]
        })
      });

      const j = await r.json();
      return res.json({
        reply: j.choices?.[0]?.message?.content || "No response"
      });
    }

    // ---------- GEMINI ----------
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
      return res.json({
        reply: j.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
      });
    }

    return res.json({ reply: "Model not supported" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
