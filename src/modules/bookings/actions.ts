"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedContext, requireMemberContext, requireStaffContext } from "@/modules/auth/queries";
import { bookingSchema, cancellationSchema } from "@/modules/bookings/schema";
import { cancelBooking } from "@/services/bookings/cancel-booking";
import { createBooking } from "@/services/bookings/create-booking";
import {
  sendBookingCancelledNotifications,
  sendBookingCreatedNotifications,
} from "@/services/notifications/dispatcher";

async function notifySafely(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.error("Notification delivery failed", error);
  }
}

export async function createAdminBookingAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const input = bookingSchema.parse({
    memberId: formData.get("memberId"),
    spaceId: formData.get("spaceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  const booking = await createBooking(input, profile);
  await notifySafely(() => sendBookingCreatedNotifications(booking.id));

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

  const booking = await createBooking(input, profile);
  await notifySafely(() => sendBookingCreatedNotifications(booking.id));

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

  const cancellation = await cancelBooking(
    {
      bookingId: input.bookingId,
      reason: input.reason,
    },
    profile,
  );
  await notifySafely(() => sendBookingCancelledNotifications(cancellation.bookingId));

  const redirectTo = input.redirectTo || (profile.role === "member" ? "/member/bookings" : "/admin/bookings");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
