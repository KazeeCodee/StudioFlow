import { describe, expect, it, vi } from "vitest";
import {
  consumeRateLimit,
  createRedisRateLimitStore,
  type RateLimitStore,
} from "@/lib/rate-limit";

class FakeRateLimitStore implements RateLimitStore {
  private now = 0;
  private readonly counters = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  advance(milliseconds: number) {
    this.now += milliseconds;
  }

  async consume(key: string, windowMs: number) {
    const current = this.counters.get(key);
    const counter =
      !current || current.expiresAt <= this.now
        ? { count: 0, expiresAt: this.now + windowMs }
        : current;

    counter.count += 1;
    this.counters.set(key, counter);

    return {
      count: counter.count,
      ttlMs: counter.expiresAt - this.now,
    };
  }
}

describe("consumeRateLimit", () => {
  it("permite solicitudes dentro del limite", async () => {
    const result = await consumeRateLimit({
      failureMode: "closed",
      key: "rate-limit:test:hash",
      limit: 2,
      store: new FakeRateLimitStore(),
      windowMs: 60_000,
    });

    expect(result).toMatchObject({
      allowed: true,
      reason: "allowed",
      remaining: 1,
    });
  });

  it("rechaza solicitudes que exceden el limite", async () => {
    const store = new FakeRateLimitStore();
    const input = {
      failureMode: "closed" as const,
      key: "rate-limit:test:hash",
      limit: 2,
      store,
      windowMs: 60_000,
    };

    await consumeRateLimit(input);
    await consumeRateLimit(input);
    const result = await consumeRateLimit(input);

    expect(result).toMatchObject({
      allowed: false,
      reason: "exceeded",
      remaining: 0,
      retryAfterSeconds: 60,
    });
  });

  it("abre una ventana nueva despues de expirar", async () => {
    const store = new FakeRateLimitStore();
    const input = {
      failureMode: "closed" as const,
      key: "rate-limit:test:hash",
      limit: 1,
      store,
      windowMs: 1_000,
    };

    await consumeRateLimit(input);
    store.advance(1_001);

    await expect(consumeRateLimit(input)).resolves.toMatchObject({
      allowed: true,
      reason: "allowed",
    });
  });

  it("falla cerrado cuando el store no esta disponible", async () => {
    const unavailableStore: RateLimitStore = {
      consume: async () => {
        throw new Error("connection details must not leak");
      },
    };

    await expect(
      consumeRateLimit({
        failureMode: "closed",
        key: "rate-limit:test:hash",
        limit: 1,
        store: unavailableStore,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "unavailable",
      remaining: 0,
    });
  });

  it("falla abierto para acciones autenticadas cuando el store no esta disponible", async () => {
    const onUnavailable = vi.fn();
    const unavailableStore: RateLimitStore = {
      consume: async () => {
        throw new Error("connection details must not leak");
      },
    };

    await expect(
      consumeRateLimit({
        failureMode: "open",
        key: "rate-limit:test:hash",
        limit: 1,
        onUnavailable,
        store: unavailableStore,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({
      allowed: true,
      reason: "unavailable",
    });
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});

describe("createRedisRateLimitStore", () => {
  it("incrementa y configura expiracion en un unico script atomico", async () => {
    const evaluate = vi.fn().mockResolvedValue([1, 60_000]);
    const store = createRedisRateLimitStore(async () => ({ eval: evaluate }));

    await expect(store.consume("rate-limit:test:hash", 60_000)).resolves.toEqual({
      count: 1,
      ttlMs: 60_000,
    });

    expect(evaluate).toHaveBeenCalledWith(
      expect.stringContaining("PEXPIRE"),
      {
        arguments: ["60000"],
        keys: ["rate-limit:test:hash"],
      },
    );
    expect(evaluate.mock.calls[0][0]).toContain("INCR");
  });
});
