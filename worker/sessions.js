import { uid } from "./utils.js";

export async function createSession(env, userId) {
  const token = uid("sess_");

  const session = {
    token,
    userId,
    createdAt: Date.now()
  };

  await env.SESSIONS_KV.put(
    `session:${token}`,
    JSON.stringify(session),
    { expirationTtl: 60 * 60 * 24 * 7 }
  );

  return token;
}

export async function getSession(env, token) {
  const data = await env.SESSIONS_KV.get(`session:${token}`);
  return data ? JSON.parse(data) : null;
}
