import { formatStudioDateTime } from "@/lib/datetime";
import {
  createSpaceBlockAction,
  deleteSpaceAction,
  deleteSpaceBlockAction,
  updateSpaceAction,
  updateSpaceStatusAction,
} from "@/modules/spaces/actions";
import type { getSpaceDetail } from "@/modules/spaces/queries";
import { weekdayOptions } from "@/modules/spaces/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SpaceForm } from "@/components/forms/space-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SpaceDetail = Awaited<ReturnType<typeof getSpaceDetail>>;

type AdminSpaceDetailProps = {
  space: SpaceDetail;
};

function getDayLabel(dayOfWeek: number) {
  return weekdayOptions.find((day) => day.value === dayOfWeek)?.label ?? `Dia ${dayOfWeek}`;
}

export function AdminSpaceDetail({ space }: AdminSpaceDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
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
            <CardTitle>Bloqueos operativos</CardTitle>
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

      <SpaceForm
        action={updateSpaceAction}
        title="Editar espacio"
        submitLabel="Guardar cambios"
        defaultValues={{
          name: space.name,
          description: space.description,
          imageUrl: space.imageUrl,
          galleryUrls: space.galleryUrls ?? [],
          videoLinks: space.videoLinks ?? [],
          capacity: space.capacity,
          status: space.status,
          hourlyQuotaCost: space.hourlyQuotaCost,
          minBookingHours: space.minBookingHours,
          maxBookingHours: space.maxBookingHours,
          availabilityRules: space.availability,
        }}
      >
        <input type="hidden" name="spaceId" value={space.id} />
      </SpaceForm>

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
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavía no hay bloqueos cargados para este espacio.
                  </TableCell>
                </TableRow>
              ) : (
                space.blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.title}</TableCell>
                    <TableCell>{block.reason ?? "Sin detalle"}</TableCell>
                    <TableCell>{formatStudioDateTime(block.startsAt)}</TableCell>
                    <TableCell>{formatStudioDateTime(block.endsAt)}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteSpaceBlockAction}>
                        <input type="hidden" name="spaceId" value={space.id} />
                        <input type="hidden" name="blockId" value={block.id} />
                        <Button type="submit" variant="outline" size="sm">Eliminar</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Zona de acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ocultá el espacio para retirarlo del catálogo y de la operación activa. La eliminación
            total solo se habilita si nunca tuvo reservas asociadas.
          </p>

          <div className="flex flex-wrap gap-3">
            <form action={updateSpaceStatusAction}>
              <input type="hidden" name="spaceId" value={space.id} />
              <input type="hidden" name="status" value="inactive" />
              <input type="hidden" name="reason" value="Ocultado desde la zona de acciones." />
              <Button type="submit" variant="outline" disabled={space.status === "inactive"}>
                Ocultar espacio
              </Button>
            </form>

            {space.deleteSummary.canDelete ? (
              <form action={deleteSpaceAction}>
                <input type="hidden" name="spaceId" value={space.id} />
                <Button type="submit" variant="destructive">
                  Eliminar espacio
                </Button>
              </form>
            ) : (
              <Alert variant="destructive" className="max-w-xl">
                <AlertTitle>Eliminación bloqueada</AlertTitle>
                <AlertDescription>
                  No se puede eliminar mientras tenga reservas asociadas.
                  {` Reservas encontradas: ${space.deleteSummary.bookingCount}.`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
