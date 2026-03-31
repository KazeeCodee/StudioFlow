import { describe, expect, it } from "vitest";
import { summarizeSpaceUsage } from "@/services/dashboard/summarize-space-usage";

describe("summarizeSpaceUsage", () => {
  it("agrupa por espacio, ordena por horas y calcula participacion", () => {
    const result = summarizeSpaceUsage([
      {
        spaceId: "space-1",
        spaceName: "Set Podcast",
        durationHours: 2,
        quotaConsumed: 4,
      },
      {
        spaceId: "space-2",
        spaceName: "Estudio A",
        durationHours: 3,
        quotaConsumed: 3,
      },
      {
        spaceId: "space-1",
        spaceName: "Set Podcast",
        durationHours: 1,
        quotaConsumed: 2,
      },
    ]);

    expect(result).toEqual([
      {
        spaceId: "space-1",
        spaceName: "Set Podcast",
        bookedHours: 3,
        quotaConsumed: 6,
        sharePercentage: 50,
      },
      {
        spaceId: "space-2",
        spaceName: "Estudio A",
        bookedHours: 3,
        quotaConsumed: 3,
        sharePercentage: 50,
      },
    ]);
  });
});
