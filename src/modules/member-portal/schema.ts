import { z } from "zod";

export const memberProfileSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá un nombre válido."),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  redirectTo: z.string().trim().optional(),
});

export const memberPasswordSchema = z
  .object({
    password: z.string().trim().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().trim().min(8, "Confirmá tu contraseña."),
    redirectTo: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });
