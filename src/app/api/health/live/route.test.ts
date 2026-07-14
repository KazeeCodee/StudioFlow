import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/live/route";

describe("GET /api/health/live", () => {
  it("responde sin consultar dependencias", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
