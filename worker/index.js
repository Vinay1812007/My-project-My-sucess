import { UserSession } from "./userSession.js";

export default {
  fetch(req, env) {
    const url = new URL(req.url);
    if (req.headers.get("Upgrade") === "websocket") {
      const email = url.searchParams.get("email");
      return env.USERS.get(env.USERS.idFromName(email)).fetch(req);
    }
    return new Response("Chatgram Worker OK");
  }
};

export { UserSession };
