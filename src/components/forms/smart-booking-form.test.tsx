import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SmartBookingForm } from "@/components/forms/smart-booking-form";

vi.mock("@/modules/bookings/actions", () => ({
  createMemberBookingAction: vi.fn(),
}));

const fetchMock = vi.fn();

const spaceOptions = [
  {
    id: "space-1",
    name: "Sala Podcast",
    hourlyQuotaCost: 2,
    minBookingHours: 1,
    maxBookingHours: 4,
    imageUrl: null,
    availabilityRules: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: "08:00:00",
      endTime: "22:00:00",
      isActive: true,
    })),
  },
];

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

async function selectSpaceDateAndDuration(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/que espacio|qué espacio/i), "space-1");
  const dateSelect = screen.getByLabelText(/que dia|qué día/i) as HTMLSelectElement;
  const availableDate = within(dateSelect)
    .getAllByRole("option")
    .find((option) => (option as HTMLOptionElement).value && !(option as HTMLOptionElement).disabled);
  if (!availableDate) throw new Error("No available date in fixture");
  await user.selectOptions(dateSelect, (availableDate as HTMLOptionElement).value);
  await user.selectOptions(screen.getByLabelText(/duracion|duración/i), "2");
  return (availableDate as HTMLOptionElement).value;
}

describe("SmartBookingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(jsonResponse({ startTimes: ["08:00", "14:00"] }));
  });

  it("consulta horarios despues de elegir duracion y los muestra", async () => {
    const user = userEvent.setup();
    render(<SmartBookingForm spaceOptions={spaceOptions} />);

    const selectedDate = await selectSpaceDateAndDuration(user);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/api/member/spaces/space-1/availability?date=${selectedDate}&durationHours=2`,
    );
    expect(await screen.findByRole("option", { name: "14:00" })).toBeInTheDocument();

    const duration = screen.getByLabelText(/duracion|duración/i);
    const startTime = screen.getByLabelText(/horario de inicio/i);
    expect(duration.compareDocumentPosition(startTime) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("construye inicio y fin a partir del horario real seleccionado", async () => {
    const user = userEvent.setup();
    const { container } = render(<SmartBookingForm spaceOptions={spaceOptions} />);
    const selectedDate = await selectSpaceDateAndDuration(user);

    await user.selectOptions(await screen.findByLabelText(/horario de inicio/i), "14:00");

    expect(container.querySelector<HTMLInputElement>('input[name="startsAt"]')?.value).toBe(
      `${selectedDate}T14:00`,
    );
    expect(container.querySelector<HTMLInputElement>('input[name="endsAt"]')?.value).toBe(
      `${selectedDate}T16:00`,
    );
    expect(screen.getByRole("button", { name: /confirmar esta reserva/i })).toBeEnabled();
  });

  it("muestra carga y luego un estado vacio", async () => {
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const user = userEvent.setup();
    render(<SmartBookingForm spaceOptions={spaceOptions} />);

    await selectSpaceDateAndDuration(user);

    expect(screen.getByText("Consultando horarios disponibles...")).toBeInTheDocument();
    expect(screen.getByLabelText(/horario de inicio/i)).toBeDisabled();

    resolveFetch(jsonResponse({ startTimes: [] }));
    expect(await screen.findByText(/no quedan horarios disponibles/i)).toBeInTheDocument();
  });

  it("muestra un error recuperable si falla la consulta", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<SmartBookingForm spaceOptions={spaceOptions} />);

    await selectSpaceDateAndDuration(user);

    expect(await screen.findByText(/no pudimos consultar los horarios/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirmar esta reserva/i })).not.toBeInTheDocument();
  });
});
