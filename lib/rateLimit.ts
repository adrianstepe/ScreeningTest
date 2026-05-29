const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  current.push(now);
  buckets.set(key, current);
  return current.length <= limit;
}
