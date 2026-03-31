"use server";

import { redirect } from "next/navigation";
import { getProfileByUserId } from "@/modules/auth/queries";
import { getDefaultRouteForRole } from "@/lib/permissions/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildLoginErrorRedirect(nextPath: string | null, error: string) {
  const searchParams = new URLSearchParams();

  if (nextPath) {
    searchParams.set("next", nextPath);
  }

  searchParams.set("error", error);

  return `/login?${searchParams.toString()}`;
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

  if (nextPath) {
    redirect(nextPath);
  }

  redirect(getDefaultRouteForRole(profile.role));
}
