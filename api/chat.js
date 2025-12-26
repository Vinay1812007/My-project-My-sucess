export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST allowed" });
  }

  let body = "";

  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body);
      const message = parsed.message;

      if (!message) {
        return res.status(400).json({ reply: "Message is missing" });
      }

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              { role: "system", content: "You are Vinay AI Assistant." },
              { role: "user", content: message }
            ],
          }),
        }
      );

      const data = await groqRes.json();

      if (!data.choices || !data.choices[0]) {
        return res.status(500).json({
          reply: "AI did not return a response. Try again."
        });
      }

      return res.status(200).json({
        reply: data.choices[0].message.content
      });

    } catch (error) {
      return res.status(500).json({
        reply: "Server error occurred"
      });
    }
  });
}
