export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export function uid(prefix = "") {
  return (
    prefix +
    crypto.randomUUID().replace(/-/g, "").slice(0, 24)
  );
}
