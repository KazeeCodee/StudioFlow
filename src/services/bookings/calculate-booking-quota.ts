export function calculateBookingQuota({
  durationHours,
  hourlyQuotaCost,
}: {
  durationHours: number;
  hourlyQuotaCost: number;
}) {
  return durationHours * hourlyQuotaCost;
}
