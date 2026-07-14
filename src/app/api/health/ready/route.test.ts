import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ execute }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde ready cuando la base acepta select 1", async () => {
    execute.mockResolvedValueOnce([{ ready: 1 }]);
    const { GET } = await import("@/app/api/health/ready/route");

    const response = await GET();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it("responde 503 sin detalles internos cuando falla la base", async () => {
    execute.mockRejectedValueOnce(new Error("postgres://user:secret@db/internal"));
    const { GET } = await import("@/app/api/health/ready/route");

    const response = await GET();
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(serialized).toBe('{"status":"unavailable"}');
    expect(serialized).not.toContain("postgres");
    expect(serialized).not.toContain("secret");
  });

  it("tolera una conexion fria de dos segundos", async () => {
    vi.useFakeTimers();
    execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([{ ready: 1 }]), 2_000);
        }),
    );
    const { GET } = await import("@/app/api/health/ready/route");

    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(2_000);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    vi.useRealTimers();
  });

  it("acota el tiempo de espera de la consulta", async () => {
    vi.useFakeTimers();
    execute.mockReturnValueOnce(new Promise(() => undefined));
    const { GET } = await import("@/app/api/health/ready/route");

    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(5_000);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    vi.useRealTimers();
  });
});
