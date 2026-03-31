import { MemberForm } from "@/components/forms/member-form";
import { listActivePlanOptions } from "@/modules/plans/queries";

export default async function NewMemberPage() {
  const planOptions = await listActivePlanOptions();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Miembros</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo miembro</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Creá el acceso inicial del miembro, asignale su plan y dejá configurado su ciclo inicial de cupos.
        </p>
      </div>
      <MemberForm planOptions={planOptions} />
    </div>
  );
}
