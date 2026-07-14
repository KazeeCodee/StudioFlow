import Link from "next/link";
import { ArrowRight, History, Search } from "lucide-react";
import { RenewalsPagination } from "@/components/renewals/renewals-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudioDate, formatStudioDateTime } from "@/lib/datetime";
import type { RenewalHistoryResult } from "@/modules/renewals/queries";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const paymentMethodLabels = {
  bank_transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

function historyHref(view: "pending" | "all" | "history", q: string) {
  const params = new URLSearchParams({ view });
  if (q) params.set("q", q);
  return `/admin/renewals?${params.toString()}`;
}

export function RenewalHistoryTable({ result, q }: { result: RenewalHistoryResult; q: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Vistas de renovaciones" className="flex flex-wrap gap-1 rounded-lg bg-muted/70 p-1">
          <Link href={historyHref("pending", q)} className="flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Pendientes</Link>
          <Link href={historyHref("all", q)} className="flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Todos los planes</Link>
          <Link href={historyHref("history", q)} aria-current="page" className="flex min-h-9 items-center gap-2 rounded-md bg-background px-3 text-sm font-medium">
            Historial
            <span className="text-xs tabular-nums">{result.pagination.total}</span>
          </Link>
        </nav>
        <form method="get" action="/admin/renewals" className="flex min-w-0 gap-2">
          <input type="hidden" name="view" value="history" />
          <div className="relative min-w-0 flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Miembro o referencia" aria-label="Buscar en historial" className="h-9 pl-8" />
          </div>
          <Button type="submit" variant="outline" size="lg">Buscar</Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <History className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">{q ? "No hay eventos con esa búsqueda." : "Todavía no hay renovaciones registradas."}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {q ? "Probá con otro nombre, email o referencia de pago." : "Cada pago confirmado aparecerá aquí con su operador y cambios aplicados."}
          </p>
          {q ? <Button asChild variant="outline" className="mt-4"><Link href={historyHref("history", "")}>Limpiar búsqueda</Link></Button> : null}
        </div>
      ) : (
        <Table className="block md:table">
          <TableHeader className="hidden bg-muted/30 md:table-header-group">
            <TableRow>
              <TableHead className="pl-4">Fecha y miembro</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="pr-4">Cambios aplicados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block md:table-row-group">
            {result.items.map((item) => (
              <TableRow key={item.id} className="grid gap-3 p-4 md:table-row md:p-0">
                <TableCell className="p-0 md:table-cell md:py-3 md:pl-4">
                  <p className="font-medium">{item.memberName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.planName} · {formatStudioDateTime(item.renewedAt)}</p>
                </TableCell>
                <TableCell className="p-0 text-sm md:table-cell md:p-2">
                  <span className="text-xs text-muted-foreground md:hidden">Operador · </span>
                  {item.renewedByName ?? "Operador no disponible"}
                </TableCell>
                <TableCell className="p-0 whitespace-normal md:table-cell md:p-2">
                  {item.amountReceived && item.paymentMethod ? (
                    <div>
                      <p className="font-medium tabular-nums">{money.format(Number(item.amountReceived))} · {paymentMethodLabels[item.paymentMethod]}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.externalReference ?? "Sin referencia"}{item.paidAt ? ` · ${formatStudioDate(item.paidAt)}` : ""}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin detalle de pago (registro anterior)</p>
                  )}
                </TableCell>
                <TableCell className="p-0 whitespace-normal md:table-cell md:p-2 md:pr-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
                    <span>{formatStudioDate(item.oldEndDate)}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{formatStudioDate(item.newEndDate)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{item.oldQuotaRemaining} restantes → {item.newQuotaTotal} disponibles</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RenewalsPagination page={result.pagination.page} pageCount={result.pagination.pageCount} total={result.pagination.total} view="history" q={q} />
    </div>
  );
}
