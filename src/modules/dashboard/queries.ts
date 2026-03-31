import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, members, spaces } from "@/lib/db/schema";
import { listRenewalAlerts } from "@/modules/alerts/queries";
import {
  summarizeSpaceUsage,
  type SpaceUsageSummary,
} from "@/services/dashboard/summarize-space-usage";

const nonCancelledStatuses = [
  "pending",
  "confirmed",
  "completed",
  "no_show",
] as const;

const cancelledStatuses = [
  "cancelled_by_user",
  "cancelled_by_admin",
] as const;

type DashboardMetricSnapshot = {
  bookingsToday: number;
  bookedHoursThisWeek: number;
  activeMembers: number;
  upcomingRenewals: number;
  lowQuotaPlans: number;
};

type DashboardAgendaItem = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: (typeof nonCancelledStatuses)[number];
  memberName: string;
  spaceName: string;
  quotaConsumed: number;
};

type DashboardCancellationItem = {
  id: string;
  startsAt: Date;
  status: (typeof cancelledStatuses)[number];
  memberName: string;
  spaceName: string;
};

export type AdminDashboardData = {
  metrics: DashboardMetricSnapshot;
  todayAgenda: DashboardAgendaItem[];
  spaceUsage: SpaceUsageSummary[];
  recentCancellations: DashboardCancellationItem[];
};

function startOfDay(baseDate: Date) {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    0,
    0,
    0,
    0,
  );
}

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(baseDate: Date) {
  const dayStart = startOfDay(baseDate);
  const day = dayStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return addDays(dayStart, mondayOffset);
}

export async function getAdminDashboardData(
  now: Date = new Date(),
): Promise<AdminDashboardData> {
  const db = getDb();
  const dayStart = startOfDay(now);
  const nextDayStart = addDays(dayStart, 1);
  const weekStart = startOfWeek(now);
  const nextWeekStart = addDays(weekStart, 7);

  const [alerts, activeMemberRows, todayAgenda, weeklyUsageRows, recentCancellations] =
    await Promise.all([
      listRenewalAlerts(),
      db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.status, "active")),
      db
        .select({
          id: bookings.id,
          startsAt: bookings.startsAt,
          endsAt: bookings.endsAt,
          status: bookings.status,
          memberName: members.fullName,
          spaceName: spaces.name,
          quotaConsumed: bookings.quotaConsumed,
        })
        .from(bookings)
        .innerJoin(members, eq(members.id, bookings.memberId))
        .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
        .where(
          and(
            gte(bookings.startsAt, dayStart),
            lt(bookings.startsAt, nextDayStart),
            inArray(bookings.status, [...nonCancelledStatuses]),
          ),
        )
        .orderBy(asc(bookings.startsAt)),
      db
        .select({
          spaceId: spaces.id,
          spaceName: spaces.name,
          durationHours: bookings.durationHours,
          quotaConsumed: bookings.quotaConsumed,
        })
        .from(bookings)
        .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
        .where(
          and(
            gte(bookings.startsAt, weekStart),
            lt(bookings.startsAt, nextWeekStart),
            inArray(bookings.status, [...nonCancelledStatuses]),
          ),
        ),
      db
        .select({
          id: bookings.id,
          startsAt: bookings.startsAt,
          status: bookings.status,
          memberName: members.fullName,
          spaceName: spaces.name,
        })
        .from(bookings)
        .innerJoin(members, eq(members.id, bookings.memberId))
        .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
        .where(inArray(bookings.status, [...cancelledStatuses]))
        .orderBy(desc(bookings.cancelledAt), desc(bookings.startsAt))
        .limit(5),
    ]);

  return {
    metrics: {
      bookingsToday: todayAgenda.length,
      bookedHoursThisWeek: weeklyUsageRows.reduce(
        (sum, booking) => sum + booking.durationHours,
        0,
      ),
      activeMembers: activeMemberRows.length,
      upcomingRenewals: alerts.upcomingRenewals.length,
      lowQuotaPlans: alerts.lowQuotaPlans.length,
    },
    todayAgenda: todayAgenda.map((item) => ({
      ...item,
      status: item.status as DashboardAgendaItem["status"],
    })),
    spaceUsage: summarizeSpaceUsage(weeklyUsageRows).slice(0, 5),
    recentCancellations: recentCancellations.map((item) => ({
      ...item,
      status: item.status as DashboardCancellationItem["status"],
    })),
  };
}
