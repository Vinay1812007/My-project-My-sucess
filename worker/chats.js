import { uid } from "./utils.js";

export async function createChat(env, members, isGroup = false, name = null) {
  const id = uid();

  const chat = {
    id,
    members,
    isGroup,
    name,
    createdAt: Date.now(),
    lastMessage: null
  };

  await env.CHATS_KV.put(`chat:${id}`, JSON.stringify(chat));

  for (const userId of members) {
    await env.CHATS_KV.put(
      `user:${userId}:chat:${id}`,
      "1"
    );
  }

  return chat;
}

export async function getUserChats(env, userId) {
  const list = await env.CHATS_KV.list({
    prefix: `user:${userId}:chat:`
  });

  const chats = [];

  for (const key of list.keys) {
    const chatId = key.name.split(":").pop();
    const chat = await env.CHATS_KV.get(`chat:${chatId}`, "json");
    if (chat) chats.push(chat);
  }

  return chats.sort((a, b) =>
    (b.lastMessage?.time || 0) - (a.lastMessage?.time || 0)
  );
}
