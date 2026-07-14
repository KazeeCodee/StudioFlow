import { render, screen } from "@testing-library/react";
import SpacesPage from "@/app/admin/spaces/page";

const {
  mockRedirect,
  mockRequireStaffContext,
  mockCanManageSpaces,
  mockListSpaces,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockRequireStaffContext: vi.fn(),
  mockCanManageSpaces: vi.fn(),
  mockListSpaces: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

vi.mock("@/lib/permissions/guards", () => ({
  canManageSpaces: mockCanManageSpaces,
}));

vi.mock("@/modules/spaces/queries", () => ({
  listSpaces: mockListSpaces,
}));

vi.mock("@/components/spaces/spaces-view-toggle", () => ({
  SpacesViewToggle: () => <div>Selector de vista</div>,
}));

describe("SpacesPage", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        id: "staff-1",
        role: "admin",
      },
    });
    mockCanManageSpaces.mockReturnValue(true);
    mockListSpaces.mockResolvedValue([
      {
        id: "space-1",
        name: "Sala Podcast",
        slug: "sala-podcast",
        description: null,
        status: "active",
        imageUrl: null,
        galleryUrls: [],
        videoLinks: [],
        hourlyQuotaCost: 2,
        minBookingHours: 1,
        maxBookingHours: 4,
        capacity: null,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    ]);
  });

  afterEach(() => {
    mockRedirect.mockReset();
    mockRequireStaffContext.mockReset();
    mockCanManageSpaces.mockReset();
    mockListSpaces.mockReset();
  });

  it("abre el detalle desde toda la fila del espacio", async () => {
    render(await SpacesPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("link", { name: "Ver detalle de Sala Podcast" }),
    ).toHaveAttribute("href", "/admin/spaces/space-1");
  });
});
