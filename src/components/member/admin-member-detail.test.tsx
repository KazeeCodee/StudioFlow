import { render, screen } from "@testing-library/react";
import { AdminMemberDetail } from "@/components/member/admin-member-detail";

describe("AdminMemberDetail", () => {
  it("renders the member summary and operational sections", () => {
    render(
      <AdminMemberDetail
        member={{
          id: "member-1",
          fullName: "Ana Perez",
          email: "ana@example.com",
          phone: "+54 11 1111 1111",
          notes: "Prefiere turno manana",
          status: "active",
          profileId: "profile-1",
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-02T12:00:00Z"),
          deleteSummary: {
            canDelete: true,
            bookingCount: 0,
            planCount: 0,
            renewalCount: 0,
          },
          activePlan: {
            memberPlanId: "member-plan-1",
            planId: "plan-1",
            planName: "Plan Creator",
            status: "active",
            startsAt: new Date("2026-04-01T12:00:00Z"),
            endsAt: new Date("2026-05-01T12:00:00Z"),
            nextPaymentDueAt: new Date("2026-05-01T12:00:00Z"),
            quotaTotal: 12,
            quotaUsed: 4,
            quotaRemaining: 8,
          },
          planHistory: [
            {
              id: "member-plan-1",
              planId: "plan-1",
              planName: "Plan Creator",
              status: "active",
              startsAt: new Date("2026-04-01T12:00:00Z"),
              endsAt: new Date("2026-05-01T12:00:00Z"),
              quotaRemaining: 8,
            },
          ],
        }}
        planOptions={[
          {
            id: "plan-1",
            name: "Plan Creator",
            quotaAmount: 12,
            durationType: "monthly",
            durationValue: 1,
          },
          {
            id: "plan-2",
            name: "Plan Pro",
            quotaAmount: 20,
            durationType: "monthly",
            durationValue: 1,
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Plan Creator")).toHaveLength(2);
    expect(screen.getByText("Editar ficha")).toBeInTheDocument();
    expect(screen.getByText("Cambiar estado")).toBeInTheDocument();
    expect(screen.getByText("Ajuste manual de cupos")).toBeInTheDocument();
    expect(screen.getByText("Cambiar plan")).toBeInTheDocument();
    expect(screen.getByText("Historial reciente de planes")).toBeInTheDocument();
    expect(screen.getByText("Zona de acciones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocultar miembro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar miembro" })).toBeInTheDocument();
  });

  it("shows why a member cannot be deleted when it has history", () => {
    render(
      <AdminMemberDetail
        member={{
          id: "member-1",
          fullName: "Ana Perez",
          email: "ana@example.com",
          phone: null,
          notes: null,
          status: "active",
          profileId: "profile-1",
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-02T12:00:00Z"),
          deleteSummary: {
            canDelete: false,
            bookingCount: 2,
            planCount: 1,
            renewalCount: 0,
          },
          activePlan: {
            memberPlanId: "member-plan-1",
            planId: "plan-1",
            planName: "Plan Creator",
            status: "active",
            startsAt: new Date("2026-04-01T12:00:00Z"),
            endsAt: new Date("2026-05-01T12:00:00Z"),
            nextPaymentDueAt: new Date("2026-05-01T12:00:00Z"),
            quotaTotal: 12,
            quotaUsed: 4,
            quotaRemaining: 8,
          },
          planHistory: [],
        }}
        planOptions={[]}
      />,
    );

    expect(screen.getByText(/No se puede eliminar mientras conserve historial/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar miembro" })).not.toBeInTheDocument();
  });
});
