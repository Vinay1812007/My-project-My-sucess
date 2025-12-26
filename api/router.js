export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { provider, feature, prompt, imageUrl } = req.body;

  try {

    /* ===================== GROQ ===================== */
    if (provider === "groq" && feature === "chat") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const d = await r.json();
      return res.json({ reply: d.choices[0].message.content });
    }

    /* ===================== GEMINI ===================== */
    if (provider === "gemini" && feature === "chat") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const d = await r.json();
      return res.json({ reply: d.candidates[0].content.parts[0].text });
    }

    /* ===================== POLLINATIONS ===================== */
    if (provider === "pollinations" && feature === "image") {
      return res.json({
        type: "image",
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    if (provider === "pollinations" && feature === "video") {
      return res.json({
        type: "video",
        url: `https://video.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    /* ===================== GROQ VISION ===================== */
    if (provider === "vision" && feature === "analyze") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }]
        })
      });
      const d = await r.json();
      return res.json({ reply: d.choices[0].message.content });
    }

    return res.status(400).json({ error: "Invalid route" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
