import { describe, expect, it } from "vitest";
import {
  buildRenewalQueueInput,
  isRenewalInQueue,
} from "@/modules/renewals/queries";

const now = new Date("2026-07-14T15:00:00.000Z");

describe("buildRenewalQueueInput", () => {
  it("normaliza busqueda, pagina y tamano de pagina", () => {
    expect(
      buildRenewalQueueInput({
        view: "all",
        q: "  Ana@example.com  ",
        page: "3",
        pageSize: 500,
      }),
    ).toEqual({
      view: "all",
      q: "Ana@example.com",
      page: 3,
      pageSize: 100,
    });
  });

  it("usa valores seguros cuando faltan filtros", () => {
    expect(buildRenewalQueueInput()).toEqual({
      view: "pending",
      q: "",
      page: 1,
      pageSize: 25,
    });
  });
});

describe("isRenewalInQueue", () => {
  it("incluye vencidos y proximos dentro de Pendientes", () => {
    expect(
      isRenewalInQueue(
        new Date("2026-07-01T15:00:00.000Z"),
        "pending",
        now,
        7,
      ),
    ).toBe(true);
    expect(
      isRenewalInQueue(
        new Date("2026-07-20T15:00:00.000Z"),
        "pending",
        now,
        7,
      ),
    ).toBe(true);
  });

  it("excluye de Pendientes los vencimientos fuera de la ventana", () => {
    expect(
      isRenewalInQueue(
        new Date("2026-08-14T15:00:00.000Z"),
        "pending",
        now,
        7,
      ),
    ).toBe(false);
  });

  it("incluye cualquier vencimiento activo en Todos", () => {
    expect(
      isRenewalInQueue(
        new Date("2027-01-14T15:00:00.000Z"),
        "all",
        now,
        7,
      ),
    ).toBe(true);
  });
});
