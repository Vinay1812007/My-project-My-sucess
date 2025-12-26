export default function handler(req, res) {
  const { prompt } = req.query;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({
    type: "image",
    url
  });
}
