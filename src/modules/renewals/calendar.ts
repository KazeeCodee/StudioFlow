import { addDays, addMonths, addWeeks } from "date-fns";

export type PlanDurationType = "weekly" | "monthly" | "custom";

export function calculateRenewalEndDate({
  anchorDate,
  durationType,
  durationValue,
}: {
  anchorDate: Date;
  durationType: PlanDurationType;
  durationValue: number;
}) {
  switch (durationType) {
    case "weekly":
      return addWeeks(anchorDate, durationValue);
    case "custom":
      return addDays(anchorDate, durationValue);
    case "monthly":
    default:
      return addMonths(anchorDate, durationValue);
  }
}

export function buildRenewalPreview({
  now,
  currentEndDate,
  durationType,
  durationValue,
  quotaAmount,
}: {
  now: Date;
  currentEndDate: Date;
  durationType: PlanDurationType;
  durationValue: number;
  quotaAmount: number;
}) {
  const anchorDate = currentEndDate > now ? currentEndDate : now;

  return {
    newEndDate: calculateRenewalEndDate({
      anchorDate,
      durationType,
      durationValue,
    }),
    quotaRemaining: quotaAmount,
    quotaUsed: 0,
  };
}
