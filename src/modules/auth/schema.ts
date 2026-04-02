import { z } from "zod";

const internalRoleSchema = z.enum(["super_admin", "admin", "operator"], {
  error: "Seleccioná un rol interno válido.",
});

const userStatusSchema = z.enum(["active", "inactive", "suspended"]);

export const passwordRecoverySchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
});

export const passwordResetSchema = z
  .object({
    password: z.string().trim().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().trim().min(8, "Confirmá tu contraseña."),
    redirectTo: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const staffUserSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá un nombre válido."),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  role: internalRoleSchema,
  status: userStatusSchema.default("active"),
  password: z.string().trim().min(8, "La contraseña inicial debe tener al menos 8 caracteres."),
});

export const staffUserUpdateSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá un nombre válido."),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  role: internalRoleSchema,
  status: userStatusSchema,
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type StaffUserInput = z.infer<typeof staffUserSchema>;
export type StaffUserUpdateInput = z.infer<typeof staffUserUpdateSchema>;
