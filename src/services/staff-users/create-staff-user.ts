import { getDb } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StaffUserInput } from "@/modules/auth/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export async function createStaffUser(
  input: StaffUserInput,
  actor: AuthenticatedProfile,
) {
  const db = getDb();
  const adminClient = createSupabaseAdminClient();

  const authResult = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(authResult.error?.message ?? "No se pudo crear el usuario interno.");
  }

  try {
    return await db.transaction(async (tx) => {
      const [createdProfile] = await tx
        .insert(profiles)
        .values({
          id: authResult.data.user.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          role: input.role,
          status: input.status,
        })
        .returning({
          id: profiles.id,
          fullName: profiles.fullName,
          role: profiles.role,
        });

      await tx.insert(auditLogs).values({
        actorId: actor.id,
        actorRole: actor.role,
        action: "staff_user.created",
        entityType: "profile",
        entityId: createdProfile.id,
        metadata: {
          fullName: createdProfile.fullName,
          role: createdProfile.role,
        },
      });

      return createdProfile;
    });
  } catch (error) {
    await adminClient.auth.admin.deleteUser(authResult.data.user.id);
    throw error;
  }
}
