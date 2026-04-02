import { render, screen } from "@testing-library/react";
import { Topbar } from "@/components/layout/topbar";

describe("Topbar", () => {
  it("muestra una accion visible para cerrar sesion", () => {
    render(
      <Topbar
        role="member"
        user={{
          name: "Ana Perez",
          email: "ana@studioflow.com",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});
