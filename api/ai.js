export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ reply: "Invalid prompt" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: "You are Vinay AI, a helpful assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.json({
        reply: "⚠️ Groq returned no text. Try again."
      });
    }

    res.json({ reply });

  } catch (error) {
    res.status(500).json({
      reply: "❌ Server error",
      error: error.message
    });
  }
}
