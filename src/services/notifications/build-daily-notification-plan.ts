type StaffRecipient = {
  email: string;
  fullName: string;
};

type RenewalReminderCandidate = {
  memberPlanId: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  nextPaymentDueAt: Date;
  quotaRemaining: number;
};

type LowQuotaCandidate = {
  memberPlanId: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  nextPaymentDueAt: Date;
  quotaRemaining: number;
};

export type ReminderReason = "renewal_due" | "low_quota";

type DailyNotificationPlanInput = {
  dateKey: string;
  staffRecipients: StaffRecipient[];
  upcomingRenewals: RenewalReminderCandidate[];
  lowQuotaPlans: LowQuotaCandidate[];
};

type StaffDigestDelivery = {
  audience: "staff";
  recipientEmail: string;
  recipientName: string;
  dedupeKey: string;
};

type MemberReminderDelivery = {
  audience: "member";
  recipientEmail: string;
  recipientName: string;
  memberPlanId: string;
  planName: string;
  nextPaymentDueAt: Date;
  quotaRemaining: number;
  reasons: ReminderReason[];
  dedupeKey: string;
};

export function buildDailyNotificationPlan({
  dateKey,
  staffRecipients,
  upcomingRenewals,
  lowQuotaPlans,
}: DailyNotificationPlanInput) {
  const memberReminderMap = new Map<string, MemberReminderDelivery>();

  for (const renewal of upcomingRenewals) {
    memberReminderMap.set(renewal.memberPlanId, {
      audience: "member",
      recipientEmail: renewal.memberEmail,
      recipientName: renewal.memberName,
      memberPlanId: renewal.memberPlanId,
      planName: renewal.planName,
      nextPaymentDueAt: renewal.nextPaymentDueAt,
      quotaRemaining: renewal.quotaRemaining,
      reasons: ["renewal_due"],
      dedupeKey: `member-reminder:${renewal.memberPlanId}:${dateKey}`,
    });
  }

  for (const lowQuota of lowQuotaPlans) {
    const current = memberReminderMap.get(lowQuota.memberPlanId);

    if (current) {
      if (!current.reasons.includes("low_quota")) {
        current.reasons.push("low_quota");
      }
      current.quotaRemaining = Math.min(current.quotaRemaining, lowQuota.quotaRemaining);
      continue;
    }

    memberReminderMap.set(lowQuota.memberPlanId, {
      audience: "member",
      recipientEmail: lowQuota.memberEmail,
      recipientName: lowQuota.memberName,
      memberPlanId: lowQuota.memberPlanId,
      planName: lowQuota.planName,
      nextPaymentDueAt: lowQuota.nextPaymentDueAt,
      quotaRemaining: lowQuota.quotaRemaining,
      reasons: ["low_quota"],
      dedupeKey: `member-reminder:${lowQuota.memberPlanId}:${dateKey}`,
    });
  }

  return {
    staffDigestDeliveries: staffRecipients.map<StaffDigestDelivery>((recipient) => ({
      audience: "staff",
      recipientEmail: recipient.email,
      recipientName: recipient.fullName,
      dedupeKey: `staff-digest:${recipient.email}:${dateKey}`,
    })),
    memberReminderDeliveries: [...memberReminderMap.values()].sort((left, right) =>
      left.recipientName.localeCompare(right.recipientName),
    ),
  };
}

export type {
  DailyNotificationPlanInput,
  LowQuotaCandidate,
  MemberReminderDelivery,
  RenewalReminderCandidate,
  StaffDigestDelivery,
  StaffRecipient,
};
