import { getDb } from "@/lib/db";
import { notificationDeliveries } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/transport";
import {
  getBookingNotificationContext,
  getRenewalNotificationContext,
  hasNotificationDelivery,
  listStaffNotificationRecipients,
} from "@/modules/notifications/queries";
import { listRenewalAlerts } from "@/modules/alerts/queries";
import { eq } from "drizzle-orm";
import {
  buildDailyNotificationPlan,
} from "@/services/notifications/build-daily-notification-plan";
import {
  renderBookingTransactionalEmail,
  renderMemberReminderEmail,
  renderRenewalTransactionalEmail,
  renderStaffDigestEmail,
} from "@/services/notifications/email-templates";

function getAppUrl() {
  return getEnv().APP_URL ?? "http://localhost:3000";
}

async function recordNotificationDelivery({
  audience,
  eventType,
  recipientEmail,
  recipientName,
  subject,
  dedupeKey,
  payload,
}: {
  audience: string;
  eventType: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
}) {
  const existing = await hasNotificationDelivery(dedupeKey);

  if (existing) {
    return {
      status: "skipped" as const,
      reason: "duplicate",
    };
  }

  const db = getDb();
  const [delivery] = await db
    .insert(notificationDeliveries)
    .values({
      audience,
      eventType,
      recipientEmail,
      recipientName: recipientName ?? null,
      subject,
      dedupeKey,
      payload,
      status: "pending",
    })
    .returning({ id: notificationDeliveries.id });

  return {
    status: "created" as const,
    id: delivery.id,
  };
}

async function finalizeNotificationDelivery({
  deliveryId,
  result,
}: {
  deliveryId: string;
  result:
    | { status: "sent"; providerMessageId: string | null }
    | { status: "skipped"; reason: string };
}) {
  const db = getDb();

  await db
    .update(notificationDeliveries)
    .set({
      status: result.status === "sent" ? "sent" : "skipped",
      providerMessageId:
        result.status === "sent" ? result.providerMessageId : null,
      errorMessage: result.status === "skipped" ? result.reason : null,
      sentAt: new Date(),
    })
    .where(eq(notificationDeliveries.id, deliveryId));
}

async function failNotificationDelivery(deliveryId: string, error: unknown) {
  const db = getDb();

  await db
    .update(notificationDeliveries)
    .set({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown email error",
    })
    .where(eq(notificationDeliveries.id, deliveryId));
}

async function attemptEmailDelivery({
  audience,
  eventType,
  recipientEmail,
  recipientName,
  subject,
  html,
  text,
  dedupeKey,
  payload,
}: {
  audience: string;
  eventType: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  html: string;
  text: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
}) {
  const recorded = await recordNotificationDelivery({
    audience,
    eventType,
    recipientEmail,
    recipientName,
    subject,
    dedupeKey,
    payload,
  });

  if (recorded.status === "skipped") {
    return recorded;
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });

    await finalizeNotificationDelivery({
      deliveryId: recorded.id,
      result,
    });

    return result;
  } catch (error) {
    await failNotificationDelivery(recorded.id, error);
    throw error;
  }
}

export async function sendBookingCreatedNotifications(bookingId: string) {
  const booking = await getBookingNotificationContext(bookingId);

  if (!booking) {
    return;
  }

  const appUrl = getAppUrl();
  const memberEmail = renderBookingTransactionalEmail({
    memberName: booking.memberName,
    spaceName: booking.spaceName,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    actionLabel: "confirmada",
    appUrl,
  });

  await attemptEmailDelivery({
    audience: "member",
    eventType: "booking_confirmed",
    recipientEmail: booking.memberEmail,
    recipientName: booking.memberName,
    subject: memberEmail.subject,
    html: memberEmail.html,
    text: memberEmail.text,
    dedupeKey: `booking-confirmed-member:${booking.id}`,
    payload: { bookingId: booking.id },
  });

  const staffRecipients = await listStaffNotificationRecipients();

  await Promise.all(
    staffRecipients.map((recipient) => {
      const staffEmail = renderBookingTransactionalEmail({
        memberName: booking.memberName,
        spaceName: booking.spaceName,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        actionLabel: "confirmada",
        appUrl,
      });

      return attemptEmailDelivery({
        audience: "staff",
        eventType: "booking_confirmed",
        recipientEmail: recipient.email,
        recipientName: recipient.fullName,
        subject: `[Staff] ${staffEmail.subject}`,
        html: staffEmail.html,
        text: staffEmail.text,
        dedupeKey: `booking-confirmed-staff:${booking.id}:${recipient.email}`,
        payload: { bookingId: booking.id },
      });
    }),
  );
}

