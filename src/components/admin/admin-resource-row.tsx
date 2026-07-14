import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminResourceRowProps = {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminResourceRow({
  href,
  label,
  children,
  className,
}: AdminResourceRowProps) {
  return (
    <TableRow
      className={cn(
        "relative cursor-pointer focus-within:bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset",
        className,
      )}
    >
      {children}
      <TableCell className="text-right">
        <Link
          href={href}
          aria-label={`Ver detalle de ${label}`}
          className="inline-flex items-center justify-end gap-1 text-sm font-medium text-primary after:absolute after:inset-0 focus-visible:outline-none"
        >
          Ver detalle
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
