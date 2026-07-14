import { z } from "zod";
import {
  getStudioDateTimeParts,
  parseStudioDateTimeInput,
} from "@/lib/datetime";

export const renewalViewSchema = z.enum(["pending", "all", "history"]);

export const renewalFiltersSchema = z.object({
  view: renewalViewSchema.default("pending"),
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
});

const paymentVerifiedSchema = z.preprocess(
  (value) => value === true || value === "true",
  z.literal(true, {
    error: "Confirma que verificaste el pago.",
  }),
);

const paidAtSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = parseStudioDateTimeInput(`${value}T00:00`);
  const { year, month, day } = getStudioDateTimeParts(parsed);
  const normalized = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return normalized === value ? parsed : new Date(Number.NaN);
}, z.coerce.date({ error: "Ingresa la fecha del pago." }));

export const renewalPaymentSchema = z
  .object({
    memberPlanId: z.string().uuid("El plan a renovar no es valido."),
    expectedNextPaymentDueAt: z.coerce.date({
      error: "La fecha esperada del plan no es valida.",
    }),
    amountReceived: z.coerce
      .number({ error: "Ingresa el importe recibido." })
      .min(0, "El importe recibido no puede ser negativo.")
      .max(99_999_999.99, "El importe recibido es demasiado alto."),
    currency: z.literal("ARS").default("ARS"),
    paymentMethod: z.enum([
      "bank_transfer",
      "cash",
      "card",
      "other",
    ]),
    paidAt: paidAtSchema,
    externalReference: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
    paymentVerified: paymentVerifiedSchema,
  })
  .superRefine((value, context) => {
    if (
      ["bank_transfer", "card"].includes(value.paymentMethod) &&
      !value.externalReference
    ) {
      context.addIssue({
        code: "custom",
        path: ["externalReference"],
        message: "Ingresa la referencia del pago.",
      });
    }
  });

export type RenewalFilters = z.infer<typeof renewalFiltersSchema>;
export type RenewalPaymentInput = z.infer<typeof renewalPaymentSchema>;
