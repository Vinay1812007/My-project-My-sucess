export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content?.trim() || null;

    if (!text) {
      return res.json({ reply: "⚠️ Groq returned no text." });
    }

    res.json({ reply: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
