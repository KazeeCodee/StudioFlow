import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireMemberContext } from "@/modules/auth/queries";

type MemberLayoutProps = {
  children: ReactNode;
};

export default async function MemberLayout({ children }: MemberLayoutProps) {
  const { profile } = await requireMemberContext();

  return (
    <AppShell
      title="Tu estudio, ordenado"
      subtitle="Desde acá podés seguir tu plan, ver tus próximas reservas y ubicar rápido lo que necesitás."
      role={profile.role}
      user={{
        name: profile.fullName,
        email: profile.email,
      }}
      eyebrow="Portal miembro"
      statusLabel="Acceso habilitado"
    >
      {children}
    </AppShell>
  );
}
