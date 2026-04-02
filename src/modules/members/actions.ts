"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auditLogs, bookings, memberPlans, members, profiles, renewals } from "@/lib/db/schema";
import { canManageMembers } from "@/lib/permissions/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaffContext } from "@/modules/auth/queries";
import type { AppRole } from "@/modules/auth/types";
import {
  memberPlanChangeSchema,
  memberQuotaAdjustmentSchema,
  memberSchema,
  memberStatusUpdateSchema,
  memberUpdateSchema,
} from "@/modules/members/schema";
import { adjustMemberQuota } from "@/services/members/adjust-member-quota";
import { changeMemberPlan } from "@/services/members/change-member-plan";
import { createMemberWithPlan } from "@/services/members/create-member-with-plan";
import { updateMemberProfile } from "@/services/members/update-member-profile";

function revalidateMemberPaths(memberId?: string) {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/new");

  if (memberId) {
    revalidatePath(`/admin/members/${memberId}`);
  }
}

function assertCanManageMembers(role: AppRole) {
  if (!canManageMembers(role)) {
    redirect("/admin");
  }
}

export async function createMemberAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);
  const input = memberSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    status: formData.get("status"),
    planId: formData.get("planId"),
    notes: formData.get("notes"),
  });

  await createMemberWithPlan(input, profile);

  revalidateMemberPaths();
}

export async function updateMemberProfileAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);
  const memberId = String(formData.get("memberId") ?? "");
  const input = memberUpdateSchema.parse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!memberId) {
    throw new Error("Falta el miembro a actualizar.");
  }

  await updateMemberProfile(
    {
      memberId,
      fullName: input.fullName,
      phone: input.phone,
      notes: input.notes,
    },
    profile,
  );

  revalidateMemberPaths(memberId);
  redirect(`/admin/members/${memberId}`);
}

export async function updateMemberStatusAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);
  const memberId = String(formData.get("memberId") ?? "");
  const input = memberStatusUpdateSchema.parse({
    status: formData.get("status"),
    reason: formData.get("reason"),
  });

  if (!memberId) {
    throw new Error("Falta el miembro a actualizar.");
  }

  const db = getDb();
  const [memberRecord] = await db
    .select({
      id: members.id,
      profileId: members.profileId,
      status: members.status,
    })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!memberRecord) {
    throw new Error("No encontramos el miembro solicitado.");
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(members)
      .set({
        status: input.status,
        updatedAt: now,
      })
      .where(eq(members.id, memberRecord.id));

    if (memberRecord.profileId) {
      await tx
        .update(profiles)
        .set({
          status: input.status,
          updatedAt: now,
        })
        .where(eq(profiles.id, memberRecord.profileId));
    }

    await tx.insert(auditLogs).values({
      actorId: profile.id,
      actorRole: profile.role,
      action: "member.status_changed",
      entityType: "member",
      entityId: memberRecord.id,
      metadata: {
        previousStatus: memberRecord.status,
        status: input.status,
        reason: input.reason ?? null,
      },
    });
  });

  revalidateMemberPaths(memberId);
  redirect(`/admin/members/${memberId}`);
}

export async function adjustMemberQuotaAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);
  const memberId = String(formData.get("memberId") ?? "");
  const input = memberQuotaAdjustmentSchema.parse({
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });

  if (!memberId) {
    throw new Error("Falta el miembro a actualizar.");
  }

  await adjustMemberQuota(
    {
      memberId,
      delta: input.delta,
      reason: input.reason,
    },
    profile,
  );

  revalidateMemberPaths(memberId);
  redirect(`/admin/members/${memberId}`);
}

export async function changeMemberPlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);
  const memberId = String(formData.get("memberId") ?? "");
  const input = memberPlanChangeSchema.parse({
    planId: formData.get("planId"),
    reason: formData.get("reason"),
  });

  if (!memberId) {
    throw new Error("Falta el miembro a actualizar.");
  }

  await changeMemberPlan(
    {
      memberId,
      planId: input.planId,
      reason: input.reason,
    },
    profile,
  );

  revalidateMemberPaths(memberId);
  redirect(`/admin/members/${memberId}`);
}

export async function deleteMemberAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageMembers(profile.role);

  const memberId = String(formData.get("memberId") ?? "");

  if (!memberId) {
    throw new Error("Falta el miembro a eliminar.");
  }

  const db = getDb();
  const [memberRecord] = await db
    .select({
      id: members.id,
      profileId: members.profileId,
      fullName: members.fullName,
    })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!memberRecord) {
    throw new Error("No encontramos el miembro solicitado.");
  }

  const [[{ bookingCount }], [{ planCount }], [{ renewalCount }]] = await Promise.all([
    db
      .select({ bookingCount: count() })
      .from(bookings)
      .where(eq(bookings.memberId, memberId)),
    db
      .select({ planCount: count() })
      .from(memberPlans)
      .where(eq(memberPlans.memberId, memberId)),
    db
      .select({ renewalCount: count() })
      .from(renewals)
      .where(eq(renewals.memberId, memberId)),
  ]);

  if (bookingCount > 0 || planCount > 0 || renewalCount > 0) {
    throw new Error("No se puede eliminar el miembro mientras conserve historial operativo.");
  }

  await db.transaction(async (tx) => {
    await tx.insert(auditLogs).values({
      actorId: profile.id,
      actorRole: profile.role,
      action: "member.deleted",
      entityType: "member",
      entityId: memberRecord.id,
      metadata: {
        fullName: memberRecord.fullName,
      },
    });

    await tx.delete(members).where(eq(members.id, memberId));

    if (memberRecord.profileId) {
      await tx.delete(profiles).where(eq(profiles.id, memberRecord.profileId));
    }
  });

  if (memberRecord.profileId) {
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.auth.admin.deleteUser(memberRecord.profileId);

    if (result.error) {
      console.error("No se pudo borrar el usuario auth del miembro eliminado:", result.error.message);
    }
  }

  revalidateMemberPaths();
  redirect("/admin/members");
}
