import { render, screen } from "@testing-library/react";
import { MemberProfileSettings } from "@/components/member/member-profile-settings";

describe("MemberProfileSettings", () => {
  it("renderiza datos personales y el formulario de cambio de contraseña", () => {
    render(
      <MemberProfileSettings
        profile={{
          fullName: "Ana Perez",
          email: "ana@studioflow.com",
          phone: "+54 11 5555-5555",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Ana Perez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ana@studioflow.com")).toBeInTheDocument();
    expect(screen.getByText("Cambiar contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Nueva contraseña")).toBeInTheDocument();
  });
});
