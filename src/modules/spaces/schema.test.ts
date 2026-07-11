import { describe, expect, it } from "vitest";
import { parseAvailabilityRulesField, spaceSchema } from "@/modules/spaces/schema";

const baseSpace = {
  name: "Estudio A",
  slug: "estudio-a",
  hourlyQuotaCost: 1,
  minBookingHours: 1,
  maxBookingHours: 4,
};

describe("spaceSchema", () => {
  it("requiere costo horario entero mayor o igual a 1", () => {
    const result = spaceSchema.safeParse(baseSpace);

    expect(result.success).toBe(true);
  });

  it("acepta varios rangos separados para el mismo dia", () => {
    const result = spaceSchema.safeParse({
      ...baseSpace,
      availabilityRules: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
        { dayOfWeek: 1, startTime: "14:00", endTime: "22:00", isActive: true },
      ],
    });

    expect(result.success).toBe(true);
  });

  it.each([
    [
      "superpuestos",
      [
        { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
        { dayOfWeek: 1, startTime: "11:00", endTime: "14:00", isActive: true },
      ],
    ],
    [
      "duplicados",
      [
        { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
        { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
      ],
    ],
    [
      "invertidos",
      [{ dayOfWeek: 1, startTime: "18:00", endTime: "09:00", isActive: true }],
    ],
    [
      "mal formados",
      [{ dayOfWeek: 1, startTime: "8:00", endTime: "12:00", isActive: true }],
    ],
  ])("rechaza rangos %s", (_label, availabilityRules) => {
    expect(spaceSchema.safeParse({ ...baseSpace, availabilityRules }).success).toBe(false);
  });

  it("lee rangos serializados desde FormData", () => {
    expect(
      parseAvailabilityRulesField(
        JSON.stringify([
          { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
        ]),
      ),
    ).toEqual([
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
    ]);
  });

  it("rechaza JSON invalido en la disponibilidad", () => {
    expect(() => parseAvailabilityRulesField("{")).toThrow(/disponibilidad/i);
  });
});
