export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      ...headers
    }
  });
}

export function getCookie(req, name) {
  const cookies = req.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export function randomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function uuid() {
  return crypto.randomUUID();
}
