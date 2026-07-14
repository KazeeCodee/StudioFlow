import { describe, expect, it } from "vitest";
import {
  classifyRenewalUrgency,
  formatRenewalRelativeDay,
  getRenewalQueueBoundaries,
} from "@/modules/renewals/status";

const now = new Date("2026-07-14T15:00:00.000Z");

describe("classifyRenewalUrgency", () => {
  it("mantiene los planes vencidos dentro de la cola operativa", () => {
    expect(
      classifyRenewalUrgency(
        new Date("2026-07-13T15:00:00.000Z"),
        now,
        7,
      ),
    ).toBe("overdue");
  });

  it("distingue los planes que vencen hoy en la zona horaria del estudio", () => {
    expect(
      classifyRenewalUrgency(
        new Date("2026-07-15T01:30:00.000Z"),
        now,
        7,
      ),
    ).toBe("due_today");
  });

  it("clasifica los vencimientos dentro de la ventana configurada", () => {
    expect(
      classifyRenewalUrgency(
        new Date("2026-07-18T15:00:00.000Z"),
        now,
        7,
      ),
    ).toBe("due_soon");
  });

  it("conserva como futuros los vencimientos posteriores a la ventana", () => {
    expect(
      classifyRenewalUrgency(
        new Date("2026-08-14T15:00:00.000Z"),
        now,
        7,
      ),
    ).toBe("future");
  });
});

describe("formatRenewalRelativeDay", () => {
  it("expresa vencimientos pasados y futuros en dias del estudio", () => {
    expect(formatRenewalRelativeDay(new Date("2026-07-12T15:00:00.000Z"), now)).toBe("Hace 2 días");
    expect(formatRenewalRelativeDay(new Date("2026-07-15T15:00:00.000Z"), now)).toBe("Mañana");
    expect(formatRenewalRelativeDay(new Date("2026-07-18T15:00:00.000Z"), now)).toBe("En 4 días");
  });
});

describe("getRenewalQueueBoundaries", () => {
  it("usa dias calendario completos de Buenos Aires", () => {
    expect(getRenewalQueueBoundaries(now, 7)).toEqual({
      todayStart: new Date("2026-07-14T03:00:00.000Z"),
      tomorrowStart: new Date("2026-07-15T03:00:00.000Z"),
      pendingEndExclusive: new Date("2026-07-22T03:00:00.000Z"),
    });
  });
});
