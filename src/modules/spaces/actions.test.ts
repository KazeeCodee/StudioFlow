import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialFormActionState } from "@/lib/form-action-state";

const revalidatePath = vi.fn();
const redirect = vi.fn();
const requireStaffContext = vi.fn();
const resolveSpaceImageUrl = vi.fn();
const consumeRateLimit = vi.fn();
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
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit,
  logRateLimitUnavailable: vi.fn(),
  redisRateLimitStore: {},
}));
vi.mock("@/lib/request-identity", () => ({
  buildRateLimitKey: () => "rate-limit:upload:test-hash",
}));
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
    consumeRateLimit.mockResolvedValue({
      allowed: true,
      reason: "allowed",
      remaining: 19,
      retryAfterSeconds: 900,
    });
  });

  it("crea el espacio, sus rangos y la auditoria en una sola transaccion", async () => {
    const { createSpaceAction } = await import("@/modules/spaces/actions");

    await createSpaceAction(initialFormActionState, createSpaceForm());

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
    expect(redirect).toHaveBeenCalledWith("/admin/spaces/space-1");
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

    const result = await createSpaceAction(initialFormActionState, createSpaceForm("{"));

    expect(result).toEqual({
      status: "error",
      message: expect.stringMatching(/disponibilidad/i),
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("corta uploads cuando se excede el limite autenticado", async () => {
    consumeRateLimit.mockResolvedValue({
      allowed: false,
      reason: "exceeded",
      remaining: 0,
      retryAfterSeconds: 900,
    });
    const { createSpaceAction } = await import("@/modules/spaces/actions");
    const formData = createSpaceForm();
    formData.set(
      "imageFile",
      new File(["image"], "space.png", { type: "image/png" }),
    );

    const result = await createSpaceAction(initialFormActionState, formData);

    expect(result).toEqual({
      status: "error",
      message: "Demasiadas imagenes subidas. Intenta nuevamente mas tarde.",
    });
    expect(resolveSpaceImageUrl).not.toHaveBeenCalled();
  });

  it("devuelve el error de imagen dentro del estado del formulario", async () => {
    resolveSpaceImageUrl.mockRejectedValue(
      new Error("La imagen debe ser JPG, PNG, GIF o WEBP."),
    );
    const { createSpaceAction } = await import("@/modules/spaces/actions");

    const result = await createSpaceAction(initialFormActionState, createSpaceForm());

    expect(result).toEqual({
      status: "error",
      message: "La imagen debe ser JPG, PNG, GIF o WEBP.",
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});
