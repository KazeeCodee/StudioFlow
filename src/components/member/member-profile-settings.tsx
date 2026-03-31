import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { MemberProfileSnapshot } from "@/modules/member-portal/queries";

type MemberProfileSettingsProps = {
  profile: MemberProfileSnapshot;
  updateProfileAction?: (formData: FormData) => void | Promise<void>;
  changePasswordAction?: (formData: FormData) => void | Promise<void>;
};

export function MemberProfileSettings({
  profile,
  updateProfileAction,
  changePasswordAction,
}: MemberProfileSettingsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>
            Mantené tus datos actualizados para que el staff pueda ubicarte y gestionar tu plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value="/member/profile" />
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.fullName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Elegí una nueva contraseña para entrar al portal con más seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={changePasswordAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value="/member/profile" />
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input id="password" name="password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" />
            </div>
            <Button type="submit" variant="outline">
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
