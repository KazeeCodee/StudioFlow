import postgres from "postgres";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedProfile } from "@/modules/auth/types";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("INTEGRATION_DATABASE_URL is required for database integration tests.");
}

process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_POOL_MAX = "4";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://studioflow-test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "integration-test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "integration-test-service-role-key";

const sql = postgres(databaseUrl, { max: 4 });

const actorId = "00000000-0000-4000-8000-000000000301";
const memberId = "00000000-0000-4000-8000-000000000302";
const planId = "00000000-0000-4000-8000-000000000303";
const memberPlanId = "00000000-0000-4000-8000-000000000304";
const firstSpaceId = "00000000-0000-4000-8000-000000000305";
const secondSpaceId = "00000000-0000-4000-8000-000000000306";
const firstBookingId = "00000000-0000-4000-8000-000000000307";
const secondBookingId = "00000000-0000-4000-8000-000000000308";

const actor: AuthenticatedProfile = {
  id: actorId,
  email: "booking-concurrency@studioflow.invalid",
  fullName: "Booking Concurrency Test",
  role: "admin",
  status: "active",
};

function bookingInput(spaceId: string) {
  return {
    memberId,
    spaceId,
    startsAt: "2026-08-03T10:00",
    endsAt: "2026-08-03T11:00",
  };
}

async function clearBookings() {
  await sql`delete from public.bookings where member_id = ${memberId}`;
}

async function resetMemberPlan(quota: number) {
  await sql`delete from public.renewals where member_plan_id = ${memberPlanId}`;
  await sql`
    update public.member_plans
    set quota_total = ${quota}, quota_used = 0, quota_remaining = ${quota},
        ends_at = '2026-09-01T00:00:00Z', next_payment_due_at = '2026-09-01T00:00:00Z',
        last_renewed_at = null, renewed_manually = false
    where id = ${memberPlanId}
  `;
}

async function seedBooking({
  bookingId,
  spaceId,
  startsAt,
  endsAt,
}: {
  bookingId: string;
  spaceId: string;
  startsAt: string;
  endsAt: string;
}) {
  await sql`
    insert into public.bookings (
      id, member_id, space_id, member_plan_id, starts_at, ends_at,
      duration_hours, hourly_quota_cost, quota_consumed, status, created_by
    ) values (
      ${bookingId}, ${memberId}, ${spaceId}, ${memberPlanId}, ${startsAt}, ${endsAt},
      1, 1, 1, 'confirmed', ${actorId}
    )
  `;
}

