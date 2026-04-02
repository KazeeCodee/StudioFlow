import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("renderiza navegación y contenido", () => {
    render(
      <AppShell
        title="Panel"
        subtitle="Resumen"
        role="admin"
        user={{
          name: "Ada Lovelace",
          email: "ada@studioflow.com",
        }}
      >
        <div>Contenido</div>
      </AppShell>,
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace")).toHaveLength(2);
    expect(screen.getByText("KazeCode")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Desarrollado por KazeCode/i })).toHaveAttribute(
      "href",
      "https://kazecode.com.ar",
    );
  });
});
