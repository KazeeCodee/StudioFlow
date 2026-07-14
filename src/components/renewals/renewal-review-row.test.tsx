import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RenewalReviewRow } from "@/components/renewals/renewal-review-row";

const renewAction = vi.hoisted(() => vi.fn());

vi.mock("@/modules/renewals/actions", () => ({
  initialRenewalActionState: { status: "idle", message: "" },
  renewMemberPlanAction: renewAction,
}));

const item = {
  memberPlanId: "68fae66e-3471-4f63-b9ed-4f5d2ea1b0ce",
  memberId: "member-1",
  memberName: "Ana Perez",
  memberEmail: "ana@example.com",
  memberPhone: null,
  planName: "Estudio 10",
  planPrice: "25000.00",
  planDurationType: "monthly" as const,
  planDurationValue: 1,
  planQuotaAmount: 10,
  endsAt: new Date("2026-07-31T15:00:00.000Z"),
  nextPaymentDueAt: new Date("2026-07-31T15:00:00.000Z"),
  quotaRemaining: 2,
  quotaUsed: 8,
  quotaTotal: 10,
  lastRenewedAt: null,
};

describe("RenewalReviewRow", () => {
  beforeEach(() => {
    renewAction.mockReset();
  });

  it("requiere verificacion explicita y muestra la vista previa", async () => {
    const user = userEvent.setup();
    render(
      <RenewalReviewRow
        item={item}
        now={new Date("2026-07-14T15:00:00.000Z")}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Antes")).toBeInTheDocument();
    expect(screen.getByText("Después")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Confirmar pago y renovar" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /confirmo que verifiqué/i }));
    expect(submit).toBeEnabled();
  });

  it("conserva el resultado visible hasta que el operador continua", async () => {
    const user = userEvent.setup();
    renewAction.mockResolvedValue({
      status: "success",
      message: "Pago confirmado y plan de Ana Perez renovado.",
      newEndDate: "2026-08-31T15:00:00.000Z",
      quotaRemaining: 10,
      notificationStatus: "sent",
    });
    render(
      <RenewalReviewRow
        item={item}
        now={new Date("2026-07-14T15:00:00.000Z")}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^Referencia/), "TRX-9001");
    await user.click(screen.getByRole("checkbox", { name: /confirmo que verifiqué/i }));
    await user.click(screen.getByRole("button", { name: "Confirmar pago y renovar" }));

    expect(await screen.findByText("Pago confirmado y plan de Ana Perez renovado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar siguiente" })).toBeInTheDocument();
  });
});
