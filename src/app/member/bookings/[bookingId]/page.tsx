import { redirect } from "next/navigation";
import { BookingDetail } from "@/components/bookings/booking-detail";
import { requireMemberContext } from "@/modules/auth/queries";
import { getBookingDetail } from "@/modules/bookings/queries";

type MemberBookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function MemberBookingDetailPage({
  params,
}: MemberBookingDetailPageProps) {
  const { profile } = await requireMemberContext();
  const { bookingId } = await params;
  const booking = await getBookingDetail(bookingId);

  if (!booking.memberProfileId || booking.memberProfileId !== profile.id) {
    redirect("/member/bookings");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mis reservas</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{booking.spaceName}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Consulta el historial de tu reserva y, si sigue vigente, puedes cancelarla o reprogramarla
          segun la politica de tu plan.
        </p>
      </div>

      <BookingDetail role="member" booking={booking} />
    </div>
  );
}
