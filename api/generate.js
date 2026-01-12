export const config = {
  runtime: 'edge', // Uses Vercel Edge for faster responses
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt, history } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construct messages: System prompt + History + Current User Prompt
    const messages = [
        { role: "system", content: "You are a helpful AI assistant for Sirimilla Vinay's portfolio." },
        ...(history || []), 
        { role: "user", content: prompt }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    
    if (data.error) {
         throw new Error(data.error.message);
    }

    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
