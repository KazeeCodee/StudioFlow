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
    expect(screen.getByLabelText(/eliminar imagen actual/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/imagen principal/i)).not.toBeInTheDocument();
  });
});
