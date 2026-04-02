import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StaffUserUpdateInput } from "@/modules/auth/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export async function updateStaffUser(
  {
    userId,
    input,
  }: {
    userId: string;
    input: StaffUserUpdateInput;
  },
  actor: AuthenticatedProfile,
) {
  const db = getDb();
  const [currentProfile] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      status: profiles.status,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!currentProfile) {
    throw new Error("No encontramos el usuario interno solicitado.");
  }

  if (currentProfile.role === "member") {
    throw new Error("Ese perfil no pertenece al equipo interno.");
  }

  if (actor.id === userId && input.status !== "active") {
    throw new Error("No podés desactivar tu propia cuenta.");
  }

  const adminClient = createSupabaseAdminClient();
  const authPayload: {
    password?: string;
    user_metadata: {
      full_name: string;
    };
  } = {
    user_metadata: {
      full_name: input.fullName,
    },
  };

  if (input.password) {
    authPayload.password = input.password;
  }

  const authResult = await adminClient.auth.admin.updateUserById(userId, authPayload);

  if (authResult.error) {
    throw new Error(authResult.error.message ?? "No se pudo actualizar el acceso del usuario.");
  }

  await db
    .update(profiles)
    .set({
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  await db.insert(auditLogs).values({
    actorId: actor.id,
    actorRole: actor.role,
    action: "staff_user.updated",
    entityType: "profile",
    entityId: userId,
    metadata: {
      previousRole: currentProfile.role,
      previousStatus: currentProfile.status,
      role: input.role,
      status: input.status,
      passwordChanged: Boolean(input.password),
    },
  });
}
