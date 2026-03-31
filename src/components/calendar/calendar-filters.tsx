import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type SpaceOption = Awaited<ReturnType<typeof import("@/modules/bookings/queries").listBookingSpaceOptions>>[number];
type MemberOption = Awaited<ReturnType<typeof import("@/modules/bookings/queries").listBookingMemberOptions>>[number];

type CalendarFiltersProps = {
  spaceOptions: SpaceOption[];
  memberOptions: MemberOption[];
  selectedSpaceId?: string;
  selectedMemberId?: string;
  selectedStatus?: string;
};

export function CalendarFilters({
  spaceOptions,
  memberOptions,
  selectedSpaceId,
  selectedMemberId,
  selectedStatus,
}: CalendarFiltersProps) {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_200px_auto]">
          <div className="space-y-2">
            <Label htmlFor="spaceId">Espacio</Label>
            <select
              id="spaceId"
              name="spaceId"
              defaultValue={selectedSpaceId ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Todos los espacios</option>
              {spaceOptions.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberId">Miembro</Label>
            <select
              id="memberId"
              name="memberId"
              defaultValue={selectedMemberId ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Todos los miembros</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              defaultValue={selectedStatus ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Todos</option>
              <option value="confirmed">Confirmada</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled_by_user">Cancelada usuario</option>
              <option value="cancelled_by_admin">Cancelada admin</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">Aplicar</Button>
            <Button type="reset" variant="outline" asChild>
              <a href="/admin/calendar">Limpiar</a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
