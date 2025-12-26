export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { model, message } = req.body;

  // TEMP TEST RESPONSE
  res.json({
    reply: `✅ ${model} received: "${message}"`
  });
}
