export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ reply: "⚠️ Empty message list." });
    }

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages,
          temperature: 0.7
        })
      }
    );

    const data = await groqRes.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.json({
        reply: "⚠️ Groq responded but returned empty text. Try again."
      });
    }

    res.json({ reply });

  } catch (err) {
    res.status(500).json({
      reply: "❌ Server error",
      details: err.message
    });
  }
}
