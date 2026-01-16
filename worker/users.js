import { uid } from "./utils.js";

export async function createUser(env, email) {
  const userId = uid("user_");

  const user = {
    id: userId,
    email,
    name: email.split("@")[0],
    avatar: "🙂",
    createdAt: Date.now()
  };

  await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));
  await env.USERS_KV.put(`email:${email}`, userId);

  return user;
}

export async function getUserByEmail(env, email) {
  const userId = await env.USERS_KV.get(`email:${email}`);
  if (!userId) return null;

  return getUserById(env, userId);
}

export async function getUserById(env, userId) {
  const data = await env.USERS_KV.get(`user:${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function updateUser(env, userId, updates) {
  const user = await getUserById(env, userId);
  if (!user) return null;

  const updated = { ...user, ...updates };
  await env.USERS_KV.put(`user:${userId}`, JSON.stringify(updated));
  return updated;
}
