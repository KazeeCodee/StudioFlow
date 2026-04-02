import { redirect } from "next/navigation";
import { AdminMemberDetail } from "@/components/member/admin-member-detail";
import { canManageMembers } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { getMemberDetail } from "@/modules/members/queries";
import { listActivePlanOptions } from "@/modules/plans/queries";

type MemberDetailPageProps = {
  params: Promise<{
    memberId: string;
  }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManageMembers(profile.role)) {
    redirect("/admin");
  }

  const { memberId } = await params;
  const [member, planOptions] = await Promise.all([
    getMemberDetail(memberId),
    listActivePlanOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Miembros</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{member.fullName}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Administrá ficha, estado, cupos y plan activo desde una sola vista operativa.
        </p>
      </div>

      <AdminMemberDetail member={member} planOptions={planOptions} />
    </div>
  );
}
