import { createStaffUserAction, updateStaffUserAction } from "@/modules/staff-users/actions";
import type { listStaffUsers } from "@/modules/staff-users/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StaffUser = Awaited<ReturnType<typeof listStaffUsers>>[number];

type AdminStaffUsersProps = {
  users: StaffUser[];
  currentUserId: string;
};

export function AdminStaffUsers({ users, currentUserId }: AdminStaffUsersProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Alta de usuario interno</CardTitle>
          <CardDescription>
            Creá cuentas de super admin, admin u operator con contraseña inicial definida por el staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStaffUserAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-fullName">Nombre completo</Label>
              <Input id="new-fullName" name="fullName" placeholder="Ada Lovelace" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" name="email" type="email" placeholder="ada@studioflow.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-phone">Teléfono</Label>
              <Input id="new-phone" name="phone" placeholder="+54 11 ..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Rol</Label>
              <select
                id="new-role"
                name="role"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                defaultValue="operator"
              >
                <option value="super_admin">Super admin</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">Estado</Label>
              <select
                id="new-status"
                name="status"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                defaultValue="active"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-password">Contraseña inicial</Label>
              <Input id="new-password" name="password" type="password" minLength={8} required />
            </div>

            <div className="md:col-span-2">
              <Button type="submit">Crear usuario interno</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {users.map((user) => (
          <Card key={user.id} className="rounded-[28px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription>
                {user.email}
                {user.id === currentUserId ? " · Tu cuenta" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateStaffUserAction} className="grid gap-5">
                <input type="hidden" name="userId" value={user.id} />

                <div className="space-y-2">
                  <Label htmlFor={`fullName-${user.id}`}>Nombre completo</Label>
                  <Input id={`fullName-${user.id}`} name="fullName" defaultValue={user.fullName} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${user.id}`}>Teléfono</Label>
                  <Input id={`phone-${user.id}`} name="phone" defaultValue={user.phone ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`role-${user.id}`}>Rol</Label>
                  <select
                    id={`role-${user.id}`}
                    name="role"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    defaultValue={user.role}
                  >
                    <option value="super_admin">Super admin</option>
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`status-${user.id}`}>Estado</Label>
                  <select
                    id={`status-${user.id}`}
                    name="status"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    defaultValue={user.status}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`password-${user.id}`}>Nueva contraseña opcional</Label>
                  <Input
                    id={`password-${user.id}`}
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="Solo si querés reemplazar la actual"
                  />
                </div>

                <Button type="submit" variant="outline">
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
