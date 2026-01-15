export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.clients = new Set();
  }

  async fetch(request) {
    if (request.method === "POST") {
      const data = await request.json();
      const payload = JSON.stringify({
        user: data.user,
        text: data.text,
        time: Date.now(),
      });

      for (const ws of this.clients) {
        try {
          ws.send(payload);
        } catch {}
      }

      return new Response("OK");
    }

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      server.accept();
      this.clients.add(server);

      server.addEventListener("close", () => {
        this.clients.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("ChatRoom alive");
  }
}
