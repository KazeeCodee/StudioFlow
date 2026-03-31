import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { memberPlans, members, plans } from "@/lib/db/schema";

export async function listMembers() {
  const db = getDb();

  return db
    .select({
      id: members.id,
      fullName: members.fullName,
      email: members.email,
      phone: members.phone,
      status: members.status,
      activePlanStatus: memberPlans.status,
      activePlanEndsAt: memberPlans.endsAt,
      quotaRemaining: memberPlans.quotaRemaining,
      planName: plans.name,
      createdAt: members.createdAt,
    })
    .from(members)
    .leftJoin(
      memberPlans,
      and(eq(memberPlans.memberId, members.id), eq(memberPlans.status, "active")),
    )
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .orderBy(desc(members.createdAt));
}
