"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auditLogs, members, profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireMemberContext } from "@/modules/auth/queries";
import {
  getMemberRecordByProfileId,
  getMemberProfileSnapshot,
} from "@/modules/member-portal/queries";
import {
  memberPasswordSchema,
  memberProfileSchema,
} from "@/modules/member-portal/schema";

function revalidateMemberPortal() {
  revalidatePath("/member");
  revalidatePath("/member/plan");
  revalidatePath("/member/profile");
}

export async function updateMemberProfileAction(formData: FormData) {
  const { profile } = await requireMemberContext();
  const input = memberProfileSchema.parse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    redirectTo: formData.get("redirectTo"),
  });

  const db = getDb();
  const memberRecord = await getMemberRecordByProfileId(profile.id);
  const currentProfile = await getMemberProfileSnapshot(profile.id);

  if (!currentProfile) {
    throw new Error("No se pudo cargar tu perfil.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        fullName: input.fullName,
        phone: input.phone,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    if (memberRecord) {
      await tx
        .update(members)
        .set({
          fullName: input.fullName,
          phone: input.phone,
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberRecord.id));
    }

    await tx.insert(auditLogs).values({
      actorId: profile.id,
      actorRole: profile.role,
      action: "member.profile_updated",
      entityType: "profile",
      entityId: profile.id,
      metadata: {
        previousFullName: currentProfile.fullName,
        fullName: input.fullName,
        phone: input.phone,
      },
    });
  });

  revalidateMemberPortal();
  redirect(input.redirectTo || "/member/profile");
}

export async function changeMemberPasswordAction(formData: FormData) {
  const { profile } = await requireMemberContext();
  const input = memberPasswordSchema.parse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    redirectTo: formData.get("redirectTo"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new Error("No se pudo actualizar la contraseña.");
  }

  await supabase.auth.signOut({ scope: "others" });

  const db = getDb();
  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "member.password_updated",
    entityType: "profile",
    entityId: profile.id,
    metadata: {},
  });

  revalidateMemberPortal();
  redirect(input.redirectTo || "/member/profile");
}
