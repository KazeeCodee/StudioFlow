export function getBookingPenaltyOutcome({
  now = new Date(),
  policyHours,
  startsAt,
}: {
  now?: Date;
  policyHours: number;
  startsAt: Date;
}) {
  const hoursUntilStart =
    (startsAt.getTime() - now.getTime()) / 3_600_000;

  return {
    hoursUntilStart,
    policyHours,
    shouldRefund: hoursUntilStart >= policyHours,
  };
}

export function getRescheduleQuotaDelta({
  newQuotaConsumed,
  oldQuotaConsumed,
  shouldRefund,
}: {
  newQuotaConsumed: number;
  oldQuotaConsumed: number;
  shouldRefund: boolean;
}) {
  if (shouldRefund) {
    return {
      quotaRemainingDelta: oldQuotaConsumed - newQuotaConsumed,
      quotaUsedDelta: newQuotaConsumed - oldQuotaConsumed,
    };
  }

  return {
    quotaRemainingDelta: -newQuotaConsumed,
    quotaUsedDelta: newQuotaConsumed,
  };
}
