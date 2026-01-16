export async function listChats(env, email) {
  const list = await env.CHATS.list({ prefix: email });
  return list.keys.map(k => k.name);
}
