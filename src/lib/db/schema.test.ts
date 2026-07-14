import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  bookings,
  memberPlans,
  plans,
  renewals,
  spaceAvailabilityRules,
  spaces,
} from "@/lib/db/schema";

describe("renewal persistence schema", () => {
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

  it("stores structured payment evidence without invalidating legacy records", () => {
    const columns = getTableColumns(renewals);

    expect(columns.amountReceived.name).toBe("amount_received");
    expect(columns.amountReceived.notNull).toBe(false);
    expect(columns.currency.name).toBe("currency");
    expect(columns.currency.notNull).toBe(true);
    expect(columns.paymentMethod.name).toBe("payment_method");
    expect(columns.paidAt.name).toBe("paid_at");
    expect(columns.externalReference.name).toBe("external_reference");
  });

  it("indexes the operational queue and renewal history order", () => {
    const memberPlanIndexes = getTableConfig(memberPlans).indexes.map(
      (index) => index.config.name,
    );
    const renewalIndexes = getTableConfig(renewals).indexes.map(
      (index) => index.config.name,
    );

    expect(memberPlanIndexes).toContain("member_plans_status_due_idx");
    expect(renewalIndexes).toContain("renewals_renewed_at_idx");
  });

  it("declara las restricciones de ventanas y cuotas", () => {
    expect(getTableConfig(bookings).checks.map((check) => check.name)).toContain(
      "bookings_valid_window",
    );
    expect(
      getTableConfig(memberPlans).checks.map((check) => check.name),
    ).toContain("member_plans_valid_quota");
  });
});
