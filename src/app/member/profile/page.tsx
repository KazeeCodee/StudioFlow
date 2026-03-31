import { MemberProfileSettings } from "@/components/member/member-profile-settings";
import { requireMemberContext } from "@/modules/auth/queries";
import {
  changeMemberPasswordAction,
  updateMemberProfileAction,
} from "@/modules/member-portal/actions";
import { getMemberProfileSnapshot } from "@/modules/member-portal/queries";

export default async function MemberProfilePage() {
  const { profile } = await requireMemberContext();
  const memberProfile = await getMemberProfileSnapshot(profile.id);

  if (!memberProfile) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar tu perfil. Probá de nuevo en unos minutos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Perfil</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Tus datos y acceso</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Actualizá tu información básica y cambiá la contraseña de acceso cuando lo necesites.
        </p>
      </div>

      <MemberProfileSettings
        profile={memberProfile}
        updateProfileAction={updateMemberProfileAction}
        changePasswordAction={changeMemberPasswordAction}
      />
    </div>
  );
}
