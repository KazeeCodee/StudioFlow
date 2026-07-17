import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberForm } from "@/components/forms/member-form";
import { PlanForm } from "@/components/forms/plan-form";
import { SpaceForm } from "@/components/forms/space-form";

const createSpaceAction = vi.hoisted(() => vi.fn());
const createPlanAction = vi.hoisted(() => vi.fn());
const createMemberAction = vi.hoisted(() => vi.fn());

vi.mock("@/modules/spaces/actions", () => ({ createSpaceAction }));
vi.mock("@/modules/plans/actions", () => ({ createPlanAction }));
vi.mock("@/modules/members/actions", () => ({ createMemberAction }));

function submitForm(buttonName: string) {
  const button = screen.getByRole("button", { name: buttonName });
  const form = button.closest("form");

  if (!form) {
    throw new Error(`No encontramos el formulario de ${buttonName}.`);
  }

  fireEvent.submit(form);
}

describe("create resource forms", () => {
  beforeEach(() => {
    createSpaceAction.mockReset();
    createPlanAction.mockReset();
    createMemberAction.mockReset();
  });

  it.each([
    {
      renderForm: () => render(<SpaceForm />),
      action: createSpaceAction,
      buttonName: "Guardar espacio",
      message: "No se pudo crear el espacio.",
    },
    {
      renderForm: () => render(<PlanForm />),
      action: createPlanAction,
      buttonName: "Guardar plan",
      message: "No se pudo crear el plan.",
    },
    {
      renderForm: () =>
        render(
          <MemberForm
            planOptions={[
              {
                id: "00000000-0000-4000-8000-000000000001",
                name: "Plan Produccion",
                quotaAmount: 12,
                durationType: "monthly",
                durationValue: 1,
              },
            ]}
          />,
        ),
      action: createMemberAction,
      buttonName: "Crear miembro",
      message: "No se pudo crear el miembro.",
    },
  ])("muestra el error de $buttonName dentro del formulario", async ({
    renderForm,
    action,
    buttonName,
    message,
  }) => {
    action.mockResolvedValue({ status: "error", message });
    renderForm();

    submitForm(buttonName);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("deshabilita el guardado del espacio mientras la accion esta pendiente", () => {
    createSpaceAction.mockReturnValue(new Promise(() => undefined));
    render(<SpaceForm />);

    submitForm("Guardar espacio");

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });
});

