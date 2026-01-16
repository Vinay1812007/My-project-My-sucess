import { json, cors } from "./utils.js";

export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.messages = (await state.storage.get("messages")) || [];
    });
  }

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return cors();

    // Get history
    if (req.method === "GET") {
      return json(this.messages);
    }

    // Post message
    if (req.method === "POST") {
      const body = await req.json();

      const msg = {
        id: crypto.randomUUID(),
        user: body.user || "Anonymous",
        text: body.text,
        time: Date.now()
      };

      this.messages.push(msg);

      // Keep last 100 messages
      this.messages = this.messages.slice(-100);

      await this.state.storage.put("messages", this.messages);

      return json(msg);
    }

    return json({ error: "Method not allowed" }, 405);
  }
}
