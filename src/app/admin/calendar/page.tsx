import { BookingsCalendar } from "@/components/calendar/bookings-calendar";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import {
  listBookingMemberOptions,
  listBookingSpaceOptions,
  listCalendarEntries,
} from "@/modules/bookings/queries";

type CalendarPageProps = {
  searchParams: Promise<{
    memberId?: string;
    spaceId?: string;
    status?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const [spaceOptions, memberOptions, events] = await Promise.all([
    listBookingSpaceOptions(),
    listBookingMemberOptions(),
    listCalendarEntries({
      memberId: params.memberId || undefined,
      spaceId: params.spaceId || undefined,
      status: params.status || undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Calendario</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Agenda general del estudio</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Vista centralizada de reservas y bloqueos con filtros por miembro, espacio y estado para operar el estudio sin superposiciones.
        </p>
      </div>

      <CalendarFilters
        spaceOptions={spaceOptions}
        memberOptions={memberOptions}
        selectedMemberId={params.memberId}
        selectedSpaceId={params.spaceId}
        selectedStatus={params.status}
      />

      <BookingsCalendar events={events} />
    </div>
  );
}
