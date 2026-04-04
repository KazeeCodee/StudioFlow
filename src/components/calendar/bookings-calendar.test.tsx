import { render, screen } from "@testing-library/react";
import { BookingsCalendar } from "@/components/calendar/bookings-calendar";

describe("BookingsCalendar", () => {
  it("renderiza eventos recibidos", () => {
    const { container } = render(
      <BookingsCalendar
        events={[
          {
            id: "1",
            title: "Reserva",
            start: "2026-04-01T10:00:00Z",
            end: "2026-04-01T11:00:00Z",
            extendedProps: {
              type: "booking",
              resourceLabel: "Estudio A",
              secondaryLabel: "Ana Pérez",
            },
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Reserva").length).toBeGreaterThan(0);
    expect(container.querySelector(".studio-calendar")).toBeInTheDocument();
  });
});
