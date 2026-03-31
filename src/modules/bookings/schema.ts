import { z } from "zod";

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
  redirectTo: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
