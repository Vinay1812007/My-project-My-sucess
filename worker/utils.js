export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export function uid() {
  return crypto.randomUUID();
}

export async function requireAuth(env, req) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;

  const token = auth.replace("Bearer ", "");
  const session = await env.SESSIONS_KV.get(`session:${token}`, "json");
  return session || null;
}
