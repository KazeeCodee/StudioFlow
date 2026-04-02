import { render, screen } from "@testing-library/react";
import { AdminSpaceDetail } from "@/components/spaces/admin-space-detail";

describe("AdminSpaceDetail", () => {
  it("renders edit controls and block management", () => {
    render(
      <AdminSpaceDetail
        space={{
          id: "space-1",
          name: "Sala Podcast",
          slug: "sala-podcast",
          description: "Set principal",
          imageUrl: null,
          capacity: 4,
          status: "active",
          hourlyQuotaCost: 2,
          minBookingHours: 1,
          maxBookingHours: 4,
          createdAt: new Date("2026-04-01T12:00:00Z"),
          updatedAt: new Date("2026-04-02T12:00:00Z"),
          availability: [
            {
              id: "rule-1",
              dayOfWeek: 1,
              startTime: "09:00:00",
              endTime: "18:00:00",
              isActive: true,
            },
          ],
          blocks: [
            {
              id: "block-1",
              title: "Mantenimiento",
              reason: "Ajuste tecnico",
              startsAt: new Date("2026-04-03T12:00:00Z"),
              endsAt: new Date("2026-04-03T14:00:00Z"),
              createdAt: new Date("2026-04-01T12:00:00Z"),
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Editar espacio")).toBeInTheDocument();
    expect(screen.getByText("Bloqueos operativos")).toBeInTheDocument();
    expect(screen.getAllByText("Mantenimiento")).toHaveLength(2);
    expect(screen.getByDisplayValue("Sala Podcast")).toBeInTheDocument();
  });
});
