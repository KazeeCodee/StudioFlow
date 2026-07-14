import { createClient } from "redis";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type RateLimitStoreResult = {
  count: number;
  ttlMs: number;
};

export type RateLimitStore = {
  consume: (key: string, windowMs: number) => Promise<RateLimitStoreResult>;
};

type ConsumeRateLimitInput = {
  failureMode: "closed" | "open";
  key: string;
  limit: number;
  onUnavailable?: () => void;
  store: RateLimitStore;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  reason: "allowed" | "exceeded" | "unavailable";
  remaining: number;
  retryAfterSeconds: number;
};

const fixedWindowScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
`;

type RedisEvalClient = {
  eval: (
    script: string,
    options: { arguments: string[]; keys: string[] },
  ) => Promise<unknown>;
};

let redisClientPromise: Promise<RedisEvalClient> | null = null;

async function getRedisClient() {
  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const redisUrl = getEnv().REDIS_URL;

      if (!redisUrl) {
        throw new Error("REDIS_URL no esta configurada.");
      }

      const client = createClient({
        disableOfflineQueue: true,
        socket: {
          connectTimeout: 1_000,
          reconnectStrategy: false,
        },
        url: redisUrl,
      });
      client.on("error", () => undefined);
      await client.connect();
      return client;
    })().catch((error) => {
      redisClientPromise = null;
      throw error;
    });
  }

  return redisClientPromise;
}

export function createRedisRateLimitStore(
  clientProvider: () => Promise<RedisEvalClient>,
): RateLimitStore {
  return {
    async consume(key, windowMs) {
      const client = await clientProvider();
      const result = await client.eval(fixedWindowScript, {
        arguments: [String(windowMs)],
        keys: [key],
      });

      if (!Array.isArray(result) || result.length !== 2) {
        throw new Error("Redis devolvio un contador invalido.");
      }

      const count = Number(result[0]);
      const ttlMs = Number(result[1]);

      if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
        throw new Error("Redis devolvio un contador invalido.");
      }

      return { count, ttlMs };
    },
  };
}

export const redisRateLimitStore = createRedisRateLimitStore(getRedisClient);

export async function consumeRateLimit({
  failureMode,
  key,
  limit,
  onUnavailable,
  store,
  windowMs,
}: ConsumeRateLimitInput): Promise<RateLimitResult> {
  try {
    const { count, ttlMs } = await store.consume(key, windowMs);
    const allowed = count <= limit;

    return {
      allowed,
      reason: allowed ? "allowed" : "exceeded",
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1_000)),
    };
  } catch {
    onUnavailable?.();

    return {
      allowed: failureMode === "open",
      reason: "unavailable",
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1_000)),
    };
  }
}

export function logRateLimitUnavailable(scope: string) {
  logger.error("rate_limit_store_unavailable", { scope });
}
