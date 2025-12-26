export default function handler(req, res) {
  res.json({
    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(req.query.prompt)}`
  });
}
