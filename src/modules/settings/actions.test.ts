import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeRateLimit = vi.fn();
const sendSystemTestNotification = vi.fn();
const requireStaffContext = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/permissions/guards", () => ({ canManageSettings: () => true }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit,
  logRateLimitUnavailable: vi.fn(),
  redisRateLimitStore: {},
}));
vi.mock("@/lib/request-identity", () => ({
  buildRateLimitKey: () => "rate-limit:test-email:test-hash",
}));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext }));
vi.mock("@/services/notifications/dispatcher", () => ({
  sendDailyReminderNotifications: vi.fn(),
  sendSystemTestNotification,
}));

describe("sendTestNotificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffContext.mockResolvedValue({
      profile: { id: "profile-1", fullName: "Admin", role: "admin" },
    });
  });

  it("corta el email de prueba cuando se excede el limite", async () => {
    consumeRateLimit.mockResolvedValue({
      allowed: false,
      reason: "exceeded",
      remaining: 0,
      retryAfterSeconds: 3600,
    });
    const { sendTestNotificationAction } = await import(
      "@/modules/settings/actions"
    );
    const formData = new FormData();
    formData.set("recipientEmail", "recipient@example.com");

    await expect(sendTestNotificationAction(formData)).rejects.toThrow(
      "Demasiados emails de prueba. Intenta nuevamente mas tarde.",
    );
    expect(sendSystemTestNotification).not.toHaveBeenCalled();
  });
});
