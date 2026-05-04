import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";

const { mockRequireStaffContext } = vi.hoisted(() => ({
  mockRequireStaffContext: vi.fn(),
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        role: "admin",
        fullName: "Ada Lovelace",
        email: "ada@studioflow.com",
      },
    });
  });

  afterEach(() => {
    mockRequireStaffContext.mockReset();
  });

  it("usa un subtitulo mas directo en el shell staff", async () => {
    render(await AdminLayout({ children: <div>Contenido</div> }));

    expect(screen.getByText("Panel staff")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Centro operativo" })).toBeInTheDocument();
    expect(
      screen.getByText("Reservas, miembros y renovaciones desde una sola consola."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/seguimiento del estudio desde una sola consola/i),
    ).not.toBeInTheDocument();
  });
});
