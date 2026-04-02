import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, members, profiles } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export async function updateMemberProfile(
  {
    memberId,
    fullName,
    phone,
    notes,
  }: {
    memberId: string;
    fullName: string;
    phone?: string;
    notes?: string;
  },
  actor: AuthenticatedProfile,
) {
  const db = getDb();

  const [memberRecord] = await db
    .select({
      id: members.id,
      profileId: members.profileId,
      fullName: members.fullName,
      phone: members.phone,
      notes: members.notes,
    })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!memberRecord) {
    throw new Error("No encontramos el miembro solicitado.");
  }

  const nextPhone = phone?.trim() ? phone.trim() : null;
  const nextNotes = notes?.trim() ? notes.trim() : null;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(members)
      .set({
        fullName,
        phone: nextPhone,
        notes: nextNotes,
        updatedAt: now,
      })
      .where(eq(members.id, memberRecord.id));

    if (memberRecord.profileId) {
      await tx
        .update(profiles)
        .set({
          fullName,
          phone: nextPhone,
          updatedAt: now,
        })
        .where(eq(profiles.id, memberRecord.profileId));
    }

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "member.updated",
      entityType: "member",
      entityId: memberRecord.id,
      metadata: {
        previousFullName: memberRecord.fullName,
        previousPhone: memberRecord.phone,
        previousNotes: memberRecord.notes,
        fullName,
        phone: nextPhone,
        notes: nextNotes,
      },
    });
  });

  return {
    memberId: memberRecord.id,
  };
}
