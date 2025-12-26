export default async function handler(req, res) {
  const { prompt } = req.body;

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
  res.json({ reply: d.candidates[0].content.parts[0].text });
}
