import { ChatRoom } from "./chatRoom.js";
import { cors, json } from "./utils.js";

export { ChatRoom };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return cors();
    }

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "chatgram-api" });
    }

    // Group chat route
    if (url.pathname.startsWith("/chat/")) {
      const roomId = url.pathname.split("/")[2];
      const id = env.CHAT_ROOM.idFromName(roomId);
      const room = env.CHAT_ROOM.get(id);
      return room.fetch(req);
    }

    return json({ error: "Not found" }, 404);
  }
};
