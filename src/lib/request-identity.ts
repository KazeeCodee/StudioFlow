import { createHash } from "node:crypto";
import { isIP } from "node:net";

export function normalizeAccountIdentifier(value: string) {
  return value.trim().normalize("NFKC").toLowerCase();
}

export function getTrustedClientIp(
  headers: Pick<Headers, "get">,
  trustRailwayProxy = Boolean(process.env.RAILWAY_ENVIRONMENT_ID),
) {
  if (!trustRailwayProxy) {
    return "unknown";
  }

  const candidate = headers.get("x-real-ip")?.trim() ?? "";
  return isIP(candidate) ? candidate : "unknown";
}

export function buildRateLimitKey(scope: string, identifiers: string[]) {
  const safeScope = scope.replace(/[^a-z0-9:_-]/gi, "_");
  const digest = createHash("sha256")
    .update(identifiers.join("\0"))
    .digest("hex");

  return `rate-limit:${safeScope}:${digest}`;
}
