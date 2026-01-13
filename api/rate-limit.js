const RATE_LIMIT = 60; // requests
const WINDOW = 60 * 1000; // 1 minute

const store = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = store.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count++;
  store.set(ip, entry);

  return entry.count <= RATE_LIMIT;
}
