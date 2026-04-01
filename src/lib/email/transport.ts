import { getEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "skipped"; reason: string };

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  const env = getEnv();
  const mode = env.EMAIL_TRANSPORT_MODE ?? "log";

  if (mode === "log") {
    console.info("[email:log]", { to, subject, text });
    return {
      status: "skipped",
      reason: "Email transport in log mode.",
    };
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return {
      status: "skipped",
      reason: "Missing Resend configuration.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
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
    const errorBody = await response.text();
    throw new Error(errorBody || "No se pudo enviar el email.");
  }

  const body = (await response.json()) as { id?: string };

  return {
    status: "sent",
    providerMessageId: body.id ?? null,
  };
}
