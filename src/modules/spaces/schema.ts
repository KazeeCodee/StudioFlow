import { z } from "zod";

export const weekdayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
] as const;

const availabilityRuleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  isActive: z.boolean().default(false),
  startTime: z.string().default("09:00"),
  endTime: z.string().default("18:00"),
});

const defaultAvailabilityRules = weekdayOptions.map((day) => ({
  dayOfWeek: day.value,
  isActive: day.value >= 1 && day.value <= 6,
  startTime: "09:00",
  endTime: "18:00",
}));

export const spaceSchema = z
  .object({
    name: z.string().min(2, "El nombre del espacio es obligatorio."),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas y guiones."),
    description: z.string().trim().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    capacity: z
      .preprocess(
        (value) => (value === undefined || value === null ? "" : value),
        z.union([z.coerce.number().int().min(1), z.literal("")]),
      )
      .transform((value) => (value === "" ? null : value)),
    status: z.enum(["active", "inactive", "maintenance"]).default("active"),
    hourlyQuotaCost: z.coerce.number().int().min(1),
    minBookingHours: z.coerce.number().int().min(1),
    maxBookingHours: z.coerce.number().int().min(1),
    availabilityRules: z.array(availabilityRuleSchema).length(7).default(defaultAvailabilityRules),
  })
  .refine((input) => input.maxBookingHours >= input.minBookingHours, {
    path: ["maxBookingHours"],
    message: "La duración máxima debe ser mayor o igual a la mínima.",
  });

export const spaceBlockSchema = z
  .object({
    title: z.string().min(2, "El bloqueo necesita un título."),
    reason: z.string().trim().optional(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
  })
  .refine((input) => new Date(input.endsAt) > new Date(input.startsAt), {
    path: ["endsAt"],
    message: "El fin del bloqueo debe ser posterior al inicio.",
  });

export type SpaceInput = z.infer<typeof spaceSchema>;
export type SpaceBlockInput = z.infer<typeof spaceBlockSchema>;