describe("concurrent booking creation", () => {
  beforeAll(async () => {
    await sql`
      insert into public.profiles (id, full_name, email, role)
      values (${actorId}, 'Booking Concurrency Test', 'booking-concurrency@studioflow.invalid', 'admin')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.members (id, full_name, email)
      values (${memberId}, 'Concurrent Member', 'concurrent-member@studioflow.invalid')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.plans (id, name, status, quota_amount)
      values (${planId}, 'Concurrent Plan', 'active', 10)
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.member_plans (
        id, member_id, plan_id, starts_at, ends_at, next_payment_due_at,
        quota_total, quota_used, quota_remaining
      ) values (
        ${memberPlanId}, ${memberId}, ${planId}, '2026-08-01T00:00:00Z',
        '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z', 10, 0, 10
      )
      on conflict (id) do nothing
    `;

    for (const [spaceId, slug] of [
      [firstSpaceId, "concurrency-space-one"],
      [secondSpaceId, "concurrency-space-two"],
    ] as const) {
      await sql`
        insert into public.spaces (
          id, name, slug, status, hourly_quota_cost, min_booking_hours, max_booking_hours
        ) values (${spaceId}, ${slug}, ${slug}, 'active', 1, 1, 8)
        on conflict (id) do nothing
      `;
      await sql`
        insert into public.space_availability_rules (
          space_id, day_of_week, start_time, end_time, is_active
        ) values (${spaceId}, 1, '00:00:00', '23:59:00', true)
      `;
    }
  });

  afterEach(async () => {
    await clearBookings();
    await resetMemberPlan(10);
    await sql`delete from public.audit_logs where actor_id = ${actorId}`;
  });

  afterAll(async () => {
    await clearBookings();
    await sql`delete from public.space_availability_rules where space_id in (${firstSpaceId}, ${secondSpaceId})`;
    await sql`delete from public.spaces where id in (${firstSpaceId}, ${secondSpaceId})`;
    await sql`delete from public.member_plans where id = ${memberPlanId}`;
    await sql`delete from public.plans where id = ${planId}`;
    await sql`delete from public.members where id = ${memberId}`;
    await sql`delete from public.profiles where id = ${actorId}`;
    await sql.end();
  });

  it("returns one domain conflict when two requests overlap", async () => {
    await resetMemberPlan(10);
    const { createBooking } = await import("@/services/bookings/create-booking");

    const results = await Promise.allSettled([
      createBooking(bookingInput(firstSpaceId), actor),
      createBooking(bookingInput(firstSpaceId), actor),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      reason: new Error("El espacio ya tiene una reserva superpuesta."),
    });
  });

  it("allows only one request to consume the last quota", async () => {
    await resetMemberPlan(1);
    const { createBooking } = await import("@/services/bookings/create-booking");

    const results = await Promise.allSettled([
      createBooking(bookingInput(firstSpaceId), actor),
      createBooking(bookingInput(secondSpaceId), actor),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const [quota] = await sql`
      select quota_total, quota_used, quota_remaining
      from public.member_plans
      where id = ${memberPlanId}
    `;
    expect(quota).toMatchObject({ quota_total: 1, quota_used: 1, quota_remaining: 0 });
  });

  it("refunds a concurrently cancelled booking only once", async () => {
    await resetMemberPlan(10);
    await sql`
      update public.member_plans
      set quota_used = 1, quota_remaining = 9
      where id = ${memberPlanId}
    `;
    await seedBooking({
      bookingId: firstBookingId,
      spaceId: firstSpaceId,
      startsAt: "2026-08-03T13:00:00Z",
      endsAt: "2026-08-03T14:00:00Z",
    });
    const { cancelBooking } = await import("@/services/bookings/cancel-booking");

    const results = await Promise.allSettled([
      cancelBooking({ bookingId: firstBookingId }, actor),
      cancelBooking({ bookingId: firstBookingId }, actor),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const [quota] = await sql`
      select quota_total, quota_used, quota_remaining
      from public.member_plans where id = ${memberPlanId}
    `;
    expect(quota).toMatchObject({ quota_total: 10, quota_used: 0, quota_remaining: 10 });
  });

  it("allows only one concurrent reschedule into the same slot", async () => {
    await resetMemberPlan(10);
    await sql`
      update public.member_plans
      set quota_used = 2, quota_remaining = 8
      where id = ${memberPlanId}
    `;
    await seedBooking({
      bookingId: firstBookingId,
      spaceId: firstSpaceId,
      startsAt: "2026-08-03T11:00:00Z",
      endsAt: "2026-08-03T12:00:00Z",
    });
    await seedBooking({
      bookingId: secondBookingId,
      spaceId: firstSpaceId,
      startsAt: "2026-08-03T12:00:00Z",
      endsAt: "2026-08-03T13:00:00Z",
    });
    const { rescheduleBooking } = await import("@/services/bookings/reschedule-booking");

    const results = await Promise.allSettled([
      rescheduleBooking(
        { bookingId: firstBookingId, startsAt: "2026-08-03T15:00", endsAt: "2026-08-03T16:00" },
        actor,
      ),
      rescheduleBooking(
        { bookingId: secondBookingId, startsAt: "2026-08-03T15:00", endsAt: "2026-08-03T16:00" },
        actor,
      ),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      reason: new Error("El espacio ya tiene una reserva superpuesta en el nuevo horario."),
    });
  });

  it("preserves both concurrent manual quota adjustments", async () => {
    await resetMemberPlan(10);
    const { adjustMemberQuota } = await import("@/services/members/adjust-member-quota");

    await Promise.all([
      adjustMemberQuota({ memberId, delta: 1, reason: "Concurrent one" }, actor),
      adjustMemberQuota({ memberId, delta: 2, reason: "Concurrent two" }, actor),
    ]);

    const [quota] = await sql`
      select quota_total, quota_used, quota_remaining
      from public.member_plans where id = ${memberPlanId}
    `;
    expect(quota).toMatchObject({ quota_total: 13, quota_used: 0, quota_remaining: 13 });
  });

  it("preserves both concurrent renewals", async () => {
    await resetMemberPlan(10);
    const { renewMemberPlan } = await import("@/services/renewals/renew-member-plan");

    await renewMemberPlan({ memberPlanId, notes: "Sequential one" }, actor);
    await renewMemberPlan({ memberPlanId, notes: "Sequential two" }, actor);
    const [sequentialPlan] = await sql`
      select ends_at from public.member_plans where id = ${memberPlanId}
    `;

    await resetMemberPlan(10);

    await Promise.all([
      renewMemberPlan({ memberPlanId, notes: "Concurrent one" }, actor),
      renewMemberPlan({ memberPlanId, notes: "Concurrent two" }, actor),
    ]);

    const [plan] = await sql`
      select ends_at from public.member_plans where id = ${memberPlanId}
    `;
    const [renewalCount] = await sql`
      select count(*)::int as count from public.renewals where member_plan_id = ${memberPlanId}
    `;
    expect(plan.ends_at).toEqual(sequentialPlan.ends_at);
    expect(renewalCount.count).toBe(2);
  });
});
