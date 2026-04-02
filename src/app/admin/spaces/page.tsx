import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SpaceStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SpacesGrid } from "@/components/spaces/spaces-grid";
import { SpacesViewToggle } from "@/components/spaces/spaces-view-toggle";
import { canManageSpaces } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { listSpaces } from "@/modules/spaces/queries";
import { ImageIcon } from "lucide-react";

type SpacesPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManageSpaces(profile.role)) {
    redirect("/admin");
  }

  const [items, params] = await Promise.all([listSpaces(), searchParams]);
  const isGrid = params.view === "grid";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Espacios
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
            Sets, salas y recursos reservables
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <SpacesViewToggle />
          <Button asChild className="rounded-xl">
            <Link href="/admin/spaces/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo espacio
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isGrid ? (
        <SpacesGrid spaces={items} />
      ) : (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-0">
            {items.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="h-6 w-6" />}
                title="No hay espacios creados"
                description="Creá el primer espacio para empezar a gestionar reservas."
                action={
                  <Button asChild size="sm" className="rounded-xl">
                    <Link href="/admin/spaces/new">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Crear espacio
                    </Link>
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">
                      Espacio
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Cupos/h
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Mínimo
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Máximo
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Media
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((space) => {
                    const mediaCount =
                      (space.galleryUrls?.length ?? 0) + (space.videoLinks?.length ?? 0);
                    return (
                      <TableRow
                        key={space.id}
                        className="group border-border/40 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="py-3">
                          <Link
                            href={`/admin/spaces/${space.id}`}
                            className="font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {space.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">{space.slug}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <SpaceStatusBadge
                            status={space.status as "active" | "inactive" | "maintenance"}
                          />
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums text-sm">
                          {space.hourlyQuotaCost}
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums text-sm text-muted-foreground">
                          {space.minBookingHours}h
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums text-sm text-muted-foreground">
                          {space.maxBookingHours}h
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          {mediaCount > 0 ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                              {mediaCount}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
