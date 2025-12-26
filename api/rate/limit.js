const hits = new Map();

export default function handler(req, res) {
  const ip = req.headers["x-forwarded-for"] || "local";
  const now = Date.now();

  if (!hits.has(ip)) hits.set(ip, []);
  hits.set(ip, hits.get(ip).filter(t => now - t < 60000));

  if (hits.get(ip).length >= 20) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  hits.get(ip).push(now);
  res.status(200).json({ ok: true });
}
