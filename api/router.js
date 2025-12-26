export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { model, message } = req.body;

  try {
    // GROQ
    if (model === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: message }]
        })
      });
      const j = await r.json();
      return res.json({ reply: j.choices[0].message.content });
    }

    // GEMINI
    if (model === "gemini") {
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
        reply: j.candidates[0].content.parts[0].text
      });
    }

    // IMAGE (Pollinations)
    if (model === "image") {
      return res.json({
        image: `https://image.pollinations.ai/prompt/${encodeURIComponent(message)}`
      });
    }

    // VIDEO (Pollinations)
    if (model === "video") {
      return res.json({
        video: `https://video.pollinations.ai/prompt/${encodeURIComponent(message)}`
      });
    }

    res.json({ reply: "Unknown model" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
