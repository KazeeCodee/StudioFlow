import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import {
  operationalSettingsDefaults,
  operationalSettingsValueSchema,
} from "@/modules/settings/schema";

export const operationalSettingsKey = "operational_rules";
type SettingsQueryExecutor = Pick<ReturnType<typeof getDb>, "select">;

export async function getOperationalSettings(
  executor: SettingsQueryExecutor = getDb(),
) {
  const [storedSettings] = await executor
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
