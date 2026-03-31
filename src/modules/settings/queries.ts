import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import {
  operationalSettingsDefaults,
  operationalSettingsValueSchema,
} from "@/modules/settings/schema";

export const operationalSettingsKey = "operational_rules";

export async function getOperationalSettings() {
  const db = getDb();

  const [storedSettings] = await db
    .select({
      id: systemSettings.id,
      valueJson: systemSettings.valueJson,
      updatedAt: systemSettings.updatedAt,
    })
    .from(systemSettings)
    .where(eq(systemSettings.key, operationalSettingsKey))
    .limit(1);

  const parsed = operationalSettingsValueSchema.safeParse(
    storedSettings?.valueJson ?? {},
  );

  return {
    ...operationalSettingsDefaults,
    ...(parsed.success ? parsed.data : {}),
    updatedAt: storedSettings?.updatedAt ?? null,
  };
}
