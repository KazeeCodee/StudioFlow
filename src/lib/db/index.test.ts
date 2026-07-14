import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabasePoolMax } from "@/lib/db";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getDatabasePoolMax", () => {
  it("usa cinco conexiones por defecto en produccion", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_POOL_MAX", "");

    expect(getDatabasePoolMax()).toBe(5);
  });

  it("respeta un limite positivo configurado", () => {
    vi.stubEnv("DATABASE_POOL_MAX", "3");

    expect(getDatabasePoolMax()).toBe(3);
  });
});
