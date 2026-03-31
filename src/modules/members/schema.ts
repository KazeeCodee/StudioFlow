import { z } from "zod";

export const memberSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Ingresá un email válido."),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "La contraseña inicial debe tener al menos 8 caracteres."),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  planId: z.string().uuid("Seleccioná un plan válido."),
  notes: z.string().trim().optional(),
});

export type MemberInput = z.infer<typeof memberSchema>;
