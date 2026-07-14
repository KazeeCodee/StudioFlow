const internalPathPrefixes = [
  "/admin",
  "/auth",
  "/forgot-password",
  "/login",
  "/member",
  "/reset-password",
] as const;

const controlCharacterPattern = /[\u0000-\u001f\u007f]/;
const validationOrigin = "https://studioflow.invalid";

function isAllowlistedPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return internalPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    value.includes("\\") ||
    decodedValue.includes("\\") ||
    controlCharacterPattern.test(value) ||
    controlCharacterPattern.test(decodedValue)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, validationOrigin);

    if (parsed.origin !== validationOrigin || !isAllowlistedPath(parsed.pathname)) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
