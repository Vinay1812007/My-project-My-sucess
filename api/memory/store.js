let memory = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    memory.push(req.body);
    memory = memory.slice(-20);
    return res.json({ ok: true });
  }

  res.json({ memory });
}
