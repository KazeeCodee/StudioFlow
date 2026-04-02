import { describe, expect, it } from "vitest";
import { buildSpaceWriteValues } from "@/services/spaces/build-space-write-values";

describe("buildSpaceWriteValues", () => {
  it("normalizes nullable values for persistence", () => {
    const result = buildSpaceWriteValues({
      name: "Sala Podcast",
      slug: "sala-podcast",
      description: "Set para grabacion",
      imageUrl: "",
      capacity: null,
      status: "active",
      hourlyQuotaCost: 2,
      minBookingHours: 1,
      maxBookingHours: 4,
      availabilityRules: [],
    });

    expect(result.imageUrl).toBeNull();
    expect(result.capacity).toBeNull();
    expect(result.slug).toBe("sala-podcast");
  });
});
