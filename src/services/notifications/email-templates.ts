import { formatStudioDateTime, formatStudioDayMonth } from "@/lib/datetime";
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
  actionLabel: "confirmada" | "cancelada" | "reprogramada";
  appUrl: string;
};

type SystemTestEmailInput = {
  recipientName: string;
  appUrl: string;
  transportMode: "log" | "resend";
};

function renderReminderReasonText(reasons: ReminderReason[], quotaRemaining: number) {
  const lines: string[] = [];

  if (reasons.includes("renewal_due")) {
    lines.push("Tu plan vence pronto y requiere seguimiento.");
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
  const subject = `StudioFlow: ${upcomingRenewalsCount} renovaciones y ${lowQuotaCount} cupos criticos`;
  const text = `Hola ${recipientName},\n\nTenes ${upcomingRenewalsCount} renovaciones proximas y ${lowQuotaCount} miembros con cupos criticos.\n\nRevisalo en ${appUrl}/admin/renewals`;
  const html = `<p>Hola ${recipientName},</p><p>Tenes <strong>${upcomingRenewalsCount}</strong> renovaciones proximas y <strong>${lowQuotaCount}</strong> miembros con cupos criticos.</p><p>Revisalo en <a href="${appUrl}/admin/renewals">${appUrl}/admin/renewals</a>.</p>`;

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
  const nextControl = formatStudioDayMonth(nextPaymentDueAt);
  const text = `Hola ${memberName},\n\n${reasonText}\nTu proximo control es el ${nextControl}.\n\nPodes revisar tu cuenta en ${appUrl}.`;
  const html = `<p>Hola ${memberName},</p><p>${reasonText}</p><p>Tu proximo control es el <strong>${nextControl}</strong>.</p><p>Podes revisar tu cuenta en <a href="${appUrl}">${appUrl}</a>.</p>`;

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
  const startLabel = formatStudioDateTime(startsAt);
  const endLabel = formatStudioDateTime(endsAt);
  const text = `Hola ${memberName},\n\nTu reserva en ${spaceName} fue ${actionLabel}.\nHorario vigente: ${startLabel} a ${endLabel}.\n\nPuedes revisar el detalle en ${appUrl}/member/bookings.`;
  const html = `<p>Hola ${memberName},</p><p>Tu reserva en <strong>${spaceName}</strong> fue <strong>${actionLabel}</strong>.</p><p>Horario vigente: <strong>${startLabel}</strong> a <strong>${endLabel}</strong>.</p><p>Puedes revisar el detalle en <a href="${appUrl}/member/bookings">${appUrl}/member/bookings</a>.</p>`;

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
  const nextControl = formatStudioDayMonth(nextPaymentDueAt);
  const text = `Hola ${memberName},\n\nTu plan ${planName} fue renovado correctamente.\nNuevo proximo control: ${nextControl}.\nCupos disponibles: ${quotaRemaining}.\n\nPodes revisarlo en ${appUrl}/member/plan`;
  const html = `<p>Hola ${memberName},</p><p>Tu plan <strong>${planName}</strong> fue renovado correctamente.</p><p>Nuevo proximo control: <strong>${nextControl}</strong>.</p><p>Cupos disponibles: <strong>${quotaRemaining}</strong>.</p><p>Podes revisarlo en <a href="${appUrl}/member/plan">${appUrl}/member/plan</a>.</p>`;

  return { subject, text, html };
}

export function renderSystemTestEmail({
  recipientName,
  appUrl,
  transportMode,
}: SystemTestEmailInput): EmailContent {
  const subject = "StudioFlow: prueba de notificaciones";
  const text = `Hola ${recipientName},\n\nEste es un correo de prueba para validar la configuracion de notificaciones de StudioFlow.\nModo de transporte activo: ${transportMode}.\n\nPanel administrativo: ${appUrl}/admin/settings`;
  const html = `<p>Hola ${recipientName},</p><p>Este es un correo de prueba para validar la configuracion de notificaciones de <strong>StudioFlow</strong>.</p><p>Modo de transporte activo: <strong>${transportMode}</strong>.</p><p>Puedes volver al panel desde <a href="${appUrl}/admin/settings">${appUrl}/admin/settings</a>.</p>`;

  return { subject, text, html };
}

export type { EmailContent, MemberReminderEmailInput, StaffDigestEmailInput, SystemTestEmailInput };
