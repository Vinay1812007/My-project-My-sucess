import { ChatRoom } from "./chatRoom.js";

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const room = url.searchParams.get("room") || "global";

      const id = env.CHATROOM.idFromName(room);
      const stub = env.CHATROOM.get(id);

      return stub.fetch(request);
    }

    return new Response("Chatgram Worker Running", { status: 200 });
  }
};

export { ChatRoom };
