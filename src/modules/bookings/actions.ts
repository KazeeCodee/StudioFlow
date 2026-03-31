"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedContext, requireMemberContext, requireStaffContext } from "@/modules/auth/queries";
import { bookingSchema, cancellationSchema } from "@/modules/bookings/schema";
import { cancelBooking } from "@/services/bookings/cancel-booking";
import { createBooking } from "@/services/bookings/create-booking";

export async function createAdminBookingAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const input = bookingSchema.parse({
    memberId: formData.get("memberId"),
    spaceId: formData.get("spaceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  await createBooking(input, profile);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/new");
  redirect("/admin/bookings");
}

export async function createMemberBookingAction(formData: FormData) {
  const { profile } = await requireMemberContext();
  const input = bookingSchema.parse({
    spaceId: formData.get("spaceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  await createBooking(input, profile);

  revalidatePath("/member/bookings");
  revalidatePath("/member/bookings/new");
  redirect("/member/bookings");
}

export async function cancelBookingAction(formData: FormData) {
  const { profile } = await requireAuthenticatedContext();
  const input = cancellationSchema.parse({
    bookingId: formData.get("bookingId"),
    reason: formData.get("reason"),
    redirectTo: formData.get("redirectTo"),
  });

  await cancelBooking(
    {
      bookingId: input.bookingId,
      reason: input.reason,
    },
    profile,
  );

  const redirectTo = input.redirectTo || (profile.role === "member" ? "/member/bookings" : "/admin/bookings");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
