import { BookingForm } from "@/components/forms/booking-form";
import { listBookingSpaceOptions } from "@/modules/bookings/queries";

export default async function NewMemberBookingPage() {
  const spaceOptions = await listBookingSpaceOptions();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reservar</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nueva reserva</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Elegí un espacio y un horario. El sistema valida automáticamente disponibilidad real y cupos antes de confirmar.
        </p>
      </div>

      <BookingForm role="member" spaceOptions={spaceOptions} />
    </div>
  );
}
