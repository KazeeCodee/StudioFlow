import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  description: z.string().trim().optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).default("draft"),
  durationType: z.enum(["weekly", "monthly", "custom"]).default("monthly"),
  durationValue: z.coerce.number().int().min(1),
  quotaAmount: z.coerce.number().int().min(1),
  price: z
    .union([z.coerce.number().min(0), z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  cancellationPolicyHours: z.coerce.number().int().min(0).default(24),
  maxBookingsPerDay: z
    .union([z.coerce.number().int().min(1), z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  maxBookingsPerWeek: z
    .union([z.coerce.number().int().min(1), z.literal("")])
    .transform((value) => (value === "" ? null : value)),
});

export type PlanInput = z.infer<typeof planSchema>;
