export class ChatRoom {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const method = request.method;

    if (method === "GET") {
      const messages = (await this.state.storage.get("messages")) || [];
      return Response.json(messages);
    }

    if (method === "POST") {
      const body = await request.json();
      const messages = (await this.state.storage.get("messages")) || [];

      const message = {
        user: body.user || "Anonymous",
        text: body.text,
        time: Date.now()
      };

      messages.push(message);
      await this.state.storage.put("messages", messages);

      return Response.json({ success: true });
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
}
