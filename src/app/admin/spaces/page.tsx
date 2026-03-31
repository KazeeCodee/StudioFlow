import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listSpaces } from "@/modules/spaces/queries";

export default async function SpacesPage() {
  const items = await listSpaces();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Espacios</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sets, salas y recursos reservables</h2>
        </div>
        <Button asChild>
          <Link href="/admin/spaces/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo espacio
          </Link>
        </Button>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Listado actual</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cupos/hora</TableHead>
                <TableHead>Reserva mínima</TableHead>
                <TableHead>Reserva máxima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavía no hay espacios creados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <Link href={`/admin/spaces/${space.id}`} className="font-medium hover:underline">
                        {space.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{space.slug}</p>
                    </TableCell>
                    <TableCell>{space.status}</TableCell>
                    <TableCell>{space.hourlyQuotaCost}</TableCell>
                    <TableCell>{space.minBookingHours}h</TableCell>
                    <TableCell>{space.maxBookingHours}h</TableCell>
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
