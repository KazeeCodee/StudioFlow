import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RenewalsWorkbench } from "@/components/renewals/renewals-workbench";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/modules/renewals/actions", () => ({
  initialRenewalActionState: { status: "idle", message: "" },
  renewMemberPlanAction: vi.fn(),
}));

const now = new Date("2026-07-14T15:00:00.000Z");
const items = [
  {
    memberPlanId: "68fae66e-3471-4f63-b9ed-4f5d2ea1b0ce",
    memberId: "member-1",
    memberName: "Ana Perez",
    memberEmail: "ana@example.com",
    memberPhone: "+54 11 5555 1111",
    planName: "Estudio 10",
    planPrice: "25000.00",
    planDurationType: "monthly" as const,
    planDurationValue: 1,
    planQuotaAmount: 10,
    endsAt: new Date("2026-07-14T15:00:00.000Z"),
    nextPaymentDueAt: new Date("2026-07-14T15:00:00.000Z"),
    quotaRemaining: 2,
    quotaUsed: 8,
    quotaTotal: 10,
    lastRenewedAt: null,
  },
  {
    memberPlanId: "6e29bbff-bb1d-4d10-bdc6-ac87ea3f0cec",
    memberId: "member-2",
    memberName: "Beto Gomez",
    memberEmail: "beto@example.com",
    memberPhone: null,
    planName: "Estudio 6",
    planPrice: "18000.00",
    planDurationType: "monthly" as const,
    planDurationValue: 1,
    planQuotaAmount: 6,
    endsAt: new Date("2026-07-18T15:00:00.000Z"),
    nextPaymentDueAt: new Date("2026-07-18T15:00:00.000Z"),
    quotaRemaining: 4,
    quotaUsed: 2,
    quotaTotal: 6,
    lastRenewedAt: null,
  },
];

const result = {
  items,
  counts: { all: 2, pending: 2, overdue: 0, dueSoon: 2 },
  pagination: { page: 1, pageSize: 25, total: 2, pageCount: 1 },
  renewalWindowDays: 7,
  now,
};

describe("RenewalsWorkbench", () => {
  it("presenta una sola tabla operativa con datos y acciones contextuales", () => {
    render(<RenewalsWorkbench result={result} view="pending" q="" />);

    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getAllByText("Ana Perez").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Revisar pago de Ana Perez" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Historial/i })).toHaveAttribute("href", expect.stringContaining("view=history"));
  });

  it("mantiene una sola revision abierta", async () => {
    const user = userEvent.setup();
    render(<RenewalsWorkbench result={result} view="pending" q="" />);

    await user.click(screen.getByRole("button", { name: "Revisar pago de Ana Perez" }));
    expect(screen.getByRole("region", { name: "Verificar pago de Ana Perez" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revisar pago de Beto Gomez" }));
    expect(screen.queryByRole("region", { name: "Verificar pago de Ana Perez" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Verificar pago de Beto Gomez" })).toBeInTheDocument();
  });
});
