import { render, screen } from "@testing-library/react";
import MembersPage from "@/app/admin/members/page";
import type { listMembers } from "@/modules/members/queries";

const {
  mockRedirect,
  mockRequireStaffContext,
  mockCanManageMembers,
  mockListMembers,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockRequireStaffContext: vi.fn(),
  mockCanManageMembers: vi.fn(),
  mockListMembers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

vi.mock("@/lib/permissions/guards", () => ({
  canManageMembers: mockCanManageMembers,
}));

vi.mock("@/modules/members/queries", () => ({
  listMembers: mockListMembers,
}));

describe("MembersPage", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        id: "staff-1",
        role: "admin",
      },
    });
    mockCanManageMembers.mockReturnValue(true);

    const members = [
      {
        id: "member-1",
        fullName: "Ana Pérez",
        email: "ana@example.com",
        phone: null,
        status: "active",
        activePlanStatus: "active",
        activePlanEndsAt: new Date("2026-08-14T00:00:00.000Z"),
        quotaRemaining: 8,
        planName: "Plan Pro",
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    ] satisfies Awaited<ReturnType<typeof listMembers>>;

    mockListMembers.mockResolvedValue(members);
  });

  afterEach(() => {
    mockRedirect.mockReset();
    mockRequireStaffContext.mockReset();
    mockCanManageMembers.mockReset();
    mockListMembers.mockReset();
  });

  it("abre el detalle desde toda la fila del miembro", async () => {
    render(await MembersPage());

    expect(
      screen.getByRole("link", { name: "Ver detalle de Ana Pérez" }),
    ).toHaveAttribute("href", "/admin/members/member-1");
  });
});
