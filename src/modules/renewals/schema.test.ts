import { describe, expect, it } from "vitest";
import {
  renewalFiltersSchema,
  renewalPaymentSchema,
} from "@/modules/renewals/schema";
import { formatStudioDate } from "@/lib/datetime";

const validPayment = {
  memberPlanId: "87aaf7a7-e667-4690-8f38-6f328f313606",
  expectedNextPaymentDueAt: "2026-07-14T15:00:00.000Z",
  amountReceived: "25000",
  currency: "ARS",
  paymentMethod: "bank_transfer",
  paidAt: "2026-07-14",
  externalReference: "TRX-2026-0714",
  notes: "Pago validado contra el resumen bancario.",
  paymentVerified: "true",
};

describe("renewalFiltersSchema", () => {
  it("aplica una vista operativa y paginacion seguras por defecto", () => {
    expect(renewalFiltersSchema.parse({})).toEqual({
      view: "pending",
      q: "",
      page: 1,
    });
  });

  it("recorta la busqueda y normaliza la pagina", () => {
    expect(
      renewalFiltersSchema.parse({ view: "all", q: "  ana@studio.com  ", page: "2" }),
    ).toEqual({ view: "all", q: "ana@studio.com", page: 2 });
  });
});

describe("renewalPaymentSchema", () => {
  it("normaliza la evidencia de un pago valido", () => {
    const payment = renewalPaymentSchema.parse(validPayment);

    expect(payment).toMatchObject({
      amountReceived: 25000,
      currency: "ARS",
      paymentMethod: "bank_transfer",
      externalReference: "TRX-2026-0714",
      paymentVerified: true,
    });
    expect(formatStudioDate(payment.paidAt)).toBe("14/07/2026");
  });

  it("exige referencia para transferencias", () => {
    const result = renewalPaymentSchema.safeParse({
      ...validPayment,
      externalReference: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.externalReference).toContain(
        "Ingresa la referencia del pago.",
      );
    }
  });

  it("exige confirmar que el pago fue verificado", () => {
    const result = renewalPaymentSchema.safeParse({
      ...validPayment,
      paymentVerified: "false",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.paymentVerified).toContain(
        "Confirma que verificaste el pago.",
      );
    }
  });

  it("permite omitir la referencia para pagos en efectivo", () => {
    expect(
      renewalPaymentSchema.safeParse({
        ...validPayment,
        paymentMethod: "cash",
        externalReference: "",
      }).success,
    ).toBe(true);
  });

  it("rechaza importes que exceden la precision de la base", () => {
    expect(
      renewalPaymentSchema.safeParse({
        ...validPayment,
        amountReceived: "100000000",
      }).success,
    ).toBe(false);
  });
});
