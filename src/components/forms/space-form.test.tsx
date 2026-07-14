import { render, screen } from "@testing-library/react";
import { SpaceForm } from "@/components/forms/space-form";

describe("SpaceForm", () => {
  it("prioriza subida de imagen real y conserva la referencia actual en edicion", () => {
    render(
      <SpaceForm
        defaultValues={{
          name: "Sala Podcast",
          imageUrl: "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/actual.jpg",
          hourlyQuotaCost: 2,
          minBookingHours: 1,
          maxBookingHours: 4,
          availabilityRules: [],
        }}
      />,
    );

    expect(screen.getByLabelText(/subir imagen/i)).toHaveAttribute("type", "file");
    expect(screen.getByLabelText(/subir imagen/i)).toHaveAttribute(
      "accept",
      "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    );
    expect(screen.getByLabelText(/eliminar imagen actual/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/imagen principal/i)).not.toBeInTheDocument();
  });

  it("muestra todos los rangos existentes del mismo dia al editar", () => {
    render(
      <SpaceForm
        defaultValues={{
          name: "Sala Podcast",
          hourlyQuotaCost: 2,
          minBookingHours: 1,
          maxBookingHours: 4,
          availabilityRules: [
            { dayOfWeek: 1, isActive: true, startTime: "08:00:00", endTime: "12:00:00" },
            { dayOfWeek: 1, isActive: true, startTime: "14:00:00", endTime: "22:00:00" },
          ],
        }}
      />,
    );

    expect(screen.getAllByTestId("availability-range-1")).toHaveLength(2);
    expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();
  });
});
