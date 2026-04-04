import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("muestra branding Kazecode y un mensaje comercial mas claro", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getAllByText("StudioFlow").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("KazeCode")).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        name: "Gestioná reservas, membresías y operación diaria desde una sola plataforma.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ingresá a tu cuenta" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Accedé con tu email y contraseña para administrar reservas, membresías y seguimiento diario.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Ingresar a StudioFlow",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/administrador de tu cuenta/i),
    ).not.toBeInTheDocument();
  });
});
