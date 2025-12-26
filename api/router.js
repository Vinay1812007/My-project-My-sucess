const memory = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { model, message, imageBase64, sessionId = "default" } = req.body;

  // ---------- MEMORY ----------
  const history = memory.get(sessionId) || [];
  history.push({ role: "user", content: message });
  memory.set(sessionId, history.slice(-10));

  try {
    // ---------- GROQ ----------
    if (model === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: history
        })
      });
      const j = await r.json();
      return res.json({ reply: j.choices[0].message.content });
    }

    // ---------- GEMINI ----------
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
      return res.json({ reply: j.candidates[0].content.parts[0].text });
    }

    // ---------- GEMINI OCR ----------
    if (model === "ocr") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: "image/png", data: imageBase64 } },
                { text: "Extract text and explain image" }
              ]
            }]
          })
        }
      );
      const j = await r.json();
      return res.json({ reply: j.candidates[0].content.parts[0].text });
    }

    // ---------- IMAGE (Pollinations) ----------
    if (model === "image") {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(message)}`;
      return res.json({ image: url });
    }

    // ---------- VIDEO (Pollinations) ----------
    if (model === "video") {
      const url = `https://video.pollinations.ai/prompt/${encodeURIComponent(message)}`;
      return res.json({ video: url });
    }

    res.json({ reply: "Unknown model" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
