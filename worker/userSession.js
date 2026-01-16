export function getUser(request) {
  const ip = request.headers.get("CF-Connecting-IP");
  return ip || "guest";
}
