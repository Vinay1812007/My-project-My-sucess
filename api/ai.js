export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const prompt = req.body?.prompt?.trim();

  if (!prompt) {
    return res.status(400).json({ reply: "Invalid prompt" });
  }

  try {
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
          messages: [
            {
              role: "system",
              content: "You are Vinay AI, a friendly and helpful assistant. Always reply with text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 512,
          stream: false
        })
      }
    );

    const data = await groqRes.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Groq replied but sent no text. Please try again.";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      reply: "Server error while contacting Groq.",
      error: err.message
    });
  }
}
