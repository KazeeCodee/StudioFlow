import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMembers } from "@/modules/members/queries";

export default async function MembersPage() {
  const items = await listMembers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Miembros</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Miembros y planes activos</h2>
        </div>
        <Button asChild>
          <Link href="/admin/members/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo miembro
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
                <TableHead>Miembro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cupos restantes</TableHead>
                <TableHead>Vence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavía no hay miembros creados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.status}</TableCell>
                    <TableCell>{member.planName ?? "Sin plan"}</TableCell>
                    <TableCell>{member.quotaRemaining ?? "-"}</TableCell>
                    <TableCell>
                      {member.activePlanEndsAt
                        ? member.activePlanEndsAt.toLocaleDateString("es-AR")
                        : "-"}
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
