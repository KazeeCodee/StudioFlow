"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { getDefaultRouteForRole } from "@/lib/permissions/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/modules/auth/queries";
import {
  passwordRecoverySchema,
  passwordResetSchema,
} from "@/modules/auth/schema";

function buildLoginErrorRedirect(nextPath: string | null, error: string) {
  const searchParams = new URLSearchParams();

  if (nextPath) {
    searchParams.set("next", nextPath);
  }

  searchParams.set("error", error);

  return `/login?${searchParams.toString()}`;
}

function buildLoginStatusRedirect(status: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("status", status);

  return `/login?${searchParams.toString()}`;
}

async function getAppOrigin() {
  const env = getEnv();

  if (env.APP_URL) {
    return env.APP_URL;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim() || null;

  if (!email || !password) {
    redirect(buildLoginErrorRedirect(nextPath, "missing_credentials"));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(buildLoginErrorRedirect(nextPath, "invalid_credentials"));
  }

  const profile = await getProfileByUserId(data.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    redirect(buildLoginErrorRedirect(nextPath, "profile_not_found"));
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut({ scope: "local" });
    redirect(buildLoginErrorRedirect(nextPath, "account_inactive"));
  }

  if (nextPath) {
    redirect(nextPath);
  }

  redirect(getDefaultRouteForRole(profile.role));
}

export async function forgotPasswordAction(formData: FormData) {
  const input = passwordRecoverySchema.parse({
    email: formData.get("email"),
  });

  const origin = await getAppOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: new URL("/auth/callback?next=/reset-password", origin).toString(),
  });

  if (error) {
    redirect("/forgot-password?error=request_failed");
  }

  const searchParams = new URLSearchParams();
  searchParams.set("status", "sent");
  searchParams.set("email", input.email);
  redirect(`/forgot-password?${searchParams.toString()}`);
}

export async function resetPasswordAction(formData: FormData) {
  const input = passwordResetSchema.parse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    redirectTo: formData.get("redirectTo"),
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reset-password?error=session_missing");
  }

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    redirect("/reset-password?error=update_failed");
  }

  const profile = await getProfileByUserId(user.id);

  if (profile) {
    const db = getDb();
    await db.insert(auditLogs).values({
      actorId: profile.id,
      actorRole: profile.role,
      action: "auth.password_recovered",
      entityType: "profile",
      entityId: profile.id,
      metadata: {},
    });
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect(buildLoginStatusRedirect("password_reset"));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
