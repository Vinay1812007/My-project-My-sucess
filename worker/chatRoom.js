export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.clients = new Set();
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket required", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.clients.add(server);

    server.addEventListener("message", (event) => {
      this.broadcast(event.data, server);
    });

    server.addEventListener("close", () => {
      this.clients.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  broadcast(message, sender) {
    for (const client of this.clients) {
      if (client !== sender) {
        client.send(message);
      }
    }
  }
}
