import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { memberPlans, renewals } from "@/lib/db/schema";

describe("renewal persistence schema", () => {
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
});
