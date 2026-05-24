import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// Distributed lock using Redis SET NX with expiry
export async function acquireLock(
  key: string,
  ttlMs: number = 5000
): Promise<string | null> {
  const client = getRedis();
  if (!client) return "no-redis"; // fallback: no distributed lock

  const lockValue = `lock_${Date.now()}_${Math.random()}`;
  const result = await client.set(`lock:${key}`, lockValue, {
    px: ttlMs,
    nx: true,
  });

  return result === "OK" ? lockValue : null;
}

export async function releaseLock(
  key: string,
  lockValue: string
): Promise<void> {
  const client = getRedis();
  if (!client || lockValue === "no-redis") return;

  const current = await client.get(`lock:${key}`);
  if (current === lockValue) {
    await client.del(`lock:${key}`);
  }
}

// Idempotency key cache
export async function getIdempotencyCache(
  key: string
): Promise<{ statusCode: number; response: unknown } | null> {
  const client = getRedis();
  if (!client) return null;

  const cached = await client.get<{ statusCode: number; response: unknown }>(
    `idempotency:${key}`
  );
  return cached;
}

export async function setIdempotencyCache(
  key: string,
  statusCode: number,
  response: unknown,
  ttlSeconds: number = 86400
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  await client.set(
    `idempotency:${key}`,
    { statusCode, response },
    { ex: ttlSeconds }
  );
}
