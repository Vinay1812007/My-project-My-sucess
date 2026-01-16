export function json(data, status = 200, cookies = []) {
  const headers = { "Content-Type": "application/json" };
  if (cookies.length) headers["Set-Cookie"] = cookies;
  return new Response(JSON.stringify(data), { status, headers });
}

export function getCookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`${name}=([^;]+)`));
  return m ? m[1] : null;
}

export function uuid() {
  return crypto.randomUUID();
}

export function otp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
