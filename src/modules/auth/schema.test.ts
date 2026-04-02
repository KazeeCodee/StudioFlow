import { describe, expect, it } from "vitest";
import {
  passwordRecoverySchema,
  passwordResetSchema,
  staffUserSchema,
  staffUserUpdateSchema,
} from "@/modules/auth/schema";

describe("auth schema", () => {
  it("acepta una recuperacion de contrasena con email valido", () => {
    const result = passwordRecoverySchema.parse({
      email: "ana@studioflow.com",
    });

    expect(result.email).toBe("ana@studioflow.com");
  });

  it("rechaza contrasenas nuevas que no coinciden", () => {
    expect(() =>
      passwordResetSchema.parse({
        password: "12345678",
        confirmPassword: "87654321",
        redirectTo: "/member/profile",
      }),
    ).toThrow("Las contraseñas no coinciden.");
  });

  it("acepta la creacion de un usuario interno", () => {
    const result = staffUserSchema.parse({
      fullName: "Ada Lovelace",
      email: "ada@studioflow.com",
      phone: "+54 11 5555 5555",
      role: "operator",
      status: "active",
      password: "supersecreto",
    });

    expect(result.role).toBe("operator");
    expect(result.password).toBe("supersecreto");
  });

  it("rechaza asignar role member a usuarios internos", () => {
    expect(() =>
      staffUserSchema.parse({
        fullName: "Member Malo",
        email: "member@studioflow.com",
        role: "member",
        status: "active",
        password: "12345678",
      }),
    ).toThrow("Seleccioná un rol interno válido.");
  });

  it("acepta actualizar un usuario interno sin cambiar contrasena", () => {
    const result = staffUserUpdateSchema.parse({
      fullName: "Grace Hopper",
      email: "grace@studioflow.com",
      phone: "",
      role: "admin",
      status: "inactive",
      password: "",
    });

    expect(result.password).toBeUndefined();
    expect(result.status).toBe("inactive");
  });
});
