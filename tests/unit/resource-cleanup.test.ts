import { describe, expect, it, vi } from "vitest";
import { closeSqlAfterCleanup } from "../e2e/support/resource-cleanup";

describe("closeSqlAfterCleanup", () => {
  it("cierra SQL despues de una limpieza exitosa", async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const end = vi.fn().mockResolvedValue(undefined);

    await closeSqlAfterCleanup({ end }, cleanup);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledWith({ timeout: 5 });
  });

  it("cierra SQL aunque falle la limpieza", async () => {
    const end = vi.fn().mockResolvedValue(undefined);

    await expect(
      closeSqlAfterCleanup({ end }, async () => {
        throw new Error("cleanup failed");
      }),
    ).rejects.toThrow("cleanup failed");
    expect(end).toHaveBeenCalledWith({ timeout: 5 });
  });
});
