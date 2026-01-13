export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: prompt }
        ],
        // UPDATED MODEL: The old one was decommissioned
        model: "llama-3.3-70b-versatile", 
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Error");

    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
