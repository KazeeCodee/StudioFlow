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

const availabilityTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Usa un horario HH:mm valido.");

export const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    isActive: z.boolean().default(true),
    startTime: availabilityTimeSchema,
    endTime: availabilityTimeSchema,
  })
  .refine((rule) => rule.startTime < rule.endTime, {
    path: ["endTime"],
    message: "El fin debe ser posterior al inicio.",
  });

export const availabilityRulesSchema = z.array(availabilityRuleSchema).superRefine((rules, ctx) => {
  for (const day of weekdayOptions) {
    const ordered = rules
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => rule.isActive && rule.dayOfWeek === day.value)
      .sort((a, b) => a.rule.startTime.localeCompare(b.rule.startTime));

    for (let index = 1; index < ordered.length; index += 1) {
      const current = ordered[index];
      const previous = ordered[index - 1];

      if (current.rule.startTime < previous.rule.endTime) {
        ctx.addIssue({
          code: "custom",
          path: [current.index, "startTime"],
          message: `${day.label}: los horarios no pueden superponerse.`,
        });
      }
    }
  }
});

export const defaultAvailabilityRules = weekdayOptions
  .filter((day) => day.value >= 1 && day.value <= 6)
  .map((day) => ({
    dayOfWeek: day.value,
    isActive: true,
    startTime: "09:00",
    endTime: "18:00",
  }));

export function parseAvailabilityRulesField(value: FormDataEntryValue | null) {
  try {
    return availabilityRulesSchema.parse(JSON.parse(String(value ?? "[]")));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }

    throw new Error("La disponibilidad enviada no es valida.");
  }
}

export const spaceSchema = z
  .object({
    name: z.string().min(2, "El nombre del espacio es obligatorio."),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas y guiones."),
    description: z.string().trim().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    galleryUrls: z.array(z.string().url("Cada URL de galería debe ser válida.")).default([]),
    videoLinks: z
      .array(
        z
          .string()
          .url("El link de YouTube debe ser una URL válida.")
          .refine(
            (url) =>
              url.includes("youtube.com/watch") ||
              url.includes("youtu.be/") ||
              url.includes("youtube.com/shorts"),
            "Solo se permiten links de YouTube (youtube.com o youtu.be).",
          ),
      )
      .default([]),
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
    availabilityRules: availabilityRulesSchema.default(defaultAvailabilityRules),
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

/** Extracts a YouTube video ID from various YouTube URL formats */
export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    // invalid URL
  }
  return null;
}
