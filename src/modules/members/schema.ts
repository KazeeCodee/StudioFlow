import { z } from "zod";

const memberStatusSchema = z.enum(["active", "inactive", "suspended"]);

export const memberSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Ingresá un email válido."),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "La contraseña inicial debe tener al menos 8 caracteres."),
  status: memberStatusSchema.default("active"),
  planId: z.string().uuid("Seleccioná un plan válido."),
  notes: z.string().trim().optional(),
});

export const memberUpdateSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio."),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const memberStatusUpdateSchema = z.object({
  status: memberStatusSchema,
  reason: z.string().trim().optional(),
});

export const memberQuotaAdjustmentSchema = z.object({
  delta: z.coerce.number().int().refine((value) => value !== 0, {
    message: "El ajuste no puede ser cero.",
  }),
  reason: z.string().trim().min(2, "Dejá una nota para el ajuste."),
});

export const memberPlanChangeSchema = z.object({
  planId: z.string().uuid("Seleccioná un plan válido."),
  reason: z.string().trim().optional(),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MemberStatusUpdateInput = z.infer<typeof memberStatusUpdateSchema>;
export type MemberQuotaAdjustmentInput = z.infer<typeof memberQuotaAdjustmentSchema>;
export type MemberPlanChangeInput = z.infer<typeof memberPlanChangeSchema>;
