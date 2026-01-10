export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server Config Error: GROQ_API_KEY missing.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                // UPDATED MODEL: llama3-8b-8192 is deprecated.
                // Using llama-3.3-70b-versatile for better performance.
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Groq API Error:", data.error);
            return res.status(500).json({ error: data.error.message });
        }

        const result = data.choices?.[0]?.message?.content || "No response received from AI.";
        return res.status(200).json({ result });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Failed to connect to AI service.' });
    }
}
