import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  memberPlans,
  members,
  plans,
  profiles,
  renewals,
} from "@/lib/db/schema";
import { renewalFiltersSchema } from "@/modules/renewals/schema";
import { getRenewalQueueBoundaries } from "@/modules/renewals/status";
import { getOperationalSettings } from "@/modules/settings/queries";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type RenewalQueueView = "pending" | "all";

export type RenewalQueueInput = {
  view: RenewalQueueView;
  q: string;
  page: number;
  pageSize: number;
};

type RawRenewalQueueInput = {
  view?: unknown;
  q?: unknown;
  page?: unknown;
  pageSize?: unknown;
};

function normalizePageSize(value: unknown) {
  const parsed = Number(value ?? DEFAULT_PAGE_SIZE);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(parsed)));
}

export function buildRenewalQueueInput(
  input: RawRenewalQueueInput = {},
): RenewalQueueInput {
  const filters = renewalFiltersSchema.parse({
    view: input.view,
    q: input.q,
    page: input.page,
  });

  return {
    view: filters.view === "all" ? "all" : "pending",
    q: filters.q,
    page: filters.page,
    pageSize: normalizePageSize(input.pageSize),
  };
}

export function isRenewalInQueue(
  dueAt: Date,
  view: RenewalQueueView,
  now: Date,
  renewalWindowDays: number,
) {
  if (view === "all") {
    return true;
  }

  return dueAt < getRenewalQueueBoundaries(now, renewalWindowDays).pendingEndExclusive;
}

export async function listRenewalQueue(
  rawInput: RawRenewalQueueInput = {},
  options: { now?: Date; renewalWindowDays?: number } = {},
) {
  const db = getDb();
  const input = buildRenewalQueueInput(rawInput);
  const now = options.now ?? new Date();
  const settings = await getOperationalSettings();
  const renewalWindowDays =
    options.renewalWindowDays ?? settings.renewalWindowDays;
  const { todayStart, tomorrowStart, pendingEndExclusive } =
    getRenewalQueueBoundaries(now, renewalWindowDays);
  const searchPattern = `%${input.q}%`;
  const searchCondition = input.q
    ? or(
        ilike(members.fullName, searchPattern),
        ilike(members.email, searchPattern),
        ilike(members.phone, searchPattern),
      )
    : undefined;
  const queueCondition =
    input.view === "pending"
      ? lt(memberPlans.nextPaymentDueAt, pendingEndExclusive)
      : undefined;
  const listCondition = and(
    eq(memberPlans.status, "active"),
    queueCondition,
    searchCondition,
  );
  const allActiveCondition = and(
    eq(memberPlans.status, "active"),
    searchCondition,
  );
  const pendingCondition = and(
    eq(memberPlans.status, "active"),
    lt(memberPlans.nextPaymentDueAt, pendingEndExclusive),
    searchCondition,
  );
  const overdueCondition = and(
    eq(memberPlans.status, "active"),
    lt(memberPlans.nextPaymentDueAt, todayStart),
    searchCondition,
  );

  const baseItemsQuery = db
    .select({
      memberPlanId: memberPlans.id,
      memberId: members.id,
      memberName: members.fullName,
      memberEmail: members.email,
      memberPhone: members.phone,
      planName: plans.name,
      planPrice: plans.price,
      planDurationType: plans.durationType,
      planDurationValue: plans.durationValue,
      planQuotaAmount: plans.quotaAmount,
      endsAt: memberPlans.endsAt,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      quotaRemaining: memberPlans.quotaRemaining,
      quotaUsed: memberPlans.quotaUsed,
      quotaTotal: memberPlans.quotaTotal,
      lastRenewedAt: memberPlans.lastRenewedAt,
    })
    .from(memberPlans)
    .innerJoin(members, eq(members.id, memberPlans.memberId))
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(listCondition)
    .orderBy(
      sql<number>`case
        when ${memberPlans.nextPaymentDueAt} < ${todayStart} then 0
        when ${memberPlans.nextPaymentDueAt} < ${tomorrowStart} then 1
        when ${memberPlans.nextPaymentDueAt} < ${pendingEndExclusive} then 2
        else 3
      end`,
      asc(memberPlans.nextPaymentDueAt),
      asc(members.fullName),
    )
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);

  const countPlans = (condition: ReturnType<typeof and>) =>
    db
      .select({ value: count() })
      .from(memberPlans)
      .innerJoin(members, eq(members.id, memberPlans.memberId))
      .where(condition);

  const [items, totalRows, allRows, pendingRows, overdueRows] =
    await Promise.all([
      baseItemsQuery,
      countPlans(listCondition),
      countPlans(allActiveCondition),
      countPlans(pendingCondition),
      countPlans(overdueCondition),
    ]);

  const total = totalRows[0]?.value ?? 0;
  const all = allRows[0]?.value ?? 0;
  const pending = pendingRows[0]?.value ?? 0;
  const overdue = overdueRows[0]?.value ?? 0;

  return {
    items,
    counts: {
      all,
      pending,
      overdue,
      dueSoon: Math.max(0, pending - overdue),
    },
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    },
    renewalWindowDays,
    now,
  };
}

export async function listRenewalHistory(
  rawInput: Pick<RawRenewalQueueInput, "q" | "page" | "pageSize"> = {},
) {
  const input = buildRenewalQueueInput({ ...rawInput, view: "all" });
  const db = getDb();
  const searchPattern = `%${input.q}%`;
  const searchCondition = input.q
    ? or(
        ilike(members.fullName, searchPattern),
        ilike(members.email, searchPattern),
        ilike(renewals.externalReference, searchPattern),
      )
    : undefined;

  const itemsQuery = db
    .select({
      id: renewals.id,
      memberPlanId: renewals.memberPlanId,
      memberId: members.id,
      memberName: members.fullName,
      memberEmail: members.email,
      planName: plans.name,
      renewedByName: profiles.fullName,
      renewedAt: renewals.renewedAt,
      oldEndDate: renewals.oldEndDate,
      newEndDate: renewals.newEndDate,
      oldQuotaRemaining: renewals.oldQuotaRemaining,
      newQuotaTotal: renewals.newQuotaTotal,
      amountReceived: renewals.amountReceived,
      currency: renewals.currency,
      paymentMethod: renewals.paymentMethod,
      paidAt: renewals.paidAt,
      externalReference: renewals.externalReference,
      notes: renewals.notes,
    })
    .from(renewals)
    .innerJoin(members, eq(members.id, renewals.memberId))
    .innerJoin(memberPlans, eq(memberPlans.id, renewals.memberPlanId))
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .leftJoin(profiles, eq(profiles.id, renewals.renewedBy))
    .where(searchCondition)
    .orderBy(desc(renewals.renewedAt), desc(renewals.id))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);

  const totalQuery = db
    .select({ value: count() })
    .from(renewals)
    .innerJoin(members, eq(members.id, renewals.memberId))
    .where(searchCondition);

  const [items, totalRows] = await Promise.all([itemsQuery, totalQuery]);
  const total = totalRows[0]?.value ?? 0;

  return {
    items,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export type RenewalQueueResult = Awaited<ReturnType<typeof listRenewalQueue>>;
export type RenewalQueueItem = RenewalQueueResult["items"][number];
export type RenewalHistoryResult = Awaited<ReturnType<typeof listRenewalHistory>>;
export type RenewalHistoryItem = RenewalHistoryResult["items"][number];
