export default async function handler(req, res) {
  const { imageBase64 } = req.body;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/png", data: imageBase64 } },
            { text: "Extract text from image" }
          ]
        }]
      })
    }
  );

  const d = await r.json();
  res.json({ reply: d.candidates[0].content.parts[0].text });
}
