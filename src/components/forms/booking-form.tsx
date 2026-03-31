import type { AppRole } from "@/modules/auth/types";
import { createAdminBookingAction, createMemberBookingAction } from "@/modules/bookings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SpaceOption = Awaited<ReturnType<typeof import("@/modules/bookings/queries").listBookingSpaceOptions>>[number];
type MemberOption = Awaited<ReturnType<typeof import("@/modules/bookings/queries").listBookingMemberOptions>>[number];

type BookingFormProps = {
  role: AppRole;
  spaceOptions: SpaceOption[];
  memberOptions?: MemberOption[];
};

export function BookingForm({ role, spaceOptions, memberOptions = [] }: BookingFormProps) {
  const action = role === "member" ? createMemberBookingAction : createAdminBookingAction;

  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>{role === "member" ? "Reservar espacio" : "Crear reserva"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          {role !== "member" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="memberId">Miembro</Label>
              <select
                id="memberId"
                name="memberId"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Seleccionar miembro
                </option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName} · {member.planName} · {member.quotaRemaining} cupos
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spaceId">Espacio</Label>
            <select
              id="spaceId"
              name="spaceId"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Seleccionar espacio
              </option>
              {spaceOptions.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name} · {space.hourlyQuotaCost} cupos/hora
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startsAt">Inicio</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endsAt">Fin</Label>
            <Input id="endsAt" name="endsAt" type="datetime-local" required />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Confirmar reserva</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
