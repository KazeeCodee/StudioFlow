"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auditLogs, systemSettings } from "@/lib/db/schema";
import { canManageSettings } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import {
  getOperationalSettings,
  operationalSettingsKey,
} from "@/modules/settings/queries";
import { operationalSettingsSchema } from "@/modules/settings/schema";

export async function updateOperationalSettingsAction(formData: FormData) {
  const { profile } = await requireStaffContext();

  if (!canManageSettings(profile.role)) {
    redirect("/admin");
  }

  const input = operationalSettingsSchema.parse({
    renewalWindowDays: formData.get("renewalWindowDays"),
    lowQuotaThreshold: formData.get("lowQuotaThreshold"),
    bookingBufferHours: formData.get("bookingBufferHours"),
  });

  const previousSettings = await getOperationalSettings();
  const db = getDb();

  await db
    .insert(systemSettings)
    .values({
      key: operationalSettingsKey,
      valueJson: input,
      updatedBy: profile.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        valueJson: input,
        updatedBy: profile.id,
        updatedAt: new Date(),
      },
    });

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "settings.operational_updated",
    entityType: "system_settings",
    metadata: {
      previous: {
        renewalWindowDays: previousSettings.renewalWindowDays,
        lowQuotaThreshold: previousSettings.lowQuotaThreshold,
        bookingBufferHours: previousSettings.bookingBufferHours,
      },
      next: input,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/renewals");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/bookings/new");
  revalidatePath("/member/bookings/new");
  redirect("/admin/settings");
}
