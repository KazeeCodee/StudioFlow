import { describe, expect, it } from "vitest";
import {
  operationalSettingsDefaults,
  operationalSettingsSchema,
} from "@/modules/settings/schema";

describe("operationalSettingsSchema", () => {
  it("normaliza enteros válidos para reglas operativas", () => {
    const result = operationalSettingsSchema.parse({
      renewalWindowDays: "10",
      lowQuotaThreshold: "4",
      bookingBufferHours: "1",
    });

    expect(result).toEqual({
      renewalWindowDays: 10,
      lowQuotaThreshold: 4,
      bookingBufferHours: 1,
    });
  });

  it("expone defaults seguros para el MVP", () => {
    expect(operationalSettingsDefaults).toEqual({
      renewalWindowDays: 7,
      lowQuotaThreshold: 3,
      bookingBufferHours: 0,
    });
  });
});
