import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "skipped"; reason: string };

export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: SendEmailInput): Promise<SendEmailResult> {
  const env = getEnv();
  const mode = env.EMAIL_TRANSPORT_MODE ?? "log";

  if (mode === "log") {
    logger.info("email_delivery_skipped", { mode: "log" });
    return {
      status: "skipped",
      reason: "Email transport in log mode.",
    };
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Email provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    logger.error("email_provider_rejected", {
      provider: "resend",
      status: response.status,
    });
    throw new Error("No se pudo enviar el email.");
  }

  const body = (await response.json()) as { id?: string };

  return {
    status: "sent",
    providerMessageId: body.id ?? null,
  };
}
