import { BookingForm } from "@/components/forms/booking-form";
import { listBookingMemberOptions, listBookingSpaceOptions } from "@/modules/bookings/queries";

export default async function NewAdminBookingPage() {
  const [spaceOptions, memberOptions] = await Promise.all([
    listBookingSpaceOptions(),
    listBookingMemberOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reservas</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nueva reserva</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Seleccioná el miembro, el espacio y el horario. El sistema valida cupos, bloqueos y solapamientos antes de confirmar.
        </p>
      </div>

      <BookingForm role="admin" spaceOptions={spaceOptions} memberOptions={memberOptions} />
    </div>
  );
}
