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
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Equipo</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">Usuarios internos</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Gestiona accesos del equipo con clave inicial definida por el admin.
        </p>
      </div>

      <AdminStaffUsers users={users} currentUserId={profile.id} />
    </div>
  );
}
