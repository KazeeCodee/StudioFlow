import { redirect } from "next/navigation";
import { AdminStaffUsers } from "@/components/staff/admin-staff-users";
import { canManageStaffUsers } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { listStaffUsers } from "@/modules/staff-users/queries";

export default async function AdminUsersPage() {
  const { profile } = await requireStaffContext();

  if (!canManageStaffUsers(profile.role)) {
    redirect("/admin");
  }

  const users = await listStaffUsers();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Equipo</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Usuarios internos</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Administrá accesos administrativos y operativos, con contraseña inicial definida por el admin.
        </p>
      </div>

      <AdminStaffUsers users={users} currentUserId={profile.id} />
    </div>
  );
}
