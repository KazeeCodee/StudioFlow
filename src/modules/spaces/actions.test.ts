import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const redirect = vi.fn();
const requireStaffContext = vi.fn();
const resolveSpaceImageUrl = vi.fn();
const buildSpaceWriteValues = vi.fn((input: Record<string, unknown>) => ({
  name: input.name,
  slug: input.slug,
  status: input.status,
  hourlyQuotaCost: input.hourlyQuotaCost,
  minBookingHours: input.minBookingHours,
  maxBookingHours: input.maxBookingHours,
}));

const returning = vi.fn(async () => [{ id: "space-1", name: "Sala Podcast", slug: "sala-podcast" }]);
const insertValues = vi.fn(() => ({ returning }));
const updateWhere = vi.fn();
const updateSet = vi.fn(() => ({ where: updateWhere }));
const deleteWhere = vi.fn();
const tx = {
  insert: vi.fn(() => ({ values: insertValues })),
  update: vi.fn(() => ({ set: updateSet })),
  delete: vi.fn(() => ({ where: deleteWhere })),
};
const transaction = vi.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
const getDb = vi.fn(() => ({ transaction }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext }));
vi.mock("@/services/spaces/resolve-space-image", () => ({ resolveSpaceImageUrl }));
vi.mock("@/services/spaces/build-space-write-values", () => ({ buildSpaceWriteValues }));

const splitMonday = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
  { dayOfWeek: 1, startTime: "14:00", endTime: "22:00", isActive: true },
];

function createSpaceForm(availabilityRules: unknown = splitMonday) {
  const formData = new FormData();
  formData.set("name", "Sala Podcast");
  formData.set("description", "Set principal");
  formData.set("status", "active");
  formData.set("hourlyQuotaCost", "2");
  formData.set("minBookingHours", "1");
  formData.set("maxBookingHours", "4");
  formData.set(
    "availabilityRules",
    typeof availabilityRules === "string" ? availabilityRules : JSON.stringify(availabilityRules),
  );
  return formData;
}

describe("space actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffContext.mockResolvedValue({
      profile: { id: "profile-1", role: "admin" },
    });
    resolveSpaceImageUrl.mockResolvedValue(null);
  });

  it("crea el espacio, sus rangos y la auditoria en una sola transaccion", async () => {
    const { createSpaceAction } = await import("@/modules/spaces/actions");

    await createSpaceAction(createSpaceForm());

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(3);
    expect(insertValues.mock.calls[1][0]).toEqual([
      expect.objectContaining({
        spaceId: "space-1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "12:00",
        isActive: true,
      }),
      expect.objectContaining({
        spaceId: "space-1",
        dayOfWeek: 1,
        startTime: "14:00",
        endTime: "22:00",
        isActive: true,
      }),
    ]);
  });

  it("reemplaza todos los rangos durante la actualizacion", async () => {
    const { updateSpaceAction } = await import("@/modules/spaces/actions");
    const formData = createSpaceForm();
    formData.set("spaceId", "space-1");

    await updateSpaceAction(formData);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(insertValues.mock.calls[0][0]).toEqual([
      expect.objectContaining({ dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }),
      expect.objectContaining({ dayOfWeek: 1, startTime: "14:00", endTime: "22:00" }),
    ]);
  });

  it("rechaza disponibilidad mal serializada antes de escribir", async () => {
    const { createSpaceAction } = await import("@/modules/spaces/actions");

    await expect(createSpaceAction(createSpaceForm("{"))).rejects.toThrow(/disponibilidad/i);
    expect(transaction).not.toHaveBeenCalled();
  });
});
