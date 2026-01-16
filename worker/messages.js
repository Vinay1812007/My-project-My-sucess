import { uuid } from "./utils.js";

export async function addMessage(env, chat, email, text) {
  const msg = { id: uuid(), email, text, ts: Date.now() };
  await env.MESSAGES.put(`${chat}:${msg.id}`, JSON.stringify(msg));
  return msg;
}
