import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RenewalsPagination({
  page,
  pageCount,
  total,
  view,
  q,
}: {
  page: number;
  pageCount: number;
  total: number;
  view: "pending" | "all" | "history";
  q: string;
}) {
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams({ view, page: String(nextPage) });
    if (q) params.set("q", q);
    return `/admin/renewals?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{total}</span>{" "}
        {total === 1 ? "registro" : "registros"}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            tabIndex={page <= 1 ? -1 : undefined}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Link>
        </Button>
        <span className="min-w-20 text-center tabular-nums text-muted-foreground">
          {page} de {pageCount}
        </span>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}>
          <Link
            href={hrefFor(Math.min(pageCount, page + 1))}
            tabIndex={page >= pageCount ? -1 : undefined}
            className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
          >
            Siguiente
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
