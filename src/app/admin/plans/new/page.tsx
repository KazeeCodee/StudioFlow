import { redirect } from "next/navigation";
import { PlanForm } from "@/components/forms/plan-form";
import { canManagePlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";

export default async function NewPlanPage() {
  const { profile } = await requireStaffContext();

  if (!canManagePlans(profile.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Planes</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo plan</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Definí vigencia, cupos y reglas básicas para asignar este plan a futuros miembros.
        </p>
      </div>
      <PlanForm />
    </div>
  );
}
