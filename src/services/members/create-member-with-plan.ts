import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, memberPlans, members, plans, profiles } from "@/lib/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MemberInput } from "@/modules/members/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export function calculateInitialQuota({ quotaAmount }: { quotaAmount: number }) {
  return quotaAmount;
}

function calculatePlanDates({
  durationType,
  durationValue,
  startsAt,
}: {
  durationType: "weekly" | "monthly" | "custom";
  durationValue: number;
  startsAt: Date;
}) {
  const nextDate = new Date(startsAt);

  switch (durationType) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + durationValue * 7);
      return nextDate;
    case "custom":
      nextDate.setDate(nextDate.getDate() + durationValue);
      return nextDate;
    case "monthly":
    default:
      nextDate.setMonth(nextDate.getMonth() + durationValue);
      return nextDate;
  }
}

export async function createMemberWithPlan(
  input: MemberInput,
  actor: AuthenticatedProfile,
) {
  const db = getDb();
  const adminClient = createSupabaseAdminClient();

  const [selectedPlan] = await db
    .select({
      id: plans.id,
      name: plans.name,
      quotaAmount: plans.quotaAmount,
      durationType: plans.durationType,
      durationValue: plans.durationValue,
    })
    .from(plans)
    .where(eq(plans.id, input.planId))
    .limit(1);

  if (!selectedPlan) {
    throw new Error("El plan seleccionado no existe.");
  }

  const authResult = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(authResult.error?.message ?? "No se pudo crear el usuario autenticado.");
  }

  const startsAt = new Date();
  const endsAt = calculatePlanDates({
    durationType: selectedPlan.durationType,
    durationValue: selectedPlan.durationValue,
    startsAt,
  });
  const quotaTotal = calculateInitialQuota({
    quotaAmount: selectedPlan.quotaAmount,
  });

  try {
    return await db.transaction(async (tx) => {
      const [createdProfile] = await tx
        .insert(profiles)
        .values({
          id: authResult.data.user.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          role: "member",
          status: input.status,
        })
        .returning({
          id: profiles.id,
          email: profiles.email,
          fullName: profiles.fullName,
        });

      const [createdMember] = await tx
        .insert(members)
        .values({
          profileId: createdProfile.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          status: input.status,
          notes: input.notes,
        })
        .returning({
          id: members.id,
          fullName: members.fullName,
        });

      const [createdMemberPlan] = await tx
        .insert(memberPlans)
        .values({
          memberId: createdMember.id,
          planId: selectedPlan.id,
          status: "active",
          startsAt,
          endsAt,
          nextPaymentDueAt: endsAt,
          quotaTotal,
          quotaRemaining: quotaTotal,
          quotaUsed: 0,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({
          id: memberPlans.id,
        });

      await tx.insert(auditLogs).values({
        actorId: actor.id,
        actorRole: actor.role,
        action: "member.created",
        entityType: "member",
        entityId: createdMember.id,
        metadata: {
          memberName: createdMember.fullName,
          planId: selectedPlan.id,
          memberPlanId: createdMemberPlan.id,
        },
      });

      return {
        memberId: createdMember.id,
        memberPlanId: createdMemberPlan.id,
      };
    });
  } catch (error) {
    await adminClient.auth.admin.deleteUser(authResult.data.user.id);
    throw error;
  }
}
