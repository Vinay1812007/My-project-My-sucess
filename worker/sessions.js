import { uuid } from "./utils.js";

export async function createSession(env, email) {
  const token = uuid();
  await env.SESSIONS.put(token, email, { expirationTtl: 604800 });
  return token;
}

export async function getSession(env, token) {
  return await env.SESSIONS.get(token);
}
