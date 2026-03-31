import { createSpaceBlockAction } from "@/modules/spaces/actions";
import { getSpaceDetail } from "@/modules/spaces/queries";
import { weekdayOptions } from "@/modules/spaces/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SpaceDetailPageProps = {
  params: Promise<{
    spaceId: string;
  }>;
};

function getDayLabel(dayOfWeek: number) {
  return weekdayOptions.find((day) => day.value === dayOfWeek)?.label ?? `Día ${dayOfWeek}`;
}

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { spaceId } = await params;
  const space = await getSpaceDetail(spaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Espacios</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{space.name}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {space.description ?? "Todavía no hay una descripción operativa para este espacio."}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Configuración general</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
              <p className="mt-2 text-xl font-semibold">{space.status}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Costo por hora</p>
              <p className="mt-2 text-xl font-semibold">{space.hourlyQuotaCost} cupos</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reserva mínima</p>
              <p className="mt-2 text-xl font-semibold">{space.minBookingHours}h</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reserva máxima</p>
              <p className="mt-2 text-xl font-semibold">{space.maxBookingHours}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Agregar bloqueo operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSpaceBlockAction} className="space-y-4">
              <input type="hidden" name="spaceId" value={space.id} />

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" placeholder="Mantenimiento técnico" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea id="reason" name="reason" placeholder="Detalle interno del bloqueo..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Inicio</Label>
                  <Input id="startsAt" name="startsAt" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Fin</Label>
                  <Input id="endsAt" name="endsAt" type="datetime-local" required />
                </div>
              </div>

              <Button type="submit">Guardar bloqueo</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Disponibilidad semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.availability.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{getDayLabel(rule.dayOfWeek)}</TableCell>
                  <TableCell>{rule.isActive ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>{rule.startTime}</TableCell>
                  <TableCell>{rule.endTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Bloqueos cargados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Todavía no hay bloqueos cargados para este espacio.
                  </TableCell>
                </TableRow>
              ) : (
                space.blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.title}</TableCell>
                    <TableCell>{block.reason ?? "Sin detalle"}</TableCell>
                    <TableCell>{block.startsAt.toLocaleString("es-AR")}</TableCell>
                    <TableCell>{block.endsAt.toLocaleString("es-AR")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
