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
import { json, error } from "./utils.js";
import { requestOTP, verifyOTP } from "./auth.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/auth/request-otp") {
      const { email } = await req.json();
      if (!email) return error("Email required");
      await requestOTP(env, email);
      return json({ success: true });
    }

    if (req.method === "POST" && url.pathname === "/auth/verify-otp") {
      const { email, otp } = await req.json();
      const token = await verifyOTP(env, email, otp);
      if (!token) return error("Invalid OTP", 401);
      return json({ token });
    }

    return error("Not found", 404);
  }
};
