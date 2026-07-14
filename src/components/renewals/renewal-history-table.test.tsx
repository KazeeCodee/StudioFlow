import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RenewalHistoryTable } from "@/components/renewals/renewal-history-table";

describe("RenewalHistoryTable", () => {
  it("muestra eventos reales y distingue registros anteriores sin evidencia", () => {
    render(
      <RenewalHistoryTable
        q=""
        result={{
          items: [
            {
              id: "renewal-1",
              memberPlanId: "plan-1",
              memberId: "member-1",
              memberName: "Ana Perez",
              memberEmail: "ana@example.com",
              planName: "Estudio 10",
              renewedByName: "Admin Uno",
              renewedAt: new Date("2026-07-14T15:00:00.000Z"),
              oldEndDate: new Date("2026-07-14T15:00:00.000Z"),
              newEndDate: new Date("2026-08-14T15:00:00.000Z"),
              oldQuotaRemaining: 2,
              newQuotaTotal: 10,
              amountReceived: "25000.00",
              currency: "ARS",
              paymentMethod: "bank_transfer",
              paidAt: new Date("2026-07-14T12:00:00.000Z"),
              externalReference: "TRX-8821",
              notes: null,
            },
            {
              id: "renewal-legacy",
              memberPlanId: "plan-2",
              memberId: "member-2",
              memberName: "Beto Gomez",
              memberEmail: "beto@example.com",
              planName: "Estudio 6",
              renewedByName: null,
              renewedAt: new Date("2026-06-14T15:00:00.000Z"),
              oldEndDate: new Date("2026-06-14T15:00:00.000Z"),
              newEndDate: new Date("2026-07-14T15:00:00.000Z"),
              oldQuotaRemaining: 0,
              newQuotaTotal: 6,
              amountReceived: null,
              currency: "ARS",
              paymentMethod: null,
              paidAt: null,
              externalReference: null,
              notes: null,
            },
          ],
          pagination: { page: 1, pageSize: 25, total: 2, pageCount: 1 },
        }}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getByText(/TRX-8821/)).toBeInTheDocument();
    expect(screen.getByText(/Sin detalle de pago/i)).toBeInTheDocument();
  });
});
