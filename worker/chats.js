import { uid } from "./utils.js";

export async function createDirectChat(env, userA, userB) {
  const chatId = uid("chat_");

  const chat = {
    id: chatId,
    type: "direct",
    members: [userA, userB],
    createdAt: Date.now()
  };

  await env.CHATS_KV.put(`chat:${chatId}`, JSON.stringify(chat));
  return chat;
}

export async function createGroupChat(env, creatorId, name, members) {
  const chatId = uid("chat_");

  const chat = {
    id: chatId,
    type: "group",
    name,
    members: Array.from(new Set([creatorId, ...members])),
    createdAt: Date.now()
  };

  await env.CHATS_KV.put(`chat:${chatId}`, JSON.stringify(chat));
  return chat;
}

export async function getChat(env, chatId) {
  const data = await env.CHATS_KV.get(`chat:${chatId}`);
  return data ? JSON.parse(data) : null;
}
