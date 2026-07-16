import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const { createMemberActionMock } = vi.hoisted(() => ({
  createMemberActionMock: vi.fn(async (formData: FormData) => {
    void formData;
  }),
}));

vi.mock("@/modules/members/actions", () => ({
  createMemberAction: createMemberActionMock,
}));

import { MemberForm } from "@/components/forms/member-form";

const planOptions = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Plan Creator",
    quotaAmount: 12,
    durationType: "monthly" as const,
    durationValue: 1,
  },
];

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre y apellido"), "Ana Pérez");
  await user.type(screen.getByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Contraseña inicial"), "password-segura");
}

describe("MemberForm", () => {
  beforeEach(() => {
    createMemberActionMock.mockClear();
  });

  it("envía directamente cuando hay un plan seleccionado", async () => {
    const user = userEvent.setup();
    render(<MemberForm planOptions={planOptions} />);
    await completeRequiredFields(user);
    await user.selectOptions(
      screen.getByLabelText("Plan asignado"),
      "11111111-1111-4111-8111-111111111111",
    );

    await user.click(screen.getByRole("button", { name: "Crear miembro" }));

    await waitFor(() => expect(createMemberActionMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("advierte antes de enviar cuando no hay un plan", async () => {
    const user = userEvent.setup();
    render(<MemberForm planOptions={planOptions} />);
    await completeRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Crear miembro" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(createMemberActionMock).not.toHaveBeenCalled();
  });

  it("vuelve al formulario sin perder los datos cargados", async () => {
    const user = userEvent.setup();
    render(<MemberForm planOptions={planOptions} />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear miembro" }));

    await user.click(await screen.findByRole("button", { name: "Volver al formulario" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nombre y apellido")).toHaveValue("Ana Pérez");
    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com");
    expect(createMemberActionMock).not.toHaveBeenCalled();
  });

  it("crea el miembro sin plan después de confirmarlo", async () => {
    const user = userEvent.setup();
    render(<MemberForm planOptions={planOptions} />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear miembro" }));

    await user.click(await screen.findByRole("button", { name: "Crear sin plan" }));

    await waitFor(() => expect(createMemberActionMock).toHaveBeenCalledTimes(1));
    const submittedData = createMemberActionMock.mock.calls[0][0];
    expect(submittedData.get("planId")).toBe("");
  });
});
