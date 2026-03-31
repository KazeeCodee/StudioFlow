import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  canViewAdmin,
  canViewMemberPortal,
  getDefaultRouteForRole,
} from "@/lib/permissions/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/modules/auth/types";

export async function getCurrentAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function getProfileByUserId(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      role: profiles.role,
      status: profiles.status,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    return null;
  }

  return {
    user,
    profile,
  };
}

export async function requireAuthenticatedContext() {
  const context = await getCurrentAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireStaffContext() {
  const context = await requireAuthenticatedContext();

  if (!canViewAdmin(context.profile.role)) {
    redirect(getDefaultRouteForRole(context.profile.role));
  }

  return context;
}

export async function requireMemberContext() {
  const context = await requireAuthenticatedContext();

  if (!canViewMemberPortal(context.profile.role)) {
    redirect(getDefaultRouteForRole(context.profile.role));
  }

  return context;
}
