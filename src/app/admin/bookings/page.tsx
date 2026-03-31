import Link from "next/link";
import { Plus } from "lucide-react";
import { cancelBookingAction } from "@/modules/bookings/actions";
import { listAdminBookings } from "@/modules/bookings/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminBookingsPage() {
  const items = await listAdminBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reservas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Agenda operativa</h2>
        </div>
        <Button asChild>
          <Link href="/admin/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva reserva
          </Link>
        </Button>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Reservas cargadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
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
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavía no hay reservas creadas.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.memberName}</TableCell>
                    <TableCell>{booking.spaceName}</TableCell>
                    <TableCell>{booking.startsAt.toLocaleString("es-AR")}</TableCell>
                    <TableCell>{booking.endsAt.toLocaleString("es-AR")}</TableCell>
                    <TableCell>{booking.quotaConsumed}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell className="text-right">
                      {booking.status === "confirmed" ? (
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="redirectTo" value="/admin/bookings" />
                          <Button type="submit" variant="outline">
                            Cancelar
                          </Button>
                        </form>
                      ) : null}
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
