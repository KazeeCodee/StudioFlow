import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberContext = vi.fn();
const getAvailableStartTimesForSpace = vi.fn();

class BookingAvailabilityNotFoundError extends Error {}

vi.mock("@/modules/auth/queries", () => ({ requireMemberContext }));
vi.mock("@/modules/bookings/queries", () => ({
  BookingAvailabilityNotFoundError,
  getAvailableStartTimesForSpace,
}));

function createRequest(query = "date=2026-04-06&durationHours=2") {
  return new NextRequest(
    `https://studioflow.test/api/member/spaces/space-1/availability?${query}`,
  );
}

const context = { params: Promise.resolve({ spaceId: "space-1" }) };

describe("GET /api/member/spaces/[spaceId]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireMemberContext.mockResolvedValue({ profile: { id: "profile-1", role: "member" } });
    getAvailableStartTimesForSpace.mockResolvedValue(["08:00", "14:00"]);
  });

  it("autentica al miembro y devuelve horarios reales", async () => {
    const { GET } = await import("@/app/api/member/spaces/[spaceId]/availability/route");

    const response = await GET(createRequest(), context);

    expect(requireMemberContext).toHaveBeenCalledTimes(1);
    expect(getAvailableStartTimesForSpace).toHaveBeenCalledWith({
      spaceId: "space-1",
      date: "2026-04-06",
      durationHours: 2,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ startTimes: ["08:00", "14:00"] });
  });

  it("responde 400 cuando la consulta es invalida", async () => {
    const { GET } = await import("@/app/api/member/spaces/[spaceId]/availability/route");

    const response = await GET(createRequest("date=06-04-2026&durationHours=0"), context);

    expect(response.status).toBe(400);
    expect(getAvailableStartTimesForSpace).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el espacio no esta disponible", async () => {
    getAvailableStartTimesForSpace.mockRejectedValue(
      new BookingAvailabilityNotFoundError("Espacio no disponible"),
    );
    const { GET } = await import("@/app/api/member/spaces/[spaceId]/availability/route");

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(404);
  });

  it("no oculta errores inesperados como una lista vacia", async () => {
    getAvailableStartTimesForSpace.mockRejectedValue(new Error("database unavailable"));
    const { GET } = await import("@/app/api/member/spaces/[spaceId]/availability/route");

    await expect(GET(createRequest(), context)).rejects.toThrow("database unavailable");
  });
});
