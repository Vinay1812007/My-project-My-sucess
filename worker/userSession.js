export function getUser(req) {
  const header = req.headers.get("x-user");
  return header || "Guest";
}
