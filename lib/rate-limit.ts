type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

/** Giới hạn tại tiến trình cho local/single instance. Production nhiều instance nên dùng Redis. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  current.count += 1;
  if (buckets.size > 10_000) {
    for (const [bucketKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(bucketKey);
  }
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}
