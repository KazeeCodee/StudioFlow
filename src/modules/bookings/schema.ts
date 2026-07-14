import { z } from "zod";
import { getSafeInternalPath } from "@/lib/safe-redirect";

const optionalBookingRedirectSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    const safePath = getSafeInternalPath(value, "");
    return safePath || undefined;
  });

export const bookingAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationHours: z.coerce.number().int().min(1),
});

export const bookingSchema = z
  .object({
    memberId: z.string().uuid().optional(),
    spaceId: z.string().uuid("Seleccioná un espacio válido."),
    startsAt: z.string().min(1, "La fecha y hora de inicio es obligatoria."),
    endsAt: z.string().min(1, "La fecha y hora de fin es obligatoria."),
  })
  .refine((input) => input.startsAt < input.endsAt, {
    path: ["endsAt"],
    message: "El fin debe ser posterior al inicio.",
  });

export const cancellationSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().optional(),
  redirectTo: optionalBookingRedirectSchema,
});

export const rescheduleSchema = z
  .object({
    bookingId: z.string().uuid(),
    startsAt: z.string().min(1, "La nueva fecha y hora de inicio es obligatoria."),
    endsAt: z.string().min(1, "La nueva fecha y hora de fin es obligatoria."),
    reason: z.string().trim().optional(),
    redirectTo: optionalBookingRedirectSchema,
  })
  .refine((input) => input.startsAt < input.endsAt, {
    path: ["endsAt"],
    message: "El fin debe ser posterior al inicio.",
  });

export type BookingInput = z.infer<typeof bookingSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
