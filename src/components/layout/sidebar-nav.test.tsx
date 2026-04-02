import { render, screen } from "@testing-library/react";
import { SidebarNav } from "@/components/layout/sidebar-nav";

describe("SidebarNav", () => {
  it("oculta secciones administrativas sensibles para operator", () => {
    render(<SidebarNav role="operator" />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reservas/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agenda/i })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /miembros/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /planes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /espacios/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /renovaciones/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /configuraci/i })).not.toBeInTheDocument();
  });
});
