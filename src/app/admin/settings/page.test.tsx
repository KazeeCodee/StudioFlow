import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/admin/settings/page";

const {
  mockRedirect,
  mockRequireStaffContext,
  mockCanManageSettings,
  mockListRecentNotificationDeliveries,
  mockGetOperationalSettings,
  mockGetEnv,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockRequireStaffContext: vi.fn(),
  mockCanManageSettings: vi.fn(),
  mockListRecentNotificationDeliveries: vi.fn(),
  mockGetOperationalSettings: vi.fn(),
  mockGetEnv: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/modules/auth/queries", () => ({
  requireStaffContext: mockRequireStaffContext,
}));

vi.mock("@/lib/permissions/guards", () => ({
  canManageSettings: mockCanManageSettings,
}));

vi.mock("@/modules/notifications/queries", () => ({
  listRecentNotificationDeliveries: mockListRecentNotificationDeliveries,
}));

vi.mock("@/modules/settings/queries", () => ({
  getOperationalSettings: mockGetOperationalSettings,
}));

vi.mock("@/lib/env", () => ({
  getEnv: mockGetEnv,
}));

vi.mock("@/modules/settings/actions", () => ({
  runDailyNotificationsNowAction: vi.fn(),
  sendTestNotificationAction: vi.fn(),
  updateOperationalSettingsAction: vi.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    mockRequireStaffContext.mockResolvedValue({
      profile: {
        role: "admin",
        email: "ada@studioflow.com",
      },
    });
    mockCanManageSettings.mockReturnValue(true);
    mockListRecentNotificationDeliveries.mockResolvedValue([]);
    mockGetOperationalSettings.mockResolvedValue({
      renewalWindowDays: 7,
      lowQuotaThreshold: 3,
      bookingBufferHours: 0,
    });
    mockGetEnv.mockReturnValue({
      EMAIL_TRANSPORT_MODE: "log",
      EMAIL_FROM: "ops@studioflow.com",
      RESEND_API_KEY: "",
      CRON_SECRET: "",
      APP_URL: "https://studioflow.test",
    });
  });

  afterEach(() => {
    mockRedirect.mockReset();
    mockRequireStaffContext.mockReset();
    mockCanManageSettings.mockReset();
    mockListRecentNotificationDeliveries.mockReset();
    mockGetOperationalSettings.mockReset();
    mockGetEnv.mockReset();
  });

  it("compacta el copy de configuracion y reglas globales", async () => {
    render(await SettingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Configuracion")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Parametros operativos" })).toBeInTheDocument();
    expect(
      screen.getByText("Ajusta reglas globales y valida emails o cron cuando haga falta."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pruebas controladas del cron diario/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estos cambios impactan/i)).not.toBeInTheDocument();
    expect(screen.getByText("Alertas, dashboard y reservas.")).toBeInTheDocument();
    expect(
      screen.getByText("Dias a futuro para vencimientos y seguimiento."),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo maximo para marcar cupo critico.")).toBeInTheDocument();
    expect(
      screen.getByText("Horas bloqueadas antes y despues de cada reserva."),
    ).toBeInTheDocument();
  });
});
