"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { RenewalReviewRow } from "@/components/renewals/renewal-review-row";
import { RenewalStatusBadge } from "@/components/renewals/renewal-status-badge";
import { RenewalsPagination } from "@/components/renewals/renewals-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudioDate } from "@/lib/datetime";
import type { RenewalQueueResult } from "@/modules/renewals/queries";
import {
  classifyRenewalUrgency,
  formatRenewalRelativeDay,
} from "@/modules/renewals/status";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function viewHref(view: "pending" | "all" | "history", q: string) {
  const params = new URLSearchParams({ view });
  if (q) params.set("q", q);
  return `/admin/renewals?${params.toString()}`;
}

export function RenewalsWorkbench({
  result,
  view,
  q,
}: {
  result: RenewalQueueResult;
  view: "pending" | "all";
  q: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const closeReview = (memberPlanId: string) => {
    setExpandedId(null);
    requestAnimationFrame(() => buttonRefs.current.get(memberPlanId)?.focus());
  };

  const completeReview = () => {
    setExpandedId(null);
    router.refresh();
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Vistas de renovaciones" className="flex flex-wrap gap-1 rounded-lg bg-muted/70 p-1">
          <Link
            href={viewHref("pending", q)}
            aria-current={view === "pending" ? "page" : undefined}
            className={`flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${view === "pending" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Pendientes
            <span className="tabular-nums text-xs">{result.counts.pending}</span>
          </Link>
          <Link
            href={viewHref("all", q)}
            aria-current={view === "all" ? "page" : undefined}
            className={`flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${view === "all" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Todos los planes
            <span className="tabular-nums text-xs">{result.counts.all}</span>
          </Link>
          <Link
            href={viewHref("history", q)}
            className="flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Historial
          </Link>
        </nav>

        <form method="get" action="/admin/renewals" className="flex min-w-0 gap-2">
          <input type="hidden" name="view" value={view} />
          <div className="relative min-w-0 flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Buscar nombre o email" aria-label="Buscar renovaciones" className="h-9 pl-8" />
          </div>
          <Button type="submit" variant="outline" size="lg">
            <SlidersHorizontal aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Aplicar</span>
          </Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-medium">
            {q ? "No encontramos renovaciones con esa búsqueda." : view === "pending" ? "No hay renovaciones que requieran atención." : "No hay planes activos."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {q ? "Probá con otro nombre o email, o limpiá la búsqueda." : view === "pending" ? "La cola volverá a mostrar casos cuando se acerque un vencimiento." : "Los planes activos aparecerán en esta vista."}
          </p>
          {q ? <Button asChild variant="outline" className="mt-4"><Link href={viewHref(view, "")}>Limpiar búsqueda</Link></Button> : null}
        </div>
      ) : (
        <Table className="block md:table">
          <TableHeader className="hidden bg-muted/30 md:table-header-group">
            <TableRow>
              <TableHead className="pl-4">Miembro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Cupos</TableHead>
              <TableHead className="pr-4 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block md:table-row-group">
            {result.items.map((item) => {
              const status = classifyRenewalUrgency(item.nextPaymentDueAt, result.now, result.renewalWindowDays);
              const isExpanded = expandedId === item.memberPlanId;

              return [
                <TableRow
                  key={item.memberPlanId}
                  aria-expanded={isExpanded}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-4 hover:bg-muted/30 md:table-row md:p-0"
                >
                  <TableCell className="col-start-1 min-w-0 p-0 md:table-cell md:py-3 md:pl-4">
                    <p className="truncate font-medium">{item.memberName}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.memberEmail}</p>
                  </TableCell>
                  <TableCell className="col-start-2 row-start-1 p-0 md:table-cell md:p-2">
                    <RenewalStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="col-start-1 p-0 text-sm md:table-cell md:p-2">
                    <span className="font-medium md:font-normal">{item.planName}</span>
                    <span className="ml-2 text-xs tabular-nums text-muted-foreground md:ml-0 md:block">{money.format(Number(item.planPrice ?? 0))}</span>
                  </TableCell>
                  <TableCell className="col-start-1 p-0 text-sm tabular-nums md:table-cell md:p-2">
                    {formatStudioDate(item.nextPaymentDueAt)}
                    <span className="ml-2 text-xs text-muted-foreground md:ml-0 md:block">
                      {formatRenewalRelativeDay(item.nextPaymentDueAt, result.now)}
                    </span>
                  </TableCell>
                  <TableCell className="col-start-1 p-0 text-xs tabular-nums text-muted-foreground md:table-cell md:p-2 md:text-sm md:text-foreground">
                    {item.quotaRemaining} de {item.quotaTotal} disponibles
                  </TableCell>
                  <TableCell className="col-start-2 row-span-3 row-start-2 flex items-end p-0 md:table-cell md:p-2 md:pr-4 md:text-right">
                    <Button
                      ref={(node) => {
                        if (node) buttonRefs.current.set(item.memberPlanId, node);
                        else buttonRefs.current.delete(item.memberPlanId);
                      }}
                      type="button"
                      variant={isExpanded ? "secondary" : "outline"}
                      aria-label={`Revisar pago de ${item.memberName}`}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : item.memberPlanId)}
                    >
                      Revisar pago
                      <ChevronRight className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>,
                isExpanded ? (
                  <TableRow key={`${item.memberPlanId}-review`} className="block md:table-row">
                    <TableCell colSpan={6} className="block p-0 whitespace-normal md:table-cell">
                      <RenewalReviewRow
                        item={item}
                        now={result.now}
                        onClose={() => closeReview(item.memberPlanId)}
                        onCompleted={completeReview}
                      />
                    </TableCell>
                  </TableRow>
                ) : null,
              ];
            })}
          </TableBody>
        </Table>
      )}

      <RenewalsPagination
        page={result.pagination.page}
        pageCount={result.pagination.pageCount}
        total={result.pagination.total}
        view={view}
        q={q}
      />
    </div>
  );
}
