export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message missing" });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: "You are Vinay AI Assistant." },
            { role: "user", content: message }
          ],
        }),
      }
    );

    const data = await groqResponse.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.error("Groq raw response:", data);
      return res.status(500).json({
        reply: "Groq API error. Check logs."
      });
    }

    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error occurred"
    });
  }
}
