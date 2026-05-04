import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/layout/page-header";

describe("PageHeader", () => {
  it("usa un layout mas compacto para titulo y subtitulo", () => {
    const { container } = render(
      <PageHeader
        eyebrow="Panel staff"
        title="Centro operativo"
        subtitle="Reservas, miembros y renovaciones desde una sola consola."
        statusLabel="Turno activo"
      />,
    );

    const header = container.firstElementChild;
    const title = screen.getByRole("heading", { name: "Centro operativo" });
    const subtitle = screen.getByText("Reservas, miembros y renovaciones desde una sola consola.");

    expect(header).toHaveClass("space-y-0.5");
    expect(title).toHaveClass("leading-tight");
    expect(subtitle).toHaveClass("max-w-xl", "leading-snug");
    expect(screen.getByText("Turno activo")).toBeInTheDocument();
  });
});
