import { describe, expect, it } from "vitest";
import { spaceSchema } from "@/modules/spaces/schema";

describe("spaceSchema", () => {
  it("requiere costo horario entero mayor o igual a 1", () => {
    const result = spaceSchema.safeParse({
      name: "Estudio A",
      slug: "estudio-a",
      hourlyQuotaCost: 1,
      minBookingHours: 1,
      maxBookingHours: 4,
    });

    expect(result.success).toBe(true);
  });
});
