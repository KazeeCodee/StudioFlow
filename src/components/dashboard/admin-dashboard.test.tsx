import { render, screen } from "@testing-library/react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

describe("AdminDashboard", () => {
  it("renderiza metricas, agenda y uso por espacio", () => {
    render(
      <AdminDashboard
        data={{
          metrics: {
            bookingsToday: 7,
            bookedHoursThisWeek: 22,
            activeMembers: 14,
            upcomingRenewals: 4,
            lowQuotaPlans: 2,
          },
          todayAgenda: [
            {
              id: "booking-1",
              startsAt: new Date("2026-03-31T13:00:00Z"),
              endsAt: new Date("2026-03-31T15:00:00Z"),
              status: "confirmed",
              memberName: "Ana Perez",
              spaceName: "Estudio A",
              quotaConsumed: 2,
            },
          ],
          spaceUsage: [
            {
              spaceId: "space-1",
              spaceName: "Estudio A",
              bookedHours: 10,
              quotaConsumed: 10,
              sharePercentage: 63,
            },
          ],
          recentCancellations: [
            {
              id: "booking-2",
              startsAt: new Date("2026-03-31T18:00:00Z"),
              status: "cancelled_by_user",
              memberName: "Nico Diaz",
              spaceName: "Sala Podcast",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Reservas hoy")).toBeInTheDocument();
    expect(screen.getByText("22 h")).toBeInTheDocument();
    expect(screen.getByText("Agenda de hoy")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Uso por espacio")).toBeInTheDocument();
    expect(screen.getByText("63% del total semanal")).toBeInTheDocument();
    expect(screen.getByText("Cancelaciones recientes")).toBeInTheDocument();
    expect(screen.getByText("Nico Diaz")).toBeInTheDocument();
  });
});
