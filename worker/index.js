import { ChatRoom } from "./chatRoom.js";

export { ChatRoom };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("OK");
    }

    if (url.pathname.startsWith("/chat/")) {
      const roomName = url.pathname.split("/")[2] || "global";
      const id = env.CHAT_ROOM.idFromName(roomName);
      const room = env.CHAT_ROOM.get(id);
      return room.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
