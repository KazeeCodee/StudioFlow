import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sendDailyReminderNotifications } from "@/services/notifications/dispatcher";

export async function GET(request: Request) {
  const env = getEnv();
  const authHeader = request.headers.get("authorization");

  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDailyReminderNotifications();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
