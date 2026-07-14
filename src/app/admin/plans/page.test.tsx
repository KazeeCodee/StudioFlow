import { render, screen } from "@testing-library/react";
import PlansPage from "@/app/admin/plans/page";

const {
  mockRedirect,
  mockRequireStaffContext,
  mockCanManagePlans,
  mockListPlans,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockRequireStaffContext: vi.fn(),
  mockCanManagePlans: vi.fn(),
  mockListPlans: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

vi.mock("@/lib/permissions/guards", () => ({
  canManagePlans: mockCanManagePlans,
}));

vi.mock("@/modules/plans/queries", () => ({
  listPlans: mockListPlans,
}));

describe("PlansPage", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        id: "staff-1",
        role: "admin",
      },
    });
    mockCanManagePlans.mockReturnValue(true);
    mockListPlans.mockResolvedValue([
      {
        id: "plan-1",
        name: "Plan Pro",
        description: "Plan mensual para miembros frecuentes",
        status: "active",
        durationType: "monthly",
        durationValue: 1,
        quotaAmount: 10,
        price: "45000.00",
        cancellationPolicyHours: 24,
        maxBookingsPerDay: null,
        maxBookingsPerWeek: null,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    ]);
  });

  afterEach(() => {
    mockRedirect.mockReset();
    mockRequireStaffContext.mockReset();
    mockCanManagePlans.mockReset();
    mockListPlans.mockReset();
  });

  it("abre el detalle desde toda la fila del plan", async () => {
    render(await PlansPage());

    expect(
      screen.getByRole("link", { name: "Ver detalle de Plan Pro" }),
    ).toHaveAttribute("href", "/admin/plans/plan-1");
  });
});
