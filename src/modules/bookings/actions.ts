"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedContext, requireMemberContext, requireStaffContext } from "@/modules/auth/queries";
import { bookingSchema, cancellationSchema, rescheduleSchema } from "@/modules/bookings/schema";
import { cancelBooking } from "@/services/bookings/cancel-booking";
import { createBooking } from "@/services/bookings/create-booking";
import { rescheduleBooking } from "@/services/bookings/reschedule-booking";
import {
  sendBookingCancelledNotifications,
  sendBookingCreatedNotifications,
  sendBookingRescheduledNotifications,
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
  revalidatePath("/admin/bookings");
  revalidatePath("/member/bookings");
  revalidatePath(`/admin/bookings/${cancellation.bookingId}`);
  revalidatePath(`/member/bookings/${cancellation.bookingId}`);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function rescheduleBookingAction(formData: FormData) {
  const { profile } = await requireAuthenticatedContext();
  const input = rescheduleSchema.parse({
    bookingId: formData.get("bookingId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    reason: formData.get("reason"),
    redirectTo: formData.get("redirectTo"),
  });

  const result = await rescheduleBooking(
    {
      bookingId: input.bookingId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reason: input.reason,
    },
    profile,
  );
  await notifySafely(() => sendBookingRescheduledNotifications(result.bookingId));

  const redirectTo = input.redirectTo || (profile.role === "member" ? "/member/bookings" : "/admin/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/member/bookings");
  revalidatePath(`/admin/bookings/${result.bookingId}`);
  revalidatePath(`/member/bookings/${result.bookingId}`);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
