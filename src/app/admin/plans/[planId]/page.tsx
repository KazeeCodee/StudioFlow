import { redirect } from "next/navigation";
import { AdminPlanDetail } from "@/components/plans/admin-plan-detail";
import { canManagePlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { getPlanDetail } from "@/modules/plans/queries";

type PlanDetailPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManagePlans(profile.role)) {
    redirect("/admin");
  }

  const { planId } = await params;
  const plan = await getPlanDetail(planId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Planes</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{plan.name}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Ajustá reglas del plan y administrá su estado operativo desde una sola vista.
        </p>
      </div>

      <AdminPlanDetail plan={plan} />
    </div>
  );
}
