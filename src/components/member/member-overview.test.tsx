import { render, screen } from "@testing-library/react";
import { MemberOverview } from "@/components/member/member-overview";

describe("MemberOverview", () => {
  it("muestra plan, cupos y proxima reserva", () => {
    render(
      <MemberOverview
        data={{
          memberName: "Ana Perez",
          activePlan: {
            planName: "Plan Creator",
            quotaRemaining: 8,
            quotaTotal: 12,
            nextPaymentDueAt: new Date("2026-04-05T12:00:00Z"),
            cancellationPolicyHours: 24,
          },
          upcomingBookingsCount: 3,
          nextBooking: {
            startsAt: new Date("2026-04-02T15:00:00Z"),
            spaceName: "Estudio A",
          },
        }}
      />,
    );

    expect(screen.getByText("Plan Creator")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3 reservas por delante")).toBeInTheDocument();
    expect(screen.getByText("Proxima reserva")).toBeInTheDocument();
    expect(screen.getByText(/Estudio A/)).toBeInTheDocument();
  });
});
