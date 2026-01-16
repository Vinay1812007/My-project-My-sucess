import { requireAuth, json, error } from "./utils.js";
import { createChat, getUserChats } from "./chats.js";
import { sendMessage, getMessages } from "./messages.js";

/* LIST CHATS */
if (url.pathname === "/chats" && req.method === "GET") {
  const session = await requireAuth(env, req);
  if (!session) return error("Unauthorized", 401);

  const chats = await getUserChats(env, session.userId);
  return json(chats);
}

/* CREATE CHAT */
if (url.pathname === "/chats" && req.method === "POST") {
  const session = await requireAuth(env, req);
  if (!session) return error("Unauthorized", 401);

  const { members, name } = await req.json();
  if (!members || !Array.isArray(members))
    return error("Members required");

  const chat = await createChat(
    env,
    [session.userId, ...members],
    members.length > 1,
    name
  );

  return json(chat);
}

/* SEND MESSAGE */
if (url.pathname === "/messages" && req.method === "POST") {
  const session = await requireAuth(env, req);
  if (!session) return error("Unauthorized", 401);

  const { chatId, text } = await req.json();
  if (!chatId || !text) return error("Invalid");

  const msg = await sendMessage(env, chatId, session.userId, text);
  return json(msg);
}

/* GET MESSAGES */
if (url.pathname.startsWith("/messages/")) {
  const session = await requireAuth(env, req);
  if (!session) return error("Unauthorized", 401);

  const chatId = url.pathname.split("/").pop();
  const msgs = await getMessages(env, chatId);
  return json(msgs);
}
