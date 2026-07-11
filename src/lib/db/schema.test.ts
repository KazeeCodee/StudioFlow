import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  bookings,
  memberPlans,
  plans,
  spaceAvailabilityRules,
  spaces,
} from "@/lib/db/schema";

describe("schema", () => {
  it("define las tablas clave del negocio", () => {
    expect(plans).toBeDefined();
    expect(memberPlans).toBeDefined();
    expect(spaces).toBeDefined();
    expect(bookings).toBeDefined();
  });

  it("protege los rangos de disponibilidad del espacio", () => {
    const config = getTableConfig(spaceAvailabilityRules);

    expect(config.indexes.map((index) => index.config.name)).toContain(
      "space_availability_rules_space_day_idx",
    );
    expect(config.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        "space_availability_rules_weekday_check",
        "space_availability_rules_time_order_check",
      ]),
    );
  });
});
