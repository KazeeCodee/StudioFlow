type SpaceUsageEntry = {
  spaceId: string;
  spaceName: string;
  durationHours: number;
  quotaConsumed: number;
};

type SpaceUsageSummary = {
  spaceId: string;
  spaceName: string;
  bookedHours: number;
  quotaConsumed: number;
  sharePercentage: number;
};

export function summarizeSpaceUsage(
  entries: SpaceUsageEntry[],
): SpaceUsageSummary[] {
  const totalHours = entries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const usageBySpace = new Map<string, SpaceUsageSummary>();

  for (const entry of entries) {
    const current = usageBySpace.get(entry.spaceId);

    if (current) {
      current.bookedHours += entry.durationHours;
      current.quotaConsumed += entry.quotaConsumed;
      continue;
    }

    usageBySpace.set(entry.spaceId, {
      spaceId: entry.spaceId,
      spaceName: entry.spaceName,
      bookedHours: entry.durationHours,
      quotaConsumed: entry.quotaConsumed,
      sharePercentage: 0,
    });
  }

  return [...usageBySpace.values()]
    .map((entry) => ({
      ...entry,
      sharePercentage:
        totalHours > 0 ? Math.round((entry.bookedHours / totalHours) * 100) : 0,
    }))
    .sort(
      (left, right) =>
        right.bookedHours - left.bookedHours ||
        right.quotaConsumed - left.quotaConsumed ||
        left.spaceName.localeCompare(right.spaceName),
    );
}

export type { SpaceUsageEntry, SpaceUsageSummary };
