import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenewalsPage from "@/app/admin/renewals/page";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireStaffContext: vi.fn(),
  canRenewPlans: vi.fn(),
  listRenewalQueue: vi.fn(),
  listRenewalHistory: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext: mocks.requireStaffContext }));
vi.mock("@/lib/permissions/guards", () => ({ canRenewPlans: mocks.canRenewPlans }));
vi.mock("@/modules/renewals/queries", () => ({
  listRenewalQueue: mocks.listRenewalQueue,
  listRenewalHistory: mocks.listRenewalHistory,
}));
vi.mock("@/components/renewals/renewals-workbench", () => ({
  RenewalsWorkbench: () => <div>Cola operativa</div>,
}));
vi.mock("@/components/renewals/renewal-history-table", () => ({
  RenewalHistoryTable: () => <div>Historial real</div>,
}));

describe("RenewalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStaffContext.mockResolvedValue({ profile: { role: "admin" } });
    mocks.canRenewPlans.mockReturnValue(true);
    mocks.listRenewalQueue.mockResolvedValue({ counts: { pending: 4 } });
    mocks.listRenewalHistory.mockResolvedValue({ items: [] });
  });

  it("usa Pendientes por defecto y elimina las tablas duplicadas", async () => {
    render(await RenewalsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Cola operativa")).toBeInTheDocument();
    expect(mocks.listRenewalQueue).toHaveBeenCalledWith(expect.objectContaining({ view: "pending" }));
    expect(screen.queryByText("Próximas renovaciones")).not.toBeInTheDocument();
    expect(screen.queryByText("Cupos bajos")).not.toBeInTheDocument();
  });

  it("reemplaza la superficie con el historial solicitado por URL", async () => {
    render(await RenewalsPage({ searchParams: Promise.resolve({ view: "history", q: "ana", page: "2" }) }));

    expect(screen.getByText("Historial real")).toBeInTheDocument();
    expect(mocks.listRenewalHistory).toHaveBeenCalledWith(expect.objectContaining({ q: "ana", page: 2 }));
    expect(mocks.listRenewalQueue).not.toHaveBeenCalled();
  });
});
