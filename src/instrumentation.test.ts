import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.fn();
const loggerInfo = vi.fn();

vi.mock("@/lib/env", () => ({ getEnv }));
vi.mock("@/lib/logger", () => ({ logger: { info: loggerInfo } }));

describe("instrumentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
  });

  it("valida el entorno al registrar el runtime Node", async () => {
    getEnv.mockReturnValue({ NODE_ENV: "production" });
    const { register } = await import("@/instrumentation");

    await register();

    expect(getEnv).toHaveBeenCalledTimes(1);
    expect(loggerInfo).toHaveBeenCalledWith("application_started", {
      runtime: "nodejs",
    });
  });

  it("no carga validacion Node en el runtime edge", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    const { register } = await import("@/instrumentation");

    await register();

    expect(getEnv).not.toHaveBeenCalled();
  });
});
