export default function handler(req, res) {
  res.json({
    url: `https://video.pollinations.ai/prompt/${encodeURIComponent(req.query.prompt)}`
  });
}
