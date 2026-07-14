import path from "node:path";
import { pathToFileURL } from "node:url";

const defaultMaxRetries = 3;
const defaultTimeoutMs = 10_000;

function writeLog(severity, event, metadata = {}) {
  const serialized = JSON.stringify({
    ...metadata,
    timestamp: new Date().toISOString(),
    severity,
    event,
  });

  if (severity === "error") {
    console.error(serialized);
    return;
  }

  if (severity === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeSummary(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    [
      "staffDigestCount",
      "memberReminderCount",
      "attempted",
      "sent",
      "skipped",
      "failed",
    ].flatMap((key) =>
      Number.isFinite(value[key]) ? [[key, value[key]]] : [],
    ),
  );
}

export async function runNotificationsCron({
  appUrl = process.env.APP_URL,
  cronSecret = process.env.CRON_SECRET,
  fetchImpl = globalThis.fetch,
  log = writeLog,
  maxRetries = defaultMaxRetries,
  sleep = delay,
  timeoutMs = defaultTimeoutMs,
} = {}) {
  if (!appUrl || !cronSecret) {
    throw new Error("APP_URL and CRON_SECRET are required.");
  }

  const endpoint = new URL("/api/cron/notifications", appUrl).toString();
  const totalAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`notification_endpoint_status_${response.status}`);
      }

      const result = await response.json();
      log("info", "notifications_cron_completed", {
        attempt,
        status: response.status,
        ...safeSummary(result),
      });
      return result;
    } catch {
      if (attempt === totalAttempts) {
        log("error", "notifications_cron_failed", { attempts: totalAttempts });
        throw new Error(`Notifications cron failed after ${totalAttempts} attempts.`);
      }

      const retryDelayMs = Math.min(500 * 2 ** (attempt - 1), 2_000);
      log("warn", "notifications_cron_retry", {
        attempt,
        nextAttempt: attempt + 1,
        retryDelayMs,
      });
      await sleep(retryDelayMs);
    }
  }

  throw new Error("Notifications cron reached an unreachable state.");
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (invokedPath === import.meta.url) {
  runNotificationsCron().catch(() => {
    process.exitCode = 1;
  });
}
