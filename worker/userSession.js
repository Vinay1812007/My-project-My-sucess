export class UserSession {
  constructor(state) {
    this.state = state;
    this.sockets = new Set();
  }

  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sockets.add(server);

    server.addEventListener("message", e => {
      for (const ws of this.sockets) {
        if (ws !== server) ws.send(e.data);
      }
    });

    server.addEventListener("close", () => {
      this.sockets.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
