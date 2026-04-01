import { describe, expect, it } from "vitest";
import {
  getStudioDateTimeParts,
  parseStudioDateTimeInput,
} from "@/lib/datetime";

describe("parseStudioDateTimeInput", () => {
  it("interpreta datetime-local en la zona horaria del estudio", () => {
    const result = parseStudioDateTimeInput("2026-04-01T10:00");

    expect(result.toISOString()).toBe("2026-04-01T13:00:00.000Z");
  });
});

describe("getStudioDateTimeParts", () => {
  it("expone las partes locales del estudio para horarios y agenda", () => {
    const result = getStudioDateTimeParts(new Date("2026-04-01T13:00:00.000Z"));

    expect(result).toMatchObject({
      year: 2026,
      month: 4,
      day: 1,
      hour: 10,
      minute: 0,
      second: 0,
      dayOfWeek: 3,
    });
  });
});
