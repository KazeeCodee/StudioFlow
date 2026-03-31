import { MemberOverview } from "@/components/member/member-overview";
import { requireMemberContext } from "@/modules/auth/queries";
import { getMemberPortalSnapshot } from "@/modules/member-portal/queries";

export default async function MemberHomePage() {
  const { profile } = await requireMemberContext();
  const data = await getMemberPortalSnapshot(profile.id);

  if (!data) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-sm text-muted-foreground">
          No encontramos una ficha activa para este acceso. Escribile al staff para revisar tu cuenta.
        </p>
      </div>
    );
  }

  return <MemberOverview data={data} />;
}
