export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ reply: "Only POST requests allowed" }),
      { status: 405 }
    );
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "Message missing" }),
        { status: 400 }
      );
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
      return new Response(
        JSON.stringify({ reply: "Groq returned no response." }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ reply: data.choices[0].message.content }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ reply: "Server error occurred." }),
      { status: 500 }
    );
  }
}
