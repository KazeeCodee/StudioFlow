type LogSeverity = "debug" | "info" | "warn" | "error";
type LogMetadata = Record<string, unknown>;

const redactedKeyPattern =
  /authorization|cookie|credential|password|secret|token|api[-_]?key|service[-_]?role|html|text|(?:response)?body/i;

function redactEntirely(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactEntirely);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).map((key) => [key, redactEntirely(Reflect.get(value, key))]),
    );
  }

  return "[REDACTED]";
}

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return { name: value.name };
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      redactedKeyPattern.test(key)
        ? redactEntirely(nestedValue)
        : redact(nestedValue, seen),
    ]),
  );
}

function write(severity: LogSeverity, event: string, metadata: LogMetadata = {}) {
  const safeMetadata = redact(metadata) as LogMetadata;
  const record = {
    ...safeMetadata,
    timestamp: new Date().toISOString(),
    severity,
    event,
  };
  const serialized = JSON.stringify(record);

  if (severity === "error") {
    console.error(serialized);
    return;
  }

  if (severity === "warn") {
    console.warn(serialized);
    return;
  }

  if (severity === "debug") {
    console.debug(serialized);
    return;
  }

  console.info(serialized);
}

export const logger = {
  debug: (event: string, metadata?: LogMetadata) => write("debug", event, metadata),
  error: (event: string, metadata?: LogMetadata) => write("error", event, metadata),
  info: (event: string, metadata?: LogMetadata) => write("info", event, metadata),
  warn: (event: string, metadata?: LogMetadata) => write("warn", event, metadata),
};
