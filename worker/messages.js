import { uid } from "./utils.js";

export async function sendMessage(env, chatId, senderId, text) {
  const msg = {
    id: uid(),
    chatId,
    senderId,
    text,
    time: Date.now()
  };

  await env.CHATS_KV.put(
    `msg:${chatId}:${msg.id}`,
    JSON.stringify(msg)
  );

  const chat = await env.CHATS_KV.get(`chat:${chatId}`, "json");
  chat.lastMessage = {
    text,
    senderId,
    time: msg.time
  };

  await env.CHATS_KV.put(`chat:${chatId}`, JSON.stringify(chat));
  return msg;
}

export async function getMessages(env, chatId) {
  const list = await env.CHATS_KV.list({
    prefix: `msg:${chatId}:`
  });

  const messages = [];
  for (const key of list.keys) {
    const m = await env.CHATS_KV.get(key.name, "json");
    if (m) messages.push(m);
  }

  return messages.sort((a, b) => a.time - b.time);
}
