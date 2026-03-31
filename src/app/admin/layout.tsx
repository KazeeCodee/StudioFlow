import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireStaffContext } from "@/modules/auth/queries";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = await requireStaffContext();

  return (
    <AppShell
      title="Centro operativo"
      subtitle="Reservas, miembros, renovaciones y seguimiento del estudio desde una sola consola."
      role={profile.role}
      user={{
        name: profile.fullName,
        email: profile.email,
      }}
      eyebrow="Panel staff"
      statusLabel="Turno activo"
    >
      {children}
    </AppShell>
  );
}
