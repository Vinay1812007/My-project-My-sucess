export default async function handler(req, res) {
  const { prompt } = req.body;

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Reason step by step." },
        { role: "user", content: prompt }
      ]
    })
  });

  const d = await r.json();
  res.json({ reply: d.choices[0].message.content });
}
