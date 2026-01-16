export async function getUser(env, email) {
  return await env.USERS.get(email, { type: "json" });
}

export async function createUser(env, email) {
  const user = { email, createdAt: Date.now() };
  await env.USERS.put(email, JSON.stringify(user));
  return user;
}
