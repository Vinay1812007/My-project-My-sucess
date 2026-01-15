export class UserSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Map();
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    server.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data);
        const roomId = data.room || "global";

        const room = this.env.CHATROOM.get(
          this.env.CHATROOM.idFromName(roomId)
        );

        await room.fetch("https://chat/send", {
          method: "POST",
          body: JSON.stringify(data),
        });
      } catch (err) {
        server.send(JSON.stringify({ error: "Invalid message" }));
      }
    });

    server.addEventListener("close", () => {
      for (const [key, ws] of this.sockets.entries()) {
        if (ws === server) this.sockets.delete(key);
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}
