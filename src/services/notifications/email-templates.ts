import type { ReminderReason } from "@/services/notifications/build-daily-notification-plan";

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

type StaffDigestEmailInput = {
  recipientName: string;
  upcomingRenewalsCount: number;
  lowQuotaCount: number;
  appUrl: string;
};

type MemberReminderEmailInput = {
  memberName: string;
  planName: string;
  nextPaymentDueAt: Date;
  quotaRemaining: number;
  reasons: ReminderReason[];
  appUrl: string;
};

type BookingTransactionalEmailInput = {
  memberName: string;
  spaceName: string;
  startsAt: Date;
  endsAt: Date;
  actionLabel: "confirmada" | "cancelada";
  appUrl: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function renderReminderReasonText(reasons: ReminderReason[], quotaRemaining: number) {
  const lines: string[] = [];

  if (reasons.includes("renewal_due")) {
    lines.push("Tu plan está próximo a vencer y requiere seguimiento.");
  }

  if (reasons.includes("low_quota")) {
    lines.push(`Te quedan ${quotaRemaining} cupos disponibles en tu plan.`);
  }

  return lines.join(" ");
}

export function renderStaffDigestEmail({
  recipientName,
  upcomingRenewalsCount,
  lowQuotaCount,
  appUrl,
}: StaffDigestEmailInput): EmailContent {
  const subject = `StudioFlow: ${upcomingRenewalsCount} renovaciones y ${lowQuotaCount} cupos críticos`;
  const text = `Hola ${recipientName},\n\nTenés ${upcomingRenewalsCount} renovaciones próximas y ${lowQuotaCount} miembros con cupos críticos.\n\nRevisalo en ${appUrl}/admin/renewals`;
  const html = `<p>Hola ${recipientName},</p><p>Tenés <strong>${upcomingRenewalsCount}</strong> renovaciones próximas y <strong>${lowQuotaCount}</strong> miembros con cupos críticos.</p><p>Revisalo en <a href="${appUrl}/admin/renewals">${appUrl}/admin/renewals</a>.</p>`;

  return { subject, text, html };
}

export function renderMemberReminderEmail({
  memberName,
  planName,
  nextPaymentDueAt,
  quotaRemaining,
  reasons,
  appUrl,
}: MemberReminderEmailInput): EmailContent {
  const subject = `StudioFlow: recordatorio de tu ${planName}`;
  const reasonText = renderReminderReasonText(reasons, quotaRemaining);
  const text = `Hola ${memberName},\n\n${reasonText}\nTu próximo control es el ${dateFormatter.format(nextPaymentDueAt)}.\n\nPodés revisar tu cuenta en ${appUrl}.`;
  const html = `<p>Hola ${memberName},</p><p>${reasonText}</p><p>Tu próximo control es el <strong>${dateFormatter.format(nextPaymentDueAt)}</strong>.</p><p>Podés revisar tu cuenta en <a href="${appUrl}">${appUrl}</a>.</p>`;

  return { subject, text, html };
}

export function renderBookingTransactionalEmail({
  memberName,
  spaceName,
  startsAt,
  endsAt,
  actionLabel,
  appUrl,
}: BookingTransactionalEmailInput): EmailContent {
  const subject = `StudioFlow: tu reserva fue ${actionLabel}`;
  const text = `Hola ${memberName},\n\nTu reserva en ${spaceName} fue ${actionLabel}.\nHorario: ${dateTimeFormatter.format(startsAt)} a ${dateTimeFormatter.format(endsAt)}.\n\nMás detalles en ${appUrl}/member/bookings`;
  const html = `<p>Hola ${memberName},</p><p>Tu reserva en <strong>${spaceName}</strong> fue <strong>${actionLabel}</strong>.</p><p>Horario: ${dateTimeFormatter.format(startsAt)} a ${dateTimeFormatter.format(endsAt)}.</p><p>Más detalles en <a href="${appUrl}/member/bookings">${appUrl}/member/bookings</a>.</p>`;

  return { subject, text, html };
}

export function renderRenewalTransactionalEmail({
  memberName,
  planName,
  nextPaymentDueAt,
  quotaRemaining,
  appUrl,
}: {
  memberName: string;
  planName: string;
  nextPaymentDueAt: Date;
  quotaRemaining: number;
  appUrl: string;
}): EmailContent {
  const subject = `StudioFlow: tu plan ${planName} fue renovado`;
  const text = `Hola ${memberName},\n\nTu plan ${planName} fue renovado correctamente.\nNuevo próximo control: ${dateFormatter.format(nextPaymentDueAt)}.\nCupos disponibles: ${quotaRemaining}.\n\nPodés revisarlo en ${appUrl}/member/plan`;
  const html = `<p>Hola ${memberName},</p><p>Tu plan <strong>${planName}</strong> fue renovado correctamente.</p><p>Nuevo próximo control: <strong>${dateFormatter.format(nextPaymentDueAt)}</strong>.</p><p>Cupos disponibles: <strong>${quotaRemaining}</strong>.</p><p>Podés revisarlo en <a href="${appUrl}/member/plan">${appUrl}/member/plan</a>.</p>`;

  return { subject, text, html };
}

export type { EmailContent, MemberReminderEmailInput, StaffDigestEmailInput };
