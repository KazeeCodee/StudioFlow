import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
} from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/proxy";

const protectedPrefixes = ["/admin", "/member"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("auth-token") || cookie.name.startsWith("sb-"),
    );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL para construir la CSP.");
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({
    isDevelopment: process.env.NODE_ENV === "development",
    nonce,
    supabaseUrl,
  });
  const reportOnly = process.env.CSP_REPORT_ONLY === "true";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let response: NextResponse;

  if (!isProtectedPath(pathname)) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else if (hasSupabaseSessionCookie(request)) {
    response = await updateSession(request, requestHeaders);
  } else {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(loginUrl);
  }

  return applySecurityHeaders(response, {
    contentSecurityPolicy,
    reportOnly,
  });
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
