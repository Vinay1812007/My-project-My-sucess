export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message, model } = req.body;

    if (!message || typeof message !== "string") {
      return res.json({ reply: "Please enter a message." });
    }

    /* ===========================
       GEMINI (PRIMARY)
    ============================ */
    if (model === "gemini") {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: message }]
                }
              ]
            })
          }
        );

        const geminiData = await geminiResponse.json();

        const geminiText =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (geminiText && geminiText.trim()) {
          return res.status(200).json({
            reply: geminiText
          });
        }

        // Gemini responded but with no usable text
        throw new Error("Gemini returned empty text");

      } catch (geminiError) {
        console.warn("Gemini failed → Falling back to Groq");
      }
    }

    /* ===========================
       GROQ (FALLBACK / DEFAULT)
    ============================ */
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      }
    );

    const groqData = await groqResponse.json();

    const groqText =
      groqData?.choices?.[0]?.message?.content;

    if (!groqText) {
      return res.status(200).json({
        reply: "AI did not generate a response. Please try again."
      });
    }

    return res.status(200).json({
      reply: groqText
    });

  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({
      reply: "Server error. Please try again later."
    });
  }
}
