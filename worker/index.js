import { corsHeaders, error } from "./utils.js";
import { UserSession } from "./userSession.js";
import { ChatRoom } from "./chatRoom.js";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const id = env.USERSESSION.idFromName("global");
      const stub = env.USERSESSION.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith("/room/")) {
      const roomId = url.pathname.split("/").pop();
      const id = env.CHATROOM.idFromName(roomId);
      const stub = env.CHATROOM.get(id);
      return stub.fetch(request);
    }

    return error("Not found", 404);
  },
};
