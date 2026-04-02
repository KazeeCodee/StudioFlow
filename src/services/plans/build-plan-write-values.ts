import type { PlanInput } from "@/modules/plans/schema";

export function buildPlanWriteValues(input: PlanInput) {
  return {
    name: input.name,
    description: input.description,
    status: input.status,
    durationType: input.durationType,
    durationValue: input.durationValue,
    quotaAmount: input.quotaAmount,
    price: input.price === null ? null : input.price.toFixed(2),
    cancellationPolicyHours: input.cancellationPolicyHours,
    maxBookingsPerDay: input.maxBookingsPerDay,
    maxBookingsPerWeek: input.maxBookingsPerWeek,
  };
}
