export default async function handler(req, res) {
  try {
    const body = req.body || {};
    const message = body.message?.trim();
    const model = body.model || "groq";
    const memory = Array.isArray(body.memory) ? body.memory : [];

    if (!message) {
      return res.json({ reply: "Please type a message." });
    }

    /* IMAGE */
    if (model === "image") {
      return res.json({
        reply: "Image generated 👇",
        image: `https://image.pollinations.ai/prompt/${encodeURIComponent(message)}`
      });
    }

    /* GROQ */
    if (model === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            ...memory.map(m => ({ role: "user", content: m })),
            { role: "user", content: message }
          ]
        })
      });

      const j = await r.json();

      return res.json({
        reply:
          j?.choices?.[0]?.message?.content ||
          j?.error?.message ||
          "Groq did not respond."
      });
    }

    /* GEMINI */
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      reply:
        j?.candidates?.[0]?.content?.parts?.[0]?.text ||
        j?.error?.message ||
        "Gemini did not respond."
    });

  } catch (e) {
    return res.json({ reply: "Server error: " + e.message });
  }
}
