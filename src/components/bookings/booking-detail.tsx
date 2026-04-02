import { formatStudioDateTime, formatStudioDateTimeInputValue } from "@/lib/datetime";
import type { AppRole } from "@/modules/auth/types";
import { cancelBookingAction, rescheduleBookingAction } from "@/modules/bookings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BookingTimelineEntry = {
  id: string;
  kind: "status" | "audit";
  createdAt: Date;
  actorName: string | null;
  label: string;
  description: string | null;
};

type BookingDetailData = {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  durationHours: number;
  quotaConsumed: number;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  memberName: string;
  memberEmail: string;
  spaceName: string;
  createdAt: Date;
  updatedAt: Date;
  cancellationPolicyHours: number | null;
  timeline: BookingTimelineEntry[];
};

type BookingDetailProps = {
  role: AppRole;
  booking: BookingDetailData;
  cancelAction?: (formData: FormData) => void | Promise<void>;
  rescheduleAction?: (formData: FormData) => void | Promise<void>;
};

export function BookingDetail({
  role,
  booking,
  cancelAction = cancelBookingAction,
  rescheduleAction = rescheduleBookingAction,
}: BookingDetailProps) {
  const redirectTo = role === "member" ? `/member/bookings/${booking.id}` : `/admin/bookings/${booking.id}`;
  const canOperate = booking.status === "confirmed" && booking.startsAt > new Date();
  const policyHours = booking.cancellationPolicyHours ?? 24;
  const penaltyCopy = `Si cancelas o reprogramas con ${policyHours} hora(s) o mas de anticipacion, los cupos se reintegran. Despues de ese limite, los cupos siguen consumidos.`;

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>{`Reserva #${booking.id}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Miembro</p>
            <p className="mt-2 font-semibold">{booking.memberName}</p>
            <p className="text-sm text-muted-foreground">{booking.memberEmail}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espacio</p>
            <p className="mt-2 font-semibold">{booking.spaceName}</p>
            <p className="text-sm text-muted-foreground">{booking.status}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Horario</p>
            <p className="mt-2 font-semibold">{formatStudioDateTime(booking.startsAt)}</p>
            <p className="text-sm text-muted-foreground">{formatStudioDateTime(booking.endsAt)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cupos</p>
            <p className="mt-2 font-semibold">{booking.quotaConsumed}</p>
            <p className="text-sm text-muted-foreground">{booking.durationHours} hora(s)</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Historial y auditoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavia no hay movimientos registrados para esta reserva.
              </p>
            ) : (
              booking.timeline.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatStudioDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.actorName ?? "Sistema"}
                  </p>
                  {entry.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
            <CardTitle>Reprogramar reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={rescheduleAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="space-y-2">
                  <Label htmlFor="startsAt">Nuevo inicio</Label>
                  <Input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={formatStudioDateTimeInputValue(booking.startsAt)}
                    required
                    disabled={!canOperate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Nuevo fin</Label>
                  <Input
                    id="endsAt"
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={formatStudioDateTimeInputValue(booking.endsAt)}
                    required
                    disabled={!canOperate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Cambio operativo o solicitud del miembro..."
                    disabled={!canOperate}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{penaltyCopy}</p>

                <Button type="submit" disabled={!canOperate}>
                  Guardar reprogramacion
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
              <CardTitle>Cancelar reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={cancelAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Motivo</Label>
                  <Textarea
                    id="cancel-reason"
                    name="reason"
                    placeholder="Deja un motivo para auditoria y seguimiento..."
                    disabled={!canOperate}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{penaltyCopy}</p>

                <Button type="submit" variant="outline" disabled={!canOperate}>
                  Cancelar reserva
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
