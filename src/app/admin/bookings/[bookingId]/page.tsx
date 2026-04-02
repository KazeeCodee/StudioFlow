import { redirect } from "next/navigation";
import { BookingDetail } from "@/components/bookings/booking-detail";
import { canManageBookings } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { getBookingDetail } from "@/modules/bookings/queries";

type AdminBookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingDetailPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManageBookings(profile.role)) {
    redirect("/admin");
  }

  const { bookingId } = await params;
  const booking = await getBookingDetail(bookingId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reservas</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{booking.spaceName}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Revisa el detalle operativo, la auditoria y gestiona cancelaciones o reprogramaciones
          desde una sola vista.
        </p>
      </div>

      <BookingDetail role={profile.role} booking={booking} />
    </div>
  );
}
