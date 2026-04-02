import { listSmartBookingSpaceOptions } from "@/modules/bookings/queries";
import { SmartBookingForm } from "@/components/forms/smart-booking-form";

type PageProps = {
  searchParams: Promise<{ spaceId?: string }>;
};

export default async function NewMemberBookingPage({ searchParams }: PageProps) {
  const { spaceId } = await searchParams;
  const spaceOptions = await listSmartBookingSpaceOptions();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">Reservar</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Nueva reserva</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Elegí un espacio y la fecha. El sistema valida automáticamente disponibilidad real y cupos antes de confirmar.
        </p>
      </div>

      <SmartBookingForm spaceOptions={spaceOptions} preselectedSpaceId={spaceId} />
    </div>
  );
}
