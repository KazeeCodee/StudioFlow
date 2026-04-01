import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  bookings,
  memberPlans,
  members,
  notificationDeliveries,
  plans,
  profiles,
  renewals,
  spaces,
} from "@/lib/db/schema";
import { staffRoles } from "@/lib/permissions/roles";

export async function hasNotificationDelivery(dedupeKey: string) {
  const db = getDb();
  const [delivery] = await db
    .select({ id: notificationDeliveries.id })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.dedupeKey, dedupeKey))
    .limit(1);

  return Boolean(delivery);
}

export async function listStaffNotificationRecipients() {
  const db = getDb();

  return db
    .select({
      email: profiles.email,
      fullName: profiles.fullName,
    })
    .from(profiles)
    .where(inArray(profiles.role, [...staffRoles]));
}

export async function getBookingNotificationContext(bookingId: string) {
  const db = getDb();
  const [booking] = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      memberId: members.id,
      memberName: members.fullName,
      memberEmail: members.email,
      spaceName: spaces.name,
    })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking ?? null;
}

export async function getRenewalNotificationContext(renewalId: string) {
  const db = getDb();
  const [renewal] = await db
    .select({
      renewalId: renewals.id,
      memberName: members.fullName,
      memberEmail: members.email,
      planName: plans.name,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      quotaRemaining: memberPlans.quotaRemaining,
    })
    .from(renewals)
    .innerJoin(members, eq(members.id, renewals.memberId))
    .innerJoin(memberPlans, eq(memberPlans.id, renewals.memberPlanId))
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(renewals.id, renewalId))
    .limit(1);

  return renewal ?? null;
}

export async function listRecentNotificationDeliveries(limit = 20) {
  const db = getDb();

  return db
    .select({
      id: notificationDeliveries.id,
      audience: notificationDeliveries.audience,
      eventType: notificationDeliveries.eventType,
      recipientEmail: notificationDeliveries.recipientEmail,
      subject: notificationDeliveries.subject,
      status: notificationDeliveries.status,
      createdAt: notificationDeliveries.createdAt,
      sentAt: notificationDeliveries.sentAt,
    })
    .from(notificationDeliveries)
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(limit);
}
