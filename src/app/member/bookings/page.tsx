import Link from "next/link";
import { Plus } from "lucide-react";
import { formatStudioDateTime } from "@/lib/datetime";
import { cancelBookingAction } from "@/modules/bookings/actions";
import { listMemberBookings } from "@/modules/bookings/queries";
import { requireMemberContext } from "@/modules/auth/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function MemberBookingsPage() {
  const { profile } = await requireMemberContext();
  const items = await listMemberBookings(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mis reservas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Proximas y pasadas</h2>
        </div>
        <Button asChild>
          <Link href="/member/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            Reservar
          </Link>
        </Button>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Cupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Todavia no tenes reservas cargadas.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.spaceName}</TableCell>
                    <TableCell>{formatStudioDateTime(booking.startsAt)}</TableCell>
                    <TableCell>{formatStudioDateTime(booking.endsAt)}</TableCell>
                    <TableCell>{booking.quotaConsumed}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost">
                          <Link href={`/member/bookings/${booking.id}`}>Ver detalle</Link>
                        </Button>
                        {booking.status === "confirmed" ? (
                          <form action={cancelBookingAction}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="redirectTo" value="/member/bookings" />
                            <Button type="submit" variant="outline">
                              Cancelar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
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
