import { render, screen } from "@testing-library/react";
import AdminUsersPage from "@/app/admin/users/page";

const {
  mockRedirect,
  mockRequireStaffContext,
  mockCanManageStaffUsers,
  mockListStaffUsers,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockRequireStaffContext: vi.fn(),
  mockCanManageStaffUsers: vi.fn(),
  mockListStaffUsers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

vi.mock("@/lib/permissions/guards", () => ({
  canManageStaffUsers: mockCanManageStaffUsers,
}));

vi.mock("@/modules/staff-users/queries", () => ({
  listStaffUsers: mockListStaffUsers,
}));

vi.mock("@/components/staff/admin-staff-users", () => ({
  AdminStaffUsers: () => <div>Tabla staff</div>,
}));

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        id: "staff-1",
        role: "admin",
      },
    });
    mockCanManageStaffUsers.mockReturnValue(true);
    mockListStaffUsers.mockResolvedValue([]);
  });

  afterEach(() => {
    mockRedirect.mockReset();
    mockRequireStaffContext.mockReset();
    mockCanManageStaffUsers.mockReset();
    mockListStaffUsers.mockReset();
  });

  it("resume la bajada de usuarios internos", async () => {
    render(await AdminUsersPage());

    expect(screen.getByText("Equipo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Usuarios internos" })).toBeInTheDocument();
    expect(
      screen.getByText("Gestiona accesos del equipo con clave inicial definida por el admin."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/administrativos y operativos/i)).not.toBeInTheDocument();
    expect(screen.getByText("Tabla staff")).toBeInTheDocument();
  });
});
