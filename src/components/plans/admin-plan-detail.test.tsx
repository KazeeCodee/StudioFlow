import { render, screen } from "@testing-library/react";
import { AdminPlanDetail } from "@/components/plans/admin-plan-detail";

describe("AdminPlanDetail", () => {
  it("renders summary, rules form and status management", () => {
    render(
      <AdminPlanDetail
        plan={{
          id: "plan-1",
          name: "Plan Pro",
          description: "Incluye prioridad",
          status: "active",
          durationType: "monthly",
          durationValue: 1,
          quotaAmount: 20,
          price: "12500.00",
          cancellationPolicyHours: 24,
          maxBookingsPerDay: 2,
          maxBookingsPerWeek: 5,
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-02T12:00:00Z"),
          deleteSummary: {
            canDelete: true,
            memberPlanCount: 0,
          },
        }}
      />,
    );

    expect(screen.getByText("Editar reglas del plan")).toBeInTheDocument();
    expect(screen.getByText("Estado del plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Plan Pro")).toBeInTheDocument();
    expect(screen.getByDisplayValue("active")).toBeInTheDocument();
    expect(screen.getByText("Zona de acciones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocultar plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar plan" })).toBeInTheDocument();
  });

  it("shows a safeguard when the plan is still assigned", () => {
    render(
      <AdminPlanDetail
        plan={{
          id: "plan-1",
          name: "Plan Pro",
          description: "Incluye prioridad",
          status: "active",
          durationType: "monthly",
          durationValue: 1,
          quotaAmount: 20,
          price: "12500.00",
          cancellationPolicyHours: 24,
          maxBookingsPerDay: 2,
          maxBookingsPerWeek: 5,
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-02T12:00:00Z"),
          deleteSummary: {
            canDelete: false,
            memberPlanCount: 3,
          },
        }}
      />,
    );

    expect(screen.getByText(/No se puede eliminar mientras esté asignado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar plan" })).not.toBeInTheDocument();
  });
});
