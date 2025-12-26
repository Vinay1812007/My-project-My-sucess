export default function handler(req, res) {
  const { prompt } = req.query;

  const url = `https://video.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

  res.json({
    type: "video",
    url
  });
}
