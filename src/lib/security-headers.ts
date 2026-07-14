type ContentSecurityPolicyInput = {
  isDevelopment: boolean;
  nonce: string;
  supabaseUrl: string;
};

type ApplySecurityHeadersInput = {
  contentSecurityPolicy: string;
  reportOnly: boolean;
};

const baselineSecurityHeaders = {
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

export function buildContentSecurityPolicy({
  isDevelopment,
  nonce,
  supabaseUrl,
}: ContentSecurityPolicyInput) {
  const supabaseOrigin = new URL(supabaseUrl).origin;
  const supabaseWebSocketOrigin = supabaseOrigin.replace(/^http/, "ws");
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabaseOrigin} https://img.youtube.com`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin}${isDevelopment ? " ws:" : ""}`,
    "font-src 'self' data:",
    "frame-src https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.map((directive) => `${directive};`).join(" ");
}

export function getContentSecurityPolicyHeaderName(reportOnly: boolean) {
  return reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
}

export function applySecurityHeaders(
  response: Response,
  { contentSecurityPolicy, reportOnly }: ApplySecurityHeadersInput,
) {
  response.headers.set(
    getContentSecurityPolicyHeaderName(reportOnly),
    contentSecurityPolicy,
  );

  for (const [name, value] of Object.entries(baselineSecurityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}
