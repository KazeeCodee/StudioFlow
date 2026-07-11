import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeeklyAvailabilityEditor } from "@/components/forms/weekly-availability-editor";

const mondayMorning = [
  {
    dayOfWeek: 1,
    isActive: true,
    startTime: "08:00",
    endTime: "12:00",
  },
];

function readSubmittedRules() {
  const input = screen.getByTestId("availability-rules-input") as HTMLInputElement;
  return JSON.parse(input.value) as Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

describe("WeeklyAvailabilityEditor", () => {
  it("agrega un segundo horario al mismo dia y lo serializa", async () => {
    const user = userEvent.setup();
    render(<WeeklyAvailabilityEditor initialRules={mondayMorning} />);

    await user.click(screen.getByRole("button", { name: /agregar horario para lunes/i }));

    expect(screen.getAllByTestId("availability-range-1")).toHaveLength(2);
    expect(readSubmittedRules().filter((rule) => rule.dayOfWeek === 1)).toHaveLength(2);
  });

  it("muestra un error y marca el formulario como invalido cuando hay rangos superpuestos", async () => {
    const user = userEvent.setup();
    render(<WeeklyAvailabilityEditor initialRules={mondayMorning} />);

    await user.click(screen.getByRole("button", { name: /agregar horario para lunes/i }));
    await user.clear(screen.getByLabelText(/lunes horario 2 desde/i));
    await user.type(screen.getByLabelText(/lunes horario 2 desde/i), "11:00");
    await user.clear(screen.getByLabelText(/lunes horario 2 hasta/i));
    await user.type(screen.getByLabelText(/lunes horario 2 hasta/i), "14:00");

    expect(screen.getByRole("alert")).toHaveTextContent(/no pueden superponerse/i);
    expect(screen.getByTestId("availability-validity")).toBeInvalid();
  });

  it("cerrar un dia elimina sus rangos del valor enviado", async () => {
    const user = userEvent.setup();
    render(<WeeklyAvailabilityEditor initialRules={mondayMorning} />);

    await user.click(screen.getByRole("checkbox", { name: /lunes abierto/i }));

    expect(readSubmittedRules().some((rule) => rule.dayOfWeek === 1)).toBe(false);
    expect(screen.getByText(/lunes esta cerrado/i)).toBeInTheDocument();
  });

  it("un dia cerrado puede abrirse con un rango inicial", async () => {
    const user = userEvent.setup();
    render(<WeeklyAvailabilityEditor initialRules={[]} />);

    await user.click(screen.getByRole("checkbox", { name: /martes abierto/i }));

    expect(readSubmittedRules()).toContainEqual(
      expect.objectContaining({ dayOfWeek: 2, startTime: "09:00", endTime: "18:00" }),
    );
  });
});
