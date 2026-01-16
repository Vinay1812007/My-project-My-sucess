import { json, error } from "./utils.js";
import { createUser, getUserByEmail } from "./users.js";
import { createSession, getSession } from "./sessions.js";
import { createDirectChat, createGroupChat, getChat } from "./chats.js";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    /* HEALTH */
    if (url.pathname === "/health") {
      return json({ status: "ok", service: "chatgram-api" });
    }

    /* AUTH — EMAIL LOGIN (NO PASSWORD) */
    if (url.pathname === "/auth/login" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) return error("Email required");

      let user = await getUserByEmail(env, email);
      if (!user) user = await createUser(env, email);

      const token = await createSession(env, user.id);
      return json({ token, user });
    }

    /* CHAT — CREATE DIRECT */
    if (url.pathname === "/chat/direct" && req.method === "POST") {
      const { userA, userB } = await req.json();
      if (!userA || !userB) return error("Missing users");

      const chat = await createDirectChat(env, userA, userB);
      return json(chat);
    }

    /* CHAT — CREATE GROUP */
    if (url.pathname === "/chat/group" && req.method === "POST") {
      const { creatorId, name, members } = await req.json();
      if (!creatorId || !name || !members)
        return error("Invalid group data");

      const chat = await createGroupChat(env, creatorId, name, members);
      return json(chat);
    }

    /* CHAT — GET INFO */
    if (url.pathname.startsWith("/chat/") && req.method === "GET") {
      const chatId = url.pathname.split("/")[2];
      const chat = await getChat(env, chatId);
      if (!chat) return error("Chat not found", 404);
      return json(chat);
    }

    return error("Route not found", 404);
  }
};