export async function sendBookingCancelledNotifications(bookingId: string) {
  const booking = await getBookingNotificationContext(bookingId);

  if (!booking) {
    return;
  }

  const appUrl = getAppUrl();
  const memberEmail = renderBookingTransactionalEmail({
    memberName: booking.memberName,
    spaceName: booking.spaceName,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    actionLabel: "cancelada",
    appUrl,
  });

  await attemptEmailDelivery({
    audience: "member",
    eventType: "booking_cancelled",
    recipientEmail: booking.memberEmail,
    recipientName: booking.memberName,
    subject: memberEmail.subject,
    html: memberEmail.html,
    text: memberEmail.text,
    dedupeKey: `booking-cancelled-member:${booking.id}`,
    payload: { bookingId: booking.id },
  });

  const staffRecipients = await listStaffNotificationRecipients();

  await Promise.all(
    staffRecipients.map((recipient) => {
      const staffEmail = renderBookingTransactionalEmail({
        memberName: booking.memberName,
        spaceName: booking.spaceName,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        actionLabel: "cancelada",
        appUrl,
      });

      return attemptEmailDelivery({
        audience: "staff",
        eventType: "booking_cancelled",
        recipientEmail: recipient.email,
        recipientName: recipient.fullName,
        subject: `[Staff] ${staffEmail.subject}`,
        html: staffEmail.html,
        text: staffEmail.text,
        dedupeKey: `booking-cancelled-staff:${booking.id}:${recipient.email}`,
        payload: { bookingId: booking.id },
      });
    }),
  );
}

export async function sendRenewalConfirmationNotification(renewalId: string) {
  const renewal = await getRenewalNotificationContext(renewalId);

  if (!renewal) {
    return;
  }

  const appUrl = getAppUrl();
  const email = renderRenewalTransactionalEmail({
    memberName: renewal.memberName,
    planName: renewal.planName,
    nextPaymentDueAt: renewal.nextPaymentDueAt,
    quotaRemaining: renewal.quotaRemaining,
    appUrl,
  });

  await attemptEmailDelivery({
    audience: "member",
    eventType: "plan_renewed",
    recipientEmail: renewal.memberEmail,
    recipientName: renewal.memberName,
    subject: email.subject,
    html: email.html,
    text: email.text,
    dedupeKey: `plan-renewed-member:${renewal.renewalId}`,
    payload: { renewalId: renewal.renewalId },
  });
}

export async function sendDailyReminderNotifications(now: Date = new Date()) {
  const [alerts, staffRecipients] = await Promise.all([
    listRenewalAlerts(),
    listStaffNotificationRecipients(),
  ]);
  const dateKey = now.toISOString().slice(0, 10);
  const appUrl = getAppUrl();

  const plan = buildDailyNotificationPlan({
    dateKey,
    staffRecipients,
    upcomingRenewals: alerts.upcomingRenewals.map((item) => ({
      memberPlanId: item.memberPlanId,
      memberName: item.memberName,
      memberEmail: item.memberEmail,
      planName: item.planName,
      nextPaymentDueAt: item.nextPaymentDueAt,
      quotaRemaining: item.quotaRemaining,
    })),
    lowQuotaPlans: alerts.lowQuotaPlans.map((item) => ({
      memberPlanId: item.memberPlanId,
      memberName: item.memberName,
      memberEmail: item.memberEmail,
      planName: item.planName,
      nextPaymentDueAt: item.nextPaymentDueAt,
      quotaRemaining: item.quotaRemaining,
    })),
  });

  await Promise.all(
    plan.staffDigestDeliveries.map((delivery) => {
      const email = renderStaffDigestEmail({
        recipientName: delivery.recipientName,
        upcomingRenewalsCount: alerts.upcomingRenewals.length,
        lowQuotaCount: alerts.lowQuotaPlans.length,
        appUrl,
      });

      return attemptEmailDelivery({
        audience: delivery.audience,
        eventType: "daily_staff_digest",
        recipientEmail: delivery.recipientEmail,
        recipientName: delivery.recipientName,
        subject: email.subject,
        html: email.html,
        text: email.text,
        dedupeKey: delivery.dedupeKey,
        payload: {
          upcomingRenewalsCount: alerts.upcomingRenewals.length,
          lowQuotaCount: alerts.lowQuotaPlans.length,
        },
      });
    }),
  );

  await Promise.all(
    plan.memberReminderDeliveries.map((delivery) => {
      const email = renderMemberReminderEmail({
        memberName: delivery.recipientName,
        planName: delivery.planName,
        nextPaymentDueAt: delivery.nextPaymentDueAt,
        quotaRemaining: delivery.quotaRemaining,
        reasons: delivery.reasons,
        appUrl: `${appUrl}/member`,
      });

      return attemptEmailDelivery({
        audience: delivery.audience,
        eventType: "daily_member_reminder",
        recipientEmail: delivery.recipientEmail,
        recipientName: delivery.recipientName,
        subject: email.subject,
        html: email.html,
        text: email.text,
        dedupeKey: delivery.dedupeKey,
        payload: {
          memberPlanId: delivery.memberPlanId,
          reasons: delivery.reasons,
        },
      });
    }),
  );

  return {
    staffDigestCount: plan.staffDigestDeliveries.length,
    memberReminderCount: plan.memberReminderDeliveries.length,
  };
}
