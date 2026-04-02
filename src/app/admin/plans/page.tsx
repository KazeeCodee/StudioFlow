import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManagePlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { listPlans } from "@/modules/plans/queries";

export default async function PlansPage() {
  const { profile } = await requireStaffContext();

  if (!canManagePlans(profile.role)) {
    redirect("/admin");
  }

  const items = await listPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Planes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Planes y reglas de cupos</h2>
        </div>
        <Button asChild>
          <Link href="/admin/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan
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
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Cupos</TableHead>
                <TableHead>Cancelación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavía no hay planes creados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <Link href={`/admin/plans/${plan.id}`} className="font-medium hover:underline">
                          {plan.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {plan.description ?? "Sin descripción"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{plan.status}</TableCell>
                    <TableCell>
                      {plan.durationValue} {plan.durationType}
                    </TableCell>
                    <TableCell>{plan.quotaAmount}</TableCell>
                    <TableCell>{plan.cancellationPolicyHours}h</TableCell>
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
