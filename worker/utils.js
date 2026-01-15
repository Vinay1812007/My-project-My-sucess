export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export function upgradeWebSocket(request) {
  if (request.headers.get("Upgrade") !== "websocket") {
    return null;
  }
  const pair = new WebSocketPair();
  return pair;
}
