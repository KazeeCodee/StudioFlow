import { render, screen } from "@testing-library/react";
import { BookingDetail } from "@/components/bookings/booking-detail";

describe("BookingDetail", () => {
  it("muestra resumen, historial y acciones de reprogramacion/cancelacion", () => {
    render(
      <BookingDetail
        role="admin"
        booking={{
          id: "booking-1",
          status: "confirmed",
          startsAt: new Date("2026-04-04T12:00:00Z"),
          endsAt: new Date("2026-04-04T14:00:00Z"),
          durationHours: 2,
          quotaConsumed: 4,
          cancellationReason: null,
          cancelledAt: null,
          memberName: "Ana Perez",
          memberEmail: "ana@studioflow.com",
          spaceName: "Sala Podcast",
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-01T12:00:00Z"),
          cancellationPolicyHours: 24,
          timeline: [
            {
              id: "history-1",
              kind: "status",
              createdAt: new Date("2026-04-01T12:00:00Z"),
              actorName: "Walter Admin",
              label: "Reserva creada",
              description: "Estado confirmado",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Reserva #booking-1")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Sala Podcast")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar reprogramacion/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar reserva/i })).toBeInTheDocument();
    expect(screen.getByText("Reserva creada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-04T09:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-04T11:00")).toBeInTheDocument();
    expect(
      screen.getAllByText(/los cupos siguen consumidos/i),
    ).toHaveLength(2);
  });
});
